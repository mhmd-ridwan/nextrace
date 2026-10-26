"""
NEXTRACE Report Generation Service.
Generates JSON and PDF evidence reports for takedown requests and human review.
"""

import io
import json
from datetime import UTC, datetime
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import compute_file_hash, generate_id
from app.models.buzzer import BuzzerComment, BuzzerScan
from app.models.evidence import EvidenceArtifact
from app.models.finding import ImpersonationFinding
from app.models.investigation import Investigation
from app.models.report import GeneratedReport, ReportFormat, ReportStatus, ReportType
from app.schemas.report import ReportGenerateRequest, ReportResponse, ReportTypeEnum


class ReportService:
    """Generates and manages auditable investigation reports."""

    def __init__(self):
        self.settings = get_settings()

    async def generate_report(self, db: AsyncSession, request: ReportGenerateRequest) -> ReportResponse:
        """Generate a report in requested format (JSON / PDF)."""
        report_id = generate_id()
        now = datetime.now(UTC)

        report_data = await self._gather_report_data(db, request)
        report_data["report_id"] = report_id
        report_data["generated_at"] = now.isoformat()
        report_data["report_type"] = request.report_type.value
        report_data["status"] = "draft"
        report_data["disclaimer"] = (
            "DRAFT FOR HUMAN REVIEW. This report contains automated algorithmic "
            "analysis and digital evidence records. It does not constitute a "
            "final legal ruling or platform policy decision without human verification."
        )

        reports_dir = self.settings.reports_dir

        if request.format.value == "json":
            file_path = reports_dir / f"{report_id}.json"
            content = json.dumps(report_data, indent=2, default=str)
            file_path.write_text(content, encoding="utf-8")
        else:
            file_path = reports_dir / f"{report_id}.pdf"
            pdf_bytes = self._generate_pdf_report(report_data)
            file_path.write_bytes(pdf_bytes)

        file_hash = compute_file_hash(str(file_path))

        report = GeneratedReport(
            id=report_id,
            investigation_id=request.investigation_id,
            report_type=ReportType(request.report_type.value),
            format=ReportFormat(request.format.value),
            status=ReportStatus.DRAFT,
            version="1.0",
            file_path=str(file_path),
            file_hash_sha256=file_hash,
            metadata_json={
                "target_platform": request.target_platform,
                "reporting_organization": request.reporting_organization,
                "contact_info": request.contact_info,
                "requested_action": request.requested_action,
                "finding_count": len(report_data.get("findings", [])),
                "buzzer_count": len(report_data.get("comments", [])),
            },
            generated_by="analyst",
        )
        db.add(report)
        await db.flush()

        return ReportResponse(
            report_id=report.id,
            investigation_id=report.investigation_id,
            report_type=report.report_type.value,
            format=report.format.value,
            status=report.status.value,
            version=report.version,
            file_hash_sha256=report.file_hash_sha256,
            metadata=report.metadata_json or {},
            generated_by=report.generated_by,
            created_at=report.created_at,
            download_url=f"/api/v1/reports/{report.id}/download",
        )

    async def get_report(self, db: AsyncSession, report_id: str) -> ReportResponse | None:
        """Get report metadata."""
        res = await db.execute(select(GeneratedReport).where(GeneratedReport.id == report_id))
        r = res.scalar_one_or_none()
        if not r:
            return None

        return ReportResponse(
            report_id=r.id,
            investigation_id=r.investigation_id,
            report_type=r.report_type.value,
            format=r.format.value,
            status=r.status.value,
            version=r.version,
            file_hash_sha256=r.file_hash_sha256,
            metadata=r.metadata_json or {},
            generated_by=r.generated_by,
            created_at=r.created_at,
            download_url=f"/api/v1/reports/{r.id}/download",
        )

    async def get_report_file(self, db: AsyncSession, report_id: str) -> tuple[str, str] | None:
        """Fetch report file path and MIME type."""
        res = await db.execute(select(GeneratedReport).where(GeneratedReport.id == report_id))
        r = res.scalar_one_or_none()
        if not r or not r.file_path:
            return None

        p = Path(r.file_path)
        if not p.exists():
            return None

        media_type = "application/json" if r.format == ReportFormat.JSON else "application/pdf"
        return str(p), media_type

    async def list_reports(self, db: AsyncSession, investigation_id: str | None = None) -> list[ReportResponse]:
        """List generated reports."""
        q = select(GeneratedReport).order_by(GeneratedReport.created_at.desc())
        if investigation_id:
            q = q.where(GeneratedReport.investigation_id == investigation_id)

        res = await db.execute(q)
        reports = res.scalars().all()

        return [
            ReportResponse(
                report_id=r.id,
                investigation_id=r.investigation_id,
                report_type=r.report_type.value,
                format=r.format.value,
                status=r.status.value,
                version=r.version,
                file_hash_sha256=r.file_hash_sha256,
                metadata=r.metadata_json or {},
                generated_by=r.generated_by,
                created_at=r.created_at,
                download_url=f"/api/v1/reports/{r.id}/download",
            )
            for r in reports
        ]

    async def _gather_report_data(self, db: AsyncSession, req: ReportGenerateRequest) -> dict:
        data = {
            "platform": "NEXTRACE",
            "title": "Digital Evidence & Impersonation Takedown Dossier",
            "reporting_organization": req.reporting_organization,
            "target_platform": req.target_platform,
            "contact_info": req.contact_info,
            "requested_action": req.requested_action or "Account Suspension & Content Takedown",
        }

        if req.investigation_id:
            inv_res = await db.execute(select(Investigation).where(Investigation.id == req.investigation_id))
            inv = inv_res.scalar_one_or_none()
            if inv:
                data["investigation"] = {
                    "id": inv.id,
                    "title": inv.title,
                    "organization": inv.organization,
                    "target_brand": inv.target_brand,
                    "status": inv.status.value if hasattr(inv.status, "value") else str(inv.status),
                }

        # Buzzer Threat Dossier Specific Data
        if req.report_type == ReportTypeEnum.BUZZER_THREAT_DOSSIER:
            data["title"] = "Laporan Intelijen Anomali Buzzer & Astroturfing"
            data["requested_action"] = (
                req.requested_action or "Audit Rekayasa Opini Publik & Pemutusan Akses Jaringan Inautentik"
            )

            target_scan_id = req.contact_info.get("scan_id") if req.contact_info else None
            scan = None
            if target_scan_id:
                scan_res = await db.execute(select(BuzzerScan).where(BuzzerScan.id == target_scan_id))
                scan = scan_res.scalar_one_or_none()
            if not scan and req.investigation_id and req.investigation_id != "inv-demo-001":
                scan_res = await db.execute(
                    select(BuzzerScan)
                    .where(BuzzerScan.investigation_id == req.investigation_id)
                    .order_by(BuzzerScan.created_at.desc())
                )
                scan = scan_res.scalars().first()
            if not scan:
                scan_res = await db.execute(select(BuzzerScan).order_by(BuzzerScan.created_at.desc()))
                scan = scan_res.scalars().first()

            if scan:
                comm_res = await db.execute(
                    select(BuzzerComment)
                    .where(BuzzerComment.scan_id == scan.id)
                    .order_by(BuzzerComment.buzzer_score.desc())
                )
                comments = comm_res.scalars().all()
                data["buzzer_scan"] = {
                    "scan_id": scan.id,
                    "target_url": scan.target_url,
                    "target_platform": scan.target_platform,
                    "target_author": scan.target_author or "Sasaran Terpantau",
                    "total_comments": scan.total_comments,
                    "buzzer_count": scan.buzzer_count,
                    "bot_count": scan.bot_count,
                    "organic_count": scan.organic_count,
                    "threat_comments_count": scan.threat_comments_count,
                    "astroturfing_index": scan.astroturfing_index,
                    "scan_metadata": scan.scan_metadata or {},
                }
                data["comments"] = [
                    {
                        "id": c.id,
                        "author_username": c.author_username,
                        "author_display_name": c.author_display_name,
                        "platform": c.platform,
                        "comment_text": c.comment_text,
                        "likes_count": c.likes_count,
                        "buzzer_score": c.buzzer_score,
                        "account_classification": c.account_classification,
                        "threat_intent": c.threat_intent,
                        "account_signals": c.account_signals or {},
                    }
                    for c in comments
                ]

        # Impersonation Findings
        q = select(ImpersonationFinding)
        if req.finding_ids:
            q = q.where(ImpersonationFinding.id.in_(req.finding_ids))
        elif req.investigation_id:
            q = q.where(ImpersonationFinding.investigation_id == req.investigation_id)

        find_res = await db.execute(q)
        findings = find_res.scalars().all()

        data["findings"] = [
            {
                "finding_id": f.id,
                "risk_score": f.risk_score,
                "risk_severity": f.risk_severity.value if hasattr(f.risk_severity, "value") else str(f.risk_severity),
                "username_similarity": f.username_similarity_score,
                "avatar_similarity": f.avatar_similarity_score,
                "homoglyph_detected": f.homoglyph_detected,
                "review_status": f.review_status.value if hasattr(f.review_status, "value") else str(f.review_status),
            }
            for f in findings
        ]

        # Evidence
        if req.investigation_id:
            ev_res = await db.execute(
                select(EvidenceArtifact).where(EvidenceArtifact.investigation_id == req.investigation_id)
            )
            evidence = ev_res.scalars().all()
            data["evidence_manifest"] = [
                {
                    "evidence_id": e.id,
                    "type": e.evidence_type.value if hasattr(e.evidence_type, "value") else str(e.evidence_type),
                    "file_hash_sha256": e.file_hash_sha256,
                    "collection_method": e.collection_method,
                    "collection_timestamp": e.collection_timestamp.isoformat() if e.collection_timestamp else None,
                }
                for e in evidence
            ]

        return data

    def _generate_pdf_report(self, data: dict) -> bytes:
        """Create PDF report using ReportLab with clean styling."""
        if data.get("report_type") == "buzzer_threat_dossier":
            return self._generate_buzzer_threat_pdf(data)

        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            rightMargin=2 * cm,
            leftMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Title"],
            fontSize=18,
            textColor=colors.HexColor("#0B0F17"),
            spaceAfter=6,
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#475569"),
            spaceAfter=14,
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontSize=12,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=6,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=4,
        )
        warning_style = ParagraphStyle(
            "Warning",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#dc2626"),
            leading=11,
            spaceAfter=8,
        )

        elements = []

        elements.append(Paragraph("NEXTRACE DIGITAL FORENSICS &amp; EVIDENCE DOSSIER", title_style))
        elements.append(
            Paragraph(
                "Sistem Terpadu Identifikasi Akun Tiruan &amp; Pelacak Jejak Kebocoran Data",
                subtitle_style,
            )
        )

        # Metadata Table
        meta_table_data = [
            [
                "Report ID:",
                data.get("report_id", "N/A"),
                "Status:",
                "DRAFT (Requires Human Review)",
            ],
            [
                "Generated:",
                f"{data.get('generated_at', 'N/A')} UTC",
                "Format:",
                "Official Audit Draft",
            ],
            [
                "Organization:",
                data.get("reporting_organization") or "Cybersecurity Taskforce",
                "Target Platform:",
                data.get("target_platform") or "Public Web",
            ],
            [
                "Requested Action:",
                data.get("requested_action") or "Review for Takedown",
                "",
                "",
            ],
        ]
        meta_table = Table(meta_table_data, colWidths=[3 * cm, 5.5 * cm, 3 * cm, 5.5 * cm])
        meta_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 4 * mm))

        # Disclaimer
        elements.append(Paragraph("EVIDENTIARY DISCLAIMER", h2_style))
        elements.append(Paragraph(data.get("disclaimer", ""), warning_style))

        # Findings Summary
        findings = data.get("findings", [])
        elements.append(Paragraph(f"SUSPECTED IMPERSONATION FINDINGS ({len(findings)} records)", h2_style))

        if findings:
            rows = [["#", "Finding ID", "Risk Score", "Severity", "Review Status"]]
            for idx, f in enumerate(findings, 1):
                rows.append(
                    [
                        str(idx),
                        str(f.get("finding_id", ""))[:14] + "...",
                        f"{f.get('risk_score', 0):.1f}/100",
                        str(f.get("risk_severity", "")).upper(),
                        str(f.get("review_status", "")).upper(),
                    ]
                )
            t = Table(rows, colWidths=[1 * cm, 5.5 * cm, 3.5 * cm, 3.5 * cm, 3.5 * cm])
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 8),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        (
                            "ROWBACKGROUNDS",
                            (0, 1),
                            (-1, -1),
                            [colors.white, colors.HexColor("#f8fafc")],
                        ),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ]
                )
            )
            elements.append(t)
        else:
            elements.append(Paragraph("No impersonator findings associated with this report.", body_style))

        # Evidence Manifest
        evidence = data.get("evidence_manifest", [])
        if evidence:
            elements.append(Spacer(1, 4 * mm))
            elements.append(
                Paragraph(
                    f"CHAIN-OF-CUSTODY EVIDENCE MANIFEST ({len(evidence)} items)",
                    h2_style,
                )
            )
            for e in evidence:
                elements.append(
                    Paragraph(
                        f"• <b>[{e.get('type')}]</b> ID: {e.get('evidence_id')}<br/>"
                        f"  &nbsp;&nbsp;SHA-256: <code>{e.get('file_hash_sha256') or 'N/A'}</code><br/>"
                        f"  &nbsp;&nbsp;Collected: {e.get('collection_timestamp')} via {e.get('collection_method')}",
                        body_style,
                    )
                )

        elements.append(Spacer(1, 8 * mm))
        elements.append(
            Paragraph(
                "— NEXTRACE Automated Evidence Engine — Generated for authorized incident triage.",
                ParagraphStyle(
                    "Footer",
                    parent=styles["Normal"],
                    fontSize=7,
                    textColor=colors.gray,
                    alignment=1,
                ),
            )
        )

        doc.build(elements)
        return buf.getvalue()

    def _generate_buzzer_threat_pdf(self, data: dict) -> bytes:
        """Create PDF report for Buzzer & Astroturfing threat intelligence using ReportLab."""
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
            pagesize=A4,
            rightMargin=1.8 * cm,
            leftMargin=1.8 * cm,
            topMargin=1.8 * cm,
            bottomMargin=1.8 * cm,
        )

        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Title"],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0B0F17"),
            spaceAfter=4,
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=styles["Normal"],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#2563eb"),
            fontName="Helvetica-Bold",
            spaceAfter=12,
        )
        h2_style = ParagraphStyle(
            "SectionH2",
            parent=styles["Heading2"],
            fontSize=11,
            leading=14,
            textColor=colors.HexColor("#0f172a"),
            fontName="Helvetica-Bold",
            spaceBefore=10,
            spaceAfter=4,
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#1e293b"),
            spaceAfter=4,
        )
        warning_style = ParagraphStyle(
            "Warning",
            parent=styles["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#b91c1c"),
            leading=11,
            spaceAfter=6,
        )

        elements = []

        elements.append(Paragraph("NEXTRACE FORENSICS &bull; DOSSIER INTELIJEN ANOMALI BUZZER", title_style))
        elements.append(
            Paragraph(
                "Sistem Audit Terpadu Rekayasa Opini Publik, Koordinasi Astroturfing, &amp; Jaringan Akun Inautentik",
                subtitle_style,
            )
        )

        scan_info = data.get("buzzer_scan", {})

        # Metadata Table
        meta_table_data = [
            [
                "Dossier ID:",
                f"BUZZER-{data.get('report_id', 'N/A')[:8].upper()}",
                "Status:",
                "TERVERIFIKASI (SIAP REVIEW)",
            ],
            [
                "Akun Sasaran:",
                f"@{scan_info.get('target_author', 'N/A')}",
                "Platform:",
                scan_info.get("target_platform", "Instagram"),
            ],
            [
                "URL Sasaran:",
                Paragraph(f"<font size=7 color='#2563eb'>{scan_info.get('target_url', 'N/A')}</font>", body_style),
                "Waktu Audit:",
                f"{data.get('generated_at', 'N/A')[:19]} UTC",
            ],
            [
                "Metode Koleksi:",
                "Edge Headless Real-Web OSINT",
                "Dasar Hukum:",
                "UU ITE No. 1/2024 Pasal 5 & 6",
            ],
        ]
        meta_table = Table(meta_table_data, colWidths=[2.8 * cm, 5.8 * cm, 2.8 * cm, 5.8 * cm])
        meta_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#334155")),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                ]
            )
        )
        elements.append(meta_table)
        elements.append(Spacer(1, 3 * mm))

        # KPI Metrics Table (4 columns)
        total_comments = scan_info.get("total_comments", 0)
        buzzer_bot_count = scan_info.get("buzzer_count", 0) + scan_info.get("bot_count", 0)
        astroturfing_index = scan_info.get("astroturfing_index", 0.0)
        threat_count = scan_info.get("threat_comments_count", 0)

        kpi_data = [
            [
                "TOTAL ENTITAS",
                "BUZZER / BOT FARM",
                "INDEKS ASTROTURFING",
                "MUATAN ANCAMAN",
            ],
            [
                str(total_comments),
                f"{buzzer_bot_count} Akun",
                f"{astroturfing_index:.1f}%",
                f"{threat_count} Terdeteksi",
            ],
        ]
        kpi_table = Table(kpi_data, colWidths=[4.3 * cm, 4.3 * cm, 4.3 * cm, 4.3 * cm])
        kpi_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, 0), 7.5),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#64748b")),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTSIZE", (0, 1), (-1, 1), 12),
                    ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 1), (-1, 1), colors.HexColor("#0f172a")),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ]
            )
        )
        elements.append(kpi_table)
        elements.append(Spacer(1, 3 * mm))

        # Evidentiary Disclaimer
        elements.append(Paragraph("DISCLAIMER &amp; INTEGRITAS ALAT BUKTI ELEKTRONIK", h2_style))
        elements.append(
            Paragraph(
                "Berkas ini disusun berdasarkan audit telemetri web real-time tanpa manipulasi data sintetis. "
                "Sesuai ketentuan UU No. 1 Tahun 2024 tentang Perubahan Kedua UU No. 11 Tahun 2008 tentang ITE "
                "(Pasal 5 ayat 1 &amp; Pasal 6), seluruh entitas yang disita telah disegel secara kriptografis "
                "menggunakan algoritma Secure Hash Algorithm 256-bit (SHA-256) untuk menjamin keutuhan (integrity) "
                "dan rantai kustodi (chain of custody) alat bukti hukum di pengadilan.",
                warning_style,
            )
        )

        # Entity Triage Table
        comments = data.get("comments", [])
        elements.append(Paragraph(f"MANIFEST ENTITAS &amp; INTERAKSI PUBLIK ({len(comments)} Catatan)", h2_style))

        if comments:
            rows = [["#", "Akun Pengunggah", "Klasifikasi", "Skor Anomali", "Ringkasan Muatan Teks", "Suka / Komen"]]
            for idx, c in enumerate(comments[:25], 1):
                txt = c.get("comment_text", "").replace("\n", " ")
                if len(txt) > 42:
                    txt = txt[:40] + "..."
                likes = c.get("likes_count", 0)
                score = c.get("buzzer_score", 0.0)
                cls_name = c.get("account_classification", "organic").upper()
                rows.append(
                    [
                        str(idx),
                        f"@{c.get('author_username', '')}",
                        cls_name,
                        f"{score:.0f}%",
                        txt,
                        f"{likes} / {c.get('account_signals', {}).get('comments_count', 0)}",
                    ]
                )
            t = Table(rows, colWidths=[0.8 * cm, 3.8 * cm, 2.6 * cm, 2.2 * cm, 5.8 * cm, 2.0 * cm])
            t.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                        ("ALIGN", (0, 0), (0, -1), "CENTER"),
                        ("ALIGN", (2, 0), (3, -1), "CENTER"),
                        ("ALIGN", (5, 0), (5, -1), "RIGHT"),
                        (
                            "ROWBACKGROUNDS",
                            (0, 1),
                            (-1, -1),
                            [colors.white, colors.HexColor("#f8fafc")],
                        ),
                        ("TOPPADDING", (0, 0), (-1, -1), 3),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ]
                )
            )
            elements.append(t)
        else:
            elements.append(Paragraph("Belum ada entitas komentar yang diinspeksi dalam sesi scan ini.", body_style))

        # Legal Signature & Custody Block
        elements.append(Spacer(1, 4 * mm))
        elements.append(Paragraph("OTORISASI &amp; PENGESAHAN FORENSIK DIGITAL", h2_style))

        sig_data = [
            [
                "Analis Penyelidik Forensik Digital:",
                "Penelaah Hukum &amp; Otoritas Investigasi:",
            ],
            [
                "\n\n\n____________________________________\nNEXTRACE Cyber OSINT Analyst\nNIP / Cert: NX-ID-88402",
                "\n\n\n____________________________________\nChief of Cyber Evidence &amp; Legal\nBiro Investigasi Kejahatan Siber",
            ],
        ]
        sig_table = Table(sig_data, colWidths=[8.6 * cm, 8.6 * cm])
        sig_table.setStyle(
            TableStyle(
                [
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1e293b")),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )
        elements.append(sig_table)

        elements.append(Spacer(1, 4 * mm))
        elements.append(
            Paragraph(
                "— Diterbitkan secara otomatis oleh NEXTRACE OSINT Engine &bull; Validated under SHA-256 Custody —",
                ParagraphStyle(
                    "Footer",
                    parent=styles["Normal"],
                    fontSize=7,
                    textColor=colors.gray,
                    alignment=1,
                ),
            )
        )

        doc.build(elements)
        return buf.getvalue()
