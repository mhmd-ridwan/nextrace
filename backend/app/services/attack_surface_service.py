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


class AttackSurfaceService:
    """Enterprise service managing asset discovery and vulnerability intelligence."""

    def __init__(self) -> None:
        project_root = Path(__file__).resolve().parent.parent.parent
        self.bin_dir = project_root / "bin"
        self.subfinder_bin = self.bin_dir / "subfinder.exe"
        self.nuclei_bin = self.bin_dir / "nuclei.exe"

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
            "-duc",  # disable update check during scan
        ]

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

        async with httpx.AsyncClient(timeout=4.0, verify=False, follow_redirects=True) as client:
            for item in COMMON_EXPOSURE_PATHS:
                test_url = f"{base_url.rstrip('/')}{item['path']}"
                try:
                    res = await client.get(test_url)
                    if res.status_code == 200 and item["match"] in res.text:
                        findings.append(
                            NucleiVulnerabilityItem(
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
                        )
                except Exception:
                    continue

        return findings

    async def run_security_scan(
        self,
        target_input: str,
        tags: list[str] | None = None,
        severity: list[str] | None = None,
    ) -> NucleiScanResponse:
        """Execute focused security assessment combining Nuclei and native probes."""
        start_time = time.time()
        target = self.clean_target(target_input)
        selected_tags = tags or ["exposure", "misconfig", "takeover", "phishing", "panel", "cve"]
        selected_sev = severity or ["critical", "high", "medium", "low"]

        # Run Nuclei CLI
        nuclei_task = self._run_nuclei_cli(target, selected_tags, selected_sev)
        native_task = self._run_native_exposure_probe(target)

        nuclei_results, native_results = await asyncio.gather(nuclei_task, native_task)

        # Merge findings, avoiding exact duplicates by matched_at
        seen_matches = set()
        merged_findings: list[NucleiVulnerabilityItem] = []

        for item in nuclei_results + native_results:
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
