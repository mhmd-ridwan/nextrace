"""NEXTRACE Buzzer & Coordinated Comment Threat Intelligence Schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class BuzzerScanRequest(BaseModel):
    """Request to initiate a buzzer and comment threat scan on a post or profile."""

    model_config = ConfigDict(from_attributes=True)

    target_url: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="URL of post or public comment thread",
    )
    platform: str = Field(
        default="Instagram",
        description="Target platform (Instagram, TikTok, X, Facebook, YouTube)",
    )
    max_comments: int = Field(default=20, ge=5, le=100)
    investigation_id: str | None = Field(default="inv-demo-001")
    target_official_handle: str | None = None
    preset_scenario: str | None = None


class BuzzerCommentResponse(BaseModel):
    """Forensic evaluation of a single commenting account."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    author_username: str
    author_display_name: str | None = None
    author_avatar_url: str | None = None
    author_avatar_path: str | None = None
    platform: str = "Instagram"
    comment_text: str
    comment_timestamp: datetime | None = None
    likes_count: int = 0
    buzzer_score: float = 0.0
    account_classification: str = "organic"  # "buzzer", "bot", "organic", "suspicious_farm"
    threat_intent: str = "neutral"  # "impersonation_lure", "target_seeking", "astroturfing", "neutral", "doxxing"
    matched_keywords: list[str] = []
    account_signals: dict = {}
    sentiment: str = "neutral"
    takedown_recommended: bool = False
    analyst_notes: str | None = None
    created_at: datetime | None = None


class BuzzerScanResponse(BaseModel):
    """Full threat intelligence report of a scanned post's comment section."""

    model_config = ConfigDict(from_attributes=True)

    scan_id: str
    investigation_id: str | None = None
    target_url: str
    target_platform: str
    target_author: str | None = None
    post_snippet: str | None = None
    total_comments: int = 0
    buzzer_count: int = 0
    bot_count: int = 0
    organic_count: int = 0
    threat_comments_count: int = 0
    astroturfing_index: float = 0.0
    scan_metadata: dict = {}
    comments: list[BuzzerCommentResponse] = []
    created_at: datetime | None = None


class BuzzerStatsResponse(BaseModel):
    """High-level metrics for dashboard and telemetry."""

    model_config = ConfigDict(from_attributes=True)

    total_scans: int = 0
    total_comments_monitored: int = 0
    buzzer_detected_count: int = 0
    threat_lures_detected: int = 0
    average_astroturfing_index: float = 0.0
