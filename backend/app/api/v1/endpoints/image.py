"""
NEXTRACE Image Forensics & EXIF Endpoints.
Provides deep EXIF extraction, camera optics provenance, tampering analysis, and evidence vaulting.
"""

from __future__ import annotations

import base64
import io
import json
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from PIL import ExifTags, Image
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import ValidationError
from app.db.session import get_db
from app.schemas.evidence import EvidenceCreateRequest, EvidenceResponse
from app.schemas.image import GlobalImageScanResponse, ImageForensicsResponse
from app.services.evidence_service import EvidenceService
from app.services.image_forensics_service import ImageForensicsService

router = APIRouter()
forensics_service = ImageForensicsService()
evidence_service = EvidenceService()


class Base64ImageRequest(BaseModel):
    data_url: str = Field(..., description="Base64 data URL e.g. data:image/jpeg;base64,...")
    file_name: str = Field("sample_evidence.jpg", description="File name")


@router.post("/exif", response_model=ImageForensicsResponse, summary="Analyze image file & extract EXIF")
async def analyze_image_exif(
    file: UploadFile = File(...),
):
    """
    Ingest image file and extract forensic camera telemetry, optics, GPS coordinates,
    tampering traces, and perceptual & cryptographic hashes.
    """
    settings = get_settings()

    if file.content_type and not file.content_type.startswith("image/"):
        raise ValidationError(f"Tipe berkas tidak didukung: {file.content_type}. Harap unggah berkas gambar.")

    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError(f"Ukuran berkas melebihi batas maksimum {settings.MAX_UPLOAD_SIZE_MB}MB")

    try:
        return forensics_service.analyze_bytes(content, file_name=file.filename or "uploaded_image.jpg")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses forensik berkas citra: {e}") from e


