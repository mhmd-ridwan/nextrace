"""NEXTRACE Brand & Identity Impersonation Hunter Endpoints."""

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import generate_id
from app.db.session import get_db
from app.schemas.impersonator import (
    AnalyzeRequest,
    AutoScanGlobalRequest,
    AutoScanGlobalResponse,
    BrandBaselineCreate,
    BrandBaselineResponse,
    FindingResponse,
    ProfileScrapeRequest,
    ProfileScrapeResponse,
    QuickCompareRequest,
    ScanRequest,
    ScanResponse,
)
from app.schemas.report import ReportGenerateRequest, ReportTypeEnum
from app.services.impersonation_service import ImpersonationService
from app.services.osint_scanner import OSINTScannerService
from app.services.report_service import ReportService

router = APIRouter()
impersonation_service = ImpersonationService()
osint_scanner = OSINTScannerService()
report_service = ReportService()


@router.post("/baseline", response_model=BrandBaselineResponse, summary="Create brand baseline")
async def create_baseline(
    brand_name: str = Form(...),
    official_username: str = Form(...),
    display_name: str = Form(...),
    website_url: str | None = Form(None),
    business_category: str | None = Form(None),
    investigation_id: str | None = Form(None),
    avatar: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Register official brand profile and avatar baseline for comparative analysis."""
    settings = get_settings()
    avatar_path = None

    if avatar:
        if avatar.content_type and not avatar.content_type.startswith("image/"):
            raise ValidationError("Avatar must be an image file")

        content = await avatar.read()
        if len(content) > settings.max_upload_size_bytes:
            raise ValidationError(f"Image exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

        ext = Path(avatar.filename or "img.png").suffix or ".png"
        target_name = f"baseline_{generate_id()}{ext}"
        target_path = settings.uploads_dir / target_name
        target_path.write_bytes(content)
        avatar_path = str(target_path)

    data = BrandBaselineCreate(
        brand_name=brand_name,
        official_username=official_username,
        display_name=display_name,
        website_url=website_url,
        business_category=business_category,
        investigation_id=investigation_id,
    )
    return await impersonation_service.create_baseline(db, data, avatar_path)


@router.get(
    "/baselines",
    response_model=list[BrandBaselineResponse],
    summary="List distinct brand baselines",
)
async def list_baselines(
    investigation_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all distinct registered brand baselines for target switching."""
    return await impersonation_service.list_baselines(db, investigation_id)


@router.get(
    "/baseline/{baseline_id}",
    response_model=BrandBaselineResponse,
    summary="Get brand baseline",
)
async def get_baseline(
    baseline_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get official brand baseline profile."""
    res = await impersonation_service.get_baseline(db, baseline_id)
    if not res:
        raise NotFoundError("Brand baseline", baseline_id)
    return res


@router.post("/scan", response_model=ScanResponse, summary="Scan candidate profiles")
async def scan_candidates(
    request: ScanRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Execute multi-signal impersonation scan against candidate accounts.
    Evaluates perceptual hash, username edit distance, homoglyphs,
    link redirection, contact mismatch, and urgency language.
    """
    return await impersonation_service.scan(
        db=db,
        baseline_id=request.baseline_id,
        candidates=request.candidates,
        investigation_id=request.investigation_id,
    )


@router.post("/analyze", response_model=FindingResponse, summary="Analyze single candidate")
async def analyze_candidate(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Analyze a single candidate profile against an authorized baseline."""
    res = await impersonation_service.analyze_single(db, request.baseline_id, request.candidate_id)
    if not res:
        raise NotFoundError("Baseline or candidate profile")
    return res


@router.get("/findings", summary="List impersonation findings")
async def list_findings(
    investigation_id: str | None = Query(None),
    baseline_id: str | None = Query(None),
    active_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List ranked impersonation findings with risk scores, optional baseline and active-only filtering."""
    return await impersonation_service.get_findings(db, investigation_id, baseline_id, active_only, page, per_page)


@router.get(
    "/findings/{finding_id}",
    response_model=FindingResponse,
    summary="Get finding detail",
)
async def get_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full algorithmic breakdown for a specific candidate finding."""
    res = await impersonation_service.get_finding(db, finding_id)
    if not res:
        raise NotFoundError("Finding", finding_id)
    return res


@router.post(
    "/findings/{finding_id}/avatar",
    response_model=FindingResponse,
    summary="Upload avatar for existing finding",
)
async def attach_finding_avatar(
    finding_id: str,
    avatar: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload avatar or screenshot for an existing candidate finding and recalculate pHash."""
    settings = get_settings()
    if avatar.content_type and not avatar.content_type.startswith("image/"):
        raise ValidationError("Avatar must be an image file")

    content = await avatar.read()
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError(f"Image exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = Path(avatar.filename or "cand.png").suffix or ".png"
    target_name = f"candidate_{generate_id()}{ext}"
    target_path = settings.uploads_dir / target_name
    target_path.write_bytes(content)

    updated = await impersonation_service.update_candidate_avatar(db, finding_id, str(target_path))
    if not updated:
        raise NotFoundError("Finding", finding_id)
    return updated


@router.delete("/findings/{finding_id}", summary="Delete an impersonation finding")
async def delete_finding(
    finding_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Delete an impersonation finding and its candidate profile."""
    success = await impersonation_service.delete_finding(db, finding_id)
    if not success:
        raise NotFoundError("Finding", finding_id)
    return {"success": True, "message": f"Finding {finding_id} deleted"}


@router.delete("/findings", summary="Clear findings queue")
async def clear_findings(
    investigation_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Clear findings from queue to start with a fresh slate."""
    count = await impersonation_service.clear_findings(db, investigation_id)
    return {"success": True, "cleared_count": count}


@router.post(
    "/quick-compare",
    response_model=FindingResponse,
    summary="Ad-hoc comparison of any two accounts",
)
async def quick_compare(
    request: QuickCompareRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Directly compare ANY official account vs ANY candidate account without predefined defaults.
    Extracts public metadata & avatars on demand and computes full forensic pHash metrics.
    """
    return await impersonation_service.quick_compare(
        db=db,
        official_query=request.official_query,
        official_platform=request.official_platform,
        candidate_query=request.candidate_query,
        candidate_platform=request.candidate_platform,
        investigation_id=request.investigation_id,
        save_to_queue=request.save_to_queue,
    )


@router.post(
    "/scrape",
    response_model=ProfileScrapeResponse,
    summary="Scrape public social profile",
)
async def scrape_profile(
    request: ProfileScrapeRequest,
):
    """
    Scrape live public profile metadata (display name, bio, avatar)
    using headless browser OpenGraph extraction.
    """
    return impersonation_service.scraper.scrape(request.query, request.platform)


@router.post("/candidate-upload", summary="Upload candidate avatar or screenshot")
async def upload_candidate_avatar(
    avatar: UploadFile = File(...),
):
    """Upload a candidate profile avatar or screenshot for pHash analysis."""
    settings = get_settings()
    if avatar.content_type and not avatar.content_type.startswith("image/"):
        raise ValidationError("Avatar must be an image file")

    content = await avatar.read()
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError(f"Image exceeds limit of {settings.MAX_UPLOAD_SIZE_MB}MB")

    ext = Path(avatar.filename or "cand.png").suffix or ".png"
    target_name = f"candidate_{generate_id()}{ext}"
    target_path = settings.uploads_dir / target_name
    target_path.write_bytes(content)

    return {
        "success": True,
        "avatar_path": str(target_path),
        "filename": target_name,
        "url": f"/uploads/{target_name}",
    }


@router.post("/generate-takedown-report", summary="Generate takedown package")
async def generate_takedown_report(
    request: ReportGenerateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Generate structured takedown evidence package in JSON or PDF."""
    request.report_type = ReportTypeEnum.TAKEDOWN
    return await report_service.generate_report(db, request)


@router.post(
    "/auto-scan-global",
    response_model=AutoScanGlobalResponse,
    summary="Autonomous Global OSINT Impersonator Discovery",
)
async def auto_scan_global(
    request: AutoScanGlobalRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Autonomous Global OSINT Scan:
    Input ONE single official profile URL or handle (e.g. https://www.instagram.com/jokowi/).
    The system automatically scrapes the official anchor baseline, conducts global lookalike
    and adversarial permutation discovery across social networks (Instagram, TikTok, Facebook, Telegram),
    downloads candidate avatars, executes pHash 64-bit DCT comparison and Unicode homoglyph analysis,
    and populates the investigation triage queue.
    """
    return await osint_scanner.run_global_scan(
        db=db,
        target_url=request.target_url,
        investigation_id=request.investigation_id or "inv-demo-001",
        max_candidates=request.max_candidates,
    )
