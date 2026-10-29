"""
NEXTRACE Breach Intelligence Service.
Handles breach lookups, risk assessment, telecom/domain intelligence enrichment, and identifier management.
"""

import re
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_identifier
from app.models.breach import (
    BreachIncident,
    BreachLookupResult,
    IdentifierType,
    VerificationStatus,
)
from app.schemas.leak import (
    BreachIncidentResponse,
    IntelligenceMetadata,
    LeakCheckResponse,
)
from app.schemas.leak import (
    IdentifierType as SchemaIdentifierType,
)
from app.services.email_intel_service import EmailIntelService
from app.services.phone_intel_service import PhoneIntelService
from app.services.risk_engine import RiskEngine

# Indonesian Telecom Operator Prefixes
INDONESIAN_OPERATORS: dict[str, tuple[str, str, str]] = {
    # Telkomsel
    "0811": ("Telkomsel", "Kartu Halo (Pascabayar)", "PT Telekomunikasi Selular"),
    "0812": ("Telkomsel", "simPATI / Halo", "PT Telekomunikasi Selular"),
    "0813": ("Telkomsel", "simPATI", "PT Telekomunikasi Selular"),
    "0821": ("Telkomsel", "simPATI", "PT Telekomunikasi Selular"),
    "0822": ("Telkomsel", "simPATI / Loop", "PT Telekomunikasi Selular"),
    "0823": ("Telkomsel", "Kartu As", "PT Telekomunikasi Selular"),
    "0851": ("Telkomsel", "by.U / Kartu As", "PT Telekomunikasi Selular"),
    "0852": ("Telkomsel", "Kartu As", "PT Telekomunikasi Selular"),
    "0853": ("Telkomsel", "Kartu As", "PT Telekomunikasi Selular"),
    # Indosat Ooredoo Hutchison
    "0814": ("Indosat Ooredoo", "Indosat M2 Broadband", "PT Indosat Tbk"),
    "0815": ("Indosat Ooredoo", "Matrix / Mentari", "PT Indosat Tbk"),
    "0816": ("Indosat Ooredoo", "Matrix / IM3", "PT Indosat Tbk"),
    "0855": ("Indosat Ooredoo", "Matrix", "PT Indosat Tbk"),
    "0856": ("Indosat Ooredoo", "IM3 Prabayar", "PT Indosat Tbk"),
    "0857": ("Indosat Ooredoo", "IM3 Prabayar", "PT Indosat Tbk"),
    "0858": ("Indosat Ooredoo", "Mentari / IM3", "PT Indosat Tbk"),
    # XL Axiata
    "0817": ("XL Axiata", "XL Prabayar", "PT XL Axiata Tbk"),
    "0818": ("XL Axiata", "XL Prabayar", "PT XL Axiata Tbk"),
    "0819": ("XL Axiata", "XL Prabayar", "PT XL Axiata Tbk"),
    "0859": ("XL Axiata", "XL / AXIS", "PT XL Axiata Tbk"),
    "0877": ("XL Axiata", "XL Prabayar", "PT XL Axiata Tbk"),
    "0878": ("XL Axiata", "XL Prabayar / Prioritas", "PT XL Axiata Tbk"),
    # AXIS (XL Axiata)
    "0831": ("AXIS", "AXIS Prabayar", "PT XL Axiata Tbk"),
    "0832": ("AXIS", "AXIS Prabayar", "PT XL Axiata Tbk"),
    "0833": ("AXIS", "AXIS Prabayar", "PT XL Axiata Tbk"),
    "0838": ("AXIS", "AXIS Prabayar", "PT XL Axiata Tbk"),
    # Tri (3 - Indosat Hutchison)
    "0895": ("Tri (3)", "Tri Prabayar", "Indosat Ooredoo Hutchison"),
    "0896": ("Tri (3)", "Tri Prabayar", "Indosat Ooredoo Hutchison"),
    "0897": ("Tri (3)", "Tri Prabayar", "Indosat Ooredoo Hutchison"),
    "0898": ("Tri (3)", "Tri Prabayar", "Indosat Ooredoo Hutchison"),
    "0899": ("Tri (3)", "Tri Prabayar", "Indosat Ooredoo Hutchison"),
    # Smartfren
    "0881": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0882": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0883": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0884": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0885": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0886": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0887": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0888": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
    "0889": ("Smartfren", "Smartfren Prabayar", "PT Smartfren Telecom Tbk"),
}

