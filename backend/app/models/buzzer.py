"""NEXTRACE Buzzer & Coordinated Comment Threat Intelligence Models."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.types import JSON

from app.db.base import Base, IDMixin, TimestampMixin


class BuzzerScan(Base, IDMixin, TimestampMixin):
    """Scan session of a social media post or account comment section."""

    __tablename__ = "buzzer_scans"

    investigation_id = Column(String(36), nullable=True)
    target_url = Column(String(500), nullable=False)
    target_platform = Column(String(100), default="Instagram")
    target_author = Column(String(100), nullable=True)
    post_snippet = Column(Text, nullable=True)
    total_comments = Column(Integer, default=0)
    buzzer_count = Column(Integer, default=0)
    bot_count = Column(Integer, default=0)
    organic_count = Column(Integer, default=0)
    threat_comments_count = Column(Integer, default=0)
    astroturfing_index = Column(Float, default=0.0)
    scan_metadata = Column(JSON, default=dict)


class BuzzerComment(Base, IDMixin, TimestampMixin):
    """Individual analyzed comment evaluating buzzer/bot probability and threat intent."""

    __tablename__ = "buzzer_comments"

    scan_id = Column(String(36), ForeignKey("buzzer_scans.id", ondelete="CASCADE"), nullable=False)
    author_username = Column(String(100), nullable=False)
    author_display_name = Column(String(255), nullable=True)
    author_avatar_url = Column(String(500), nullable=True)
    author_avatar_path = Column(String(500), nullable=True)
    platform = Column(String(100), default="Instagram")
    comment_text = Column(Text, nullable=False)
    comment_timestamp = Column(DateTime(timezone=True), nullable=True)
    likes_count = Column(Integer, default=0)
    buzzer_score = Column(Float, default=0.0)
    account_classification = Column(String(50), default="organic")
    threat_intent = Column(String(50), default="neutral")
    matched_keywords = Column(JSON, default=list)
    account_signals = Column(JSON, default=dict)
    sentiment = Column(String(50), default="neutral")
    takedown_recommended = Column(Boolean, default=False)
    analyst_notes = Column(Text, nullable=True)
