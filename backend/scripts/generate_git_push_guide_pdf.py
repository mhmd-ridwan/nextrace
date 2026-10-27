"""
NEXTRACE Git Push Guide (Clean Single-Page SOP).
Generates a minimal, ultra-clean, high-contrast, professional 1-page A4 PDF on Desktop.
Focuses strictly on: Urutan Standar Git Push (Alur Harian 6 Langkah).
"""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfgen import canvas
from reportlab.platypus import HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


class SinglePageCanvas(canvas.Canvas):
    """Clean single-page canvas with top accent line and official footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_decorations(self, page_count):
        self.saveState()
        # Top brand line
        self.setStrokeColor(colors.HexColor("#0284c7"))
        self.setLineWidth(2)
        self.line(48, 804, 547, 804)

        # Bottom footer
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f172a"))
        self.drawString(48, 32, "NEXTRACE OSINT PLATFORM")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(185, 32, "•  Dokumen Panduan Praktis Pengembang (SOP Git)")
        self.drawRightString(547, 32, "Halaman 1 dari 1")
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(48, 44, 547, 44)
        self.restoreState()


def build_single_page_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=48,
        rightMargin=48,
        topMargin=44,
        bottomMargin=48,
    )

    styles = getSampleStyleSheet()

    c_dark = colors.HexColor("#0f172a")
    c_blue = colors.HexColor("#1e40af")
    c_sky = colors.HexColor("#0284c7")
    c_mute = colors.HexColor("#475569")
    c_line = colors.HexColor("#cbd5e1")
    c_bg_row = colors.HexColor("#f8fafc")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=c_dark,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=c_mute,
        spaceAfter=14,
    )

    th_style = ParagraphStyle(
        "THStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=12,
        textColor=c_dark,
    )

    step_num_style = ParagraphStyle(
        "StepNum",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=c_blue,
    )

    cmd_style = ParagraphStyle(
        "CmdStyle",
        parent=styles["Normal"],
        fontName="Courier-Bold",
        fontSize=9,
        leading=13,
        textColor=c_dark,
    )

    desc_style = ParagraphStyle(
        "DescStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=c_mute,
    )

    story = []

    # Category Tag
    story.append(Paragraph(
        "<font color='#0284c7'><b>STANDAR OPERASIONAL PROSEDUR (SOP) &bull; VERSION CONTROL WORKFLOW</b></font>",
        ParagraphStyle("Tag", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=c_sky)
    ))
    story.append(Spacer(1, 4))

    # Title & Target Repo
    story.append(Paragraph("Urutan Standar Git Push (Alur Harian 6 Langkah)", title_style))
    story.append(Paragraph(
        "Prosedur baku pengunggahan kode ke repositori resmi <b>https://github.com/mhmd-ridwan/nextrace</b> "
        "setiap kali selesai melakukan pembaruan kodingan.",
        subtitle_style
    ))

    story.append(HRFlowable(width="100%", thickness=1, color=c_line, spaceAfter=14))

    # The 6 Steps Table
    table_data = [
        [
            Paragraph("No", th_style),
            Paragraph("Langkah Kerja", th_style),
            Paragraph("Perintah Terminal (PowerShell / Bash)", th_style),
            Paragraph("Fungsi &amp; Tujuan", th_style),
        ],
        [
            Paragraph("<b>01</b>", step_num_style),
            Paragraph("<b>Masuk Folder</b>", ParagraphStyle("P1", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>cd C:\\Users\\Administrator\\Documents\\project\\nextrace</code>", cmd_style),
            Paragraph("Masuk ke direktori utama (root) repositori project.", desc_style),
        ],
        [
            Paragraph("<b>02</b>", step_num_style),
            Paragraph("<b>Tarik Update</b>", ParagraphStyle("P2", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>git pull origin main</code>", cmd_style),
            Paragraph("Mengambil pembaruan terbaru dari GitHub agar kode lokal tetap sinkron.", desc_style),
        ],
        [
            Paragraph("<b>03</b>", step_num_style),
            Paragraph("<b>Periksa Status</b>", ParagraphStyle("P3", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>git status</code>", cmd_style),
            Paragraph("Melihat daftar berkas yang baru dimodifikasi, ditambah, atau dihapus.", desc_style),
        ],
        [
            Paragraph("<b>04</b>", step_num_style),
            Paragraph("<b>Staging File</b>", ParagraphStyle("P4", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>git add .</code>", cmd_style),
            Paragraph("Mendaftarkan seluruh berkas perubahan ke antrean commit.", desc_style),
        ],
        [
            Paragraph("<b>05</b>", step_num_style),
            Paragraph("<b>Simpan Commit</b>", ParagraphStyle("P5", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>git commit -m \"Pesan perubahan Anda\"</code>", cmd_style),
            Paragraph("Menyimpan snapshot perubahan di komputer lokal dengan catatan yang jelas.", desc_style),
        ],
        [
            Paragraph("<b>06</b>", step_num_style),
            Paragraph("<b>Kirim ke GitHub</b>", ParagraphStyle("P6", parent=desc_style, fontName="Helvetica-Bold", textColor=c_dark)),
            Paragraph("<code>git push origin main</code>", cmd_style),
            Paragraph("Mengunggah commit lokal secara permanen ke repositori remote GitHub.", desc_style),
        ],
    ]

    col_widths = [32, 95, 210, 162]
    step_table = Table(table_data, colWidths=col_widths)
    step_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
        ("GRID", (0, 0), (-1, -1), 0.5, c_line),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_row]),
    ]))
    story.append(step_table)
    story.append(Spacer(1, 16))

    # Quick One-Liner Box
    quick_title = Paragraph(
        "<b>Ringkasan Eksekusi Cepat (Sekali Salin / One-Liner):</b>",
        ParagraphStyle("QTitle", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=c_dark)
    )
    quick_code = Paragraph(
        "<code>git pull origin main &amp;&amp; git add . &amp;&amp; git commit -m \"Update fitur baru\" &amp;&amp; git push origin main</code>",
        ParagraphStyle("QCode", parent=styles["Normal"], fontName="Courier-Bold", fontSize=8.5, leading=12, textColor=c_blue)
    )

    quick_table = Table([[quick_title], [quick_code]], colWidths=[499])
    quick_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f0f9ff")),
        ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#0284c7")),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(quick_table)

    story.append(Spacer(1, 12))

    # Minimal Helpful Tip Note
    tip_content = (
        "<b>Verifikasi Akhir:</b> Jalankan <code>git status</code> setelah langkah 6. "
        "Bila muncul keterangan <i>'Your branch is up to date with origin/main'</i> dan working tree bersih, "
        "seluruh perubahan telah berhasil tersimpan di GitHub."
    )
    story.append(Paragraph(
        tip_content,
        ParagraphStyle("TipText", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5, leading=12, textColor=c_mute)
    ))

    # Build document
    doc.build(story, canvasmaker=SinglePageCanvas)
    print(f"Single-page SOP PDF generated successfully at: {output_path}")


if __name__ == "__main__":
    desktop_file = Path(r"C:\Users\Administrator\Desktop\PANDUAN_GIT_PUSH_NEXTRACE.pdf")
    build_single_page_pdf(str(desktop_file))
