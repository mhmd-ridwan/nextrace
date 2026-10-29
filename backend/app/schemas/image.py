"""
NEXTRACE Image Forensics & EXIF Schemas.
Strict Pydantic v2 data models for digital image provenance, EXIF, and tampering detection.
"""

from pydantic import BaseModel, ConfigDict, Field


class ImageDimensions(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    width: int = Field(..., description="Image width in pixels")
    height: int = Field(..., description="Image height in pixels")
    megapixels: float = Field(..., description="Image resolution in megapixels")
    aspect_ratio: str = Field(..., description="Aspect ratio string e.g. '16:9', '4:3'")


class ImageHashes(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sha256: str = Field(..., description="Cryptographic SHA-256 digest")
    md5: str = Field(..., description="MD5 digest")
    phash: str = Field(..., description="Perceptual hash (pHash)")
    dhash: str = Field(..., description="Difference hash (dHash)")


class CameraHardware(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    make: str | None = Field(None, description="Camera or smartphone manufacturer")
    model: str | None = Field(None, description="Camera or smartphone model")
    lens_make: str | None = Field(None, description="Lens manufacturer")
    lens_model: str | None = Field(None, description="Lens model")
    serial_number: str | None = Field(None, description="Device serial number")


class ShootingOptics(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exposure_time: str | None = Field(None, description="Exposure time / shutter speed e.g. '1/125s'")
    f_number: str | None = Field(None, description="Aperture f-number e.g. 'f/1.8'")
    iso: int | None = Field(None, description="ISO sensitivity e.g. 100")
    focal_length: str | None = Field(None, description="Physical focal length e.g. '24.0 mm'")
    focal_length_35mm: str | None = Field(None, description="35mm equivalent focal length")
    flash: str | None = Field(None, description="Flash firing state")
    white_balance: str | None = Field(None, description="White balance setting")
    exposure_mode: str | None = Field(None, description="Exposure mode")


class SoftwareTampering(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    software: str | None = Field(None, description="Software or firmware string")
    tampering_detected: bool = Field(False, description="Whether editing software or timestamp discrepancies are found")
    tampering_indicators: list[str] = Field(default_factory=list, description="Specific tampering flags")


class ImageChronology(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date_time_original: str | None = Field(None, description="When shutter clicked")
    date_time_digitized: str | None = Field(None, description="When digitized")
    date_time_modified: str | None = Field(None, description="File/EXIF modification timestamp")
    offset_time: str | None = Field(None, description="Timezone offset e.g. '+07:00'")


class GPSLocation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    has_gps: bool = Field(False, description="Whether GPS telemetry is present")
    latitude: float | None = Field(None, description="Decimal latitude (-90 to 90)")
    longitude: float | None = Field(None, description="Decimal longitude (-180 to 180)")
    altitude: float | None = Field(None, description="Altitude in meters")
    altitude_ref: str | None = Field(None, description="Above or below sea level")
    latitude_ref: str | None = Field(None, description="'N' or 'S'")
    longitude_ref: str | None = Field(None, description="'E' or 'W'")
    google_maps_url: str | None = Field(None, description="Direct Google Maps URL")
    openstreetmap_url: str | None = Field(None, description="Direct OpenStreetMap URL")
    location_hint: str | None = Field(
        None, description="Formatted coordinate string e.g. '6°12\\'31.5\"S, 106°48\\'44.2\"E'"
    )
    gps_timestamp: str | None = Field(None, description="GPS satellite timestamp")


class ImageForensicsResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    file_name: str
    file_size_bytes: int
    file_size_formatted: str
    mime_type: str
    format: str
    color_mode: str
    dimensions: ImageDimensions
    hashes: ImageHashes
    camera: CameraHardware
    optics: ShootingOptics
    software: SoftwareTampering
    chronology: ImageChronology
    gps: GPSLocation
    raw_exif: dict[str, str] = Field(default_factory=dict, description="Top extracted EXIF tag values")
    preview_data_url: str | None = Field(None, description="Base64 preview data URL")


class MatchedProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    candidate_id: str
    platform: str
    username: str
    display_name: str
    profile_url: str
    avatar_url: str | None = None
    avatar_path: str | None = None
    visual_similarity_score: float = Field(..., description="Visual match percentage 0-100")
    hash_distance: int = Field(0, description="pHash Hamming bit distance")
    match_classification: str = Field(
        "LOOKALIKE", description="EXACT_AVATAR, CROPPED_CLONE, HIGH_SIMILARITY, LOOKALIKE"
    )
    risk_severity: str = Field("medium", description="critical, high, medium, low")
    risk_score: float = Field(50.0, description="Risk score 0-100")
    threat_indicators: list[str] = Field(default_factory=list)
    suspicious_contacts: list[str] = Field(default_factory=list)
    is_official_anchor: bool = False


class GlobalImageScanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    forensics: ImageForensicsResponse
    investigation_id: str | None = None
    target_phash: str
    target_sha256: str
    total_profiles_matched: int
    high_risk_matches: int
    matched_entity_name: str
    matched_profiles: list[MatchedProfile] = Field(default_factory=list)


class ImageComparisonMetrics(BaseModel):
    """Metrics and spectral comparison between two images (1-on-1 pHash/dHash)."""

    model_config = ConfigDict(from_attributes=True)

    file_a_name: str
    file_b_name: str
    file_a_size_formatted: str
    file_b_size_formatted: str
    file_a_dimensions: ImageDimensions
    file_b_dimensions: ImageDimensions
    file_a_hashes: ImageHashes
    file_b_hashes: ImageHashes
    phash_hamming_distance: int = Field(..., description="Hamming bit distance between perceptual hashes (0 to 64)")
    dhash_hamming_distance: int = Field(..., description="Hamming bit distance between difference hashes (0 to 64)")
    similarity_score: float = Field(..., description="Visual similarity score percentage (0.0 to 100.0)")
    verdict: str = Field(..., description="Human-readable forensic verdict")
    match_classification: str = Field(..., description="EXACT_MATCH, CLONED_IMAGE, MODIFIED_VARIANT, DIFFERENT")
    file_a_preview: str | None = None
    file_b_preview: str | None = None

