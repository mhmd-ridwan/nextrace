"""NEXTRACE API v1 Router — combines all domain endpoint routers."""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    aliases,
    buzzer,
    evidence,
    health,
    image,
    impersonator,
    investigations,
    leak,
    network,
    reports,
)

api_v1_router = APIRouter()

api_v1_router.include_router(health.router, prefix="/health", tags=["Health & System"])
api_v1_router.include_router(leak.router, prefix="/leak", tags=["Module A: Leak Tracer"])
api_v1_router.include_router(aliases.router, prefix="/aliases", tags=["Module A: Email Aliases"])
api_v1_router.include_router(impersonator.router, prefix="/impersonator", tags=["Module B: Impersonation Hunter"])
api_v1_router.include_router(buzzer.router, prefix="/buzzer", tags=["Module E: Buzzer & Comment Hunter"])
api_v1_router.include_router(network.router, tags=["Module F: Network & Domain OSINT"])
api_v1_router.include_router(investigations.router, prefix="/investigations", tags=["Module C: Investigations"])
api_v1_router.include_router(evidence.router, prefix="/evidence", tags=["Module C: Digital Evidence"])
api_v1_router.include_router(reports.router, prefix="/reports", tags=["Module D: Takedown Reports"])
api_v1_router.include_router(image.router, prefix="/image", tags=["Module G: Image Forensics & EXIF Analysis"])
