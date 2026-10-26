"""NEXTRACE Impersonation Schemas."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field


class BrandBaselineCreate(BaseModel):
    """Request to create a brand baseline."""

    model_config = ConfigDict(from_attributes=True)

    brand_name: str = Field(..., min_length=1, max_length=255)
    official_username: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=255)
    website_url: str | None = None
    contact_info: dict = Field(default_factory=dict)
    business_category: str | None = None
    investigation_id: str | None = None


class BrandBaselineResponse(BaseModel):
    """Response for a brand baseline."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    brand_name: str
    official_username: str
    display_name: str
    avatar_path: str | None = None
    website_url: str | None = None
    contact_info: dict = {}
    business_category: str | None = None
    investigation_id: str | None = None
    created_at: datetime | None = None


class CandidateProfileCreate(BaseModel):
    """A candidate profile to analyze."""

    model_config = ConfigDict(from_attributes=True)

    platform: str = Field(..., min_length=1, max_length=100)
    profile_url: str | None = None
    username: str = Field(..., min_length=1, max_length=100)
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    avatar_path: str | None = None
    contact_info: dict = Field(default_factory=dict)
    is_active: bool = True
    activity_status: str = "active"
    observation_timestamp: datetime | None = None
    collection_method: str = "manual_submission"


class CandidateProfileResponse(BaseModel):
    """Response for a candidate profile."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    platform: str
    profile_url: str | None = None
    username: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    avatar_path: str | None = None
    contact_info: dict = {}
    is_active: bool = True
    activity_status: str = "active"
    observation_timestamp: datetime | None = None
    collection_method: str | None = None


class ImageSimilarityResult(BaseModel):
    """Result of image similarity analysis."""

    algorithm: str = "phash"
    hash_distance: int = 0
    hash_bit_length: int = 64
    similarity_percentage: float = 0.0
    threshold_used: float = 85.0
    is_above_threshold: bool = False
    baseline_hash: str = ""
    candidate_hash: str = ""


class UsernameSimilarityResult(BaseModel):
    """Result of username similarity analysis."""

    edit_distance: int = 0
    similarity_ratio: float = 0.0
    homoglyph_detected: bool = False
    confusable_chars: list[dict] = []
    substitution_patterns: list[str] = []
    suspicious_affixes: list[str] = []
    is_suspicious: bool = False


class DisplayNameSimilarityResult(BaseModel):
    """Result of display name similarity analysis."""

    edit_distance: int = 0
    similarity_ratio: float = 0.0
    normalized_baseline: str = ""
    normalized_candidate: str = ""


class LinkAnalysisResult(BaseModel):
    """Result of link/URL analysis."""

    url: str
    is_shortened: bool = False
    is_punycode: bool = False
    has_suspicious_redirect: bool = False
    domain_similarity_to_official: float | None = None
    risk_indicators: list[str] = []
    risk_level: str = "low"


class ContactAnalysisResult(BaseModel):
    """Result of contact information analysis."""

    contact_type: str
    value_masked: str
    is_authorized: bool = True
    risk_indicators: list[str] = []


class BioAnalysisResult(BaseModel):
    """Result of bio text analysis."""

    has_impersonation_language: bool = False
    has_urgency_indicators: bool = False
    has_payment_requests: bool = False
    indicators: list[str] = []


class FindingResponse(BaseModel):
    """Full response for an impersonation finding."""

    model_config = ConfigDict(from_attributes=True)

    finding_id: str
    investigation_id: str | None = None
    baseline_id: str | None = None
    baseline: BrandBaselineResponse | None = None
    candidate: CandidateProfileResponse | None = None
    image_similarity: ImageSimilarityResult | None = None
    username_similarity: UsernameSimilarityResult | None = None
    display_name_similarity: DisplayNameSimilarityResult | None = None
    link_analysis: list[LinkAnalysisResult] = []
    contact_analysis: list[ContactAnalysisResult] = []
    bio_analysis: BioAnalysisResult | None = None
    risk_score: float = 0.0
    risk_severity: str = "low"
    risk_factors: list[str] = []
    analyst_notes: str | None = None
    review_status: str = "pending"
    created_at: datetime | None = None


class ScanRequest(BaseModel):
    """Request to scan candidates against a baseline."""

    baseline_id: str
    candidates: list[CandidateProfileCreate] = []
    investigation_id: str | None = None


class ScanResponse(BaseModel):
    """Response for a scan operation."""

    scan_id: str
    investigation_id: str | None = None
    total_candidates: int = 0
    findings: list[FindingResponse] = []
    scan_timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    high_risk_count: int = 0
    medium_risk_count: int = 0
    low_risk_count: int = 0


class AnalyzeRequest(BaseModel):
    """Request to analyze a single candidate against a baseline."""

    baseline_id: str
    candidate_id: str


class ProfileScrapeRequest(BaseModel):
    """Request to scrape public profile metadata."""

    query: str
    platform: str = "Instagram"


class ProfileScrapeResponse(BaseModel):
    """Response from profile scraper."""

    model_config = ConfigDict(from_attributes=True)

    success: bool
    platform: str
    profile_url: str
    username: str
    display_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    avatar_path: str | None = None
    contact_info: dict = {}
    error: str | None = None


class QuickCompareRequest(BaseModel):
    """Ad-hoc instant comparison between any two public handles."""

    model_config = ConfigDict(from_attributes=True)

    official_query: str
    official_platform: str = "Instagram"
    candidate_query: str
    candidate_platform: str = "Instagram"
    investigation_id: str | None = "inv-demo-001"
    save_to_queue: bool = True


class AutoScanGlobalRequest(BaseModel):
    """Request for autonomous global OSINT scan from a single official URL."""

    model_config = ConfigDict(from_attributes=True)

    target_url: str = Field(
        ...,
        description="Target official account URL or handle, e.g. https://www.instagram.com/jokowi/",
    )
    investigation_id: str | None = "inv-demo-001"
    max_candidates: int = Field(default=8, ge=2, le=25)


class AutoScanGlobalResponse(BaseModel):
    """Response containing discovered impersonators and forensic scan stats."""

    model_config = ConfigDict(from_attributes=True)

    target_input: str
    official_username: str
    display_name: str
    brand_baseline: BrandBaselineResponse
    total_permutations_tested: int
    platforms_scanned: list[str]
    candidates_discovered: int
    high_risk_count: int
    findings: list[FindingResponse]
    scan_timestamp: datetime
