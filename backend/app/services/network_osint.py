"""
NEXTRACE Real-Time Network & Domain OSINT Intelligence Service.
Performs live DNS record resolution, socket/RDAP WHOIS registry extraction,
SSL certificate telemetry, and automated forensic domain reputation scoring.
"""

import re
import socket
import ssl
from datetime import UTC, datetime
from urllib.parse import urlparse

import dns.resolver

from app.schemas.network import DomainAuditResponse


class NetworkOSINTService:
    """Enterprise Forensic Service for Real-time Domain, DNS, and WHOIS Intelligence."""

    WHOIS_SERVERS = {
        "id": "whois.id",
        "co.id": "whois.id",
        "go.id": "whois.id",
        "ac.id": "whois.id",
        "my.id": "whois.id",
        "biz.id": "whois.id",
        "web.id": "whois.id",
        "com": "whois.verisign-grs.com",
        "net": "whois.verisign-grs.com",
        "org": "whois.pir.org",
        "io": "whois.nic.io",
        "info": "whois.afilias.net",
        "biz": "whois.nic.biz",
        "xyz": "whois.nic.xyz",
        "me": "whois.nic.me",
        "co": "whois.nic.co",
        "top": "whois.nic.top",
    }

    def clean_domain(self, raw_input: str) -> str:
        """Sanitize raw URL or domain string to plain FQDN hostname."""
        cleaned = raw_input.strip().lower()
        if "://" in cleaned:
            parsed = urlparse(cleaned)
            cleaned = parsed.netloc or parsed.path
        cleaned = cleaned.split("/")[0].split(":")[0].strip()
        cleaned = re.sub(r"^www\.", "", cleaned)
        return cleaned

    def resolve_dns(self, domain: str) -> tuple[dict[str, list[str]], list[str]]:
        """Resolve live DNS records (A, AAAA, MX, NS, TXT) using dnspython."""
        records: dict[str, list[str]] = {}
        ip_addresses: list[str] = []

        resolver = dns.resolver.Resolver()
        resolver.timeout = 3.5
        resolver.lifetime = 4.0

        for rtype in ["A", "AAAA", "MX", "NS", "TXT"]:
            try:
                answers = resolver.resolve(domain, rtype)
                vals: list[str] = []
                for ans in answers:
                    val_str = str(ans.to_text()).strip('"').strip()
                    vals.append(val_str)
                    if rtype == "A" and val_str not in ip_addresses:
                        ip_addresses.append(val_str)
                records[rtype] = vals
            except Exception:
                records[rtype] = []

        return records, ip_addresses

    def query_whois_socket(self, domain: str) -> str:
        """Query official port 43 WHOIS registry servers via raw TCP socket."""
        parts = domain.split(".")
        tld = (
            ".".join(parts[-2:]) if len(parts) >= 2 and f"{parts[-2]}.{parts[-1]}" in self.WHOIS_SERVERS else parts[-1]
        )
        server = self.WHOIS_SERVERS.get(tld, "whois.iana.org")

        try:
            with socket.create_connection((server, 43), timeout=5.0) as sock:
                sock.send((domain + "\r\n").encode("utf-8"))
                response = b""
                while True:
                    chunk = sock.recv(4096)
                    if not chunk:
                        break
                    response += chunk
                raw_text = response.decode("utf-8", errors="ignore")
                return raw_text
        except Exception as e:
            return f"WHOIS query timeout or connection error: {e}"

    def extract_ssl_info(self, domain: str) -> tuple[str, str]:
        """Fetch live SSL/TLS peer certificate from port 443."""
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # inspect cert even if self-signed for OSINT

        try:
            with (
                socket.create_connection((domain, 443), timeout=3.5) as sock,
                ctx.wrap_socket(sock, server_hostname=domain) as ssock,
            ):
                cert = ssock.getpeercert(binary_form=False)
                if not cert:
                    return "TLS Active (Unparsed Subject)", "Aktif"
                issuer_dict = dict(x[0] for x in cert.get("issuer", []))
                issuer = issuer_dict.get("organizationName") or issuer_dict.get("commonName") or "TLS Authority"
                not_after = cert.get("notAfter", "Valid")
                return str(issuer), str(not_after)
        except Exception:
            return "Tidak Tersedia / Port 443 Tertutup", "-"

    def parse_whois_fields(self, raw_whois: str, domain: str) -> dict:
        """Parse structured metadata from raw WHOIS response text."""
        fields = {
            "registrar": "Public Domain Registry",
            "created_date": "Tidak Terpublikasi",
            "expiry_date": "Tidak Terpublikasi",
            "updated_date": "-",
            "nameservers": [],
            "age_days": None,
            "age_formatted": "Tidak Diketahui",
        }

        # Registrar
        reg_m = re.search(r"(?:Registrar|Sponsoring Registrar|organisation):\s*([^\r\n]+)", raw_whois, re.IGNORECASE)
        if reg_m:
            fields["registrar"] = reg_m.group(1).strip()

        # Creation / Registration Date
        date_patterns = [
            r"(?:Creation Date|Created On|Registration Date|created):\s*([^\r\n]+)",
            r"(?:createdDate):\s*([^\r\n]+)",
        ]
        created_raw = None
        for p in date_patterns:
            m = re.search(p, raw_whois, re.IGNORECASE)
            if m:
                created_raw = m.group(1).strip()
                break

        if created_raw:
            fields["created_date"] = created_raw
            # Attempt to parse date into age
            iso_m = re.search(r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})", created_raw)
            if iso_m:
                try:
                    dt = datetime(int(iso_m.group(1)), int(iso_m.group(2)), int(iso_m.group(3)), tzinfo=UTC)
                    now = datetime.now(UTC)
                    days = (now - dt).days
                    fields["age_days"] = max(0, days)
                    years = days // 365
                    remaining_days = days % 365
                    if years > 0:
                        fields["age_formatted"] = f"{years} tahun {remaining_days // 30} bulan lalu ({days:,} hari)"
                    else:
                        fields["age_formatted"] = f"{days} hari lalu"
                except Exception:
                    pass

        # Expiry Date
        exp_patterns = [
            r"(?:Registry Expiry Date|Expiration Date|Expires On|paid-till):\s*([^\r\n]+)",
        ]
        for p in exp_patterns:
            m = re.search(p, raw_whois, re.IGNORECASE)
            if m:
                fields["expiry_date"] = m.group(1).strip()
                break

        # Nameservers from WHOIS if any
        ns_matches = re.findall(r"(?:Name Server|nserver):\s*([a-zA-Z0-9_\.\-]+)", raw_whois, re.IGNORECASE)
        if ns_matches:
            fields["nameservers"] = list({ns.lower() for ns in ns_matches})

        return fields

    def calculate_reputation(
        self,
        domain: str,
        age_days: int | None,
        registrar: str,
        ssl_issuer: str,
        dns_records: dict,
    ) -> tuple[str, int, list[str], str]:
        """Compute forensic risk score and reputation narrative based on multi-signal indicators."""
        risk_score = 15
        reasons: list[str] = []

        is_gov_or_mil = any(domain.endswith(sfx) for sfx in [".go.id", ".mil.id", ".gov", ".ac.id", ".edu"])
        if is_gov_or_mil:
            risk_score = 0
            reasons.append("Domain resmi institusi pemerintah atau akademik dengan verifikasi legal ketat.")
            return (
                "Aman",
                risk_score,
                reasons,
                "Domain resmi lembaga terverifikasi dengan otentikasi ketat instansi negara. Tingkat kepercayaan tertinggi.",
            )

        # Domain Age Heuristics
        if age_days is not None:
            if age_days < 14:
                risk_score += 55
                reasons.append(
                    f"Domain sangat baru didaftarkan ({age_days} hari lalu). Anomali tinggi khas situs phishing."
                )
            elif age_days < 60:
                risk_score += 30
                reasons.append(f"Domain berusia relatif baru ({age_days} hari lalu). Wajib diwaspadai.")
            elif age_days > 365 * 3:
                risk_score = max(5, risk_score - 15)
                reasons.append(
                    f"Domain berusia matang ({age_days // 365} tahun). Memiliki rekam jejak historis panjang."
                )

        # Suspicious keywords in domain name
        phish_kws = ["bantuan", "bansos", "dana-", "kredit", "login-", "secure-", "verifikasi", "klaim", "hadiah"]
        found_kws = [kw for kw in phish_kws if kw in domain]
        if found_kws:
            risk_score += 35
            reasons.append(f"Nama domain memuat kata kunci berisiko pemancingan/phishing: {', '.join(found_kws)}.")

        # SSL status
        if "Tidak Tersedia" in ssl_issuer or "None" in ssl_issuer:
            risk_score += 20
            reasons.append("Layanan TLS/SSL tidak aktif atau sertifikat tidak dapat diakses.")
        elif "Let's Encrypt" in ssl_issuer or "cPanel" in ssl_issuer:
            risk_score += 5
            reasons.append("Menggunakan sertifikat TLS gratis tanpa validasi identitas korporat (DV Cert).")

        # MX Records
        if not dns_records.get("MX"):
            risk_score += 10
            reasons.append("Tidak ditemukan rekaman MX (Mail Exchange). Server tidak melayani email resmi.")

        risk_score = min(98, max(5, risk_score))

        if risk_score >= 60:
            status = "Tinggi"
            notes = "Domain memiliki indikator anomali tinggi. Sangat dicurigai sebagai landing page phishing, penipuan bantuan, atau infrastruktur penipuan daring."
        elif risk_score >= 30:
            status = "Sedang"
            notes = "Domain publik dengan tingkat kehati-hatian sedang. Pantau rekaman DNS dan identitas kepemilikan."
        else:
            status = "Aman"
            notes = "Domain stabil dengan rekam jejak baik dan konfigurasi jaringan standar tanpa indikator ancaman langsung."

        return status, risk_score, reasons, notes

    def audit_domain(self, raw_input: str) -> DomainAuditResponse:
        """Execute full end-to-end domain, DNS, and WHOIS forensic audit."""
        clean = self.clean_domain(raw_input)
        now = datetime.now(UTC)

        # 1. DNS Resolution
        dns_records, ip_addresses = self.resolve_dns(clean)
        primary_ip = ip_addresses[0] if ip_addresses else "-"

        # 2. WHOIS Query
        raw_whois = self.query_whois_socket(clean)
        whois_fields = self.parse_whois_fields(raw_whois, clean)

        # 3. SSL Telemetry
        ssl_issuer, ssl_expiry = self.extract_ssl_info(clean)

        # Combine nameservers from DNS and WHOIS
        combined_ns = dns_records.get("NS", [])
        if not combined_ns:
            combined_ns = whois_fields.get("nameservers", [])
        # clean trailing dots from nameservers
        clean_ns = [ns.rstrip(".") for ns in combined_ns]

        # 4. Multi-Signal Reputation Scoring
        risk_status, risk_score, risk_reasons, notes = self.calculate_reputation(
            domain=clean,
            age_days=whois_fields.get("age_days"),
            registrar=whois_fields["registrar"],
            ssl_issuer=ssl_issuer,
            dns_records=dns_records,
        )

        return DomainAuditResponse(
            domain=raw_input.strip(),
            clean_domain=clean,
            registrar=whois_fields["registrar"],
            created_date=whois_fields["created_date"],
            expiry_date=whois_fields["expiry_date"],
            updated_date=whois_fields.get("updated_date", "-"),
            domain_age_days=whois_fields.get("age_days"),
            domain_age_formatted=whois_fields["age_formatted"],
            nameservers=clean_ns,
            ip_addresses=ip_addresses,
            primary_ip=primary_ip,
            ssl_issuer=ssl_issuer,
            ssl_expiry=ssl_expiry,
            risk_status=risk_status,
            risk_score=risk_score,
            risk_reasons=risk_reasons,
            reputation_notes=notes,
            dns_records=dns_records,
            raw_whois=raw_whois[:4000],
            is_live_data=True,
            audited_at=now.isoformat(),
        )
