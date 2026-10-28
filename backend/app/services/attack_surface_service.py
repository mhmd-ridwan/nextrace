"""
NEXTRACE Attack Surface Management (ASM) & Security Scanner Service.
Coordinates Subdomain Discovery (via Subfinder + Passive CT Logs) and
Automated Security Scanning (via Nuclei + Native Forensic Probes).
"""

import asyncio
import json
import logging
import re
import time
from collections.abc import AsyncGenerator
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import dns.resolver
import httpx

from app.schemas.attack_surface import (
    NucleiScanResponse,
    NucleiVulnerabilityItem,
    SubdomainItem,
    SubdomainScanResponse,
)

logger = logging.getLogger(__name__)

# Known dangling CNAME fingerprints indicating potential Subdomain Takeover
TAKEOVER_FINGERPRINTS = [
    {"domain": "github.io", "service": "GitHub Pages", "pattern": "There isn't a GitHub Pages site here"},
    {"domain": "s3.amazonaws.com", "service": "Amazon S3", "pattern": "The specified bucket does not exist"},
    {"domain": "herokuapp.com", "service": "Heroku", "pattern": "No such app"},
    {"domain": "cname.vercel-dns.com", "service": "Vercel", "pattern": "The deployment could not be found"},
    {"domain": "fastly.net", "service": "Fastly CDN", "pattern": "Fastly error: unknown domain"},
    {"domain": "myshopify.com", "service": "Shopify", "pattern": "Sorry, this shop is currently unavailable"},
    {"domain": "azurewebsites.net", "service": "Microsoft Azure", "pattern": "404 Web Site not found"},
    {"domain": "pantheonsite.io", "service": "Pantheon", "pattern": "The gods are wise"},
    {"domain": "ghost.io", "service": "Ghost", "pattern": "The thing you were looking for is no longer here"},
]

COMMON_EXPOSURE_PATHS = [
    {"path": "/.env", "name": "Environment Config File (.env)", "severity": "critical", "match": "DB_PASSWORD="},
    {"path": "/.git/HEAD", "name": "Exposed Git Repository (.git/HEAD)", "severity": "high", "match": "ref: refs/"},
    {
        "path": "/actuator/health",
        "name": "Spring Boot Actuator Health Panel",
        "severity": "medium",
        "match": '"status":',
    },
    {"path": "/phpinfo.php", "name": "PHP Information Leak (phpinfo)", "severity": "medium", "match": "PHP Version"},
    {"path": "/wp-login.php", "name": "WordPress Administrative Login", "severity": "low", "match": "user_login"},
    {
        "path": "/swagger-ui.html",
        "name": "Swagger Interactive API Documentation",
        "severity": "low",
        "match": "swagger-ui",
    },
]

WORDPRESS_BACKUP_PATHS = [
    "/wp-config.php.bak",
    "/wp-config.php.save",
    "/wp-config.php.old",
    "/wp-config.php~",
    "/.wp-config.php.swp",
    "/wp-config.old",
    "/wp-config.txt",
]