@router.post("/exif-base64", response_model=ImageForensicsResponse, summary="Analyze base64 image string")
async def analyze_base64_exif(payload: Base64ImageRequest):
    """Analyze base64 data URL directly."""
    try:
        raw_b64 = payload.data_url
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]
        image_bytes = base64.b64decode(raw_b64)
        return forensics_service.analyze_bytes(image_bytes, file_name=payload.file_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal mengurai gambar base64: {e}") from e


@router.get("/samples/{sample_type}", response_model=ImageForensicsResponse, summary="Get curated forensic sample")
async def get_forensic_sample(sample_type: str):
    """
    Generate authentic forensic test cases:
    - 'iphone_gps': Photo taken with iPhone 15 Pro, 24mm f/1.78, with Jakarta Monas GPS coordinates.
    - 'canon_dslr': Professional DSLR photograph with Canon EOS R5, 50mm f/1.2, ISO 100.
    - 'photoshop_tampered': Image with Adobe Photoshop 2024 tampering tags and timestamp mismatch.
    """
    buf = io.BytesIO()

    if sample_type == "iphone_gps":
        img = Image.new("RGB", (800, 600), color=(30, 41, 59))
        exif = img.getexif()
        exif[ExifTags.Base.Make] = "Apple"
        exif[ExifTags.Base.Model] = "iPhone 15 Pro Max"
        exif[ExifTags.Base.Software] = "iOS 17.5.1"
        exif[ExifTags.Base.DateTime] = "2026:10:25 14:15:30"

        # Exif Sub-IFD
        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        exif_ifd[ExifTags.Base.DateTimeOriginal] = "2026:10:25 14:15:30"
        exif_ifd[ExifTags.Base.DateTimeDigitized] = "2026:10:25 14:15:30"
        exif_ifd[ExifTags.Base.ExposureTime] = 0.008  # 1/125s
        exif_ifd[ExifTags.Base.FNumber] = 1.78
        exif_ifd[ExifTags.Base.ISOSpeedRatings] = 80
        exif_ifd[ExifTags.Base.FocalLength] = 6.86
        exif_ifd[ExifTags.Base.FocalLengthIn35mmFilm] = 24
        exif_ifd[ExifTags.Base.LensMake] = "Apple"
        exif_ifd[ExifTags.Base.LensModel] = "iPhone 15 Pro Max back triple camera 6.86mm f/1.78"
        exif_ifd[ExifTags.Base.Flash] = 16  # Flash did not fire

        # GPS Sub-IFD (Monas Jakarta: -6.175392, 106.827153)
        gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
        gps_ifd[ExifTags.GPS.GPSLatitudeRef] = "S"
        gps_ifd[ExifTags.GPS.GPSLatitude] = (6.0, 10.0, 31.41)
        gps_ifd[ExifTags.GPS.GPSLongitudeRef] = "E"
        gps_ifd[ExifTags.GPS.GPSLongitude] = (106.0, 49.0, 37.75)
        gps_ifd[ExifTags.GPS.GPSAltitudeRef] = 0
        gps_ifd[ExifTags.GPS.GPSAltitude] = 18.5
        gps_ifd[ExifTags.GPS.GPSDateStamp] = "2026:10:25"
        gps_ifd[ExifTags.GPS.GPSTimeStamp] = (7, 15, 30)

        img.save(buf, format="JPEG", exif=exif)
        file_name = "IMG_4920_IPHONE_MONAS_GPS.JPG"

    elif sample_type == "photoshop_tampered":
        img = Image.new("RGB", (900, 600), color=(15, 23, 42))
        exif = img.getexif()
        exif[ExifTags.Base.Software] = "Adobe Photoshop 2024 (Windows)"
        exif[ExifTags.Base.DateTime] = "2026:10:25 19:40:12"

        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        exif_ifd[ExifTags.Base.DateTimeOriginal] = "2024:03:12 10:22:00"  # Big discrepancy!
        exif_ifd[ExifTags.Base.ExposureTime] = 0.002
        exif_ifd[ExifTags.Base.FNumber] = 2.8
        exif_ifd[ExifTags.Base.ISOSpeedRatings] = 400

        img.save(buf, format="JPEG", exif=exif)
        file_name = "EVIDENCE_EDITED_PHOTOSHOP_SAMPLE.JPG"

    else:  # canon_dslr
        img = Image.new("RGB", (1200, 800), color=(39, 39, 42))
        exif = img.getexif()
        exif[ExifTags.Base.Make] = "Canon"
        exif[ExifTags.Base.Model] = "Canon EOS R5"
        exif[ExifTags.Base.Software] = "Firmware Version 1.9.0"
        exif[ExifTags.Base.DateTime] = "2026:09:18 16:05:10"

        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        exif_ifd[ExifTags.Base.DateTimeOriginal] = "2026:09:18 16:05:10"
        exif_ifd[ExifTags.Base.ExposureTime] = 0.001  # 1/1000s
        exif_ifd[ExifTags.Base.FNumber] = 1.2
        exif_ifd[ExifTags.Base.ISOSpeedRatings] = 100
        exif_ifd[ExifTags.Base.FocalLength] = 50.0
        exif_ifd[ExifTags.Base.LensMake] = "Canon"
        exif_ifd[ExifTags.Base.LensModel] = "RF50mm F1.2 L USM"
        exif_ifd[ExifTags.Base.BodySerialNumber] = "042021004921"

        img.save(buf, format="JPEG", exif=exif)
        file_name = "RAW_DSLR_CANON_RF50_STUDIO.JPG"

    buf.seek(0)
    return forensics_service.analyze_bytes(buf.getvalue(), file_name=file_name)


@router.post(
    "/scan-global", response_model=GlobalImageScanResponse, summary="Scan image and reverse match profiles globally"
)
async def scan_image_global(
    file: UploadFile = File(...),
    investigation_id: str = Form("inv-jokowi-001"),
    threshold: float = Form(85.0),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest 1 photo, extract full forensic EXIF telemetry and cryptographic digests,
    and automatically search for the user profile, clone accounts, lookalikes,
    and astroturfing campaigns globally across social platforms.
    """
    settings = get_settings()

    if file.content_type and not file.content_type.startswith("image/"):
        raise ValidationError(f"Tipe berkas tidak didukung: {file.content_type}. Harap unggah berkas gambar.")

    content = await file.read()
    if len(content) > settings.max_upload_size_bytes:
        raise ValidationError(f"Ukuran berkas melebihi batas maksimum {settings.MAX_UPLOAD_SIZE_MB}MB")

    try:
        return await forensics_service.scan_and_match_profiles(
            content,
            file_name=file.filename or "uploaded_image.jpg",
            db=db,
            investigation_id=investigation_id,
            threshold=threshold,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memindai profil citra secara global: {e}") from e


@router.get(
    "/scan-global/sample/{sample_type}",
    response_model=GlobalImageScanResponse,
    summary="Scan curated sample image globally",
)
async def scan_sample_global(
    sample_type: str,
    investigation_id: str = Query("inv-jokowi-001"),
    threshold: float = Query(85.0),
    db: AsyncSession = Depends(get_db),
):
    """
    Curated samples for 1-click global photo scanning & profile discovery:
    - 'jokowi_official': Official portrait of Ir. H. Joko Widodo -> matches TikTok, Instagram, Facebook, and Telegram clone networks.
    - 'iphone_gps': Photo taken with iPhone 15 Pro Max at Monas Jakarta with GPS telemetry.
    - 'photoshop_tampered': Tampered photo with Adobe Photoshop modification flags.
    """
    buf = io.BytesIO()
    file_name = "sample.jpg"

    if sample_type in ("jokowi_official", "official_jokowi"):
        p1 = Path("uploads/official_jokowi_portrait.png")
        p2 = Path("uploads/avatar_jokowi.png")
        if p1.exists():
            img_bytes = p1.read_bytes()
            file_name = "official_jokowi_portrait.png"
        elif p2.exists():
            img_bytes = p2.read_bytes()
            file_name = "avatar_jokowi.png"
        else:
            img = Image.new("RGB", (400, 400), color=(14, 165, 233))
            img.save(buf, format="PNG")
            img_bytes = buf.getvalue()
            file_name = "jokowi_official_portrait.png"
    elif sample_type == "iphone_gps":
        img = Image.new("RGB", (800, 600), color=(30, 41, 59))
        exif = img.getexif()
        exif[ExifTags.Base.Make] = "Apple"
        exif[ExifTags.Base.Model] = "iPhone 15 Pro Max"
        exif[ExifTags.Base.Software] = "iOS 17.5.1"
        exif[ExifTags.Base.DateTime] = "2026:10:25 14:15:30"
        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        exif_ifd[ExifTags.Base.DateTimeOriginal] = "2026:10:25 14:15:30"
        exif_ifd[ExifTags.Base.DateTimeDigitized] = "2026:10:25 14:15:30"
        exif_ifd[ExifTags.Base.ExposureTime] = 0.008
        exif_ifd[ExifTags.Base.FNumber] = 1.78
        exif_ifd[ExifTags.Base.ISOSpeedRatings] = 80
        exif_ifd[ExifTags.Base.FocalLength] = 6.86
        exif_ifd[ExifTags.Base.FocalLengthIn35mmFilm] = 24
        exif_ifd[ExifTags.Base.LensModel] = "iPhone 15 Pro Max back triple camera 6.86mm f/1.78"
        gps_ifd = exif.get_ifd(ExifTags.IFD.GPSInfo)
        gps_ifd[ExifTags.GPS.GPSLatitudeRef] = "S"
        gps_ifd[ExifTags.GPS.GPSLatitude] = (6.0, 10.0, 31.4)
        gps_ifd[ExifTags.GPS.GPSLongitudeRef] = "E"
        gps_ifd[ExifTags.GPS.GPSLongitude] = (106.0, 49.0, 37.8)
        gps_ifd[ExifTags.GPS.GPSAltitudeRef] = b"\x00"
        gps_ifd[ExifTags.GPS.GPSAltitude] = 18.0
        gps_ifd[ExifTags.GPS.GPSTimeStamp] = (7.0, 15.0, 30.0)
        gps_ifd[ExifTags.GPS.GPSDateStamp] = "2026:10:25"
        img.save(buf, format="JPEG", exif=exif)
        img_bytes = buf.getvalue()
        file_name = "IMG_4920_IPHONE_MONAS_GPS.JPG"
    elif sample_type == "photoshop_tampered":
        img = Image.new("RGB", (1200, 800), color=(15, 23, 42))
        exif = img.getexif()
        exif[ExifTags.Base.Software] = "Adobe Photoshop 2024 (Macintosh)"
        exif[ExifTags.Base.DateTime] = "2026:10:25 18:30:00"
        exif_ifd = exif.get_ifd(ExifTags.IFD.Exif)
        exif_ifd[ExifTags.Base.DateTimeOriginal] = "2024:05:12 09:10:00"
        exif_ifd[ExifTags.Base.DateTimeDigitized] = "2024:05:12 09:10:00"
        img.save(buf, format="JPEG", exif=exif)
        img_bytes = buf.getvalue()
        file_name = "TAMPERED_ADOBE_PHOTOSHOP_2024.JPG"
    else:
        img = Image.new("RGB", (600, 600), color=(30, 41, 59))
        img.save(buf, format="JPEG")
        img_bytes = buf.getvalue()
        file_name = f"{sample_type}.jpg"

    return await forensics_service.scan_and_match_profiles(
        img_bytes,
        file_name=file_name,
        db=db,
        investigation_id=investigation_id,
        threshold=threshold,
    )


@router.post("/vault", response_model=EvidenceResponse, summary="Lock image analysis to evidence vault")
async def vault_image_evidence(
    investigation_id: str = Form("inv-jokowi-001"),
    file_name: str = Form(...),
    sha256_hash: str = Form(...),
    metadata_json: str = Form(...),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Lock an analyzed image and its forensic EXIF metadata into the Case Evidence Vault
    with an authoritative SHA-256 seal and chain of custody log.
    """
    try:
        parsed_metadata = json.loads(metadata_json)
    except Exception:
        parsed_metadata = {"raw": metadata_json}

    data = EvidenceCreateRequest(
        investigation_id=investigation_id,
        evidence_type="image",
        source_url=f"local://forensics/{file_name}",
        collection_method="exif_forensic_pipeline",
        metadata={
            **parsed_metadata,
            "forensic_sha256": sha256_hash,
            "file_name": file_name,
            "ingested_by": "NEXTRACE Image Forensics Engine v2.0",
        },
    )

    file_bytes = None
    fname = None
    if file:
        file_bytes = await file.read()
        fname = file.filename or file_name
    elif sha256_hash:
        raw_evidence = json.dumps(
            {
                "file_name": file_name,
                "forensic_sha256": sha256_hash,
                "metadata": parsed_metadata,
            },
            indent=2,
        ).encode("utf-8")
        file_bytes = raw_evidence
        fname = f"forensic_{file_name}.json"

    return await evidence_service.create_evidence(db, data, file_bytes, fname)
