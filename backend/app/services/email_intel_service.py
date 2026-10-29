"""NEXTRACE Email Intelligence & Protocol Auditing Service.

Provides DNS anti-spoofing telemetry (MX, SPF, DMARC), Gravatar footprint OSINT,
and canonical alias/dot-trick analysis.
"""

import asyncio
import hashlib
import re

import dns.resolver
import httpx

from app.schemas.leak import DnsSecurityInfo, EmailAnalysis, GravatarProfile

_CONSUMER_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "ymail.com",
    "yahoo.co.id",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "zoho.com",
}


def _audit_dns_sync(domain: str) -> DnsSecurityInfo:
    """Execute synchronous DNS lookups for MX, SPF, and DMARC."""
    resolver = dns.resolver.Resolver()
    resolver.timeout = 2.0
    resolver.lifetime = 2.5

    # 1. MX Records
    has_mx = False
    mx_records: list[str] = []
    try:
        mx_answers = resolver.resolve(domain, "MX")
        for r in sorted(mx_answers, key=lambda x: x.preference):
            exchange = str(r.exchange).rstrip(".")
            mx_records.append(f"{exchange} (prioritas {r.preference})")
        has_mx = len(mx_records) > 0
    except Exception:
        has_mx = False

    # 2. SPF Record
    has_spf = False
    spf_record: str | None = None
    spf_policy = "missing"
    try:
        txt_answers = resolver.resolve(domain, "TXT")
        for r in txt_answers:
            txt_str = r.to_text().strip('"')
            if txt_str.startswith("v=spf1"):
                has_spf = True
                spf_record = txt_str
                if "-all" in txt_str:
                    spf_policy = "strict (-all)"
                elif "~all" in txt_str:
                    spf_policy = "softfail (~all)"
                elif "?all" in txt_str:
                    spf_policy = "neutral (?all)"
                elif "+all" in txt_str:
                    spf_policy = "permissive (+all)"
                else:
                    spf_policy = "configured"
                break
    except Exception:
        has_spf = False

    # 3. DMARC Record
    has_dmarc = False
    dmarc_record: str | None = None
    dmarc_policy = "missing"
    try:
        dmarc_answers = resolver.resolve(f"_dmarc.{domain}", "TXT")
        for r in dmarc_answers:
            txt_str = r.to_text().strip('"')
            if "v=DMARC1" in txt_str:
                has_dmarc = True
                dmarc_record = txt_str
                match = re.search(r"\bp=([a-zA-Z]+)", txt_str)
                dmarc_policy = match.group(1).lower() if match else "present"
                break
    except Exception:
        has_dmarc = False

    # 4. Anti-spoofing Verdict
    is_spoofable = False
    if dmarc_policy == "reject":
        verdict = "Terproteksi Maksimal (DMARC Policy Reject)"
    elif dmarc_policy == "quarantine":
        verdict = "Terproteksi Karantina (DMARC Policy Quarantine)"
    elif dmarc_policy == "none":
        is_spoofable = True
        verdict = "Rentan Spoofing (DMARC Hanya Mode Monitoring / p=none)"
    elif not has_dmarc and not has_spf:
        is_spoofable = True
        verdict = "Tidak Terproteksi (Tanpa SPF & DMARC - Sangat Rentan Pemalsuan)"
    elif not has_dmarc:
        is_spoofable = True
        verdict = "Rentan Pemalsuan (DMARC Hilang - Hanya Mengandalkan SPF)"
    else:
        verdict = "Konfigurasi Proteksi Dasar Aktif"

    return DnsSecurityInfo(
        domain=domain,
        has_mx=has_mx,
        mx_records=mx_records[:5],
        has_spf=has_spf,
        spf_record=spf_record,
        spf_policy=spf_policy,
        has_dmarc=has_dmarc,
        dmarc_record=dmarc_record,
        dmarc_policy=dmarc_policy,
        is_spoofable=is_spoofable,
        security_verdict=verdict,
    )


