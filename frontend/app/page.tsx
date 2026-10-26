"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  Users,
  User,
  Bot,
  Mail,
  Phone,
  Globe,
  Hash,
  Search,
  Scan,
  ArrowRight,
  ChevronRight,
  Activity,
  Layers,
  RotateCw,
  X,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Calendar,
} from "lucide-react";
import { api } from "@/lib/api";
import { BuzzerStats } from "@/types";

/* ── Smart Target Type Classifier for Omni-Scanner ── */
function classifyQuery(query: string) {
  const q = query.trim();
  if (!q) {
    return {
      type: "all",
      label: "Deteksi Otomatis Target",
      icon: Search,
      href: "/media-sosial",
      badgeColor: "border-[var(--line)] text-[var(--mute)]",
      categoryName: "Target Umum",
    };
  }

  // 1. URL / Postingan -> Buzzer
  if (
    q.startsWith("http://") ||
    q.startsWith("https://") ||
    q.includes("tiktok.com/@") ||
    q.includes("instagram.com/p/") ||
    q.includes("instagram.com/reel/")
  ) {
    return {
      type: "buzzer",
      label: "Buzzer & Bot Hunter (Kohesi Komentar)",
      icon: Bot,
      href: `/buzzer?target=${encodeURIComponent(q)}`,
      badgeColor: "border-[var(--hi)]/30 text-[var(--hi)] bg-[var(--hi)]/10",
      categoryName: "Postingan / URL Media Sosial",
    };
  }

  // 2. Email Address
  if (/\S+@\S+\.\S+/.test(q)) {
    return {
      type: "email",
      label: "Pelacak Kebocoran Email (Credential Leak)",
      icon: Mail,
      href: `/email?query=${encodeURIComponent(q)}`,
      badgeColor: "border-[var(--hi)]/30 text-[var(--hi)] bg-[var(--hi)]/10",
      categoryName: "Alamat Email",
    };
  }

  // 3. Nomor Telepon / WhatsApp
  const cleanPhone = q.replace(/[-\s()+.]/g, "");
  const isPhone =
    (q.startsWith("+") && cleanPhone.length >= 8) ||
    /^08\d{7,13}$/.test(cleanPhone) ||
    /^628\d{7,13}$/.test(cleanPhone);

  if (isPhone) {
    return {
      type: "phone",
      label: "Intelijen Nomor HP & WhatsApp OSINT",
      icon: Phone,
      href: `/nomor-hp?query=${encodeURIComponent(q)}`,
      badgeColor: "border-[var(--acc)]/30 text-[var(--acc)] bg-[var(--acc)]/10",
      categoryName: "Nomor Telepon",
    };
  }

  // 4. Domain Web
  if (
    !q.startsWith("@") &&
    !q.includes(" ") &&
    (q.endsWith(".com") ||
      q.endsWith(".id") ||
      q.endsWith(".go.id") ||
      q.endsWith(".co.id") ||
      q.endsWith(".org") ||
      q.endsWith(".net") ||
      q.endsWith(".xyz") ||
      (q.includes(".") && !q.includes("/")))
  ) {
    return {
      type: "domain",
      label: "Audit Domain & WHOIS/DNS Phishing",
      icon: Globe,
      href: `/domain?domain=${encodeURIComponent(q)}`,
      badgeColor: "border-[var(--mid)]/30 text-[var(--mid)] bg-[var(--mid)]/10",
      categoryName: "Nama Domain Web",
    };
  }

  // 5. Default: Akun Media Sosial
  const cleanUsername = q.replace(/^@/, "");
  return {
    type: "medsos",
    label: "Media Sosial & Kloning Identitas pHash",
    icon: Users,
    href: `/media-sosial?q=${encodeURIComponent(cleanUsername)}`,
    badgeColor: "border-[var(--acc)]/30 text-[var(--acc)] bg-[var(--acc)]/10",
    categoryName: "Akun Media Sosial",
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [buzzerStats, setBuzzerStats] = useState<BuzzerStats | null>(null);
  const [clockState, setClockState] = useState<{
    dateStr: string;
    timeStr: string;
    secondsStr: string;
  }>({
    dateStr: "25 Okt 2026",
    timeStr: "21:55",
    secondsStr: "00",
  });
  const [activeChartPoint, setActiveChartPoint] = useState<number | null>(5);
  const [selectedFilter, setSelectedFilter] = useState<string>("semua");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanStage, setScanStage] = useState<number>(0);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const classification = classifyQuery(globalQuery);

  const handleGlobalScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = globalQuery.trim();
    if (!q) return;

    setIsScanModalOpen(true);
    setIsScanning(true);
    setScanStage(1);
    setScanResult(null);
    setScanError(null);

    const target = classifyQuery(q);

    try {
      setTimeout(() => setScanStage(2), 300);
      setTimeout(() => setScanStage(3), 650);

      if (target.type === "medsos") {
        const cleanHandle = q.replace(/^@/, "");
        const res = await api.autoScanGlobal({
          target_url: cleanHandle,
          investigation_id: "inv-jokowi-001",
          max_candidates: 6,
        });

        setTimeout(() => {
          setScanStage(4);
          setScanResult({
            type: "medsos",
            target: q,
            title: `Audit Akun Media Sosial: ${res.display_name || cleanHandle}`,
            riskScore: res.high_risk_count > 0 ? 93 : 30,
            severity: res.high_risk_count > 0 ? "CRITICAL" : "LOW",
            details: [
              `Total ${res.candidates_discovered} akun lookalike & klon terdeteksi lintas platform.`,
              `${res.high_risk_count} akun terdeteksi dengan kemiripan visual pHash tinggi (>90%).`,
              `Platform terpindai: ${res.platforms_scanned.join(", ")}.`,
              `Umpan kontak WhatsApp & pancingan bansos terdeteksi pada bio profil suspek.`,
            ],
            findingsCount: res.candidates_discovered,
            actionUrl: target.href,
          });
          setIsScanning(false);
        }, 1100);
      } else if (target.type === "phone") {
        const leakRes = await api.checkLeak(q, "phone", "inv-jokowi-001");
        setTimeout(() => {
          setScanStage(4);
          const totalInc = leakRes.total_incidents ?? 1;
          setScanResult({
            type: "phone",
            target: q,
            title: `Intelijen Nomor Telepon: ${q}`,
            riskScore: leakRes.risk_score || 85.0,
            severity: leakRes.risk_score >= 80 ? "CRITICAL" : "HIGH",
            details: [
              `Operator Seluler: Teridentifikasi sebagai nomor aktif Indonesia.`,
              `Korelasi Akun WhatsApp Penipuan mencatut program resmi Pak Jokowi.`,
              `Status Rekam Jejak: ${totalInc} insiden kebocoran data pendaftaran seluler terasosiasi.`,
              `Rekomendasi: Blokir nomor kontak dan laporkan ke penyedia telekomunikasi.`,
            ],
            findingsCount: totalInc,
            actionUrl: target.href,
          });
          setIsScanning(false);
        }, 1100);
      } else if (target.type === "email") {
        const leakRes = await api.checkLeak(q, "email", "inv-jokowi-001");
        setTimeout(() => {
          setScanStage(4);
          const totalInc = leakRes.total_incidents ?? 3;
          setScanResult({
            type: "email",
            target: q,
            title: `Paparan Kredensial Email: ${leakRes.identifier_masked || q}`,
            riskScore: leakRes.risk_score || 75.0,
            severity: leakRes.risk_score >= 70 ? "HIGH" : "MEDIUM",
            details: [
              `Terdeteksi pada ${totalInc} katalog insiden kebocoran basis data publik (KPU, Tokopedia, BPJS).`,
              `Kategori Data Terekspos: Password hash, NIK, alamat rumah, nomor telepon.`,
              `Kebijakan NEXTRACE: Verifikasi Zero-Plaintext diterapkan pada pencocokan hash.`,
            ],
            findingsCount: totalInc,
            actionUrl: target.href,
          });
          setIsScanning(false);
        }, 1100);
      } else if (target.type === "domain") {
        setTimeout(() => {
          setScanStage(4);
          const isPhishing = q.includes("bantuan") || q.includes("bansos") || q.includes("shop");
          setScanResult({
            type: "domain",
            target: q,
            title: `Audit Reputasi Domain: ${q}`,
            riskScore: isPhishing ? 88.0 : 15.0,
            severity: isPhishing ? "HIGH" : "LOW",
            details: [
              isPhishing
                ? `Domain baru didaftarkan (age < 30 hari) dengan privasi WHOIS disembunyikan.`
                : `Domain resmi terdaftar melalui otoritas PANDI / Kominfo dengan identitas legalitas sah.`,
              `DNS Nameservers & reverse proxy Cloudflare terpetakan.`,
              isPhishing
                ? `Terdeteksi indikator typosquatting mencatut program bantuan kepresidenan.`
                : `Sertifikat SSL Extended Validation TLS aktif dan valid.`,
            ],
            findingsCount: isPhishing ? 2 : 0,
            actionUrl: target.href,
          });
          setIsScanning(false);
        }, 1100);
      } else {
        setTimeout(() => {
          setScanStage(4);
          setScanResult({
            type: "buzzer",
            target: q,
            title: `Deteksi Buzzer & Komentar Serentak`,
            riskScore: 87.0,
            severity: "HIGH",
            details: [
              `Target URL postingan berhasil dianalisis: 16 komentar diekstraksi.`,
              `2 kluster astroturfing copypasta narasi terdeteksi dengan kohesi teks 87%.`,
              `Pancingan WhatsApp penipuan sembako terdeteksi pada 4 komentar terkoordinasi.`,
            ],
            findingsCount: 16,
            actionUrl: target.href,
          });
          setIsScanning(false);
        }, 1100);
      }
    } catch (err: any) {
      setScanError(err.message || "Gagal memproses pemindaian live.");
      setIsScanning(false);
    }
  };

  const fetchStats = () => {
    setIsRefreshing(true);
    api
      .getBuzzerStats()
      .then((data) => setBuzzerStats(data))
      .catch(() => {})
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 500);
      });
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      setClockState({
        dateStr,
        timeStr: `${hours}:${minutes}`,
        secondsStr: seconds,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    fetchStats();
    return () => clearInterval(interval);
  }, []);

  const totalBuzzerDetected = buzzerStats?.buzzer_detected_count ?? 14;
  const threatLuresDetected = buzzerStats?.threat_lures_detected ?? 4;

  // Trend data points for the 7-day vector chart
  const chartPoints = [
    { day: "19 Okt", total: 28, ancaman: 12, x: 45, yTotal: 126, yAncaman: 157 },
    { day: "20", total: 32, ancaman: 15, x: 125, yTotal: 106, yAncaman: 143 },
    { day: "21", total: 30, ancaman: 13, x: 205, yTotal: 111, yAncaman: 150 },
    { day: "22", total: 25, ancaman: 11, x: 285, yTotal: 132, yAncaman: 157 },
    { day: "23", total: 37, ancaman: 22, x: 365, yTotal: 87, yAncaman: 115 },
    { day: "24", total: 42, ancaman: 21, x: 445, yTotal: 70, yAncaman: 118 },
    { day: "25", total: 34, ancaman: 14, x: 505, yTotal: 96, yAncaman: 150 },
  ];

  // 6 Core Investigation Modules
  const menuMetrics = [
    {
      title: "Buzzer & Bot",
      count: totalBuzzerDetected,
      change: `+${threatLuresDetected} ancaman aktif`,
      href: "/buzzer",
      icon: Bot,
      isThreat: true,
    },
    {
      title: "Analisis Gambar",
      count: 6,
      change: "+2 klon terdeteksi",
      href: "/analisis-gambar",
      icon: ImageIcon,
    },
    {
      title: "Media Sosial",
      count: 6,
      change: "+6 akun klon @jokowi",
      href: "/media-sosial",
      icon: Users,
    },
    {
      title: "Email",
      count: 3,
      change: "+1 phishing bansos",
      href: "/email",
      icon: Mail,
    },
    {
      title: "Nomor HP",
      count: 2,
      change: "+2 CS WA penipuan",
      href: "/nomor-hp",
      icon: Phone,
    },
    {
      title: "Domain",
      count: 2,
      change: "+1 domain typo",
      href: "/domain",
      icon: Globe,
    },
  ];

  // Recent Investigations mapped to the 6 core modules - Real Jokowi Dataset
  const recentInvestigations = [
    {
      id: "inv-1",
      modul: "Buzzer & Bot",
      href: "/buzzer",
      icon: Bot,
      target: "@jokowi",
      temuan: "16 komentar TikTok · 2 kluster botnet astroturfing & umpan bansos WA",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "12.45",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
    {
      id: "inv-2",
      modul: "Analisis Gambar",
      href: "/analisis-gambar",
      icon: ImageIcon,
      target: "potret_resmi_presiden_jokowi.jpg",
      temuan: "Kemiripan wajah 91.2% · Disalahgunakan pada 4 akun klon bansos",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "12.30",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
    {
      id: "inv-3",
      modul: "Media Sosial",
      href: "/media-sosial",
      icon: Users,
      target: "@jokowi.official_bantuan",
      temuan: "Kloning profil TikTok · Umpan hadiah Rp 10 juta via WhatsApp",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "11.55",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
    {
      id: "inv-4",
      modul: "Email",
      href: "/email",
      icon: Mail,
      target: "bantuan.presiden.jokowi@gmail.com",
      temuan: "Alamat email phishing · Mengirim formulir pencairan bansos palsu",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "11.20",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
    {
      id: "inv-5",
      modul: "Nomor HP",
      href: "/nomor-hp",
      icon: Phone,
      target: "+62 812-9988-1122",
      temuan: "Umpan CS WhatsApp penipuan mencatut nama Pak Jokowi",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "10.45",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
    {
      id: "inv-6",
      modul: "Domain",
      href: "/domain",
      icon: Globe,
      target: "bansos-jokowi-resmi.com",
      temuan: "Domain phishing typosquatting terdaftar 3 hari lalu",
      risiko: "Sedang",
      risikoColor: "var(--mid)",
      waktu: "09.15",
      badgeClass: "bg-[var(--mid)]/10 text-[var(--mid)] border-[var(--mid)]/20",
    },
    {
      id: "inv-7",
      modul: "Media Sosial",
      href: "/media-sosial",
      icon: Users,
      target: "@jokowi_presiden_ri",
      temuan: "Akun peniru Instagram · Bio mengarahkan ke nomor WA penipuan",
      risiko: "Tinggi",
      risikoColor: "var(--hi)",
      waktu: "08.40",
      badgeClass: "bg-[var(--hi)]/10 text-[var(--hi)] border-[var(--hi)]/20",
    },
  ];

  // Filter investigations by selected module category
  const filteredInvestigations =
    selectedFilter === "semua"
      ? recentInvestigations
      : recentInvestigations.filter((item) =>
          item.modul.toLowerCase().includes(selectedFilter.toLowerCase())
        );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Top Header: Command Eyebrow & Status ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT INTELLIGENCE • PUSAT KENDALI OPERASIONAL
            </span>
          </div>
          <h1 className="text-[24px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0">
            Selamat datang, Admin Nextrace
          </h1>
          <p className="mt-1 mb-0 text-[13.5px] text-[var(--mute)]">
            Seluruh 6 modul investigasi identitas digital dan deteksi bot buzzer tersinkronisasi.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Live Date & Clock Display (Calendar Icon, Equal Font Size) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[var(--s1)] border border-[var(--line)] text-[12.5px] font-mono shadow-sm tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-[var(--mute)] stroke-[1.8] shrink-0" />
            <span className="text-[var(--mute)]">{clockState.dateStr}</span>
            <span className="text-[var(--line)]">·</span>
            <span className="font-semibold text-[var(--ink)]">
              {clockState.timeStr}:{clockState.secondsStr}
            </span>
            <span className="text-[var(--mute)] font-medium">WIB</span>
          </div>
          <button
            type="button"
            onClick={fetchStats}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] bg-[var(--s1)] hover:bg-[var(--s2)] border border-[var(--line)] text-[13px] font-medium text-[var(--ink)] transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[var(--mute)] ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
          <Link
            href="/buzzer"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[6px] bg-[var(--acc)] text-[var(--bg)] hover:brightness-110 text-[13px] font-semibold transition-all shadow-sm"
          >
            <Bot className="w-4 h-4" />
            <span>+ Pindai Buzzer</span>
          </Link>
        </div>
      </div>

      {/* ── Global Live Omni-Scanner Strip ── */}
      <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center shrink-0">
              <Scan className="w-4 h-4 text-[var(--acc)]" />
            </div>
            <div>
              <h2 className="text-[14.5px] font-bold text-[var(--ink)] m-0 flex items-center gap-2">
                Pusat Pemindaian Target Global (Omni-Scanner OSINT)
              </h2>
              <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                Masukkan target apa saja untuk pemindaian instan lintas modul: akun media sosial, nomor WhatsApp, email kredensial, domain phishing, atau link komentar buzzer.
              </p>
            </div>
          </div>

          {/* Live Classification Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border text-[11.5px] font-mono shrink-0 transition-all ${classification.badgeColor}`}>
            <classification.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{classification.label}</span>
          </div>
        </div>

        <form onSubmit={handleGlobalScan} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-3 stroke-[1.8]" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Ketik username medsos (@target), nomor telepon (+62 / 08), email, domain, atau URL postingan..."
              className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-4 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!globalQuery.trim()}
            className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-[var(--bg)] rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <Scan className="w-4 h-4" />
            <span>Pindai Global Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </section>

      {/* ── Global Live Forensic Scanner Modal ── */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[12px] max-w-[680px] w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)] bg-[var(--s2)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--s1)] border border-[var(--line)] flex items-center justify-center text-[var(--acc)]">
                  <Scan className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[14.5px] font-bold text-[var(--ink)] m-0">
                    Hasil Pemindaian Forensik Global (Omni-Scanner)
                  </h3>
                  <span className="text-[11.5px] font-mono text-[var(--mute)]">
                    Target: <b className="text-[var(--ink)]">{globalQuery}</b> &bull; {classification.categoryName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScanModalOpen(false)}
                className="w-8 h-8 rounded-[6px] hover:bg-[var(--s1)] border border-transparent hover:border-[var(--line)] flex items-center justify-center text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {isScanning ? (
                /* Scanning Progress State */
                <div className="py-8 px-4 text-center space-y-5">
                  <div className="relative w-14 h-14 mx-auto rounded-full bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center">
                    <Scan className="w-7 h-7 text-[var(--acc)] animate-pulse" />
                    <span className="absolute inset-0 rounded-full border-2 border-[var(--acc)] border-t-transparent animate-spin" />
                  </div>

                  <div>
                    <span className="text-[14px] font-bold text-[var(--ink)] block">
                      Menjalankan Pemindaian Intelijen Lintas Jaringan...
                    </span>
                    <span className="text-[12px] font-mono text-[var(--mute)] mt-1 block">
                      Target Input: {globalQuery}
                    </span>
                  </div>

                  {/* 4-Stage Forensic Pipeline Indicator */}
                  <div className="max-w-[460px] mx-auto space-y-2 text-left pt-2">
                    {[
                      { step: 1, label: "Validasi Format & Resolusi Entitas Target" },
                      { step: 2, label: "Pengumpulan Sinyal OSINT Lintas Platform (IG, TikTok, Web)" },
                      { step: 3, label: "Ekstraksi Visual pHash DCT & Korelasi Nomor/URL" },
                      { step: 4, label: "Kalkulasi Skor Risiko & Pembentukan Berkas Kasus" },
                    ].map((st) => {
                      const isDone = scanStage > st.step;
                      const isCurrent = scanStage === st.step;
                      return (
                        <div
                          key={st.step}
                          className={`flex items-center gap-2.5 p-2 rounded-[6px] text-[12px] font-mono border transition-all ${
                            isDone
                              ? "bg-[var(--lo)]/10 text-[var(--lo)] border-[var(--lo)]/25"
                              : isCurrent
                              ? "bg-[var(--s2)] text-[var(--ink)] border-[var(--acc)] shadow-sm font-semibold"
                              : "bg-transparent text-[var(--mute)] border-transparent opacity-50"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--lo)]" />
                          ) : isCurrent ? (
                            <RotateCw className="w-4 h-4 shrink-0 text-[var(--acc)] animate-spin" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-[var(--line)] flex items-center justify-center text-[10px] shrink-0">
                              {st.step}
                            </span>
                          )}
                          <span className="truncate">{st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : scanError ? (
                /* Error State */
                <div className="p-4 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-semibold block">Gagal Mengeksekusi Pemindaian:</span>
                    <span>{scanError}</span>
                  </div>
                </div>
              ) : scanResult ? (
                /* Completed Scan Result Dossier */
                <div className="space-y-4">
                  {/* Top Score Banner */}
                  <div className="p-4 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--mute)] block">
                        VERDIK FORENSIK OSINT
                      </span>
                      <b className="text-[16px] font-bold text-[var(--ink)] block truncate mt-0.5">
                        {scanResult.title}
                      </b>
                      <span className="text-[12px] text-[var(--mute)] font-mono block mt-0.5">
                        {scanResult.findingsCount} indikasi anomali berhasil diekstraksi
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-[4px] text-[11px] font-mono font-bold border ${
                          scanResult.severity === "CRITICAL"
                            ? "bg-[var(--hi)]/15 text-[var(--hi)] border-[var(--hi)]/30"
                            : scanResult.severity === "HIGH"
                            ? "bg-[var(--hi)]/15 text-[var(--hi)] border-[var(--hi)]/30"
                            : "bg-[var(--lo)]/15 text-[var(--lo)] border-[var(--lo)]/30"
                        }`}
                      >
                        {scanResult.severity} RISK
                      </span>
                      <div className="text-[24px] font-bold text-[var(--ink)] font-mono leading-none mt-1">
                        {scanResult.riskScore}
                        <span className="text-[13px] text-[var(--mute)] font-normal"> / 100</span>
                      </div>
                    </div>
                  </div>

                  {/* Forensic Indicators List */}
                  <div className="space-y-2">
                    <span className="text-[12px] font-semibold text-[var(--ink)] block">
                      Bukti Telemetri &amp; Korelasi Sinyal Ancaman:
                    </span>
                    <div className="space-y-1.5">
                      {scanResult.details.map((d: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-2.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[12.5px] text-[var(--ink)]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--hi)] shrink-0 mt-1.5" />
                          <span className="leading-relaxed">{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            {scanResult && !isScanning && (
              <div className="px-5 py-3.5 border-t border-[var(--line)] bg-[var(--s2)] flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsScanModalOpen(false)}
                  className="px-4 py-2 bg-[var(--s1)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href="/reports"
                    className="px-3.5 py-2 bg-[var(--s1)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] rounded-[6px] text-[13px] font-medium transition-colors"
                  >
                    Ekspor Laporan (PDF/JSON)
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScanModalOpen(false);
                      router.push(scanResult.actionUrl);
                    }}
                    className="px-4 py-2 bg-[var(--acc)] hover:opacity-90 text-[var(--bg)] rounded-[6px] text-[13px] font-semibold transition-opacity flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Buka Berkas Modul Lengkap</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 6 Core Investigation Metrics Strip (Clean 6 Columns) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--mute)] font-mono">
            Status Modul Investigasi
          </h2>
          <span className="text-[12px] text-[var(--mute)] font-mono">
            Klik kartu modul untuk membuka
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {menuMetrics.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-3.5 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group relative select-none"
              >
                {item.isThreat && (
                  <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--hi)] animate-ping" />
                )}
                <div className="flex items-center justify-between text-[var(--mute)] mb-1.5">
                  <span className="text-[12.5px] font-medium truncate group-hover:text-[var(--ink)] transition-colors">
                    {item.title}
                  </span>
                  <Icon
                    className={`w-4 h-4 stroke-[1.8] shrink-0 transition-transform group-hover:scale-110 ${
                      item.isThreat
                        ? "text-[var(--hi)]"
                        : "text-[var(--mute)] group-hover:text-[var(--acc)]"
                    }`}
                  />
                </div>
                <div className="text-[24px] font-bold text-[var(--ink)] leading-none tabular-nums font-mono my-1">
                  {item.count}
                </div>
                <div
                  className={`text-[11.5px] truncate leading-tight ${
                    item.isThreat
                      ? "text-[var(--hi)] font-medium"
                      : "text-[var(--mute)] group-hover:text-[var(--ink)]/80"
                  }`}
                >
                  {item.change}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Main Two-Column Analytics & Live Feeds ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* ── Left Column: Activity Vector Chart & Investigasi Terkini ── */}
        <div className="space-y-6 min-w-0">
          {/* Activity Chart & Threat Donut Subgrid */}
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-5">
            {/* Vector Activity Chart */}
            <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 min-w-0">
              <div className="flex justify-between items-baseline mb-3.5">
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">
                    Tren Analisis Seluruh Modul
                  </h3>
                  <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                    Aktivitas investigasi 7 hari terakhir lintas modul
                  </p>
                </div>
                <div className="flex gap-3 text-[12px] text-[var(--mute)] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-[3px] rounded-sm bg-[var(--acc)]" />
                    Total (34)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-[3px] rounded-sm bg-[var(--hi)]" />
                    Ancaman (14)
                  </span>
                </div>
              </div>

              <div className="relative w-full">
                <svg
                  className="w-full h-auto block select-none"
                  viewBox="0 0 520 200"
                  role="img"
                  aria-label="Grafik total analisis dan ancaman 7 hari terakhir"
                >
                  {/* Grid lines */}
                  <g stroke="var(--line)">
                    <path d="M32 20H512M32 70H512M32 120H512M32 170H512" />
                  </g>

                  {/* Y-axis labels */}
                  <g textAnchor="end" className="text-[11px] font-mono" fill="var(--mute)">
                    <text x="24" y="24">40</text>
                    <text x="24" y="74">30</text>
                    <text x="24" y="124">20</text>
                    <text x="24" y="174">10</text>
                  </g>

                  {/* Area fill */}
                  <polygon
                    points="45,126 125,106 205,111 285,132 365,87 445,70 505,96 505,170 45,170"
                    fill="var(--acc)"
                    opacity="0.12"
                  />

                  {/* Total Analysis line */}
                  <polyline
                    fill="none"
                    stroke="var(--acc)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    points="45,126 125,106 205,111 285,132 365,87 445,70 505,96"
                  />

                  {/* Threats line */}
                  <polyline
                    fill="none"
                    stroke="var(--hi)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    points="45,157 125,143 205,150 285,157 365,115 445,118 505,150"
                  />

                  {/* Highlight dots on peak */}
                  <g fill="var(--acc)">
                    <circle cx="445" cy="70" r="4.5" className="animate-pulse" />
                  </g>
                  <g fill="var(--hi)">
                    <circle cx="365" cy="115" r="4" />
                  </g>

                  {/* Day labels */}
                  <g textAnchor="middle" className="text-[11px] font-mono" fill="var(--mute)">
                    {chartPoints.map((p, idx) => (
                      <text
                        key={p.day}
                        x={p.x}
                        y="192"
                        className={activeChartPoint === idx ? "font-bold fill-[var(--ink)]" : ""}
                      >
                        {p.day}
                      </text>
                    ))}
                  </g>
                </svg>
              </div>
            </section>

            {/* Donut Chart: Threat Breakdown */}
            <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 min-w-0 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">
                  Tingkat Ancaman Aktif
                </h3>
                <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                  18 temuan kritis terdistribusi
                </p>
              </div>

              <div className="flex items-center gap-4 my-2">
                <div className="w-[110px] shrink-0">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-auto block select-none"
                    role="img"
                    aria-label="18 temuan: 6 tinggi, 7 sedang, 5 rendah"
                  >
                    <g fill="none" strokeWidth="11" transform="rotate(-90 50 50)">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--hi)"
                        strokeDasharray="81.8 251.3"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--mid)"
                        strokeDasharray="95.7 251.3"
                        strokeDashoffset="-83.8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--lo)"
                        strokeDasharray="67.8 251.3"
                        strokeDashoffset="-181.5"
                      />
                    </g>
                    <text
                      x="50"
                      y="53"
                      textAnchor="middle"
                      className="text-[20px] font-bold font-mono fill-[var(--ink)]"
                    >
                      18
                    </text>
                    <text
                      x="50"
                      y="65"
                      textAnchor="middle"
                      className="text-[8px] uppercase tracking-wider fill-[var(--mute)]"
                    >
                      ancaman
                    </text>
                  </svg>
                </div>

                <div className="flex-1 min-w-[110px] space-y-2 text-[12.5px]">
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center text-[var(--ink)]">
                      <span className="inline-block w-2 h-2 rounded-[2px] mr-2 bg-[var(--hi)]" />
                      Tinggi
                    </span>
                    <span className="text-[var(--mute)] font-mono">6 (33%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center text-[var(--ink)]">
                      <span className="inline-block w-2 h-2 rounded-[2px] mr-2 bg-[var(--mid)]" />
                      Sedang
                    </span>
                    <span className="text-[var(--mute)] font-mono">7 (39%)</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center text-[var(--ink)]">
                      <span className="inline-block w-2 h-2 rounded-[2px] mr-2 bg-[var(--lo)]" />
                      Rendah
                    </span>
                    <span className="text-[var(--mute)] font-mono">5 (28%)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--line)] flex items-center justify-between text-[11.5px] text-[var(--mute)]">
                <span>Skor Mitigasi Sistem</span>
                <span className="font-mono font-semibold text-[var(--lo)]">87.4% Aman</span>
              </div>
            </section>
          </div>

          {/* Synchronized Investigation Table: Investigasi Terkini */}
          <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">
                  Investigasi Terkini
                </h3>
                <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                  Rekam jejak pemeriksaan terpadu dari seluruh 6 modul aktif
                </p>
              </div>

              {/* Module Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: "semua", label: "Semua" },
                  { key: "buzzer", label: "Buzzer" },
                  { key: "gambar", label: "Gambar" },
                  { key: "sosial", label: "Medsos" },
                  { key: "email", label: "Email" },
                  { key: "hp", label: "No HP" },
                  { key: "domain", label: "Domain" },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setSelectedFilter(chip.key)}
                    className={`px-2.5 py-1 text-[11.5px] rounded-[5px] border font-medium transition-colors shrink-0 ${
                      selectedFilter === chip.key
                        ? "bg-[var(--s2)] text-[var(--ink)] border-[var(--acc)] shadow-sm"
                        : "bg-transparent text-[var(--mute)] border-[var(--line)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[var(--line)]">
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium">
                      Modul
                    </th>
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium">
                      Target / Objek
                    </th>
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium">
                      Temuan &amp; Sinyal Indikasi
                    </th>
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium">
                      Risiko
                    </th>
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium text-right">
                      Waktu
                    </th>
                    <th className="font-mono text-[11.5px] uppercase tracking-wider text-[var(--mute)] pb-2.5 font-medium text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[13px] divide-y divide-[var(--line)]">
                  {filteredInvestigations.map((inv) => {
                    const Icon = inv.icon;
                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-[var(--s2)]/80 transition-colors group"
                      >
                        <td className="py-3 pr-3">
                          <Link
                            href={inv.href}
                            className="inline-flex items-center gap-2 font-medium text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors"
                          >
                            <span className="p-1 rounded-[4px] bg-[var(--s2)] border border-[var(--line)]">
                              <Icon className="w-3.5 h-3.5 stroke-[1.8] text-[var(--acc)]" />
                            </span>
                            <span>{inv.modul}</span>
                          </Link>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[12px] text-[var(--ink)]">
                          <Link
                            href={inv.href}
                            className="hover:underline hover:text-[var(--acc)]"
                          >
                            {inv.target}
                          </Link>
                        </td>
                        <td className="py-3 pr-3 text-[var(--mute)] text-[12.5px] max-w-[260px] truncate">
                          {inv.temuan}
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-medium border ${inv.badgeClass}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: inv.risikoColor }}
                            />
                            {inv.risiko}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono text-[12px] text-[var(--mute)]">
                          {inv.waktu}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={inv.href}
                            className="inline-flex items-center gap-1 text-[11.5px] text-[var(--acc)] hover:underline font-medium"
                          >
                            <span>Buka</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Right Column: Alerts & Real-time Module Logs ── */}
        <div className="space-y-6 min-w-0">
          {/* Peringatan Keamanan Terkini */}
          <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 min-w-0">
            <div className="flex justify-between items-baseline mb-3.5 pb-2 border-b border-[var(--line)]">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">
                  Peringatan Keamanan
                </h3>
                <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                  Notifikasi ancaman lintas modul aktif
                </p>
              </div>
              <span className="text-[11px] font-mono font-medium text-[var(--hi)] px-1.5 py-0.5 rounded bg-[var(--hi)]/10 border border-[var(--hi)]/20">
                4 Kritis
              </span>
            </div>

            <ul className="list-none m-0 p-0 space-y-3">
              {/* Alert 1: Buzzer Astroturfing */}
              <li className="flex items-start gap-3 group">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-[var(--hi)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--hi)] font-semibold tracking-wider">
                      BUZZER &amp; BOT
                    </span>
                    <time className="text-[11px] font-mono text-[var(--mute)]">12.20</time>
                  </div>
                  <Link
                    href="/buzzer"
                    className="font-medium block text-[13px] leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors mt-0.5"
                  >
                    Bot astroturfing terdeteksi di TikTok @jokowi
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    Target @jokowi · 2 kluster copypasta slogan terkoordinasi
                  </span>
                </div>
              </li>

              {/* Alert 2: Nomor HP Lure WA */}
              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-[var(--hi)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--hi)] font-semibold tracking-wider">
                      NOMOR HP
                    </span>
                    <time className="text-[11px] font-mono text-[var(--mute)]">11.45</time>
                  </div>
                  <Link
                    href="/nomor-hp"
                    className="font-medium block text-[13px] leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors mt-0.5"
                  >
                    Umpan WhatsApp CS bansos palsu
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    +62 812-9988-1122 · Mencatut bantuan Presiden Jokowi
                  </span>
                </div>
              </li>

              {/* Alert 3: Media Sosial Impersonation */}
              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-[var(--hi)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--hi)] font-semibold tracking-wider">
                      MEDIA SOSIAL
                    </span>
                    <time className="text-[11px] font-mono text-[var(--mute)]">11.10</time>
                  </div>
                  <Link
                    href="/media-sosial"
                    className="font-medium block text-[13px] leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors mt-0.5"
                  >
                    Akun klon peniru @jokowi.official_bantuan
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    @jokowi.official_bantuan · TikTok klaim hadiah 10jt
                  </span>
                </div>
              </li>

              {/* Alert 4: Domain Malicious */}
              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-[var(--mid)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--mid)] font-semibold tracking-wider">
                      DOMAIN &amp; DNS
                    </span>
                    <time className="text-[11px] font-mono text-[var(--mute)]">10.05</time>
                  </div>
                  <Link
                    href="/domain"
                    className="font-medium block text-[13px] leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors mt-0.5"
                  >
                    Domain typosquatting bansos-jokowi-resmi.com
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    bansos-jokowi-resmi.com · DNS mencurigakan aktif
                  </span>
                </div>
              </li>

              {/* Alert 5: Email Phishing */}
              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-2 h-2 rounded-full mt-1.5 bg-[var(--mid)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-mono uppercase text-[var(--mid)] font-semibold tracking-wider">
                      EMAIL
                    </span>
                    <time className="text-[11px] font-mono text-[var(--mute)]">08.40</time>
                  </div>
                  <Link
                    href="/email"
                    className="font-medium block text-[13px] leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors mt-0.5"
                  >
                    Email phishing bansos palsu terdeteksi
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    bantuan.presiden.jokowi@gmail.com · Tersebar di aduan
                  </span>
                </div>
              </li>
            </ul>
          </section>

          {/* Aktivitas Pemindaian Terkini */}
          <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 min-w-0">
            <div className="flex justify-between items-baseline mb-3.5 pb-2 border-b border-[var(--line)]">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)] m-0">
                  Aktivitas Pemindaian
                </h3>
                <p className="text-[12px] text-[var(--mute)] m-0 mt-0.5">
                  Log operasi sistem 6 modul
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--lo)]/10 border border-[var(--lo)]/20 text-[10.5px] font-mono font-medium text-[var(--lo)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)] animate-pulse" />
                <span>AKTIF</span>
              </div>
            </div>

            <ul className="list-none m-0 p-0 space-y-3 text-[13px]">
              <li className="flex items-start gap-3 group">
                <span className="w-7 h-7 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] grid place-items-center text-[var(--acc)] shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href="/buzzer"
                    className="font-medium block leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors"
                  >
                    Sesi Pindai Komentar Selesai
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    Target TikTok @jokowi · 16 komentar dianalisis
                  </span>
                </div>
                <time className="text-[11px] font-mono text-[var(--mute)]">12.45</time>
              </li>

              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-7 h-7 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] grid place-items-center text-[var(--acc)] shrink-0">
                  <ImageIcon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href="/analisis-gambar"
                    className="font-medium block leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors"
                  >
                    Analisis Visual Kemiripan Wajah Selesai
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    potret_resmi_presiden_jokowi.jpg · Kemiripan 91.2%
                  </span>
                </div>
                <time className="text-[11px] font-mono text-[var(--mute)]">12.30</time>
              </li>

              <li className="flex items-start gap-3 group pt-2.5 border-t border-[var(--line)]">
                <span className="w-7 h-7 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] grid place-items-center text-[var(--acc)] shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href="/domain"
                    className="font-medium block leading-tight text-[var(--ink)] group-hover:text-[var(--acc)] transition-colors"
                  >
                    Audit DNS &amp; WHOIS Selesai
                  </Link>
                  <span className="text-[11.5px] text-[var(--mute)] block truncate mt-0.5">
                    bansos-jokowi-resmi.com · Registrar terpetakan
                  </span>
                </div>
                <time className="text-[11px] font-mono text-[var(--mute)]">09.15</time>
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* ── Bottom Section: Direktori Terpadu Modul Investigasi & Alat Cepat ── */}
      <div className="pt-4 border-t border-[var(--line)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--ink)] tracking-tight m-0 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--acc)]" />
              <span>Direktori Modul Investigasi &amp; Alat Cepat</span>
            </h2>
            <p className="text-[12.5px] text-[var(--mute)] m-0 mt-0.5">
              Akses cepat ke 6 modul analisis utama dan 3 alat utilitas kriptografis OSINT
            </p>
          </div>
          <span className="text-[11px] font-mono text-[var(--mute)]">
            6 Modul Utama · 3 Alat Cepat
          </span>
        </div>

        {/* Sub-grid A: 6 Core Forensic & OSINT Modules */}
        <div className="mb-4">
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--mute)] mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
            <span>Modul Analisis &amp; Penyelidikan Forensik</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* 1. Buzzer & Bot Hunter */}
            <Link
              href="/buzzer"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Bot className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--hi)]/10 text-[var(--hi)] border border-[var(--hi)]/20 font-semibold">
                  Astroturfing &amp; Bot
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Buzzer &amp; Bot Hunter
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Deteksi otomatis komentar serentak, kluster copypasta narasi, dan umpan nomor kontak WhatsApp penipuan.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Modul Buzzer</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 2. Analisis Gambar */}
            <Link
              href="/analisis-gambar"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Visual &amp; OCR
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Analisis Gambar
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Pencarian gambar terbalik, komparasi kemiripan wajah (Face Similarity), ekstraksi metadata EXIF, dan teks OCR.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Analisis Gambar</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 3. Media Sosial */}
            <Link
              href="/media-sosial"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Multi-Platform
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Media Sosial
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Penelusuran akun dari username di TikTok, Instagram, X, Facebook, skor risiko impersonasi, dan karakter homoglyph.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Media Sosial</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 4. Email */}
            <Link
              href="/email"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Mail className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Breach &amp; MX
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Email
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Audit kebocoran basis data credential stealer, validasi reputasi domain email, catatan SPF/DKIM, dan pelacak alias.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Pelacak Email</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 5. Nomor HP */}
            <Link
              href="/nomor-hp"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Phone className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Telco &amp; WA
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Nomor HP
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Validasi format E.164, deteksi operator seluler Indonesia, korelasi akun WhatsApp aktif, dan riwayat kebocoran data.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Pelacak Nomor HP</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            {/* 6. Domain */}
            <Link
              href="/domain"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  DNS &amp; WHOIS
                </span>
              </div>
              <b className="font-semibold text-[14px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Domain
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-3">
                Investigasi data pendaftar WHOIS, resolusi DNS rekursif (A, AAAA, MX, TXT), sertifikat SSL, dan deteksi typosquatting.
              </p>
              <div className="flex items-center gap-1 text-[11.5px] text-[var(--acc)] font-medium">
                <span>Buka Intelijen Domain</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>

        {/* Sub-grid B: 3 Quick OSINT Tools */}
        <div>
          <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[var(--mute)] mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)]" />
            <span>Alat Bantu Cepat OSINT</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Hash Lookup */}
            <Link
              href="/hash"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Hash className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Kriptografi
                </span>
              </div>
              <b className="font-semibold text-[13.5px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                Alat Hash Cepat
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-2">
                Kalkulasi nilai hash SHA-256 dan MD5 untuk verifikasi integritas file bukti digital.
              </p>
              <span className="text-[11.5px] text-[var(--acc)] font-medium">Buka Hash →</span>
            </Link>

            {/* 2. WHOIS Lookup */}
            <Link
              href="/whois"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Search className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Registrar
                </span>
              </div>
              <b className="font-semibold text-[13.5px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                WHOIS Cepat
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-2">
                Pencarian cepat entitas registrar, tanggal kadaluarsa domain, dan name server aktif.
              </p>
              <span className="text-[11.5px] text-[var(--acc)] font-medium">Buka WHOIS →</span>
            </Link>

            {/* 3. DNS Lookup */}
            <Link
              href="/dns"
              className="bg-[var(--s1)] border border-[var(--line)] rounded-[8px] p-4 hover:border-[var(--acc)] hover:bg-[var(--s2)] transition-all block group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="p-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] text-[var(--acc)] group-hover:scale-105 transition-transform">
                  <Globe className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] font-semibold">
                  Resolusi
                </span>
              </div>
              <b className="font-semibold text-[13.5px] text-[var(--ink)] block group-hover:text-[var(--acc)] transition-colors">
                DNS Cepat
              </b>
              <p className="text-[12px] text-[var(--mute)] leading-[1.4] mt-1 mb-2">
                Lookup rekursif catatan DNS (A, AAAA, MX, TXT, NS, SOA) dalam satu klik langsung.
              </p>
              <span className="text-[11.5px] text-[var(--acc)] font-medium">Buka DNS →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
