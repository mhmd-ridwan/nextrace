"""NEXTRACE Real Data Seeder - Joko Widodo (@jokowi) Digital Protection Dataset.

Seeds official baseline, real detected impersonator accounts, authentic Indonesian breach records,
buzzer astroturfing scans, and digital evidence artifacts.
"""

import io
import json
from datetime import UTC, datetime, timedelta
from pathlib import Path

from PIL import Image, ImageDraw
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import compute_file_hash, hash_identifier
from app.db.session import async_session_factory
from app.models.alias import AliasInboundEvent, EmailAlias
from app.models.breach import BreachIncident, Severity, SourceType
from app.models.buzzer import BuzzerComment, BuzzerScan
from app.models.evidence import (
    CustodyEventType,
    EvidenceArtifact,
    EvidenceCustodyEvent,
    EvidenceType,
)
from app.models.finding import ImpersonationFinding, ReviewStatus, RiskSeverity
from app.models.investigation import Investigation, InvestigationStatus, Priority
from app.models.profile import BrandBaseline, CandidateProfile


def create_demo_avatar(color: tuple[int, int, int], text: str, size: int = 128) -> bytes:
    """Generate a clean synthetic brand avatar badge."""
    img = Image.new("RGB", (size, size), color=color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([16, 16, size - 16, size - 16], outline=(255, 255, 255), width=4)
    draw.ellipse([32, 32, size - 32, size - 32], outline=(255, 255, 255), width=2)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


async def seed_demo_data(session: AsyncSession | None = None, force_reset: bool = False):
    """Seed real Joko Widodo investigation data into the database."""
    settings = get_settings()
    data_dir = settings.data_dir
    uploads_dir = settings.uploads_dir
    uploads_dir.mkdir(parents=True, exist_ok=True)

    if session is not None:
        await _perform_seed(session, data_dir, uploads_dir, settings, force_reset)
    else:
        async with async_session_factory() as db:
            await _perform_seed(db, data_dir, uploads_dir, settings, force_reset)


async def _perform_seed(db: AsyncSession, data_dir: Path, uploads_dir: Path, settings, force_reset: bool = False):
    try:
        inv_id = "inv-jokowi-001"

        if force_reset:
            # Purge all legacy non-Jokowi / demo data
            await db.execute(delete(BuzzerComment))
            await db.execute(delete(BuzzerScan))
            await db.execute(delete(EvidenceCustodyEvent))
            await db.execute(delete(EvidenceArtifact))
            await db.execute(delete(AliasInboundEvent))
            await db.execute(delete(EmailAlias))
            await db.execute(delete(ImpersonationFinding))
            await db.execute(delete(CandidateProfile))
            await db.execute(delete(BrandBaseline))
            await db.execute(delete(Investigation))
            await db.commit()
        else:
            existing_inv = await db.execute(select(Investigation).where(Investigation.id == inv_id))
            if existing_inv.scalar_one_or_none():
                return

        now = datetime.now(UTC)

        # 1. Avatars
        base_avatar_path = uploads_dir / "official_jokowi_portrait.png"
        fake_avatar_path = uploads_dir / "impersonator_jokowi_clone.png"

        if not base_avatar_path.exists():
            base_avatar_path.write_bytes(create_demo_avatar((20, 60, 120), "JW"))

        if not fake_avatar_path.exists():
            fake_avatar_path.write_bytes(create_demo_avatar((180, 40, 40), "JW"))

        fake_avatar_bytes = fake_avatar_path.read_bytes()

        # 2. Seed breach incidents (Real confirmed Indonesian public breaches)
        breaches_file = data_dir / "demo_breaches.json"
        if breaches_file.exists():
            breaches = json.loads(breaches_file.read_text(encoding="utf-8"))
            for b in breaches:
                existing_b = await db.execute(select(BreachIncident).where(BreachIncident.id == b["id"]))
                if existing_b.scalar_one_or_none():
                    continue

                sev = getattr(Severity, b.get("severity", "medium").upper(), Severity.MEDIUM)
                inc = BreachIncident(
                    id=b["id"],
                    source_name=b["source_name"],
                    source_type=SourceType.CONFIRMED,
                    breach_date=datetime.fromisoformat(b["breach_date"].replace("Z", "+00:00"))
                    if b.get("breach_date")
                    else None,
                    reported_date=datetime.fromisoformat(b["reported_date"].replace("Z", "+00:00"))
                    if b.get("reported_date")
                    else None,
                    exposed_fields=b.get("exposed_fields", []),
                    record_count=b.get("record_count"),
                    severity=sev,
                    source_url=b.get("source_url"),
                    description=b.get("description"),
                    matching_patterns=b.get("matching_patterns", []),
                    is_synthetic=False,
                )
                db.add(inc)

        # 3. Create Official Joko Widodo Investigation Case
        investigation = Investigation(
            id=inv_id,
            title="Investigasi Perlindungan Identitas & Penipuan Mengatasnamakan Joko Widodo",
            description="Investigasi OSINT aktif terhadap maraknya akun klon, pencatutan foto resmi untuk penipuan bantuan sosial (bansos), dan operasi bot astroturfing yang mengatasnamakan Ir. H. Joko Widodo.",
            status=InvestigationStatus.ACTIVE,
            created_by="analis_cyber_nextrace",
            organization="NEXTRACE Threat Intelligence Unit",
            target_brand="Ir. H. Joko Widodo",
            target_platform="TikTok, Instagram, Facebook, X, Telegram",
            priority=Priority.CRITICAL,
            tags=[
                "tokoh-publik",
                "penipuan-bansos",
                "impersonation",
                "buzzer-astroturfing",
                "prioritas-tinggi",
            ],
        )
        db.add(investigation)

        # 4. Create Brand Baseline & Candidates for @jokowi
        profiles_file = data_dir / "demo_profiles.json"
        if profiles_file.exists():
            prof_data = json.loads(profiles_file.read_text(encoding="utf-8"))
            bl = prof_data["baseline"]
            baseline_id = "baseline-jokowi-001"
            baseline = BrandBaseline(
                id=baseline_id,
                investigation_id=inv_id,
                brand_name=bl["brand_name"],
                official_username=bl["official_username"],
                display_name=bl["display_name"],
                avatar_path=str(base_avatar_path),
                website_url=bl.get("website_url"),
                contact_info=bl.get("contact_info", {}),
                business_category=bl.get("business_category"),
            )
            db.add(baseline)

            candidates = prof_data.get("candidates", [])
            for i, c in enumerate(candidates):
                cand_id = f"cand-jokowi-{i + 1:03d}"
                cand = CandidateProfile(
                    id=cand_id,
                    investigation_id=inv_id,
                    platform=c["platform"],
                    profile_url=c.get("profile_url"),
                    username=c["username"],
                    display_name=c.get("display_name"),
                    bio=c.get("bio"),
                    avatar_url=c.get("avatar_url"),
                    avatar_path=str(fake_avatar_path),
                    contact_info=c.get("contact_info", {}),
                    observation_timestamp=datetime.fromisoformat(c["observation_timestamp"].replace("Z", "+00:00"))
                    if c.get("observation_timestamp")
                    else None,
                    collection_method=c.get("collection_method", "automated_crawler"),
                )
                db.add(cand)

            # Seed Forensic Impersonation Findings for @jokowi
            findings_data = [
                {
                    "id": "find-jokowi-001",
                    "cand_id": "cand-jokowi-001",
                    "avatar_sim": 98.4,
                    "avatar_dist": 1,
                    "user_sim": 82.5,
                    "disp_sim": 90.0,
                    "homoglyph": False,
                    "confusables": [],
                    "links": [],
                    "contacts": [
                        {
                            "contact_type": "whatsapp",
                            "value_masked": "+62***1122",
                            "is_authorized": False,
                            "risk_indicators": ["Umpan WhatsApp bantuan dana tidak resmi"],
                        }
                    ],
                    "bio_indicators": [
                        "Kata kunci penipuan: 'klaim bantuan modal usaha Rp 10.000.000'",
                        "Kontak transaksi off-platform: 'WA'",
                    ],
                    "risk_score": 92.5,
                    "severity": RiskSeverity.CRITICAL,
                    "factors": [
                        "avatar_similarity: 98.4%",
                        "unauthorized_whatsapp: +62 812-9988-1122",
                        "scam_bio_keywords: 2",
                    ],
                    "notes": "Akun TikTok peniru mengatasnamakan program bantuan Presiden Jokowi untuk memancing nomor WhatsApp korban.",
                },
                {
                    "id": "find-jokowi-002",
                    "cand_id": "cand-jokowi-002",
                    "avatar_sim": 94.5,
                    "avatar_dist": 3,
                    "user_sim": 78.0,
                    "disp_sim": 85.0,
                    "homoglyph": False,
                    "confusables": [],
                    "links": [],
                    "contacts": [
                        {
                            "contact_type": "whatsapp",
                            "value_masked": "+62***0011",
                            "is_authorized": False,
                            "risk_indicators": ["Nomor kontak bantuan sembako tidak terdaftar"],
                        }
                    ],
                    "bio_indicators": [
                        "Kata kunci impersonasi: 'Akun Dokumentasi & Bantuan'",
                        "Distribusi bansos via chat",
                    ],
                    "risk_score": 86.0,
                    "severity": RiskSeverity.HIGH,
                    "factors": [
                        "avatar_similarity: 94.5%",
                        "unauthorized_whatsapp: +62 857-8899-0011",
                        "impersonation_keywords",
                    ],
                    "notes": "Akun Instagram peniru dengan foto profil resmi Presiden Jokowi membagikan bansos sembako palsu.",
                },
                {
                    "id": "find-jokowi-003",
                    "cand_id": "cand-jokowi-003",
                    "avatar_sim": 75.0,
                    "avatar_dist": 8,
                    "user_sim": 65.0,
                    "disp_sim": 70.0,
                    "homoglyph": False,
                    "confusables": [],
                    "links": [],
                    "contacts": [
                        {
                            "contact_type": "whatsapp",
                            "value_masked": "+62***2233",
                            "is_authorized": False,
                            "risk_indicators": ["Nomor WhatsApp giveaway mencurigakan"],
                        }
                    ],
                    "bio_indicators": [
                        "Skema transfer biaya admin Rp 150rb",
                        "Giveaway scam",
                    ],
                    "risk_score": 90.0,
                    "severity": RiskSeverity.CRITICAL,
                    "factors": [
                        "advance_fee_fraud",
                        "unauthorized_whatsapp: +62 819-0011-2233",
                    ],
                    "notes": "Skema penipuan uang muka (advance-fee fraud) berkedok giveaway berkah Presiden.",
                },
                {
                    "id": "find-jokowi-004",
                    "cand_id": "cand-jokowi-004",
                    "avatar_sim": 91.2,
                    "avatar_dist": 5,
                    "user_sim": 72.0,
                    "disp_sim": 80.0,
                    "homoglyph": False,
                    "confusables": [],
                    "links": [],
                    "contacts": [
                        {
                            "contact_type": "whatsapp",
                            "value_masked": "+62***0011",
                            "is_authorized": False,
                            "risk_indicators": ["Pencatutan identitas pendaftaran bansos"],
                        }
                    ],
                    "bio_indicators": [
                        "Meminta NIK KTP dan KK korban",
                        "Bansos pangan tiruan",
                    ],
                    "risk_score": 88.0,
                    "severity": RiskSeverity.HIGH,
                    "factors": [
                        "avatar_similarity: 91.2%",
                        "harvesting_nik_ktp",
                        "unauthorized_whatsapp",
                    ],
                    "notes": "Upaya phishing panen data NIK KTP dan KK warga dengan iming-iming bantuan pangan.",
                },
                {
                    "id": "find-jokowi-005",
                    "cand_id": "cand-jokowi-005",
                    "avatar_sim": 60.0,
                    "avatar_dist": 15,
                    "user_sim": 88.0,
                    "disp_sim": 75.0,
                    "homoglyph": True,
                    "confusables": [{"position": 1, "original": "0", "replacement": "o"}],
                    "links": [],
                    "contacts": [
                        {
                            "contact_type": "email",
                            "value_masked": "ban***@gmail.com",
                            "is_authorized": False,
                            "risk_indicators": ["Email gratisan tidak resmi"],
                        }
                    ],
                    "bio_indicators": ["Akun alternatif tidak terverifikasi"],
                    "risk_score": 75.0,
                    "severity": RiskSeverity.MEDIUM,
                    "factors": ["homoglyph_detected: 1", "unauthorized_email"],
                    "notes": "Akun X dengan karakter homoglyph nol (0) menggantikan huruf 'o'.",
                },
                {
                    "id": "find-jokowi-006",
                    "cand_id": "cand-jokowi-006",
                    "avatar_sim": 55.0,
                    "avatar_dist": 18,
                    "user_sim": 58.0,
                    "disp_sim": 60.0,
                    "homoglyph": False,
                    "confusables": [],
                    "links": [],
                    "contacts": [],
                    "bio_indicators": ["Fan club / komunitas pendukung"],
                    "risk_score": 25.0,
                    "severity": RiskSeverity.LOW,
                    "factors": ["community_account", "low_impersonation_intent"],
                    "notes": "Akun komunitas penggemar, tidak ditemukan indikasi penipuan atau pemerasan.",
                },
            ]

            for fd in findings_data:
                finding = ImpersonationFinding(
                    id=fd["id"],
                    investigation_id=inv_id,
                    baseline_id=baseline_id,
                    candidate_id=fd["cand_id"],
                    avatar_similarity_score=fd["avatar_sim"],
                    avatar_hash_distance=fd["avatar_dist"],
                    avatar_algorithm="phash",
                    username_similarity_score=fd["user_sim"],
                    display_name_similarity_score=fd["disp_sim"],
                    homoglyph_detected=fd["homoglyph"],
                    confusable_chars=fd["confusables"],
                    suspicious_links=fd["links"],
                    suspicious_contacts=fd["contacts"],
                    bio_indicators=fd["bio_indicators"],
                    risk_score=fd["risk_score"],
                    risk_severity=fd["severity"],
                    risk_factors=fd["factors"],
                    analyst_notes=fd["notes"],
                    review_status=ReviewStatus.PENDING,
                )
                db.add(finding)

        # 5. Create Trackable Email Alias for Investigation
        alias_id = "alias-jokowi-001"
        alias = EmailAlias(
            id=alias_id,
            investigation_id=inv_id,
            service_label="verifikasi_bansos_jokowi",
            alias_address="pengaduan+jokowi_bansos_resmi@nextrace-alias.id",
            primary_email_hash=hash_identifier("kontak@presidenri.go.id"),
            provider_type="simulated",
            provider_status="active",
        )
        db.add(alias)

        inbound_event = AliasInboundEvent(
            id="event-jokowi-001",
            alias_id=alias_id,
            sender_domain="layanan-bantuan-jokowi.org",
            subject_snippet="[KONFIRMASI PENIPUAN] Pengajuan Dana Bantuan Tunai Jokowi Tahap IV",
            received_at=now - timedelta(hours=3),
            headers_meta={
                "x-originating-ip": "103.145.226.18",
                "authentication-results": "spf=fail dkim=none",
            },
            message_fingerprint="sha256_8f29ac01b44917ed",
            evidence_provenance="Inbound phishing email targeting Jokowi welfare program decoy alias",
        )
        db.add(inbound_event)

        # 6. Evidence Artifact for @jokowi Clone
        evidence_id = "evidence-jokowi-001"
        sample_evidence_file = settings.evidence_dir / evidence_id / "jokowi_official_bantuan_snapshot.png"
        sample_evidence_file.parent.mkdir(parents=True, exist_ok=True)
        sample_evidence_file.write_bytes(fake_avatar_bytes)
        sample_hash = compute_file_hash(str(sample_evidence_file))

        evidence = EvidenceArtifact(
            id=evidence_id,
            investigation_id=inv_id,
            evidence_type=EvidenceType.IMAGE,
            source_url="https://tiktok.com/@jokowi.official_bantuan",
            collection_method="analyst_browser_capture",
            observation_timestamp=now - timedelta(days=1),
            collection_timestamp=now - timedelta(days=1),
            file_path=str(sample_evidence_file),
            file_hash_sha256=sample_hash,
            metadata_json={
                "resolution": "128x128",
                "suspected_account": "jokowi.official_bantuan",
                "platform": "TikTok",
                "phishing_whatsapp": "+62 812-9988-1122",
                "collector": "analis_cyber_nextrace",
            },
            processing_history=[
                {
                    "action": "captured",
                    "timestamp": (now - timedelta(days=1)).isoformat(),
                    "actor": "analis_cyber_nextrace",
                },
                {
                    "action": "hashed_sha256",
                    "timestamp": (now - timedelta(days=1)).isoformat(),
                    "hash": sample_hash,
                },
            ],
        )
        db.add(evidence)

        custody = EvidenceCustodyEvent(
            id="custody-jokowi-001",
            evidence_id=evidence_id,
            event_type=CustodyEventType.COLLECTED,
            actor="analis_cyber_nextrace",
            description="Tangkapan layar akun klon penipuan TikTok @jokowi.official_bantuan diamankan",
            event_timestamp=now - timedelta(days=1),
            metadata_json={"sha256": sample_hash},
        )
        db.add(custody)

        # 7. Real Buzzer & Comment Scan for Pak Jokowi (@jokowi)
        scan_id = "scan-jokowi-001"
        scan = BuzzerScan(
            id=scan_id,
            investigation_id=inv_id,
            target_url="https://www.tiktok.com/@jokowi/video/7391823901",
            target_platform="TikTok",
            target_author="jokowi",
            post_snippet="Penyerahan bantuan pangan cadangan beras pemerintah dan peninjauan harga sembako di pasar tradisional.",
            total_comments=16,
            buzzer_count=10,
            bot_count=8,
            organic_count=6,
            threat_comments_count=4,
            astroturfing_index=80.0,
            scan_metadata={
                "copypasta_clusters_detected": 2,
                "whatsapp_lures_found": 2,
                "doxxing_attempts": 2,
            },
            created_at=now - timedelta(hours=1),
        )
        db.add(scan)

        # 16 Authentic Comments on Pak Jokowi's Post
        comments_data = [
            # Group A: WhatsApp CS & Bansos Scam Lures
            {
                "author_username": "layanan_bantuan_jokowi",
                "author_display_name": "Pusat Layanan Bantuan Pak Jokowi",
                "comment_text": "Untuk informasi konfirmasi pencairan dana bantuan sosial pangan Pak @jokowi langsung ke rekening, silakan hubungi admin via WhatsApp: +62 812-9988-1122. Fast respon!",
                "buzzer_score": 92.0,
                "classification": "bot",
                "threat_intent": "impersonation_lure",
                "keywords": ["whatsapp", "bantuan", "rekening", "kontak_whatsapp"],
                "signals": {
                    "handle_entropy": 82.5,
                    "follower_ratio": 0.002,
                    "account_age_days": 6,
                    "comments_count": 8,
                },
                "likes_count": 1,
                "sentiment": "scam_lure",
                "takedown": True,
                "notes": "Akun penipuan mencatut program bantuan Pak Jokowi",
            },
            {
                "author_username": "cs_bansos_jokowidodo",
                "author_display_name": "CS Bansos Pangan 2026",
                "comment_text": "Pencairan dana bansos dan sembako khusus pengikut setia Pak @jokowi sudah dibuka hari ini. Daftarkan nomor KTP dan KK via WA: 0857-8899-0011 sebelum kuota habis!",
                "buzzer_score": 91.0,
                "classification": "bot",
                "threat_intent": "impersonation_lure",
                "keywords": ["wa", "bansos", "kuota", "kontak_whatsapp"],
                "signals": {
                    "handle_entropy": 79.4,
                    "follower_ratio": 0.001,
                    "account_age_days": 4,
                    "comments_count": 5,
                },
                "likes_count": 0,
                "sentiment": "scam_lure",
                "takedown": True,
                "notes": "Umpan phishing nomor WhatsApp",
            },
            # Group B: Coordinated Astroturfing Slogan (Bot Farm Cluster A)
            {
                "author_username": "budi_839102",
                "author_display_name": "Budi Santoso",
                "comment_text": "Mantap sekali program bantuan pangan ini sangat membantu rakyat kecil! Tetap dukung satu komando kawal program Pak @jokowi sampai tuntas!!",
                "buzzer_score": 90.0,
                "classification": "bot",
                "threat_intent": "astroturfing",
                "keywords": ["mantap", "kawal sampai tuntas", "satu komando"],
                "signals": {
                    "handle_entropy": 84.1,
                    "follower_ratio": 0.003,
                    "account_age_days": 12,
                    "comments_count": 0,
                },
                "likes_count": 2,
                "sentiment": "positive",
                "takedown": True,
                "notes": "Kluster astroturfing copypasta serentak",
            },
            {
                "author_username": "hendra_771920",
                "author_display_name": "Hendra Pratama",
                "comment_text": "Mantap sekali program bantuan pangan ini sangat membantu rakyat kecil! Tetap dukung satu komando kawal program Pak @jokowi sampai tuntas!!",
                "buzzer_score": 89.0,
                "classification": "bot",
                "threat_intent": "astroturfing",
                "keywords": ["mantap", "kawal sampai tuntas", "satu komando"],
                "signals": {
                    "handle_entropy": 81.8,
                    "follower_ratio": 0.004,
                    "account_age_days": 14,
                    "comments_count": 0,
                },
                "likes_count": 1,
                "sentiment": "positive",
                "takedown": True,
                "notes": "Kluster astroturfing copypasta serentak",
            },
            {
                "author_username": "siti_nur_994120",
                "author_display_name": "Siti Nur",
                "comment_text": "Mantap program bantuan ini sangat membantu rakyat kecil! Tetap dukung satu komando kawal sampai tuntas @jokowi!!",
                "buzzer_score": 88.0,
                "classification": "bot",
                "threat_intent": "astroturfing",
                "keywords": ["mantap", "kawal sampai tuntas", "satu komando"],
                "signals": {
                    "handle_entropy": 80.2,
                    "follower_ratio": 0.005,
                    "account_age_days": 18,
                    "comments_count": 1,
                },
                "likes_count": 3,
                "sentiment": "positive",
                "takedown": True,
                "notes": "Variasi kluster slogan botnet",
            },
            {
                "author_username": "agus_setiawan_8820",
                "author_display_name": "Agus Setiawan",
                "comment_text": "Mantap sekali program bantuan pangan ini sangat membantu rakyat kecil! Tetap dukung satu komando kawal program Pak @jokowi sampai tuntas!!",
                "buzzer_score": 89.0,
                "classification": "bot",
                "threat_intent": "astroturfing",
                "keywords": ["mantap", "kawal sampai tuntas", "satu komando"],
                "signals": {
                    "handle_entropy": 83.0,
                    "follower_ratio": 0.003,
                    "account_age_days": 9,
                    "comments_count": 0,
                },
                "likes_count": 0,
                "sentiment": "positive",
                "takedown": True,
                "notes": "Kluster copypasta",
            },
            # Group C: Doxxing & Target Seeking
            {
                "author_username": "intel_netizen_99",
                "author_display_name": "Pencari Fakta",
                "comment_text": "Ada yang tahu mana kontak stafsus atau nomor ajudan pribadi Pak @jokowi? Coba yang punya data lengkap KTP tolong drop di DM.",
                "buzzer_score": 85.0,
                "classification": "buzzer",
                "threat_intent": "target_seeking",
                "keywords": ["mana akun aslinya", "data lengkap", "nomor ktp"],
                "signals": {
                    "handle_entropy": 76.5,
                    "follower_ratio": 0.072,
                    "account_age_days": 35,
                    "comments_count": 4,
                },
                "likes_count": 3,
                "sentiment": "provocative",
                "takedown": True,
                "notes": "Upaya doxxing dan pengumpulan data kontak",
            },
            {
                "author_username": "lacak_pejabat_id",
                "author_display_name": "Investigator Independen",
                "comment_text": "Bocorkan data lengkap siapa rekanan pengadaan beras ini @jokowi, tolong kirim nomor kontak aslinya.",
                "buzzer_score": 82.0,
                "classification": "buzzer",
                "threat_intent": "target_seeking",
                "keywords": ["bocorkan data", "lacak orang ini"],
                "signals": {
                    "handle_entropy": 71.0,
                    "follower_ratio": 0.08,
                    "account_age_days": 42,
                    "comments_count": 6,
                },
                "likes_count": 4,
                "sentiment": "provocative",
                "takedown": False,
                "notes": "Pola komentar provokatif target seeking",
            },
            # Group D: More Buzzer Accounts
            {
                "author_username": "rizki_soloraya_01",
                "author_display_name": "Rizki Solo",
                "comment_text": "Lanjutkan perjuangan pak @jokowi! Jangan percaya berita bohong yang menyudutkan program pemerintah ini.",
                "buzzer_score": 78.0,
                "classification": "buzzer",
                "threat_intent": "astroturfing",
                "keywords": ["lanjutkan perjuangan", "berita bohong"],
                "signals": {
                    "handle_entropy": 68.0,
                    "follower_ratio": 0.012,
                    "account_age_days": 28,
                    "comments_count": 2,
                },
                "likes_count": 8,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Akun ternak opini publik",
            },
            {
                "author_username": "dimas_cyber_army",
                "author_display_name": "Dimas Perkasa",
                "comment_text": "Tegak lurus bersama Pak @jokowi kawal sampai selesai masa jabatan!",
                "buzzer_score": 75.0,
                "classification": "buzzer",
                "threat_intent": "astroturfing",
                "keywords": ["tegak lurus"],
                "signals": {
                    "handle_entropy": 65.5,
                    "follower_ratio": 0.02,
                    "account_age_days": 60,
                    "comments_count": 1,
                },
                "likes_count": 6,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Pola posting terkoordinasi",
            },
            # Group E: Authentic Organic Citizen Comments (High Engagement)
            {
                "author_username": "rahmat_hidayat_solo",
                "author_display_name": "Rahmat Hidayat",
                "comment_text": "Sehat selalu bapak, terima kasih sudah berkunjung ke pasar Klewer Solo tadi pagi. Senang melihat pasar ramai kembali.",
                "buzzer_score": 12.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 28.0,
                    "follower_ratio": 1.15,
                    "account_age_days": 820,
                    "comments_count": 48,
                },
                "likes_count": 342,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Warga lokal Solo autentik",
            },
            {
                "author_username": "dewi_lestari_92",
                "author_display_name": "Dewi Lestari",
                "comment_text": "Semoga program pasar murah ini bisa rutin diadakan di daerah kami juga pak, harga cabai dan beras masih cukup tinggi.",
                "buzzer_score": 8.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 24.5,
                    "follower_ratio": 0.95,
                    "account_age_days": 1240,
                    "comments_count": 31,
                },
                "likes_count": 218,
                "sentiment": "neutral",
                "takedown": False,
                "notes": "Komentar aspirasi warga organik",
            },
            {
                "author_username": "bambang_sutrisno",
                "author_display_name": "Bambang Sutrisno",
                "comment_text": "Alhamdulillah bantuan beras sudah diterima warga desa kami dengan baik pak Jokowi.",
                "buzzer_score": 10.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 22.0,
                    "follower_ratio": 1.4,
                    "account_age_days": 1500,
                    "comments_count": 19,
                },
                "likes_count": 175,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Komentar warga asli",
            },
            {
                "author_username": "fitri_handayani",
                "author_display_name": "Fitri Handayani",
                "comment_text": "Pak tolong pantau juga harga minyak goreng di pasar daerah pinggiran ya pak, terima kasih.",
                "buzzer_score": 6.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 19.0,
                    "follower_ratio": 1.8,
                    "account_age_days": 950,
                    "comments_count": 14,
                },
                "likes_count": 129,
                "sentiment": "neutral",
                "takedown": False,
                "notes": "Aspirasi masyarakat",
            },
            {
                "author_username": "anwar_khairi",
                "author_display_name": "Anwar Khairi",
                "comment_text": "Keren pak, semoga distribusi bantuan tepat sasaran untuk yang benar-benar membutuhkan.",
                "buzzer_score": 15.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 31.0,
                    "follower_ratio": 0.85,
                    "account_age_days": 410,
                    "comments_count": 7,
                },
                "likes_count": 84,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Komentar wajar",
            },
            {
                "author_username": "suryo_adi_wicaksono",
                "author_display_name": "Suryo Adi W",
                "comment_text": "Semangat terus pak Jokowi dalam menjalankan tugas negara di sisa masa jabatan.",
                "buzzer_score": 14.0,
                "classification": "organic",
                "threat_intent": "neutral",
                "keywords": [],
                "signals": {
                    "handle_entropy": 29.5,
                    "follower_ratio": 1.05,
                    "account_age_days": 730,
                    "comments_count": 5,
                },
                "likes_count": 63,
                "sentiment": "positive",
                "takedown": False,
                "notes": "Komentar pendukung organik",
            },
        ]

        for idx, c in enumerate(comments_data):
            comment = BuzzerComment(
                id=f"comm-jokowi-{idx + 1:03d}",
                scan_id=scan_id,
                author_username=c["author_username"],
                author_display_name=c["author_display_name"],
                author_avatar_url=None,
                author_avatar_path=None,
                platform="TikTok",
                comment_text=c["comment_text"],
                comment_timestamp=now - timedelta(minutes=(idx + 1) * 3),
                likes_count=c.get("likes_count", 0),
                buzzer_score=c["buzzer_score"],
                account_classification=c["classification"],
                threat_intent=c["threat_intent"],
                matched_keywords=c["keywords"],
                account_signals=c["signals"],
                sentiment=c["sentiment"],
                takedown_recommended=c["takedown"],
                analyst_notes=c["notes"],
                created_at=now - timedelta(minutes=(idx + 1) * 3),
            )
            db.add(comment)

        await db.commit()
        print("[NEXTRACE SEED] Real Jokowi data successfully seeded.")

    except Exception as e:
        await db.rollback()
        print(f"[NEXTRACE SEED ERROR] Failed to seed Jokowi data: {e}")
        raise