INDONESIAN_PROVINCES: dict[str, str] = {
    "11": "Aceh",
    "12": "Sumatera Utara",
    "13": "Sumatera Barat",
    "14": "Riau",
    "15": "Jambi",
    "16": "Sumatera Selatan",
    "17": "Bengkulu",
    "18": "Lampung",
    "19": "Kepulauan Bangka Belitung",
    "21": "Kepulauan Riau",
    "31": "DKI Jakarta",
    "32": "Jawa Barat",
    "33": "Jawa Tengah",
    "34": "DI Yogyakarta",
    "35": "Jawa Timur",
    "36": "Banten",
    "51": "Bali",
    "52": "Nusa Tenggara Barat",
    "53": "Nusa Tenggara Timur",
    "61": "Kalimantan Barat",
    "62": "Kalimantan Tengah",
    "63": "Kalimantan Selatan",
    "64": "Kalimantan Timur",
    "65": "Kalimantan Utara",
    "71": "Sulawesi Utara",
    "72": "Sulawesi Tengah",
    "73": "Sulawesi Selatan",
    "74": "Sulawesi Tenggara",
    "75": "Gorontalo",
    "76": "Sulawesi Barat",
    "81": "Maluku",
    "82": "Maluku Utara",
    "91": "Papua Barat",
    "94": "Papua",
}


DISPOSABLE_EMAIL_DOMAINS: set[str] = {
    "tempmail.com",
    "temp-mail.org",
    "10minutemail.com",
    "guerrillamail.com",
    "guerrillamail.net",
    "guerrillamail.org",
    "sharklasers.com",
    "grr.la",
    "mailinator.com",
    "yopmail.com",
    "yopmail.fr",
    "trashmail.com",
    "dispostable.com",
    "fakemailgenerator.com",
    "getairmail.com",
    "burnermail.io",
    "mohmal.com",
    "throwawaymail.com",
    "tempail.com",
    "crazymailing.com",
    "inboxbear.com",
    "mytemp.email",
    "generator.email",
    "dropmail.me",
    "emailondeck.com",
    "guerrillamailblock.com",
    "pokemail.net",
    "spam4.me",
    "nada.ltd",
}