class AttackSurfaceService:
    """Enterprise service managing asset discovery and vulnerability intelligence."""

    def __init__(self) -> None:
        project_root = Path(__file__).resolve().parent.parent.parent
        self.bin_dir = project_root / "bin"
        self.subfinder_bin = self.bin_dir / "subfinder.exe"
        self.nuclei_bin = self.bin_dir / "nuclei.exe"
        self.nuclei_templates_dir = Path("C:/Users/Administrator/nuclei-templates")

    def clean_target(self, raw_input: str) -> str:
        """Sanitize target string to bare hostname or domain."""
        cleaned = raw_input.strip().lower()
        if "://" in cleaned:
            parsed = urlparse(cleaned)
            cleaned = parsed.netloc or parsed.path
        cleaned = cleaned.split("/")[0].split(":")[0].strip()
        cleaned = re.sub(r"^www\.", "", cleaned)
        return cleaned

    async def _fetch_passive_ct_subdomains(self, domain: str) -> set[str]:
        """Fetch subdomains from public Certificate Transparency logs (crt.sh)."""
        subdomains: set[str] = set()
        url = f"https://crt.sh/?q=%25.{domain}&output=json"

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                res = await client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                if res.status_code == 200:
                    entries = res.json()
                    for item in entries:
                        name_value = item.get("name_value", "")
                        for line in name_value.split("\n"):
                            candidate = line.strip().lower().lstrip("*.")
                            if candidate.endswith(domain) and candidate != domain:
                                subdomains.add(candidate)
        except Exception as e:
            logger.debug("crt.sh query skipped or timed out: %s", e)

        return subdomains

    async def _run_subfinder_cli(self, domain: str) -> set[str]:
        """Execute local subfinder binary to enumerate subdomains quickly."""
        subdomains: set[str] = set()

        if not self.subfinder_bin.exists():
            return subdomains

        try:
            cmd = [
                str(self.subfinder_bin),
                "-d",
                domain,
                "-silent",
                "-timeout",
                "15",
            ]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                stdout, _ = await asyncio.wait_for(process.communicate(), timeout=20.0)
            except TimeoutError:
                try:
                    process.kill()
                    await process.wait()
                except Exception:
                    pass
                stdout = b""

            for line in stdout.decode("utf-8", errors="ignore").splitlines():
                candidate = line.strip().lower()
                if candidate and candidate.endswith(domain):
                    subdomains.add(candidate)
        except Exception as e:
            logger.warning("Subfinder CLI execution encountered an issue: %s", e)

        return subdomains

    def _resolve_subdomain_dns(self, subdomain: str) -> tuple[list[str], str | None]:
        """Resolve IP addresses and CNAME pointers for a subdomain."""
        ips: list[str] = []
        cname: str | None = None

        resolver = dns.resolver.Resolver()
        resolver.timeout = 2.0
        resolver.lifetime = 2.5

        # Query A / AAAA
        try:
            ans = resolver.resolve(subdomain, "A")
            for a in ans:
                ips.append(str(a.to_text()).strip())
        except Exception:
            pass

        # Query CNAME
        try:
            cname_ans = resolver.resolve(subdomain, "CNAME")
            for c in cname_ans:
                cname = str(c.to_text()).rstrip(".")
                break
        except Exception:
            pass

        return ips, cname

    async def _probe_http_service(
        self, client: httpx.AsyncClient, subdomain: str, cname: str | None
    ) -> tuple[int | None, str | None, str | None, bool, str | None]:
        """Probe HTTP/HTTPS web port to evaluate status, title, server, and takeover indicators."""
        status_code: int | None = None
        title: str | None = None
        server: str | None = None
        is_takeover: bool = False
        takeover_service: str | None = None

        # Check CNAME against takeover signatures
        if cname:
            cname_lower = cname.lower()
            for fp in TAKEOVER_FINGERPRINTS:
                if fp["domain"] in cname_lower:
                    takeover_service = fp["service"]
                    break

        urls_to_try = [f"https://{subdomain}", f"http://{subdomain}"]
        for url in urls_to_try:
            try:
                res = await client.get(url)
                status_code = res.status_code
                server = res.headers.get("server")

                # Parse <title>
                match = re.search(r"<title[^>]*>(.*?)</title>", res.text, re.IGNORECASE | re.DOTALL)
                if match:
                    title = match.group(1).strip()[:100]

                # Check body fingerprint for takeover verification
                if takeover_service:
                    body_text = res.text
                    for fp in TAKEOVER_FINGERPRINTS:
                        if fp["service"] == takeover_service and fp["pattern"] in body_text:
                            is_takeover = True
                            break

                # If we got a valid response, stop probing
                break
            except Exception:
                continue

        return status_code, title, server, is_takeover, takeover_service

    async def enumerate_subdomains(self, domain_input: str, max_subdomains: int = 60) -> SubdomainScanResponse:
        """Full enterprise workflow for discovering and assessing subdomains."""
        start_time = time.time()
        clean_domain = self.clean_target(domain_input)

        # 1. Gather subdomains in parallel (Subfinder + CT Logs)
        subfinder_task = self._run_subfinder_cli(clean_domain)
        ct_task = self._fetch_passive_ct_subdomains(clean_domain)
        subfinder_results, ct_results = await asyncio.gather(subfinder_task, ct_task)

        all_candidates = subfinder_results.union(ct_results)

        # Fallback common list if both returned empty (e.g. offline/restricted)
        if not all_candidates:
            common_prefixes = ["mail", "dev", "api", "portal", "admin", "staging", "auth", "vpn", "webmail", "cloud"]
            for prefix in common_prefixes:
                all_candidates.add(f"{prefix}.{clean_domain}")

        # Limit to max_subdomains
        selected_candidates = sorted(list(all_candidates))[:max_subdomains]

        # 2. Concurrently resolve DNS and probe HTTP
        subdomain_items: list[SubdomainItem] = []
        live_count = 0
        takeover_count = 0

        async with httpx.AsyncClient(
            timeout=3.5,
            verify=False,
            follow_redirects=True,
            headers={"User-Agent": "NEXTRACE-ASM-Scanner/2.0"},
        ) as client:
            for sub in selected_candidates:
                # DNS in threadpool
                loop = asyncio.get_event_loop()
                ips, cname = await loop.run_in_executor(None, self._resolve_subdomain_dns, sub)

                # HTTP Probe
                status_code, title, server, is_takeover, takeover_service = await self._probe_http_service(
                    client, sub, cname
                )

                is_live = bool(ips) or (status_code is not None)
                if is_live:
                    live_count += 1
                if is_takeover:
                    takeover_count += 1

                subdomain_items.append(
                    SubdomainItem(
                        subdomain=sub,
                        ip_addresses=ips,
                        status_code=status_code,
                        title=title,
                        server=server,
                        cname=cname,
                        is_takeover_risk=is_takeover,
                        takeover_service=takeover_service,
                        is_live=is_live,
                    )
                )

        # Sort: takeover risk first, then live, then alphabetical
        subdomain_items.sort(key=lambda s: (not s.is_takeover_risk, not s.is_live, s.subdomain))

        elapsed = round(time.time() - start_time, 2)
        return SubdomainScanResponse(
            target_domain=clean_domain,
            total_found=len(subdomain_items),
            live_count=live_count,
            takeover_risk_count=takeover_count,
            subdomains=subdomain_items,
            scanned_at=datetime.now(UTC).isoformat(),
            execution_time_seconds=elapsed,
        )

    async def _run_nuclei_cli(self, target: str, tags: list[str], severity: list[str]) -> list[NucleiVulnerabilityItem]:
        """Execute Nuclei CLI binary and parse JSON stream output."""
        findings: list[NucleiVulnerabilityItem] = []

        if not self.nuclei_bin.exists():
            return findings

        target_url = target if target.startswith("http") else f"https://{target}"
        tags_str = ",".join(tags)
        sev_str = ",".join(severity)

        cmd = [
            str(self.nuclei_bin),
            "-u",
            target_url,
            "-json-export",
            "-",
            "-silent",
            "-tags",
            tags_str,
            "-severity",
            sev_str,
            "-timeout",
            "5",
            "-retries",
            "1",
            "-c",
            "25",
            "-duc",
        ]
        if self.nuclei_templates_dir.exists():
            cmd.extend(["-templates", str(self.nuclei_templates_dir)])

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                stdout, _ = await asyncio.wait_for(process.communicate(), timeout=25.0)
            except TimeoutError:
                try:
                    process.kill()
                    await process.wait()
                except Exception:
                    pass
                stdout = b""

            for line in stdout.decode("utf-8", errors="ignore").splitlines():
                line = line.strip()
                if not line or not line.startswith("{"):
                    continue
                try:
                    data = json.loads(line)
                    info = data.get("info", {})
                    extracted = data.get("extracted-results", []) or []

                    findings.append(
                        NucleiVulnerabilityItem(
                            template_id=data.get("template-id", "generic-nuclei-finding"),
                            name=info.get("name", "Security Vulnerability"),
                            severity=info.get("severity", "medium").lower(),
                            matched_at=data.get("matched-at", target_url),
                            extracted_results=[str(e) for e in extracted],
                            description=info.get("description"),
                            cve_id=info.get("classification", {}).get("cve-id"),
                            type=data.get("type", "http"),
                            curl_command=data.get("curl-command"),
                            remediation=info.get("remediation"),
                        )
                    )
                except Exception as parse_err:
                    logger.debug("Nuclei JSON parse issue: %s", parse_err)
        except Exception as e:
            logger.warning("Nuclei CLI run encountered timeout or error: %s", e)

        return findings

    async def _run_native_exposure_probe(self, target: str) -> list[NucleiVulnerabilityItem]:
        """High-speed native fallback probe for critical sensitive path exposures."""
        findings: list[NucleiVulnerabilityItem] = []
        base_url = target if target.startswith("http") else f"https://{target}"

        async def _check_item(client: httpx.AsyncClient, item: dict) -> NucleiVulnerabilityItem | None:
            test_url = f"{base_url.rstrip('/')}{item['path']}"
            try:
                res = await client.get(test_url)
                if res.status_code == 200 and item["match"] in res.text:
                    return NucleiVulnerabilityItem(
                        template_id=f"native-{item['name'].lower().replace(' ', '-')}",
                        name=item["name"],
                        severity=item["severity"],
                        matched_at=test_url,
                        extracted_results=[f"HTTP 200 OK — Pattern Matched: '{item['match']}'"],
                        description=f"Endpoint {item['path']} terbuka untuk publik dan mengembalikan respon sensitif.",
                        type="http",
                        curl_command=f"curl -i -k {test_url}",
                        remediation=f"Batasi akses ke {item['path']} pada konfigurasi reverse proxy NGINX/Apache.",
                    )
            except Exception:
                pass
            return None

        async with httpx.AsyncClient(timeout=3.0, verify=False, follow_redirects=True) as client:
            tasks = [_check_item(client, item) for item in COMMON_EXPOSURE_PATHS]
            results = await asyncio.gather(*tasks)
            for r in results:
                if r:
                    findings.append(r)

        return findings

    async def _run_wordpress_audit_probe(self, target: str) -> list[NucleiVulnerabilityItem]:
        """Non-destructive forensic probe for WordPress configuration leaks, user enum, and XML-RPC."""
        findings: list[NucleiVulnerabilityItem] = []
        base_url = target if target.startswith("http") else f"https://{target}"

        async def _check_user_enum(client: httpx.AsyncClient) -> NucleiVulnerabilityItem | None:
            user_url = f"{base_url.rstrip('/')}/wp-json/wp/v2/users"
            try:
                res = await client.get(user_url)
                if res.status_code == 200 and "application/json" in res.headers.get("content-type", ""):
                    users_data = res.json()
                    if isinstance(users_data, list) and len(users_data) > 0 and "slug" in users_data[0]:
                        extracted = [
                            f"ID: {u.get('id')} | User: {u.get('slug')} ({u.get('name')})" for u in users_data[:8]
                        ]
                        return NucleiVulnerabilityItem(
                            template_id="wp-rest-user-enumeration",
                            name="WordPress REST API User Enumeration",
                            severity="medium",
                            matched_at=user_url,
                            extracted_results=extracted,
                            description="Endpoint REST API /wp-json/wp/v2/users terbuka untuk publik tanpa autentikasi, mempermudah reconnaissance dan penyerangan password brute-force.",
                            type="http",
                            curl_command=f"curl -s -k {user_url}",
                            remediation="Batasi akses rute REST API /wp/v2/users menggunakan hook rest_authentication_errors pada functions.php atau security plugin.",
                        )
            except Exception:
                pass
            return None

        async def _check_xmlrpc(client: httpx.AsyncClient) -> NucleiVulnerabilityItem | None:
            xmlrpc_url = f"{base_url.rstrip('/')}/xmlrpc.php"
            try:
                res = await client.get(xmlrpc_url)
                if res.status_code in (200, 405) and (
                    "XML-RPC server accepts POST requests only" in res.text or "rsd" in res.text
                ):
                    return NucleiVulnerabilityItem(
                        template_id="wp-xmlrpc-interface-enabled",
                        name="WordPress XML-RPC Interface Exposed",
                        severity="medium",
                        matched_at=xmlrpc_url,
                        extracted_results=["XML-RPC pingback and system.multicall vectors active"],
                        description="Endpoint xmlrpc.php aktif. Penyerang dapat menyalahgunakan antarmuka ini untuk brute-force massal via system.multicall atau DDoS amplification via pingback.ping.",
                        type="http",
                        curl_command=f"curl -i -k {xmlrpc_url}",
                        remediation="Nonaktifkan XML-RPC melalui file .htaccess, modul Nginx (location = /xmlrpc.php { deny all; }), atau plugin keamanan.",
                    )
            except Exception:
                pass
            return None

        async def _check_readme(client: httpx.AsyncClient) -> NucleiVulnerabilityItem | None:
            readme_url = f"{base_url.rstrip('/')}/readme.html"
            try:
                res = await client.get(readme_url)
                if res.status_code == 200 and "WordPress" in res.text:
                    match = re.search(r"Version\s+([0-9]+\.[0-9]+(?:\.[0-9]+)?)", res.text, re.IGNORECASE)
                    ver_str = match.group(1) if match else "Exposed"
                    return NucleiVulnerabilityItem(
                        template_id="wp-readme-version-disclosure",
                        name=f"WordPress Version Disclosure via readme.html ({ver_str})",
                        severity="low",
                        matched_at=readme_url,
                        extracted_results=[f"WordPress Core Version: {ver_str}"],
                        description=f"File readme.html mengekspos versi rilis WordPress ({ver_str}) ke publik, memudahkan profiling kelemahan CVE pada versi yang bersangkutan.",
                        type="http",
                        curl_command=f"curl -s -k {readme_url}",
                        remediation="Hapus file readme.html dan license.txt dari webroot direktori WordPress.",
                    )
            except Exception:
                pass
            return None

        async def _check_debug_log(client: httpx.AsyncClient) -> NucleiVulnerabilityItem | None:
            debug_url = f"{base_url.rstrip('/')}/wp-content/debug.log"
            try:
                res = await client.get(debug_url)
                if res.status_code == 200 and any(
                    k in res.text
                    for k in ["PHP Fatal error", "PHP Notice", "PHP Warning", "WordPress database error", "Stack trace"]
                ):
                    lines = [ln.strip() for ln in res.text.splitlines() if ln.strip()][:5]
                    return NucleiVulnerabilityItem(
                        template_id="wp-debug-log-disclosure",
                        name="WordPress Debug Log Exposure (debug.log)",
                        severity="high",
                        matched_at=debug_url,
                        extracted_results=lines,
                        description="File wp-content/debug.log dapat diakses oleh publik. Log ini memuat jejak stack trace error PHP, struktur query database, dan jalur internal server.",
                        type="http",
                        curl_command=f"curl -s -k {debug_url} | head -n 20",
                        remediation="Nonaktifkan WP_DEBUG_LOG pada file wp-config.php (define('WP_DEBUG_LOG', false);) dan hapus file wp-content/debug.log.",
                    )
            except Exception:
                pass
            return None

        async def _check_backup_path(client: httpx.AsyncClient, backup_path: str) -> NucleiVulnerabilityItem | None:
            b_url = f"{base_url.rstrip('/')}{backup_path}"
            try:
                res = await client.get(b_url)
                if res.status_code == 200 and any(
                    k in res.text for k in ["DB_PASSWORD", "DB_USER", "DB_NAME", "table_prefix"]
                ):
                    return NucleiVulnerabilityItem(
                        template_id="wp-config-backup-leak",
                        name="WordPress Configuration Backup Disclosure (wp-config)",
                        severity="critical",
                        matched_at=b_url,
                        extracted_results=["Plaintext database credentials & auth keys exposed"],
                        description=f"File cadangan konfigurasi {backup_path} terekspos tanpa eksekusi interpreter PHP, membocorkan password database dan salt autentikasi.",
                        type="http",
                        curl_command=f"curl -s -k {b_url}",
                        remediation="Segera hapus file backup dari direktori webroot dan lakukan rotasi password database MySQL serta secret keys.",
                    )
            except Exception:
                pass
            return None

        async def _check_wlw(client: httpx.AsyncClient) -> NucleiVulnerabilityItem | None:
            wlw_url = f"{base_url.rstrip('/')}/wp-includes/wlwmanifest.xml"
            try:
                res = await client.get(wlw_url)
                if res.status_code == 200 and "wlwmanifest" in res.text:
                    return NucleiVulnerabilityItem(
                        template_id="wp-wlwmanifest-exposure",
                        name="WordPress Windows Live Writer Manifest",
                        severity="info",
                        matched_at=wlw_url,
                        extracted_results=["WLW manifest exposed verifying WordPress install"],
                        description="File manifest Windows Live Writer mengonfirmasi instalasi WordPress dan mengekspos endpoint API.",
                        type="http",
                        curl_command=f"curl -i -k {wlw_url}",
                        remediation="Informasional. Blokir akses ke wp-includes/*.xml jika tidak diperlukan.",
                    )
            except Exception:
                pass
            return None

        async with httpx.AsyncClient(timeout=3.0, verify=False, follow_redirects=True) as client:
            tasks = [
                _check_user_enum(client),
                _check_xmlrpc(client),
                _check_readme(client),
                _check_debug_log(client),
                *[_check_backup_path(client, bp) for bp in WORDPRESS_BACKUP_PATHS],
                _check_wlw(client),
            ]
            results = await asyncio.gather(*tasks)
            for r in results:
                if r:
                    findings.append(r)

        return findings

    async def run_security_scan(
        self,
        target_input: str,
        tags: list[str] | None = None,
        severity: list[str] | None = None,
        preset: str | None = "default",
    ) -> NucleiScanResponse:
        """Execute focused security assessment combining Nuclei and native probes."""
        start_time = time.time()
        target = self.clean_target(target_input)

        if preset == "wordpress":
            selected_tags = tags or ["wordpress", "wp-plugin", "wp-theme", "exposure", "cve"]
        elif preset == "cve":
            selected_tags = tags or ["cve", "rce", "sqli", "lfi", "ssrf"]
        else:
            selected_tags = tags or ["exposure", "misconfig", "takeover", "phishing", "panel", "cve"]

        selected_sev = severity or ["critical", "high", "medium", "low"]

        # Run tasks concurrently
        tasks = [
            self._run_nuclei_cli(target, selected_tags, selected_sev),
            self._run_native_exposure_probe(target),
            self._run_wordpress_audit_probe(target),
        ]
        results = await asyncio.gather(*tasks)
        nuclei_results, native_results, wp_results = results[0], results[1], results[2]

        # Merge findings, avoiding exact duplicates by matched_at
        seen_matches = set()
        merged_findings: list[NucleiVulnerabilityItem] = []

        for item in nuclei_results + native_results + wp_results:
            key = f"{item.template_id}-{item.matched_at}"
            if key not in seen_matches:
                seen_matches.add(key)
                merged_findings.append(item)

        # Severity counters
        critical_c = sum(1 for f in merged_findings if f.severity == "critical")
        high_c = sum(1 for f in merged_findings if f.severity == "high")
        medium_c = sum(1 for f in merged_findings if f.severity == "medium")
        low_c = sum(1 for f in merged_findings if f.severity == "low")
        info_c = sum(1 for f in merged_findings if f.severity == "info")

        elapsed = round(time.time() - start_time, 2)
        return NucleiScanResponse(
            target=target,
            preset=preset,
            total_findings=len(merged_findings),
            critical_count=critical_c,
            high_count=high_c,
            medium_count=medium_c,
            low_count=low_c,
            info_count=info_c,
            findings=merged_findings,
            scanned_at=datetime.now(UTC).isoformat(),
            execution_time_seconds=elapsed,
        )

    async def stream_security_scan(
        self,
        target_input: str,
        tags: list[str] | None = None,
        severity: list[str] | None = None,
        preset: str | None = "default",
    ) -> AsyncGenerator[str, None]:
        """Stream real-time terminal logs, live probe findings, and scan report via SSE."""
        start_time = time.time()
        target = self.clean_target(target_input)
        target_url = target_input if target_input.startswith("http") else f"https://{target}"

        current_preset = preset or "default"
        if current_preset == "wordpress":
            selected_tags = tags or ["wordpress", "wp-plugin", "wp-theme", "exposure", "cve"]
        elif current_preset == "cve":
            selected_tags = tags or ["cve", "rce", "sqli", "lfi", "ssrf"]
        else:
            selected_tags = tags or ["exposure", "misconfig", "takeover", "phishing", "panel", "cve"]

        selected_sev = severity or ["critical", "high", "medium", "low"]
        tags_str = ",".join(selected_tags)
        sev_str = ",".join(selected_sev)

        def format_sse(event: str, data: dict | str) -> str:
            payload = json.dumps(data) if isinstance(data, dict) else str(data)
            return f"event: {event}\ndata: {payload}\n\n"

        # Banner & Initialization
        yield format_sse(
            "log",
            {
                "level": "INFO",
                "message": f"NEXTRACE Security Recon Engine diinisialisasi untuk target: {target_url}",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )
        yield format_sse(
            "log",
            {
                "level": "INFO",
                "message": f"Preset: {current_preset.upper()} | Filter Tags: [{tags_str}] | Severity: [{sev_str}]",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )

        seen_matches: set[str] = set()
        merged_findings: list[NucleiVulnerabilityItem] = []

        # 1. Native Exposure Probes
        yield format_sse(
            "log",
            {
                "level": "INFO",
                "message": "Fase 1: Menjalankan native exposure probes (.env, .git, panels, phpinfo)...",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )
        native_results = await self._run_native_exposure_probe(target)
        for item in native_results:
            key = f"{item.template_id}-{item.matched_at}"
            if key not in seen_matches:
                seen_matches.add(key)
                merged_findings.append(item)
                yield format_sse("finding", item.model_dump())
                yield format_sse(
                    "log",
                    {
                        "level": f"FOUND: {item.severity.upper()}",
                        "message": f"[{item.severity.upper()}] Ditemukan: {item.name} -> {item.matched_at}",
                        "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                    },
                )

        # 2. WordPress Forensic Probes
        yield format_sse(
            "log",
            {
                "level": "WP-AUDIT",
                "message": "Fase 2: Menjalankan WordPress forensic probes (REST API user enum, XML-RPC, debug.log, backup configs)...",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )
        wp_results = await self._run_wordpress_audit_probe(target)
        for item in wp_results:
            key = f"{item.template_id}-{item.matched_at}"
            if key not in seen_matches:
                seen_matches.add(key)
                merged_findings.append(item)
                yield format_sse("finding", item.model_dump())
                yield format_sse(
                    "log",
                    {
                        "level": f"FOUND: {item.severity.upper()}",
                        "message": f"[WP-AUDIT / {item.severity.upper()}] {item.name} -> {item.matched_at}",
                        "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                    },
                )

        if not wp_results and (current_preset == "wordpress" or "wordpress" in selected_tags):
            yield format_sse(
                "log",
                {
                    "level": "WP-AUDIT",
                    "message": "Probe WordPress selesai: Endpoint umum (REST API, XML-RPC, debug.log, config backup) aman atau tidak terekspos.",
                    "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                },
            )

        # 3. Nuclei Subprocess Execution
        yield format_sse(
            "log",
            {
                "level": "INFO",
                "message": f"Fase 3: Mengaktifkan Nuclei Engine v3.11 CLI subprocess dengan template tags [{tags_str}]...",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )

        if self.nuclei_bin.exists():
            cmd = [
                str(self.nuclei_bin),
                "-u",
                target_url,
                "-json-export",
                "-",
                "-tags",
                tags_str,
                "-severity",
                sev_str,
                "-timeout",
                "5",
                "-retries",
                "1",
                "-c",
                "25",
                "-duc",
            ]
            if self.nuclei_templates_dir.exists():
                cmd.extend(["-templates", str(self.nuclei_templates_dir)])

            process = None
            try:
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                yield format_sse(
                    "log",
                    {
                        "level": "INFO",
                        "message": f"Nuclei CLI aktif (PID: {process.pid}). Streaming live output...",
                        "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                    },
                )

                while True:
                    if process.stdout is None:
                        break
                    try:
                        line_bytes = await asyncio.wait_for(process.stdout.readline(), timeout=30.0)
                    except TimeoutError:
                        yield format_sse(
                            "log",
                            {
                                "level": "WARN",
                                "message": "Batas waktu tunggu pembacaan output Nuclei tercapai (30s).",
                                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                            },
                        )
                        break

                    if not line_bytes:
                        break

                    line_str = line_bytes.decode("utf-8", errors="ignore").strip()
                    if not line_str:
                        continue

                    if line_str.startswith("{"):
                        try:
                            data = json.loads(line_str)
                            info = data.get("info", {})
                            extracted = data.get("extracted-results", []) or []
                            item = NucleiVulnerabilityItem(
                                template_id=data.get("template-id", "generic-nuclei-finding"),
                                name=info.get("name", "Security Vulnerability"),
                                severity=info.get("severity", "medium").lower(),
                                matched_at=data.get("matched-at", target_url),
                                extracted_results=[str(e) for e in extracted],
                                description=info.get("description"),
                                cve_id=info.get("classification", {}).get("cve-id"),
                                type=data.get("type", "http"),
                                curl_command=data.get("curl-command"),
                                remediation=info.get("remediation"),
                            )
                            item_key = f"{item.template_id}-{item.matched_at}"
                            if item_key not in seen_matches:
                                seen_matches.add(item_key)
                                merged_findings.append(item)
                                yield format_sse("finding", item.model_dump())
                                yield format_sse(
                                    "log",
                                    {
                                        "level": f"FOUND: {item.severity.upper()}",
                                        "message": f"[{item.severity.upper()}] {item.name} ({item.template_id}) -> {item.matched_at}",
                                        "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                                    },
                                )
                        except Exception:
                            pass
                    else:
                        clean_line = re.sub(r"\x1B\[[0-9;]*[mK]", "", line_str)
                        if clean_line and not clean_line.startswith("__") and "projectdiscovery" not in clean_line:
                            yield format_sse(
                                "log",
                                {
                                    "level": "INFO",
                                    "message": clean_line[:140],
                                    "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                                },
                            )
            except Exception as cli_err:
                yield format_sse(
                    "log",
                    {
                        "level": "WARN",
                        "message": f"Peringatan proses Nuclei CLI: {cli_err}",
                        "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                    },
                )
            finally:
                if process and process.returncode is None:
                    try:
                        process.kill()
                        await process.wait()
                    except Exception:
                        pass
        else:
            yield format_sse(
                "log",
                {
                    "level": "WARN",
                    "message": "Binary nuclei.exe tidak terpasang di bin/, pemindaian selesai dengan native probes.",
                    "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
                },
            )

        # 4. Final Aggregation & Summary
        critical_c = sum(1 for f in merged_findings if f.severity == "critical")
        high_c = sum(1 for f in merged_findings if f.severity == "high")
        medium_c = sum(1 for f in merged_findings if f.severity == "medium")
        low_c = sum(1 for f in merged_findings if f.severity == "low")
        info_c = sum(1 for f in merged_findings if f.severity == "info")

        elapsed = round(time.time() - start_time, 2)
        summary = NucleiScanResponse(
            target=target,
            preset=current_preset,
            total_findings=len(merged_findings),
            critical_count=critical_c,
            high_count=high_c,
            medium_count=medium_c,
            low_count=low_c,
            info_count=info_c,
            findings=merged_findings,
            scanned_at=datetime.now(UTC).isoformat(),
            execution_time_seconds=elapsed,
        )

        yield format_sse("summary", summary.model_dump())
        yield format_sse(
            "log",
            {
                "level": "DONE",
                "message": f"Audit selesai dalam {elapsed}s. Total temuan: {len(merged_findings)} (Critical: {critical_c}, High: {high_c}, Medium: {medium_c}, Low: {low_c}, Info: {info_c}).",
                "timestamp": datetime.now(UTC).strftime("%H:%M:%S"),
            },
        )
        yield format_sse("done", {"status": "completed", "total_findings": len(merged_findings), "duration": elapsed})
