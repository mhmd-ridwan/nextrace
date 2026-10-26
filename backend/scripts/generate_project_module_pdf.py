"""
NEXTRACE Project Documentation & Developer Guide Module PDF Generator.
Generates a clean, simple, and professional A4 PDF guide for teammates and analysts.
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Halaman X dari Y' with running headers."""

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
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Top running header (page 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1e293b"))
            self.drawString(54, 802, "NEXTRACE")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(110, 802, "|  Modul Panduan Pengembangan & Pengoperasian Sistem")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.6)
            self.line(54, 794, 541, 794)

        # Bottom footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "NEXTRACE OSINT Platform © 2026 • Rahasia Internal Tim Proyek")
        page_str = f"Halaman {self._pageNumber} dari {page_count}"
        self.drawRightString(541, 32, page_str)
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.6)
        self.line(54, 44, 541, 44)
        self.restoreState()


def build_pdf(output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54,
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    c_dark = colors.HexColor("#0f172a")
    c_blue = colors.HexColor("#1e40af")
    c_sky = colors.HexColor("#0284c7")
    c_mute = colors.HexColor("#475569")
    c_line = colors.HexColor("#cbd5e1")
    c_bg_box = colors.HexColor("#f8fafc")
    c_code_bg = colors.HexColor("#f1f5f9")

    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=c_dark,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        "CoverSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=c_mute,
        spaceAfter=12,
    )

    h1_style = ParagraphStyle(
        "H1Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=c_blue,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "H2Style",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=14,
        textColor=c_dark,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=c_dark,
        spaceAfter=5,
    )

    bullet_style = ParagraphStyle(
        "BulletDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12.5,
        textColor=c_dark,
        leftIndent=14,
        spaceAfter=3,
    )

    code_style = ParagraphStyle(
        "CodeText",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a"),
    )

    table_header_style = ParagraphStyle(
        "THStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
    )

    table_cell_style = ParagraphStyle(
        "TDStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=c_dark,
    )

    table_cell_code = ParagraphStyle(
        "TDCode",
        parent=styles["Normal"],
        fontName="Courier-Bold",
        fontSize=8,
        leading=11,
        textColor=c_blue,
    )

    story = []

    # ─────────────────────────────────────────────────────────────
    # COVER HEADER
    # ─────────────────────────────────────────────────────────────
    logo_path = Path(r"C:\Users\Administrator\Documents\project\nextrace\frontend\public\logo.png")
    
    header_data = []
    if logo_path.exists():
        img = Image(str(logo_path), width=48, height=48)
        header_text = [
            Paragraph("<b>NEXTRACE &bull; PANDUAN PENGEMBANGAN & PENGGUNAAN</b>", title_style),
            Paragraph("Enterprise Digital Identity Defense, Web OSINT & Cryptographic Evidence Platform", subtitle_style),
        ]
        header_table = Table([[img, header_text]], colWidths=[58, 429])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ]))
        story.append(header_table)
    else:
        story.append(Paragraph("<b>NEXTRACE &bull; PANDUAN PENGEMBANGAN & PENGGUNAAN</b>", title_style))
        story.append(Paragraph("Enterprise Digital Identity Defense, Web OSINT & Cryptographic Evidence Platform", subtitle_style))

    story.append(Spacer(1, 4))

    # Meta Info Card
    meta_html = (
        "<b>Target Pembaca:</b> Rekan Pengembang, Tim Investigasi Siber, dan QA Tester &bull; "
        "<b>Status:</b> v2.4 Terverifikasi (36 Automated Tests Passed) &bull; "
        "<b>Tanggal:</b> Oktober 2026"
    )
    meta_table = Table([[Paragraph(meta_html, ParagraphStyle("Meta", parent=body_style, fontSize=8, leading=11, textColor=c_mute))]], colWidths=[487])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), c_bg_box),
        ("BOX", (0, 0), (-1, -1), 0.5, c_line),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # ─────────────────────────────────────────────────────────────
    # BAB 1: GAMBARAN UMUM & ARSITEKTUR
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("1. Gambaran Umum & Arsitektur Sistem", h1_style))
    story.append(Paragraph(
        "<b>NEXTRACE</b> adalah platform investigasi keamanan siber dan perlindungan identitas digital "
        "terintegrasi. Sistem menggabungkan kemampuan intelijen sumber terbuka (OSINT), analisis interaksi buzzer "
        "secara live, pencarian profil global berbasis kemiripan visual (pHash), forensik metadata EXIF kamera/GPS, "
        "serta brankas barang bukti digital bersegel kriptografi SHA-256.",
        body_style
    ))

    # Module map table
    mod_data = [
        [
            Paragraph("Modul Fitur", table_header_style),
            Paragraph("Rute Halaman", table_header_style),
            Paragraph("Kemampuan Kunci & Fungsi", table_header_style),
        ],
        [
            Paragraph("<b>Dashboard & Omni-Scanner</b>", table_cell_style),
            Paragraph("/ ", table_cell_code),
            Paragraph("Identitas Admin Nextrace, jam sinkron realtime animasi kalender, pencarian instan lintas entitas (Username, HP, Email, Domain, Foto).", table_cell_style),
        ],
        [
            Paragraph("<b>Analisis Gambar & Forensik</b>", table_cell_style),
            Paragraph("/analisis-gambar", table_cell_code),
            Paragraph("Pencarian profil global visual 1-klik (pHash DCT), radar laser scan realtime, ekstraksi EXIF kamera/GPS, dan deteksi software Photoshop/Lightroom.", table_cell_style),
        ],
        [
            Paragraph("<b>Media Sosial (Akun Klon)</b>", table_cell_style),
            Paragraph("/media-sosial", table_cell_code),
            Paragraph("Triage 5 platform (Instagram, TikTok, X, Facebook, Telegram), Loupe Spektral Visual pHash, nomor tabel lega, dan sinkronisasi avatar suspek.", table_cell_style),
        ],
        [
            Paragraph("<b>Buzzer & Bot Hunter</b>", table_cell_style),
            Paragraph("/buzzer", table_cell_code),
            Paragraph("Live headless Edge web scraping & Polaris SSR hydration, graf kluster astroturfing teks serupa, dan kolom metrik sejajar presisi.", table_cell_style),
        ],
        [
            Paragraph("<b>Network & Domain OSINT</b>", table_cell_style),
            Paragraph("/domain, /dns, /whois", table_cell_code),
            Paragraph("Audit reputasi domain, deteksi phishing/punycode, resolusi DNS rekod lengkap (A, MX, TXT, NS), dan data registrasi WHOIS registrar.", table_cell_style),
        ],
        [
            Paragraph("<b>Data Breach & Alias</b>", table_cell_style),
            Paragraph("/leak-tracer, /smart-alias", table_cell_code),
            Paragraph("Pelacak kebocoran data dengan masking privasi (Zero-PII), smart alias email per-vendor terisolasi, dan atribusi sumber kebocoran.", table_cell_style),
        ],
        [
            Paragraph("<b>Brankas Bukti & Dossier</b>", table_cell_style),
            Paragraph("/evidence, /reports", table_cell_code),
            Paragraph("Penyegelan barang bukti SHA-256 tamper-proof, rantai ketelusuran chain-of-custody, dan generator laporan takedown resmi (PDF A4 / JSON).", table_cell_style),
        ],
    ]

    mod_table = Table(mod_data, colWidths=[115, 82, 290])
    mod_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_blue),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, c_line),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_box]),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(mod_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────
    # BAB 2: CARA MENJALANKAN (QUICKSTART)
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("2. Panduan Menjalankan Sistem (Setup Komputer Baru)", h1_style))
    story.append(Paragraph(
        "Setiap rekan tim yang baru meng-clone proyek dapat langsung menjalankan sistem dengan dua metode:",
        body_style
    ))

    # Method 1
    story.append(Paragraph("<b>Metode A: Cara Paling Cepat (1-Klik di Windows)</b>", h2_style))
    story.append(Paragraph(
        "Cukup buka folder proyek lalu klik ganda (double-click) file: <b><code>start.bat</code></b>. "
        "Skrip ini secara otomatis memverifikasi dependensi Python & Node.js, menginisialisasi database SQLite, "
        "menjalankan backend FastAPI (port 8000), frontend Next.js (port 3000), dan membuka browser.",
        bullet_style
    ))

    # Method 2
    story.append(Paragraph("<b>Metode B: Cara Manual / Terminal (Linux, Mac, Windows)</b>", h2_style))
    
    code_box_1 = (
        "# 1. Terminal Pertama (Backend FastAPI)\n"
        "cd backend\n"
        "python -m venv venv && .\\venv\\Scripts\\activate   # (Linux/Mac: source venv/bin/activate)\n"
        "pip install -r requirements.txt\n"
        "alembic upgrade head\n"
        "python -m app.db.seed\n"
        "uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\n\n"
        "# 2. Terminal Kedua (Frontend Next.js)\n"
        "cd frontend\n"
        "npm install\n"
        "npm run dev"
    )
    c1_table = Table([[Paragraph(code_box_1.replace("\n", "<br/>"), code_style)]], colWidths=[487])
    c1_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), c_code_bg),
        ("BOX", (0, 0), (-1, -1), 0.5, c_line),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(c1_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "&bull; <b>Aplikasi Web:</b> <code>http://localhost:3000</code> &nbsp;&bull;&nbsp; "
        "<b>Dokumentasi API Swagger:</b> <code>http://localhost:8000/docs</code>",
        body_style
    ))
    story.append(Spacer(1, 8))

    # ─────────────────────────────────────────────────────────────
    # BAB 3: ALUR KERJA GIT & UPDATE KODE
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Alur Kerja Pembaruan Kode & Git Workflow", h1_style))
    story.append(Paragraph(
        "Untuk menjaga konsistensi repositori dan kelancaran kolaborasi antar-rekan tim:",
        body_style
    ))

    git_steps = (
        "<b>1. Tarik Perubahan Terbaru Sebelum Mengedit:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git pull origin main</code><br/><br/>"
        "<b>2. Simpan dan Unggah Update Kode ke GitHub:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git status</code> &nbsp;<i>(periksa file yang berubah)</i><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git add .</code> &nbsp;<i>(tandai semua perubahan aman)</i><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git commit -m \"feat: deskripsi perubahan fitur\"</code><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<code>git push</code><br/><br/>"
        "<b>3. Kebijakan .gitignore Bersih & Aman:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; Folder berat seperti <code>node_modules/</code> dan <code>.next/</code> diblokir otomatis.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; Database lokal <code>nextrace.db</code> dan file <code>.env</code> tidak di-upload demi keamanan privasi.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;&bull; Folder gambar dokumentasi (<code>images/</code>) tidak diunggah agar repositori sangat ringan (~8 MB)."
    )
    g_table = Table([[Paragraph(git_steps, body_style)]], colWidths=[487])
    g_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), c_bg_box),
        ("BOX", (0, 0), (-1, -1), 0.5, c_line),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(g_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────
    # BAB 4: CARA BERBAGI PROYEK DENGAN REKAN
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("4. Cara Berbagi Proyek dengan Rekan Tim", h1_style))
    story.append(Paragraph(
        "Terdapat 3 skenario praktis dalam berbagi proyek:",
        body_style
    ))

    share_data = [
        [
            Paragraph("Skenario Berbagi", table_header_style),
            Paragraph("Langkah Praktis yang Perlu Dilakukan", table_header_style),
        ],
        [
            Paragraph("<b>A. Kolaborasi Kode (GitHub)</b><br/><i>Untuk sesama developer</i>", table_cell_style),
            Paragraph(
                "1. Buka <code>https://github.com/mhmd-ridwan/nextrace/settings/access</code><br/>"
                "2. Klik <b>Add people</b> & masukkan username GitHub rekan.<br/>"
                "3. Rekan Anda menerima undangan, meng-clone repo, lalu menjalankan <code>start.bat</code>.",
                table_cell_style
            ),
        ],
        [
            Paragraph("<b>B. Demo Satu Jaringan (WiFi / LAN)</b><br/><i>Untuk PM, tester, rekan kantor</i>", table_cell_style),
            Paragraph(
                "1. Buka PowerShell Anda, ketik <code>ipconfig</code> (lihat IPv4, misal: <code>192.168.1.50</code>).<br/>"
                "2. Jalankan frontend: <code>cd frontend && npm run dev -- -H 0.0.0.0</code><br/>"
                "3. Rekan Anda cukup membuka browser HP/laptop: <code>http://192.168.1.50:3000</code>.",
                table_cell_style
            ),
        ],
        [
            Paragraph("<b>C. Demo Jarak Jauh (Internet)</b><br/><i>Tanpa perlu satu jaringan WiFi</i>", table_cell_style),
            Paragraph(
                "1. Gunakan Cloudflare Tunnel gratis: <code>cloudflared tunnel --url http://localhost:3000</code><br/>"
                "2. Bagikan link HTTPS sementara yang dihasilkan (misal: <code>https://random.trycloudflare.com</code>).<br/>"
                "3. Rekan Anda bisa langsung mengakses aplikasi dari mana saja secara aman.",
                table_cell_style
            ),
        ],
    ]

    s_table = Table(share_data, colWidths=[160, 327])
    s_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), c_dark),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, c_line),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, c_bg_box]),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(s_table)
    story.append(Spacer(1, 10))

    # ─────────────────────────────────────────────────────────────
    # BAB 5: VERIFIKASI KUALITAS & TESTING
    # ─────────────────────────────────────────────────────────────
    story.append(Paragraph("5. Standar Pengujian & Jaminan Mutu Kode (QA)", h1_style))
    story.append(Paragraph(
        "Sebelum melakukan push atau penggabungan kode, pastikan pengujian berikut lulus 100% tanpa error:",
        body_style
    ))

    qa_box = (
        "&bull; <b>Uji Logika Bisnis & API Backend:</b> Jalankan <code>pytest -v</code> di folder <code>backend/</code> "
        "(36 pengujian unit & integrasi terkonfirmasi PASSED).<br/>"
        "&bull; <b>Pemeriksaan Static Analysis Python:</b> Jalankan <code>ruff check .</code> di folder <code>backend/</code> (0 error).<br/>"
        "&bull; <b>Pemeriksaan Strict Typing Frontend:</b> Jalankan <code>npx tsc --noEmit</code> di folder <code>frontend/</code> "
        "(0 error kompilasi TypeScript)."
    )
    qa_table = Table([[Paragraph(qa_box, body_style)]], colWidths=[487])
    qa_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), c_bg_box),
        ("BOX", (0, 0), (-1, -1), 0.5, c_line),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(qa_table)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=c_line, spaceAfter=8))
    
    footer_note = (
        "<b>Catatan Forensik & Legalitas:</b> Seluruh laporan takedown yang dihasilkan berstatus DRAFT dan memerlukan "
        "verifikasi manusia (Human-in-the-Loop) sebelum diserahkan ke pihak penegak hukum atau abuse team platform digital."
    )
    story.append(Paragraph(footer_note, ParagraphStyle("FN", parent=body_style, fontSize=7.5, leading=10, textColor=c_mute)))

    # Build document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully generated at: {output_path}")


if __name__ == "__main__":
    out_dir = Path(r"C:\Users\Administrator\Documents\project\nextrace")
    out_file = out_dir / "MODUL_PANDUAN_NEXTRACE.pdf"
    build_pdf(str(out_file))

    # Also make a copy directly on Desktop for instant accessibility
    desktop_file = Path(r"C:\Users\Administrator\Desktop\MODUL_PANDUAN_NEXTRACE.pdf")
    import shutil
    shutil.copy2(out_file, desktop_file)
    print(f"Copied to Desktop: {desktop_file}")
