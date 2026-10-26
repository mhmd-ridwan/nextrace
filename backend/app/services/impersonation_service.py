"""
NEXTRACE Impersonation Detection Service.
Orchestrates multi-signal impersonation analysis across images, usernames,
display names, links, contacts, and bios.
"""

import contextlib
import re
from datetime import UTC, datetime
from urllib.parse import urlparse

from rapidfuzz import fuzz
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import generate_id
from app.models.finding import ImpersonationFinding, ReviewStatus, RiskSeverity
from app.models.profile import BrandBaseline, CandidateProfile
from app.schemas.impersonator import (
    BioAnalysisResult,
    BrandBaselineCreate,
    BrandBaselineResponse,
    CandidateProfileCreate,
    CandidateProfileResponse,
    ContactAnalysisResult,
    DisplayNameSimilarityResult,
    FindingResponse,
    ImageSimilarityResult,
    ScanResponse,
    UsernameSimilarityResult,
)
from app.services.homoglyph_detection import HomoglyphDetectionService
from app.services.image_similarity import ImageSimilarityService
from app.services.link_analyzer import LinkAnalyzerService
from app.services.profile_scraper import ProfileScraperService
from app.services.risk_engine import RiskEngine
from app.services.username_similarity import UsernameSimilarityService


class ImpersonationService:
    """Orchestrates multi-signal impersonation analysis."""

    def __init__(self):
        self.image_service = ImageSimilarityService()
        self.username_service = UsernameSimilarityService()
        self.homoglyph_service = HomoglyphDetectionService()
        self.link_analyzer = LinkAnalyzerService()
        self.risk_engine = RiskEngine()
        self.scraper = ProfileScraperService()

    async def create_baseline(
        self,
        db: AsyncSession,
        data: BrandBaselineCreate,
        avatar_path: str | None = None,
    ) -> BrandBaselineResponse:
        """Register official brand baseline."""
        baseline = BrandBaseline(
            id=generate_id(),
            investigation_id=data.investigation_id,
            brand_name=data.brand_name,
            official_username=data.official_username,
            display_name=data.display_name,
            avatar_path=avatar_path,
            website_url=data.website_url,
            contact_info=data.contact_info,
            business_category=data.business_category,
        )
        db.add(baseline)
        await db.flush()

        return BrandBaselineResponse(
            id=baseline.id,
            brand_name=baseline.brand_name,
            official_username=baseline.official_username,
            display_name=baseline.display_name,
            avatar_path=baseline.avatar_path,
            website_url=baseline.website_url,
            contact_info=baseline.contact_info or {},
            business_category=baseline.business_category,
            investigation_id=baseline.investigation_id,
            created_at=baseline.created_at,
        )

    async def get_baseline(self, db: AsyncSession, baseline_id: str) -> BrandBaselineResponse | None:
        """Fetch baseline by ID."""
        res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == baseline_id))
        b = res.scalar_one_or_none()
        if not b:
            return None
        return BrandBaselineResponse(
            id=b.id,
            brand_name=b.brand_name,
            official_username=b.official_username,
            display_name=b.display_name,
            avatar_path=b.avatar_path,
            website_url=b.website_url,
            contact_info=b.contact_info or {},
            business_category=b.business_category,
            investigation_id=b.investigation_id,
            created_at=b.created_at,
        )

    async def scan(
        self,
        db: AsyncSession,
        baseline_id: str,
        candidates: list[CandidateProfileCreate],
        investigation_id: str | None = None,
    ) -> ScanResponse:
        """Scan candidate profiles against the official baseline."""
        res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == baseline_id))
        baseline = res.scalar_one_or_none()
        if not baseline:
            raise ValueError(f"Brand baseline '{baseline_id}' not found")

        scan_id = generate_id()
        findings = []
        high_cnt = 0
        med_cnt = 0
        low_cnt = 0

        for cand_data in candidates:
            avatar_path = cand_data.avatar_path
            display_name = cand_data.display_name
            bio = cand_data.bio
            profile_url = cand_data.profile_url or self.scraper.normalize_profile_url(
                cand_data.username, cand_data.platform
            )
            contact_info = dict(cand_data.contact_info or {})

            # Auto-scrape live public profile if avatar or bio is missing
            if not avatar_path or not bio or not display_name or display_name == cand_data.username:
                try:
                    scraped = self.scraper.scrape(profile_url or cand_data.username, cand_data.platform)
                    if scraped.get("success"):
                        if not avatar_path and scraped.get("avatar_path"):
                            avatar_path = scraped["avatar_path"]
                        if (not display_name or display_name == cand_data.username) and scraped.get("display_name"):
                            display_name = scraped["display_name"]
                        if not bio and scraped.get("bio"):
                            bio = scraped["bio"]
                        if scraped.get("contact_info"):
                            contact_info.update(scraped["contact_info"])
                except Exception as scrape_err:
                    print("Auto-scrape fallback:", scrape_err)

            candidate = CandidateProfile(
                id=generate_id(),
                investigation_id=investigation_id,
                platform=cand_data.platform,
                profile_url=profile_url,
                username=cand_data.username,
                display_name=display_name,
                bio=bio,
                avatar_url=cand_data.avatar_url,
                avatar_path=avatar_path,
                contact_info=contact_info,
                observation_timestamp=cand_data.observation_timestamp or datetime.now(UTC),
                collection_method=cand_data.collection_method,
            )
            db.add(candidate)
            await db.flush()

            finding = await self._analyze_candidate(db, baseline, candidate, investigation_id)
            findings.append(finding)

            if finding.risk_severity in ("high", "critical"):
                high_cnt += 1
            elif finding.risk_severity == "medium":
                med_cnt += 1
            else:
                low_cnt += 1

        return ScanResponse(
            scan_id=scan_id,
            investigation_id=investigation_id,
            total_candidates=len(candidates),
            findings=findings,
            high_risk_count=high_cnt,
            medium_risk_count=med_cnt,
            low_risk_count=low_cnt,
        )

    async def analyze_single(self, db: AsyncSession, baseline_id: str, candidate_id: str) -> FindingResponse | None:
        """Analyze a specific candidate against baseline."""
        base_res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == baseline_id))
        baseline = base_res.scalar_one_or_none()

        cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == candidate_id))
        candidate = cand_res.scalar_one_or_none()

        if not baseline or not candidate:
            return None

        return await self._analyze_candidate(db, baseline, candidate)

    async def list_baselines(
        self,
        db: AsyncSession,
        investigation_id: str | None = None,
    ) -> list[BrandBaselineResponse]:
        """List distinct brand baselines."""
        q = select(BrandBaseline).order_by(BrandBaseline.created_at.desc())
        if investigation_id:
            q = q.where(BrandBaseline.investigation_id == investigation_id)
        res = await db.execute(q)
        baselines = res.scalars().all()

        seen = set()
        unique = []
        for b in baselines:
            uname = (b.official_username or "").strip().lower()
            if not uname or uname in seen:
                continue
            seen.add(uname)
            unique.append(
                BrandBaselineResponse(
                    id=b.id,
                    brand_name=b.brand_name,
                    official_username=b.official_username,
                    display_name=b.display_name,
                    avatar_path=b.avatar_path,
                    website_url=b.website_url,
                    contact_info=b.contact_info or {},
                    business_category=b.business_category,
                    investigation_id=b.investigation_id,
                    created_at=b.created_at,
                )
            )
        return unique

    async def get_findings(
        self,
        db: AsyncSession,
        investigation_id: str | None = None,
        baseline_id: str | None = None,
        active_only: bool = False,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Get paginated findings with optional baseline and liveness filtering."""
        q = select(ImpersonationFinding)
        if investigation_id:
            q = q.where(ImpersonationFinding.investigation_id == investigation_id)

        if baseline_id:
            base_res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == baseline_id))
            target_base = base_res.scalar_one_or_none()
            if target_base and target_base.official_username:
                matching_bases = await db.execute(
                    select(BrandBaseline.id).where(BrandBaseline.official_username == target_base.official_username)
                )
                base_ids = [r[0] for r in matching_bases.fetchall()]
                q = q.where(ImpersonationFinding.baseline_id.in_(base_ids))
            else:
                q = q.where(ImpersonationFinding.baseline_id == baseline_id)

        all_res = await db.execute(q.order_by(ImpersonationFinding.risk_score.desc()))
        all_findings = all_res.scalars().all()

        filtered_findings = []
        for f in all_findings:
            if active_only:
                cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == f.candidate_id))
                cand = cand_res.scalar_one_or_none()
                if (
                    cand
                    and cand.contact_info
                    and (
                        cand.contact_info.get("is_active") is False
                        or cand.contact_info.get("activity_status")
                        in (
                            "dormant",
                            "inactive",
                        )
                    )
                ):
                    continue
            filtered_findings.append(f)

        total = len(filtered_findings)
        offset = (page - 1) * per_page
        paged_findings = filtered_findings[offset : offset + per_page]

        items = [await self._finding_to_response(db, f) for f in paged_findings]
        return {
            "items": items,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
        }

    async def get_finding(self, db: AsyncSession, finding_id: str) -> FindingResponse | None:
        """Get finding detail."""
        res = await db.execute(select(ImpersonationFinding).where(ImpersonationFinding.id == finding_id))
        f = res.scalar_one_or_none()
        if not f:
            return None
        return await self._finding_to_response(db, f)

    async def update_candidate_avatar(
        self, db: AsyncSession, finding_id: str, avatar_path: str
    ) -> FindingResponse | None:
        """Attach candidate avatar and recompute pHash similarity and risk score."""
        finding_res = await db.execute(select(ImpersonationFinding).where(ImpersonationFinding.id == finding_id))
        finding = finding_res.scalar_one_or_none()
        if not finding:
            return None

        cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == finding.candidate_id))
        candidate = cand_res.scalar_one_or_none()
        if not candidate:
            return None

        base_res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == finding.baseline_id))
        baseline = base_res.scalar_one_or_none()

        candidate.avatar_path = avatar_path
        db.add(candidate)

        # Recalculate image similarity
        image_result = None
        if baseline and baseline.avatar_path and candidate.avatar_path:
            try:
                image_result = self.image_service.analyze(baseline.avatar_path, candidate.avatar_path)
            except Exception as e:
                print("Image similarity error during update:", e)

        finding.avatar_similarity_score = image_result.similarity_percentage if image_result else None
        finding.avatar_hash_distance = image_result.hash_distance if image_result else None
        finding.avatar_algorithm = image_result.algorithm if image_result else None

        # Recompute risk
        risk_indicators = {
            "avatar_similarity": image_result.similarity_percentage if image_result else 0.0,
            "username_similarity": finding.username_similarity_score or 0.0,
            "display_name_similarity": finding.display_name_similarity_score or 0.0,
            "homoglyph_detected": 100.0 if finding.homoglyph_detected else 0.0,
            "suspicious_links": min(
                100.0,
                len(
                    [
                        lnk
                        for lnk in (finding.suspicious_links or [])
                        if isinstance(lnk, dict) and lnk.get("risk_level") != "low"
                    ]
                )
                * 50.0,
            ),
            "suspicious_contacts": min(
                100.0,
                len(
                    [
                        c
                        for c in (finding.suspicious_contacts or [])
                        if isinstance(c, dict) and not c.get("is_authorized")
                    ]
                )
                * 50.0,
            ),
            "bio_indicators": min(100.0, len(finding.bio_indicators or []) * 25.0),
        }

        risk_assessment = self.risk_engine.calculate_impersonation_risk(risk_indicators)
        score = risk_assessment["score"]
        severity_str = risk_assessment["severity"]
        severity_map = {
            "low": RiskSeverity.LOW,
            "medium": RiskSeverity.MEDIUM,
            "high": RiskSeverity.HIGH,
            "critical": RiskSeverity.CRITICAL,
        }
        finding.risk_score = score
        finding.risk_severity = severity_map.get(severity_str, RiskSeverity.LOW)
        finding.risk_factors = [
            f"{f['factor']}: {f['raw_value']}%" for f in risk_assessment["factors"] if f["raw_value"] > 0
        ]

        db.add(finding)
        await db.commit()
        return await self._finding_to_response(db, finding)

    async def delete_finding(self, db: AsyncSession, finding_id: str) -> bool:
        """Delete an impersonation finding and its associated candidate profile."""
        res = await db.execute(select(ImpersonationFinding).where(ImpersonationFinding.id == finding_id))
        finding = res.scalar_one_or_none()
        if not finding:
            return False

        cand_id = finding.candidate_id
        await db.delete(finding)
        if cand_id:
            cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_id))
            cand = cand_res.scalar_one_or_none()
            if cand:
                await db.delete(cand)

        await db.commit()
        return True

    async def clear_findings(self, db: AsyncSession, investigation_id: str | None = None) -> int:
        """Clear findings from an investigation to allow a clean manual slate."""
        query = select(ImpersonationFinding)
        if investigation_id:
            query = query.where(ImpersonationFinding.investigation_id == investigation_id)
        res = await db.execute(query)
        findings = res.scalars().all()
        count = len(findings)
        for f in findings:
            cand_id = f.candidate_id
            await db.delete(f)
            if cand_id:
                cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == cand_id))
                cand = cand_res.scalar_one_or_none()
                if cand:
                    await db.delete(cand)
        await db.commit()
        return count

    async def quick_compare(
        self,
        db: AsyncSession,
        official_query: str,
        official_platform: str = "Instagram",
        candidate_query: str = "",
        candidate_platform: str = "Instagram",
        investigation_id: str | None = "inv-demo-001",
        save_to_queue: bool = True,
    ) -> FindingResponse:
        """
        Ad-hoc comparison of any two arbitrary accounts without predefined defaults.
        Scrapes live profiles on-demand, downloads avatars, and executes multi-signal forensics.
        """
        # 1. Scrape or find baseline profile
        clean_off_user = official_query.replace("@", "").strip()
        scraped_base = self.scraper.scrape(official_query, official_platform)

        base_display = scraped_base.get("display_name") or clean_off_user
        base_avatar = scraped_base.get("avatar_path")
        base_url = scraped_base.get("profile_url") or f"https://{official_platform.lower()}.com/{clean_off_user}"

        # Check if an existing baseline already exists with this handle
        existing_base_q = await db.execute(
            select(BrandBaseline).where(BrandBaseline.official_username == clean_off_user)
        )
        baseline = existing_base_q.scalar_one_or_none()
        if not baseline:
            baseline = BrandBaseline(
                id=generate_id(),
                investigation_id=investigation_id,
                brand_name=base_display,
                official_username=clean_off_user,
                display_name=base_display,
                avatar_path=base_avatar,
                website_url=base_url,
                contact_info=scraped_base.get("contact_info") or {},
                business_category="Custom Target Investigation",
            )
            db.add(baseline)
            await db.flush()
        else:
            if base_avatar and not baseline.avatar_path:
                baseline.avatar_path = base_avatar
                db.add(baseline)
                await db.flush()

        # 2. Scrape candidate profile
        clean_cand_user = candidate_query.replace("@", "").strip()
        scraped_cand = self.scraper.scrape(candidate_query, candidate_platform)

        cand_display = scraped_cand.get("display_name") or clean_cand_user
        cand_avatar = scraped_cand.get("avatar_path")
        cand_bio = scraped_cand.get("bio")
        cand_url = scraped_cand.get("profile_url") or f"https://{candidate_platform.lower()}.com/{clean_cand_user}"
        cand_contact = scraped_cand.get("contact_info") or {}

        candidate = CandidateProfile(
            id=generate_id(),
            investigation_id=investigation_id,
            platform=candidate_platform,
            profile_url=cand_url,
            username=clean_cand_user,
            display_name=cand_display,
            bio=cand_bio,
            avatar_url=scraped_cand.get("avatar_url"),
            avatar_path=cand_avatar,
            contact_info=cand_contact,
            observation_timestamp=datetime.now(UTC),
            collection_method="manual_ad_hoc_scrape",
        )
        db.add(candidate)
        await db.flush()

        finding_resp = await self._analyze_candidate(db, baseline, candidate, investigation_id)
        if not save_to_queue:
            await db.execute(delete(ImpersonationFinding).where(ImpersonationFinding.id == finding_resp.finding_id))
            await db.execute(delete(CandidateProfile).where(CandidateProfile.id == candidate.id))
            await db.commit()

        return finding_resp

    async def _analyze_candidate(
        self,
        db: AsyncSession,
        baseline: BrandBaseline,
        candidate: CandidateProfile,
        investigation_id: str | None = None,
    ) -> FindingResponse:
        # 1. Image similarity
        image_result = None
        if baseline.avatar_path and candidate.avatar_path:
            try:
                image_result = self.image_service.analyze(baseline.avatar_path, candidate.avatar_path)
            except Exception:
                image_result = None

        # 2. Username similarity
        username_result = self.username_service.analyze(baseline.official_username, candidate.username)

        # 3. Display name similarity
        clean_base_dn = (baseline.display_name or "").lower().strip()
        clean_cand_dn = (candidate.display_name or "").lower().strip()
        dn_ratio = float(fuzz.ratio(clean_base_dn, clean_cand_dn)) / 100.0

        display_name_result = DisplayNameSimilarityResult(
            edit_distance=abs(len(clean_base_dn) - len(clean_cand_dn)),
            similarity_ratio=round(dn_ratio, 4),
            normalized_baseline=clean_base_dn,
            normalized_candidate=clean_cand_dn,
        )

        # 4. Links in bio
        bio_urls = self._extract_urls(candidate.bio or "")
        official_domain = None
        if baseline.website_url:
            with contextlib.suppress(Exception):
                official_domain = urlparse(baseline.website_url).hostname
        link_results = self.link_analyzer.analyze_links(bio_urls, official_domain)

        # 5. Contacts
        contact_results = self._analyze_contacts(candidate.contact_info or {}, baseline.contact_info or {})

        # 6. Bio analysis
        bio_result = self._analyze_bio(candidate.bio or "")

        # 7. Multi-signal risk calculation
        risk_indicators = {
            "avatar_similarity": image_result.similarity_percentage if image_result else 0.0,
            "username_similarity": username_result.similarity_ratio * 100.0,
            "display_name_similarity": display_name_result.similarity_ratio * 100.0,
            "homoglyph_detected": 100.0 if username_result.homoglyph_detected else 0.0,
            "suspicious_links": min(100.0, len([lnk for lnk in link_results if lnk.risk_level != "low"]) * 50.0),
            "suspicious_contacts": min(100.0, len([c for c in contact_results if not c.is_authorized]) * 50.0),
            "bio_indicators": min(100.0, len(bio_result.indicators) * 25.0),
        }

        risk_assessment = self.risk_engine.calculate_impersonation_risk(risk_indicators)
        score = risk_assessment["score"]
        severity_str = risk_assessment["severity"]

        severity_map = {
            "low": RiskSeverity.LOW,
            "medium": RiskSeverity.MEDIUM,
            "high": RiskSeverity.HIGH,
            "critical": RiskSeverity.CRITICAL,
        }

        finding = ImpersonationFinding(
            id=generate_id(),
            investigation_id=investigation_id or baseline.investigation_id,
            baseline_id=baseline.id,
            candidate_id=candidate.id,
            avatar_similarity_score=image_result.similarity_percentage if image_result else None,
            avatar_hash_distance=image_result.hash_distance if image_result else None,
            avatar_algorithm=image_result.algorithm if image_result else None,
            username_similarity_score=username_result.similarity_ratio * 100.0,
            display_name_similarity_score=display_name_result.similarity_ratio * 100.0,
            homoglyph_detected=username_result.homoglyph_detected,
            confusable_chars=username_result.confusable_chars,
            suspicious_links=[lnk.model_dump() for lnk in link_results],
            suspicious_contacts=[c.model_dump() for c in contact_results],
            bio_indicators=bio_result.indicators,
            risk_score=score,
            risk_severity=severity_map.get(severity_str, RiskSeverity.LOW),
            risk_factors=[
                f"{f['factor']}: {f['raw_value']}%" for f in risk_assessment["factors"] if f["raw_value"] > 0
            ],
            review_status=ReviewStatus.PENDING,
        )
        db.add(finding)
        await db.flush()

        return await self._finding_to_response(db, finding)

    async def _finding_to_response(self, db: AsyncSession, f: ImpersonationFinding) -> FindingResponse:
        base_res = await db.execute(select(BrandBaseline).where(BrandBaseline.id == f.baseline_id))
        base_m = base_res.scalar_one_or_none()
        base_resp = None
        if base_m:
            base_resp = BrandBaselineResponse(
                id=base_m.id,
                brand_name=base_m.brand_name,
                official_username=base_m.official_username,
                display_name=base_m.display_name,
                avatar_path=base_m.avatar_path,
                website_url=base_m.website_url,
                contact_info=base_m.contact_info or {},
                business_category=base_m.business_category,
                investigation_id=base_m.investigation_id,
                created_at=base_m.created_at,
            )

        cand_res = await db.execute(select(CandidateProfile).where(CandidateProfile.id == f.candidate_id))
        cand_m = cand_res.scalar_one_or_none()
        cand_resp = None
        if cand_m:
            cand_contact = cand_m.contact_info or {}
            is_active = cand_contact.get("is_active", True)
            activity_status = cand_contact.get("activity_status", "active")
            cand_resp = CandidateProfileResponse(
                id=cand_m.id,
                platform=cand_m.platform,
                profile_url=cand_m.profile_url,
                username=cand_m.username,
                display_name=cand_m.display_name,
                bio=cand_m.bio,
                avatar_url=cand_m.avatar_url,
                avatar_path=cand_m.avatar_path,
                contact_info=cand_contact,
                is_active=is_active,
                activity_status=activity_status,
                observation_timestamp=cand_m.observation_timestamp,
                collection_method=cand_m.collection_method,
            )

        image_sim = None
        if f.avatar_similarity_score is not None:
            baseline_hash = ""
            candidate_hash = ""
            if base_m and base_m.avatar_path and cand_m and cand_m.avatar_path:
                try:
                    sim = self.image_service.analyze(base_m.avatar_path, cand_m.avatar_path)
                    baseline_hash = sim.baseline_hash
                    candidate_hash = sim.candidate_hash
                except Exception:
                    pass
            image_sim = ImageSimilarityResult(
                algorithm=f.avatar_algorithm or "phash",
                hash_distance=f.avatar_hash_distance or 0,
                similarity_percentage=f.avatar_similarity_score,
                is_above_threshold=(f.avatar_similarity_score >= 85.0),
                baseline_hash=baseline_hash,
                candidate_hash=candidate_hash,
            )

        username_sim = UsernameSimilarityResult(
            similarity_ratio=(f.username_similarity_score or 0.0) / 100.0,
            homoglyph_detected=f.homoglyph_detected or False,
            confusable_chars=f.confusable_chars or [],
            is_suspicious=(f.username_similarity_score or 0.0) >= 70.0,
        )

        dn_sim = DisplayNameSimilarityResult(
            similarity_ratio=(f.display_name_similarity_score or 0.0) / 100.0,
        )

        return FindingResponse(
            finding_id=f.id,
            investigation_id=f.investigation_id,
            baseline_id=f.baseline_id,
            baseline=base_resp,
            candidate=cand_resp,
            image_similarity=image_sim,
            username_similarity=username_sim,
            display_name_similarity=dn_sim,
            link_analysis=f.suspicious_links or [],
            contact_analysis=f.suspicious_contacts or [],
            bio_analysis=BioAnalysisResult(indicators=f.bio_indicators or []),
            risk_score=f.risk_score or 0.0,
            risk_severity=f.risk_severity.value if hasattr(f.risk_severity, "value") else str(f.risk_severity),
            risk_factors=f.risk_factors or [],
            analyst_notes=f.analyst_notes,
            review_status=f.review_status.value if hasattr(f.review_status, "value") else str(f.review_status),
            created_at=f.created_at,
        )

    def _extract_urls(self, text: str) -> list[str]:
        pattern = re.compile(r'https?://[^\s<>"\')\]]+', re.IGNORECASE)
        return pattern.findall(text)

    def _analyze_contacts(self, candidate_contacts: dict, official_contacts: dict) -> list[ContactAnalysisResult]:
        results = []
        for ctype, cval in candidate_contacts.items():
            official_val = official_contacts.get(ctype)
            is_auth = False
            risk_ind = []

            if official_val and str(cval).strip() == str(official_val).strip():
                is_auth = True
            elif official_val:
                risk_ind.append(f"Mismatched {ctype}: uses unauthorized number/email")
            else:
                risk_ind.append(f"Unverified {ctype}: not listed in brand baseline")

            val_str = str(cval)
            masked = f"{val_str[:3]}***{val_str[-3:]}" if len(val_str) > 6 else "***"

            results.append(
                ContactAnalysisResult(
                    contact_type=ctype,
                    value_masked=masked,
                    is_authorized=is_auth,
                    risk_indicators=risk_ind,
                )
            )
        return results

    def _analyze_bio(self, bio: str) -> BioAnalysisResult:
        indicators = []
        b_lower = bio.lower()

        impersonation_terms = [
            "official",
            "verified",
            "authorized",
            "resmi",
            "asli",
            "satu-satunya",
            "the only",
            "real account",
        ]
        has_impersonation = False
        for t in impersonation_terms:
            if t in b_lower:
                indicators.append(f"Impersonation keyword: '{t}'")
                has_impersonation = True

        urgency_terms = [
            "limited time",
            "act now",
            "urgent",
            "segera",
            "promo terbatas",
            "hari ini saja",
            "last chance",
        ]
        has_urgency = False
        for t in urgency_terms:
            if t in b_lower:
                indicators.append(f"Urgency claim: '{t}'")
                has_urgency = True

        payment_terms = [
            "transfer",
            "payment",
            "bayar",
            "kirim uang",
            "dana",
            "gopay",
            "ovo",
            "rekening",
            "order via wa",
        ]
        has_payment = False
        for t in payment_terms:
            if t in b_lower:
                indicators.append(f"Off-platform transaction cue: '{t}'")
                has_payment = True

        return BioAnalysisResult(
            has_impersonation_language=has_impersonation,
            has_urgency_indicators=has_urgency,
            has_payment_requests=has_payment,
            indicators=indicators,
        )