class BreachService:
    """Service for breach intelligence lookups, enrichment, and risk assessment."""

    def __init__(self):
        self.risk_engine = RiskEngine()
        self.email_intel = EmailIntelService()
        self.phone_intel = PhoneIntelService()

    async def check_identifier(
        self,
        db: AsyncSession,
        identifier: str,
        identifier_type: SchemaIdentifierType,
        investigation_id: str | None = None,
    ) -> LeakCheckResponse:
        """
        Check an identifier against documented breach catalogs.
        Provides telecom carrier and identity enrichment.
        """
        id_hash = hash_identifier(identifier)
        masked = self._mask_identifier(identifier, identifier_type)

        # 1. Search matching breach incidents
        incidents, intel_meta = await self._search_breaches_with_intel(db, identifier, identifier_type)

        incident_responses = []
        all_exposed_fields = set()
        now = datetime.now(UTC)

        for incident in incidents:
            exposed = incident.exposed_fields or []
            all_exposed_fields.update(exposed)

            resp = BreachIncidentResponse(
                incident_id=incident.id,
                source_name=incident.source_name,
                source_type=incident.source_type.value
                if hasattr(incident.source_type, "value")
                else str(incident.source_type),
                breach_date=incident.breach_date,
                reported_date=incident.reported_date,
                exposed_fields=exposed,
                record_count=incident.record_count,
                confidence=0.85 if incident.is_synthetic else 0.95,
                severity=incident.severity.value if hasattr(incident.severity, "value") else str(incident.severity),
                source_url=incident.source_url,
                description=incident.description,
                verification_status="verified" if not incident.is_synthetic else "synthetic",
                is_synthetic=incident.is_synthetic,
                lookup_timestamp=now,
            )
            incident_responses.append(resp)

            # Store lookup record
            lookup = BreachLookupResult(
                investigation_id=investigation_id,
                incident_id=incident.id,
                identifier_type=IdentifierType(identifier_type.value),
                identifier_hash=id_hash,
                matched=True,
                confidence=resp.confidence,
                verification_status=VerificationStatus.VERIFIED
                if not incident.is_synthetic
                else VerificationStatus.PENDING,
                risk_score=0.0,
                risk_factors=[],
                lookup_timestamp=now,
                provider_name="si_lacak_threat_intel",
            )
            db.add(lookup)

        # 2. Transparent Risk Assessment Calculation
        risk_assessment = None
        risk_score = 0.0
        risk_level = "low"
        risk_factors = []

        if incident_responses:
            risk_assessment = self.risk_engine.calculate_breach_risk(
                incidents=[{"source_name": i.source_name} for i in incident_responses],
                all_exposed_fields=list(all_exposed_fields),
            )
            risk_score = risk_assessment.score
            risk_level = risk_assessment.level
            risk_factors = [f["description"] for f in risk_assessment.factors]

        await db.flush()

        if intel_meta.is_disposable_email:
            risk_score = max(risk_score, 78.0)
            risk_level = "high"
            if "Terdeteksi alamat email sekali pakai (Disposable / Burner Email)" not in risk_factors:
                risk_factors.insert(
                    0, "Terdeteksi alamat email sekali pakai (Disposable / Burner Email - Indikasi Botnet)"
                )

        return LeakCheckResponse(
            query=identifier,
            investigation_id=investigation_id,
            identifier_type=identifier_type.value,
            identifier_masked=masked,
            total_incidents=len(incident_responses),
            risk_score=risk_score,
            risk_level=risk_level,
            risk_factors=risk_factors,
            risk_assessment=risk_assessment,
            intelligence_metadata=intel_meta,
            incidents=incident_responses,
            checked_at=now,
            provider_name="NEXTRACE Breach Intelligence Core (Katalog Insiden Riil)",
            disclaimer=(
                "Hasil audit bersumber dari katalog insiden kebocoran data nasional & global yang terdokumentasi secara publik. "
                "NEXTRACE menerapkan kebijakan privasi Zero-Plaintext; data kependudukan dan NIK tidak pernah disimpan dalam bentuk teks biasa."
            ),
        )

    async def get_incidents(
        self,
        db: AsyncSession,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Get paginated breach incidents."""
        offset = (page - 1) * per_page
        count_res = await db.execute(select(BreachIncident))
        all_items = count_res.scalars().all()
        total = len(all_items)

        res = await db.execute(
            select(BreachIncident)
            .order_by(BreachIncident.breach_date.desc().nullslast())
            .offset(offset)
            .limit(per_page)
        )
        incidents = res.scalars().all()

        items = []
        for inc in incidents:
            items.append(
                BreachIncidentResponse(
                    incident_id=inc.id,
                    source_name=inc.source_name,
                    source_type=inc.source_type.value if hasattr(inc.source_type, "value") else str(inc.source_type),
                    breach_date=inc.breach_date,
                    reported_date=inc.reported_date,
                    exposed_fields=inc.exposed_fields or [],
                    record_count=inc.record_count,
                    confidence=0.85 if inc.is_synthetic else 0.95,
                    severity=inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity),
                    source_url=inc.source_url,
                    description=inc.description,
                    verification_status="verified" if not inc.is_synthetic else "synthetic",
                    is_synthetic=inc.is_synthetic,
                )
            )

        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    async def get_incident(self, db: AsyncSession, incident_id: str) -> BreachIncidentResponse | None:
        """Get single incident by ID."""
        res = await db.execute(select(BreachIncident).where(BreachIncident.id == incident_id))
        inc = res.scalar_one_or_none()
        if not inc:
            return None

        return BreachIncidentResponse(
            incident_id=inc.id,
            source_name=inc.source_name,
            source_type=inc.source_type.value if hasattr(inc.source_type, "value") else str(inc.source_type),
            breach_date=inc.breach_date,
            reported_date=inc.reported_date,
            exposed_fields=inc.exposed_fields or [],
            record_count=inc.record_count,
            confidence=0.85 if inc.is_synthetic else 0.95,
            severity=inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity),
            source_url=inc.source_url,
            description=inc.description,
            verification_status="verified" if not inc.is_synthetic else "synthetic",
            is_synthetic=inc.is_synthetic,
        )

    async def _search_breaches_with_intel(
        self,
        db: AsyncSession,
        identifier: str,
        identifier_type: SchemaIdentifierType,
    ) -> tuple[list[BreachIncident], IntelligenceMetadata]:
        """
        Search matching breach incidents and build intelligence enrichment metadata.
        """
        res = await db.execute(select(BreachIncident))
        all_incidents = res.scalars().all()

        matched: list[BreachIncident] = []
        matched_ids = set()

        id_clean = identifier.strip().lower()

        # ── Case A: Phone Number Search ──
        if identifier_type == SchemaIdentifierType.PHONE:
            digits = re.sub(r"\D", "", identifier)
            if digits.startswith("62"):
                national = "0" + digits[2:]
            elif not digits.startswith("0") and len(digits) >= 9:
                national = "0" + digits
            else:
                national = digits

            prefix = national[:4] if len(national) >= 4 else ""
            op_data = INDONESIAN_OPERATORS.get(prefix)

            if op_data:
                carrier_name, product_name, op_group = op_data
                carrier_label = f"{carrier_name} ({product_name})"
                is_valid_format = True
            else:
                carrier_label = "Operator Seluler Indonesia (GSM)"
                op_group = "Penyedia Jasa Telekomunikasi Seluler"
                is_valid_format = len(national) >= 10 and national.startswith("08")

            intel = IntelligenceMetadata(
                carrier=carrier_label,
                operator_group=op_group,
                country="Indonesia (+62)",
                line_type="Mobile Cellular GSM",
                prefix=prefix or "+62",
                is_valid_format=is_valid_format,
                telecom_category="Kartu Seluler Pascabayar"
                if "pascabayar" in carrier_label.lower() or "halo" in carrier_label.lower()
                else "Kartu Seluler Prabayar",
                fraud_risk_score=15 if is_valid_format else 65,
                threat_vectors=[
                    "Potensi SIM Swap Fraud: Upaya pengambilalihan kartu SIM di gerai operator guna membajak SMS OTP perbankan.",
                    "Serangan Smishing & Vishing: SMS dan telepon penipuan terarah yang mencatut nama instansi perbankan atau kurir.",
                    "Korelasi NIK & No. HP: Data nomor telepon terhubung langsung dengan NIK KTP pada registrasi SIM prabayar nasional.",
                ],
                remediation_steps=[
                    f"Kunjungi gerai resmi {op_group} terdekat untuk mengaktifkan fitur Proteksi SIM Swap berbasis verifikasi biometrik/PIN.",
                    "Migrasikan otentikasi akun krusial (m-banking, email utama) dari SMS OTP ke aplikasi Authenticator (Google / Microsoft Authenticator).",
                    "Jangan pernah membagikan 6 digit kode OTP atau informasi perbankan apa pun kepada pihak penelepon.",
                    "Blokir dan laporkan nomor-nomor mencurigakan yang mengirimkan tautan APK penipuan atau phishing.",
                ],
            )

            # Match against database incidents
            for inc in all_incidents:
                patterns = [p.lower() for p in (inc.matching_patterns or [])]
                exposed = [f.lower() for f in (inc.exposed_fields or [])]

                # Specific pattern matches
                has_pattern_match = any(p in national or p in id_clean or (prefix and p == prefix) for p in patterns)

                # Broad categorical matching for valid Indonesian cellular numbers:
                # 1. Kominfo 1.3B SIM Card leak includes all Indonesian active cellular lines
                is_kominfo_sim_leak = (
                    "kominfo" in inc.id.lower()
                    or "sim card" in inc.source_name.lower()
                    or "bjorka" in inc.source_name.lower()
                )
                is_kpu_voter_leak = "kpu" in inc.id.lower() or "dpt" in inc.source_name.lower()
                is_tokopedia_leak = "tokopedia" in inc.id.lower()
                is_bpjs_leak = "bpjs" in inc.id.lower()

                should_match = False
                if (
                    has_pattern_match
                    or is_valid_format
                    and (
                        is_kominfo_sim_leak
                        and "phone" in exposed
                        or is_kpu_voter_leak
                        and "phone" in exposed
                        or is_tokopedia_leak
                        and "phone" in exposed
                        or is_bpjs_leak
                        and "phone" in exposed
                    )
                ):
                    should_match = True

                if should_match and inc.id not in matched_ids:
                    matched.append(inc)
                    matched_ids.add(inc.id)

            hlr = self.phone_intel.resolve_hlr(national)
            virtual_info = self.phone_intel.detect_virtual_voip(identifier)
            reputation = self.phone_intel.evaluate_reputation(
                number=identifier,
                has_breaches=len(matched) > 0,
                is_virtual=virtual_info.is_virtual_voip,
            )
            intel.hlr_detail = hlr
            intel.crowdsourced_reputation = reputation
            intel.virtual_number_analysis = virtual_info
            if reputation.is_spam_suspect:
                intel.fraud_risk_score = max(intel.fraud_risk_score or 0, reputation.spam_score)
            return matched, intel

        # ── Case B: Email Address Search ──
        elif identifier_type == SchemaIdentifierType.EMAIL:
            parts = id_clean.split("@")
            local = parts[0] if len(parts) > 0 else ""
            domain = parts[1] if len(parts) > 1 else ""

            is_disp = domain.lower() in DISPOSABLE_EMAIL_DOMAINS
            if is_disp:
                provider_type = f"Layanan Email Sekali Pakai / Disposable ({domain})"
            elif domain in ("gmail.com", "googlemail.com"):
                provider_type = "Google Consumer Webmail"
            elif domain in ("yahoo.com", "ymail.com", "yahoo.co.id"):
                provider_type = "Yahoo! Mail"
            elif domain in ("outlook.com", "hotmail.com"):
                provider_type = "Microsoft Personal Mail"
            elif domain.endswith(".go.id"):
                provider_type = "Pemerintah Republik Indonesia (Government)"
            elif domain.endswith(".ac.id") or domain.endswith(".edu"):
                provider_type = "Institusi Akademik / Universitas"
            else:
                provider_type = f"Domain Korporat / Organisasi ({domain})"

            intel = IntelligenceMetadata(
                carrier=provider_type,
                operator_group=f"Domain: {domain}",
                country="Global / Indonesia",
                line_type="Electronic Mail (SMTP/IMAP)",
                prefix=f"@{domain}",
                is_valid_format=bool(domain and "." in domain),
                is_disposable_email=is_disp,
                disposable_service=domain if is_disp else None,
                fraud_risk_score=85 if is_disp else 10,
                threat_vectors=[
                    "Credential Stuffing: Pelaku menguji kombinasi email & password bocor pada platform perbankan dan e-commerce.",
                    "Spear-Phishing Bertarget: Email palsu berkedok tagihan, reset sandi, atau penawaran resmi.",
                    "Paparan Hash Sandi: Kemungkinan kata sandi telah didekripsi menggunakan wordlist atau rainbow tables.",
                ],
                remediation_steps=[
                    "Segera ganti kata sandi akun email utama dan akun-akun lain yang menggunakan sandi serupa.",
                    "Aktifkan Otentikasi Dua Faktor (2FA) menggunakan Passkey atau aplikasi Authenticator (bukan SMS).",
                    "Periksa filter penerusan (forwarding rules) di pengaturan email untuk memastikan tidak ada email yang diteruskan ke alamat asing.",
                    "Jangan pernah menggunakan satu kata sandi yang sama untuk lebih dari satu layanan.",
                ],
            )

            for inc in all_incidents:
                patterns = [p.lower() for p in (inc.matching_patterns or [])]
                exposed = [f.lower() for f in (inc.exposed_fields or [])]

                has_pattern = any(
                    p in id_clean or (domain and f"@{domain}" == p) or (local and p.startswith(local)) for p in patterns
                )

                is_consumer_leak = inc.id in (
                    "breach-tokopedia-2020",
                    "breach-bukalapak-2019",
                    "breach-canva-2019",
                    "breach-bpjs-2021",
                )
                is_b2b_leak = inc.id in ("breach-linkedin-2021", "breach-indihome-2022")

                should_match = False
                if (
                    has_pattern
                    or domain in ("gmail.com", "yahoo.com", "hotmail.com", "outlook.com")
                    and is_consumer_leak
                    and "email" in exposed
                    or domain.endswith((".co.id", ".com", ".id"))
                    and is_b2b_leak
                    and "email" in exposed
                ):
                    should_match = True

                if should_match and inc.id not in matched_ids:
                    matched.append(inc)
                    matched_ids.add(inc.id)

            dns_sec = await self.email_intel.audit_dns_security(domain)
            gravatar = await self.email_intel.fetch_gravatar_profile(id_clean)
            structure = self.email_intel.analyze_structure(id_clean, is_disp)
            intel.dns_security = dns_sec
            intel.gravatar_profile = gravatar
            intel.email_analysis = structure
            if dns_sec.is_spoofable:
                intel.threat_vectors.append(
                    "Kerentanan Email Spoofing: Domain tidak menerapkan proteksi DMARC ketat sehingga rentan pemalsuan pengirim."
                )
            return matched, intel

        # ── Case C: ID Hash / National ID Search ──
        else:
            raw_nik_clean = re.sub(r"\D", "", identifier)
            prov_name = "Wilayah Kependudukan Nasional"
            if len(raw_nik_clean) >= 2:
                prov_code = raw_nik_clean[:2]
                prov_name = INDONESIAN_PROVINCES.get(prov_code, "Wilayah Kependudukan Nasional")

            intel = IntelligenceMetadata(
                carrier=f"Dukcapil {prov_name}",
                operator_group="Kementerian Dalam Negeri RI / KPU",
                country="Indonesia (+62)",
                line_type="Nomor Induk Kependudukan (NIK 16-Digit)",
                prefix=raw_nik_clean[:6] if len(raw_nik_clean) >= 6 else "SHA-256",
                is_valid_format=len(raw_nik_clean) == 16 or len(identifier) == 64,
                threat_vectors=[
                    "Penyalahgunaan Identitas Kependudukan (Identity Theft) untuk pinjaman online ilegal (Pinjol) dan pembukaan rekening bank gelap.",
                    "Pencatutan Nama pada Registrasi Kartu SIM Ilegal.",
                    "Korelasi Data Keluarga: Paparan nomor Kartu Keluarga (KK) dan nama ibu kandung.",
                ],
                remediation_steps=[
                    "Lakukan pengecekan berkala SLIK OJK (iDeb) untuk mendeteksi apakah NIK Anda pernah digunakan untuk pengajuan kredit ilegal.",
                    "Jangan pernah mengunggah foto fisik KTP tanpa watermark digital untuk keperluan transaksi publik.",
                    "Laporkan ke pihak kepolisian dan Dukcapil apabila ditemukan mutasi atau verifikasi rekening yang tidak pernah Anda lakukan.",
                ],
            )

            for inc in all_incidents:
                patterns = [p.lower() for p in (inc.matching_patterns or [])]
                exposed = [f.lower() for f in (inc.exposed_fields or [])]

                has_pattern = any(
                    p in id_clean or (len(raw_nik_clean) >= 6 and raw_nik_clean.startswith(p)) for p in patterns
                )
                is_national_id_breach = inc.id in (
                    "breach-dukcapil-2023",
                    "breach-kpu-2023",
                    "breach-bpjs-2021",
                    "breach-kominfo-2022",
                )

                should_match = False
                if (
                    has_pattern
                    or (len(raw_nik_clean) == 16 or len(identifier) == 64)
                    and is_national_id_breach
                    and "national_id" in exposed
                ):
                    should_match = True

                if should_match and inc.id not in matched_ids:
                    matched.append(inc)
                    matched_ids.add(inc.id)

            return matched, intel

    def _mask_identifier(self, identifier: str, identifier_type: SchemaIdentifierType) -> str:
        """Safely mask identifiers for audit logs and views."""
        if identifier_type == SchemaIdentifierType.EMAIL:
            parts = identifier.split("@")
            if len(parts) == 2:
                local, domain = parts
                if len(local) <= 2:
                    return f"{local[0]}***@{domain}"
                return f"{local[0]}***{local[-1]}@{domain}"
            return "***@***.***"

        elif identifier_type == SchemaIdentifierType.PHONE:
            cleaned = re.sub(r"\D", "", identifier)
            if cleaned.startswith("62") and len(cleaned) >= 10:
                return f"+62 {cleaned[2:5]}-***-{cleaned[-4:]}"
            elif cleaned.startswith("0") and len(cleaned) >= 10:
                return f"0{cleaned[1:4]}-***-{cleaned[-4:]}"
            elif len(cleaned) > 6:
                return f"{cleaned[:3]}***{cleaned[-3:]}"
            return "***"

        elif identifier_type == SchemaIdentifierType.ID_HASH:
            cleaned = re.sub(r"\D", "", identifier)
            if len(cleaned) == 16:
                return f"{cleaned[:4]}********{cleaned[-4:]}"
            return f"{identifier[:8]}...{identifier[-8:]}"

        return "***"