class EmailIntelService:
    """Orchestrates comprehensive email intelligence telemetry."""

    async def audit_dns_security(self, domain: str) -> DnsSecurityInfo:
        """Asynchronously audit DNS records with thread offloading."""
        clean_domain = domain.strip().lower()
        if not clean_domain or "." not in clean_domain:
            return DnsSecurityInfo(
                domain=domain,
                security_verdict="Domain tidak valid",
            )
        try:
            return await asyncio.to_thread(_audit_dns_sync, clean_domain)
        except Exception:
            return DnsSecurityInfo(
                domain=clean_domain,
                security_verdict="Gagal melakukan query DNS (Timeout)",
            )

    async def fetch_gravatar_profile(self, email: str) -> GravatarProfile:
        """Query Gravatar public footprint and avatar profile."""
        clean_email = email.strip().lower()
        email_hash = hashlib.md5(clean_email.encode("utf-8")).hexdigest()

        profile_api_url = f"https://api.gravatar.com/v3/profiles/{email_hash}"
        fallback_avatar_url = f"https://www.gravatar.com/avatar/{email_hash}?d=404&s=256"

        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(profile_api_url)
                if res.status_code == 200:
                    data = res.json()
                    return GravatarProfile(
                        has_gravatar=True,
                        email_hash=email_hash,
                        avatar_url=data.get("avatar_url") or fallback_avatar_url,
                        display_name=data.get("display_name"),
                        profile_url=data.get("profile_url"),
                        location=data.get("location"),
                        job_title=data.get("job_title"),
                        company=data.get("company"),
                    )

                # Fallback: check if avatar image itself returns 200
                img_res = await client.head(fallback_avatar_url)
                if img_res.status_code == 200:
                    return GravatarProfile(
                        has_gravatar=True,
                        email_hash=email_hash,
                        avatar_url=fallback_avatar_url,
                        display_name=clean_email.split("@")[0],
                        profile_url=f"https://gravatar.com/{email_hash}",
                    )
        except Exception:
            pass

        return GravatarProfile(
            has_gravatar=False,
            email_hash=email_hash,
        )

    def analyze_structure(self, email: str, is_disposable: bool) -> EmailAnalysis:
        """Analyze email local-part syntax, aliases, and canonical mapping."""
        clean = email.strip().lower()
        parts = clean.split("@")
        local = parts[0] if len(parts) > 0 else ""
        domain = parts[1] if len(parts) > 1 else ""

        has_plus = "+" in local
        base_local = local.split("+")[0] if has_plus else local
        plus_tag = local.split("+")[1] if has_plus else None

        is_gmail = domain in ("gmail.com", "googlemail.com")
        has_dot = is_gmail and "." in base_local
        canonical_local = base_local.replace(".", "") if is_gmail else base_local
        canonical = f"{canonical_local}@{domain}" if domain else clean

        if is_disposable:
            category = "Burner / Disposable Mail"
        elif domain.endswith(".go.id"):
            category = "Pemerintah RI (.go.id)"
        elif domain.endswith(".mil.id"):
            category = "Militer RI (.mil.id)"
        elif domain.endswith(".ac.id") or domain.endswith(".edu"):
            category = "Institusi Pendidikan (.ac.id)"
        elif domain in _CONSUMER_DOMAINS:
            category = "Layanan Webmail Konsumen"
        elif domain.endswith((".co.id", ".com", ".id")):
            category = "Domain Korporat / Swasta"
        else:
            category = "Domain Khusus / Lainnya"

        return EmailAnalysis(
            normalized_email=clean,
            local_part=local,
            domain=domain,
            has_plus_addressing=has_plus,
            base_local_part=base_local,
            plus_tag=plus_tag,
            has_dot_trick=has_dot,
            canonical_email=canonical,
            domain_category=category,
        )
