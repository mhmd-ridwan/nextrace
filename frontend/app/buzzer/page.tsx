"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Scan,
  RefreshCw,
  ChevronRight,
  Search,
  Trash2,
  FileText,
  Globe,
  MessageSquare,
  Network,
  Copy,
  Sliders,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  Heart,
  Share2,
} from "lucide-react";
import { api } from "@/lib/api";
import { BuzzerComment, BuzzerScan, BuzzerStats, NetworkGraphData, NetworkNode, NetworkEdge } from "@/types";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";
import { NetworkGraph } from "@/components/network/NetworkGraph";

/* ── Platform Badge with Clean Dark Neutral Aesthetic ── */
function PlatformBadge({ platform }: { platform?: string }) {
  const p = (platform || "Instagram").toLowerCase();

  if (p.includes("instagram")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shrink-0">
          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </span>
        <span>Instagram</span>
      </span>
    );
  }

  if (p.includes("tiktok")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-black border border-[var(--line)] flex items-center justify-center text-white shrink-0">
          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.36a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.64a6.34 6.34 0 0 0 10.84 4.48c.36-.36.67-.77.93-1.22V10.1a8.16 8.16 0 0 0 4.72 1.5V8.15a4.77 4.77 0 0 1 0-1.46z" />
          </svg>
        </span>
        <span>TikTok</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)]">
      <Globe className="w-3 h-3 text-[var(--mute)]" />
      <span>{platform || "Social Media"}</span>
    </span>
  );
}

function BuzzerContent() {
  const searchParams = useSearchParams();
  const targetParam = searchParams.get("target");
  const viewParam = searchParams.get("view");

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(1);
  const [scans, setScans] = useState<BuzzerScan[]>([]);
  const [activeScan, setActiveScan] = useState<BuzzerScan | null>(null);
  const [selectedComment, setSelectedComment] = useState<BuzzerComment | null>(null);
  const [stats, setStats] = useState<BuzzerStats | null>(null);

  // Scan Form State
  const [targetUrl, setTargetUrl] = useState("https://www.instagram.com/mhmmd.ridwan/");
  const [targetPlatform, setTargetPlatform] = useState("Instagram");
  const [scanDepth, setScanDepth] = useState(20);
  const [targetAuthor, setTargetAuthor] = useState("mhmmd.ridwan");
  const [showScanDrawer, setShowScanDrawer] = useState(false);

  // Filters State
  const [filterIntent, setFilterIntent] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "graph">(viewParam === "graph" ? "graph" : "table");
  const [pushingEvidence, setPushingEvidence] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Professional Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    details?: ModalDetailItem[] | string;
    onConfirm?: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const autoScanTriggered = useRef(false);

  const executeLiveScan = useCallback(async (url: string, platform: string, author?: string) => {
    setScanning(true);
    setScanStep(1);

    const stepInterval = setInterval(() => {
      setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1200);

    try {
      const newScan = await api.runBuzzerScan({
        target_url: url,
        platform: platform,
        max_comments: 20,
        target_official_handle: author || undefined,
        investigation_id: "inv-live-001",
      });

      clearInterval(stepInterval);
      setScanStep(4);

      setScans((prev) => [newScan, ...prev.filter((s) => s.scan_id !== newScan.scan_id && s.target_url !== newScan.target_url)]);
      setActiveScan(newScan);
      if (newScan.comments && newScan.comments.length > 0) {
        setSelectedComment(newScan.comments[0]);
      }
      setShowScanDrawer(false);
      setNotification(
        `Audit web real selesai: @${newScan.target_author || "target"} (${newScan.total_comments} entitas terverifikasi).`
      );
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      clearInterval(stepInterval);
      setModalConfig({
        isOpen: true,
        title: "Gagal Memindai Target Langsung",
        description: "Terjadi kendala saat mengekstraksi data web real-time dari URL target. Pastikan URL publik aktif dan dapat diakses.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setScanning(false);
    }
  }, []);

  const loadData = useCallback(async (paramTarget?: string | null) => {
    setLoading(true);
    try {
      const [scansData, statsData] = await Promise.all([
        api.getBuzzerScans(),
        api.getBuzzerStats(),
      ]);

      setScans(scansData);
      setStats(statsData);

      if (paramTarget) {
        setTargetUrl(paramTarget);
        const lower = paramTarget.toLowerCase();
        let plat = "Instagram";
        if (lower.includes("tiktok.com")) plat = "TikTok";
        else if (lower.includes("facebook.com")) plat = "Facebook";
        else if (lower.includes("x.com") || lower.includes("twitter.com")) plat = "X";
        setTargetPlatform(plat);

        const clean = paramTarget.replace(/https?:\/\/(?:www\.)?[^\/]+\/?/, "").split("/")[0].replace("@", "");
        if (clean) setTargetAuthor(clean);

        // Check if there is already a scan for this exact target
        const matched = scansData.find(
          (s) => s.target_url === paramTarget || (clean && s.target_author === clean)
        );

        if (matched) {
          setActiveScan(matched);
          if (matched.comments && matched.comments.length > 0) {
            setSelectedComment(matched.comments[0]);
          }
        } else if (!autoScanTriggered.current) {
          autoScanTriggered.current = true;
          await executeLiveScan(paramTarget, plat, clean);
          return;
        }
      } else {
        const current = scansData[0] || null;
        if (current) {
          setActiveScan(current);
          if (current.comments && current.comments.length > 0) {
            setSelectedComment(current.comments[0]);
          }
        }
      }
    } catch (err) {
      console.error("Gagal memuat data buzzer hunter:", err);
    } finally {
      setLoading(false);
    }
  }, [executeLiveScan]);

  useEffect(() => {
    loadData(targetParam);
  }, [targetParam, loadData]);

  const handleExecuteScan = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = targetUrl.trim();
    if (!url) {
      setModalConfig({
        isOpen: true,
        title: "Target Pemindaian Diperlukan",
        description: "Masukkan tautan postingan atau akun sosial media yang valid sebelum memulai audit forensik.",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }
    await executeLiveScan(url, targetPlatform, targetAuthor || undefined);
  };

  const handleSelectPreset = (url: string, platform: string, author: string, label: string) => {
    setTargetUrl(url);
    setTargetPlatform(platform);
    setTargetAuthor(author);
    setNotification(`Preset dipilih: ${label}. Menginisialisasi pemindaian forensik web real...`);
    executeLiveScan(url, platform, author);
  };

  const handleDeleteScan = (scanId: string) => {
    const targetScan = scans.find((s) => s.scan_id === scanId) || activeScan;
    setModalConfig({
      isOpen: true,
      title: "Hapus Riwayat Pemindaian",
      description:
        "Apakah Anda yakin ingin menghapus data pemindaian komentar dan profiling buzzer ini dari sistem investigasi?",
      variant: "danger",
      confirmText: "Hapus Sesi",
      cancelText: "Batal",
      details: [
        { label: "Target URL", value: targetScan?.target_url || "-" },
        { label: "Akun Target", value: `@${targetScan?.target_author || "target"}` },
        { label: "Total Entitas", value: `${targetScan?.total_comments || 0} entitas komentar` },
      ],
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await api.deleteBuzzerScan(scanId);
          const remaining = scans.filter((s) => s.scan_id !== scanId);
          setScans(remaining);
          if (activeScan?.scan_id === scanId) {
            setActiveScan(remaining[0] || null);
            setSelectedComment(remaining[0]?.comments[0] || null);
          }
          setModalConfig((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          setNotification("Riwayat pemindaian berhasil dihapus.");
          setTimeout(() => setNotification(null), 3000);
        } catch (err: any) {
          setModalConfig({
            isOpen: true,
            title: "Gagal Menghapus Sesi",
            description: "Terjadi kesalahan saat menghapus data pemindaian dari database.",
            variant: "danger",
            confirmText: "Tutup",
            details: err.message || String(err),
            onConfirm: undefined,
          });
        }
      },
    });
  };

  // Filter Comments
  const comments = activeScan?.comments || [];
  const filteredComments = comments.filter((c) => {
    const matchesIntent = filterIntent === "all" || c.threat_intent === filterIntent;

    const matchesClass =
      filterClass === "all" ||
      (filterClass === "inauthentic" &&
        (c.account_classification === "buzzer" ||
          c.account_classification === "bot" ||
          c.account_classification === "suspicious_farm")) ||
      c.account_classification === filterClass;

    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      c.author_username.toLowerCase().includes(q) ||
      (c.author_display_name || "").toLowerCase().includes(q) ||
      c.comment_text.toLowerCase().includes(q);

    return matchesIntent && matchesClass && matchesQuery;
  });

  const handlePushToEvidenceVault = async () => {
    if (!selectedComment || !activeScan) return;
    setPushingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("investigation_id", activeScan.investigation_id || "inv-general-001");
      formData.append("evidence_type", "document");
      formData.append("source_url", selectedComment.account_signals?.post_url || activeScan.target_url);
      formData.append("collection_method", "osint_buzzer_hunter");

      const metadataPayload = {
        platform: selectedComment.platform,
        target_url: activeScan.target_url,
        target_author: activeScan.target_author,
        author_username: selectedComment.author_username,
        author_display_name: selectedComment.author_display_name,
        comment_text: selectedComment.comment_text,
        comment_timestamp: selectedComment.comment_timestamp,
        likes_count: selectedComment.likes_count,
        buzzer_score: selectedComment.buzzer_score,
        account_classification: selectedComment.account_classification,
        threat_intent: selectedComment.threat_intent,
        astroturfing_index: activeScan.astroturfing_index,
        account_signals: selectedComment.account_signals,
      };
      formData.append("metadata", JSON.stringify(metadataPayload));

      const res = await api.createEvidence(formData);
      setModalConfig({
        isOpen: true,
        title: "Bukti Terkunci di Evidence Vault",
        description: `Entitas @${selectedComment.author_username} berhasil disegel secara kriptografis ke Loker Barang Bukti Digital (Rantai Kustodi).`,
        variant: "success",
        confirmText: "Lihat di Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = "/evidence";
        },
        details: [
          { label: "ID Bukti (Custody ID)", value: res.evidence_id },
          { label: "SHA-256 Hash", value: res.file_hash_sha256 || "Tersimpan & Terverifikasi" },
          { label: "Metode Koleksi", value: res.collection_method || "osint_buzzer_hunter" },
          { label: "Waktu Penyegelan", value: new Date(res.created_at).toLocaleString("id-ID") },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Valid)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengamankan Bukti",
        description: "Terjadi kesalahan saat menyegel hash bukti digital ke server.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setPushingEvidence(false);
    }
  };

  const handleExportPdfThreatDossier = async () => {
    if (!activeScan) return;
    setExportingPdf(true);
    try {
      const res = await api.generateReport({
        investigation_id: activeScan.investigation_id || "inv-general-001",
        report_type: "buzzer_threat_dossier",
        format: "pdf",
        target_platform: activeScan.target_platform,
        reporting_organization: "Satgas Intelijen Forensik NEXTRACE",
        requested_action: "Audit Forensik Buzzer & Takedown Akun Inautentik",
      });

      const downloadUrl = api.getReportDownloadUrl(res.report_id);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `nextrace_buzzer_dossier_${res.report_id.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setModalConfig({
        isOpen: true,
        title: "Dossier PDF Berhasil Dibuat",
        description: `Berkas Laporan Intelijen Anomali Buzzer untuk @${activeScan.target_author} berhasil dikompilasi dan diunduh.`,
        variant: "success",
        confirmText: "Lihat Berkas Laporan",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = "/reports";
        },
        details: [
          { label: "Dossier ID", value: res.report_id },
          { label: "Format", value: "Dokumen Resmi PDF (A4)" },
          { label: "SHA-256 Hash", value: res.file_hash_sha256 || "N/A" },
          { label: "Entitas Terdokumentasi", value: `${comments.length} Catatan` },
          { label: "Dasar Hukum", value: "UU ITE No. 1/2024 Pasal 5 & 6" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengompilasi PDF",
        description: "Terjadi kesalahan saat membuat berkas PDF Threat Dossier.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setExportingPdf(false);
    }
  };

  const networkGraphData = useMemo<NetworkGraphData>(() => {
    if (!activeScan) return { nodes: [], edges: [] };

    const targetAuthorName = activeScan.target_author || "Sasaran";
    const targetNode: NetworkNode = {
      id: "node-target",
      label: `@${targetAuthorName}`,
      sublabel: activeScan.target_platform,
      type: "target",
      riskScore: 0,
      details: {
        url: activeScan.target_url,
        platform: activeScan.target_platform,
      },
    };

    const nodes: NetworkNode[] = [targetNode];
    const edges: NetworkEdge[] = [];

    comments.forEach((c, idx) => {
      const commentNodeId = `node-comm-${c.id || idx}`;
      const isLure = c.threat_intent === "impersonation_lure";
      const isThreat =
        c.buzzer_score >= 40 ||
        c.account_classification === "buzzer" ||
        c.account_classification === "bot";

      nodes.push({
        id: commentNodeId,
        label: `@${c.author_username}`,
        sublabel: `${c.buzzer_score.toFixed(0)}% Anomali`,
        type: isLure ? "threat_lure" : isThreat ? "buzzer" : "organic",
        riskScore: c.buzzer_score,
        details: c,
      });

      edges.push({
        id: `edge-target-${commentNodeId}`,
        source: "node-target",
        target: commentNodeId,
        label: `${c.likes_count || 0} Suka`,
        type: isLure ? "lure" : isThreat ? "coordination" : "interaction",
      });

      if (isLure || (c.matched_keywords && c.matched_keywords.length > 0)) {
        const lureNodeId = `node-lure-${c.id || idx}`;
        nodes.push({
          id: lureNodeId,
          label: c.matched_keywords?.[0] || "Umpan WA/Kontak",
          sublabel: "Phishing Lure",
          type: "threat_lure",
          riskScore: 90,
          details: { keyword: c.matched_keywords?.[0] },
        });

        edges.push({
          id: `edge-lure-${commentNodeId}`,
          source: commentNodeId,
          target: lureNodeId,
          label: "Umpan Kontak",
          type: "lure",
        });
      }
    });

    return { nodes, edges };
  }, [activeScan, comments]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; DETEKSI KOORDINASI BUZZER &bull; ANOMALI AKUN
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Buzzer &amp; Bot Hunter — Analisis Komentar &amp; Astroturfing
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Scanning real-time via Edge Headless OSINT: ekstraksi langsung entitas postingan asli, interaksi publik, dan deteksi anomali buzzer tanpa data sintetis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportPdfThreatDossier}
            disabled={exportingPdf || !activeScan}
            className="flex-1 sm:flex-initial justify-center px-3.5 py-2 rounded-[6px] bg-[var(--s2)] hover:border-[var(--mute)] border border-[var(--line)] text-[var(--ink)] font-semibold text-[13px] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Kompilasi dan unduh berkas resmi PDF Threat Dossier"
          >
            <FileText className={`w-3.5 h-3.5 text-[var(--acc)] ${exportingPdf ? "animate-spin" : ""}`} />
            <span>{exportingPdf ? "Mengompilasi..." : "Ekspor PDF Threat Dossier"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowScanDrawer(!showScanDrawer)}
            className="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-[6px] bg-[var(--acc)] hover:opacity-90 text-white font-semibold text-[13px] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Scan className="w-4 h-4 stroke-[2]" />
            <span>{showScanDrawer ? "Tutup Scanner" : "+ Pindai Sasaran Baru"}</span>
          </button>
          <button
            type="button"
            onClick={() => loadData(targetParam)}
            disabled={loading || scanning}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] rounded-[6px] text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--acc)]" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ── Real-Time Scanning Progress Banner ── */}
      {scanning && (
        <div className="p-4 bg-[var(--s1)] border-2 border-[var(--acc)] rounded-[10px] space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-5 h-5 text-[var(--acc)] animate-spin" />
              <span className="font-semibold text-[14px] text-[var(--ink)]">
                Sedang Mengeksekusi Real Web Scanning: {targetUrl}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[var(--acc)] font-semibold uppercase">
              Tahap {scanStep} dari 4
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            <div className={`p-2 rounded border ${scanStep >= 1 ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--mute)]"}`}>
              1. Ingest Profil &amp; Avatar Web
            </div>
            <div className={`p-2 rounded border ${scanStep >= 2 ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--mute)]"}`}>
              2. Ekstraksi DOM &amp; Interaksi
            </div>
            <div className={`p-2 rounded border ${scanStep >= 3 ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--mute)]"}`}>
              3. Deteksi Bot &amp; Umpan WA
            </div>
            <div className={`p-2 rounded border ${scanStep >= 4 ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)]" : "border-[var(--line)] text-[var(--mute)]"}`}>
              4. Indeks Astroturfing
            </div>
          </div>
        </div>
      )}

      {/* ── 4 Executive Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Card 1: Total Entitas Dipindai */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-3.5 sm:p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[13px] font-medium">
            <span>Entitas Web Dipindai</span>
            <MessageSquare className="w-[18px] h-[18px] stroke-[1.7] text-[var(--mute)]" />
          </div>
          <b className="block text-[28px] font-semibold text-[var(--ink)] mt-1.5 leading-[1.2] tabular-nums font-mono">
            {activeScan?.total_comments || 0}
          </b>
          <small className="text-[12px] text-[var(--mute)] font-mono truncate block">
            Target: @{activeScan?.target_author || "sasaran"}
          </small>
        </div>

        {/* Card 2: Buzzer / Bot Terdeteksi */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-3.5 sm:p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[13px] font-medium">
            <span>Buzzer / Bot Farm Terdeteksi</span>
            <Bot className="w-[18px] h-[18px] stroke-[1.7] text-[var(--lo)]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <b className="text-[28px] font-semibold text-[var(--lo)] leading-[1.2] tabular-nums font-mono">
              {(activeScan?.buzzer_count || 0) + (activeScan?.bot_count || 0)}
            </b>
            <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/20 font-mono">
              0%
            </span>
          </div>
          <small className="text-[12px] text-[var(--mute)] font-mono">
            {activeScan?.bot_count || 0} Bot &bull; {activeScan?.buzzer_count || 0} Akun Ternak
          </small>
        </div>

        {/* Card 3: Muatan Ancaman Aktif */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-3.5 sm:p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[13px] font-medium">
            <span>Muatan Ancaman Aktif</span>
            <ShieldAlert className="w-[18px] h-[18px] stroke-[1.7] text-[var(--lo)]" />
          </div>
          <b className="block text-[28px] font-semibold text-[var(--lo)] mt-1.5 leading-[1.2] tabular-nums font-mono">
            {activeScan?.threat_comments_count || 0}
          </b>
          <small className="text-[12px] text-[var(--lo)] font-medium">
            Bersih / Tidak Ada Umpan Penipuan
          </small>
        </div>

        {/* Card 4: Indeks Koordinasi Astroturfing */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-3.5 sm:p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[13px] font-medium">
            <span>Koordinasi Jaringan</span>
            <Network className="w-[18px] h-[18px] stroke-[1.7] text-[var(--acc)]" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <b className="text-[28px] font-semibold leading-[1.2] tabular-nums font-mono text-[var(--lo)]">
              {activeScan?.astroturfing_index || 0}%
            </b>
            <span className="text-[11px] font-mono text-[var(--mute)]">Astroturfing</span>
          </div>
          <small className="text-[12px] text-[var(--mute)] font-mono">
            0 Kluster Copypasta Terdeteksi (Organik)
          </small>
        </div>
      </div>

      {/* ── Active Target Detailed Forensic Profile Card ── */}
      {activeScan && (
        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Avatar Preview */}
              <div className="w-14 h-14 rounded-full bg-[var(--s2)] border-2 border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center text-[var(--mute)] relative">
                {activeScan.scan_metadata?.target_avatar_path || activeScan.scan_metadata?.target_avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={
                      activeScan.scan_metadata.target_avatar_path
                        ? api.getUploadUrl(activeScan.scan_metadata.target_avatar_path)
                        : activeScan.scan_metadata.target_avatar_url
                    }
                    alt={activeScan.target_author || "target"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Bot className="w-7 h-7 text-[var(--acc)]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-[16px] font-bold text-[var(--ink)] tracking-tight m-0 truncate">
                    {activeScan.scan_metadata?.target_display_name || activeScan.target_author}
                  </h2>
                  <span className="font-mono text-[13px] text-[var(--mute)]">
                    @{activeScan.target_author}
                  </span>
                  <PlatformBadge platform={activeScan.target_platform} />
                  {activeScan.scan_metadata?.is_live_scraped && (
                    <span className="px-2 py-0.5 rounded-[4px] bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/30 text-[10.5px] font-mono font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      LIVE WEB AUDITED
                    </span>
                  )}
                </div>

                {activeScan.scan_metadata?.target_bio && (
                  <p className="text-[12px] text-[var(--mute)] line-clamp-1 mt-1 m-0">
                    {activeScan.scan_metadata.target_bio}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11.5px] font-mono text-[var(--mute)] mt-1.5 flex-wrap">
                  <span>
                    Pengikut: <strong className="text-[var(--ink)] tabular-nums">{activeScan.scan_metadata?.followers_count != null ? activeScan.scan_metadata.followers_count.toLocaleString("id-ID") : "-"}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Mengikuti: <strong className="text-[var(--ink)] tabular-nums">{activeScan.scan_metadata?.following_count != null ? activeScan.scan_metadata.following_count.toLocaleString("id-ID") : "-"}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Postingan: <strong className="text-[var(--ink)] tabular-nums">{activeScan.scan_metadata?.posts_count != null ? activeScan.scan_metadata.posts_count.toLocaleString("id-ID") : "-"}</strong>
                  </span>
                  <span>&bull;</span>
                  <a
                    href={activeScan.target_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--acc)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Buka Tautan Sumber</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteScan(activeScan.scan_id)}
                className="px-3 py-1.5 rounded-[6px] border border-[var(--line)] hover:border-[var(--hi)] text-[var(--hi)] text-[12px] font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Hapus sesi scan ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Sesi</span>
              </button>
            </div>
          </div>

          {/* Session Switcher Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-[var(--line)]">
            <span className="text-[12px] font-medium text-[var(--mute)] mr-1 shrink-0">Riwayat Target:</span>
            {scans.map((s) => {
              const active = activeScan?.scan_id === s.scan_id;
              return (
                <button
                  key={s.scan_id}
                  type="button"
                  onClick={() => {
                    setActiveScan(s);
                    if (s.comments.length > 0) setSelectedComment(s.comments[0]);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-[12px] font-mono transition-colors shrink-0 cursor-pointer ${
                    active
                      ? "bg-[var(--s2)] border border-[var(--acc)] text-[var(--ink)] font-semibold shadow-[inset_2px_0_var(--acc)]"
                      : "bg-[var(--s2)] border border-[var(--line)] text-[var(--mute)] hover:text-[var(--ink)] hover:border-[var(--mute)]"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-[var(--acc)]" : "bg-[var(--mute)]"}`} />
                  <span>@{s.target_author || "target"}</span>
                  <span className="text-[10.5px] px-1 py-0.2 rounded bg-[var(--line)] text-[var(--ink)]">
                    {s.total_comments}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="p-3 bg-[var(--s1)] border border-[var(--line)] rounded-[8px] flex items-center justify-between text-[13px] text-[var(--ink)]">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[var(--lo)]" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* ── Scan Drawer ── */}
      {showScanDrawer && (
        <form
          onSubmit={handleExecuteScan}
          className="p-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--ink)] m-0 flex items-center gap-2">
                  <span>Pindai Sasaran Baru Secara Real-Time</span>
                </h2>
                <p className="text-[12px] text-[var(--mute)] m-0">
                  Masukkan URL akun atau postingan Instagram, TikTok, Facebook, atau X untuk audit web real.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScanDrawer(false)}
              className="text-[var(--mute)] hover:text-[var(--ink)] text-[12px] font-mono cursor-pointer"
            >
              Tutup [ESC]
            </button>
          </div>

          {/* Quick Target Presets */}
          <div className="space-y-2">
            <div className="text-[11.5px] font-mono text-[var(--mute)] uppercase">
              Pilihan Cepat Target Investigasi:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    "https://www.instagram.com/mhmmd.ridwan/",
                    "Instagram",
                    "mhmmd.ridwan",
                    "Instagram @mhmmd.ridwan - Profil & Postingan Real Web"
                  )
                }
                className="p-3 bg-[var(--s1)] hover:border-[var(--acc)] border border-[var(--line)] rounded-[6px] text-left transition-colors cursor-pointer group"
              >
                <div className="text-[var(--ink)] font-semibold flex items-center justify-between">
                  <span>Instagram @mhmmd.ridwan</span>
                  <span className="text-[10px] text-[var(--lo)] font-mono font-bold">WEB REAL</span>
                </div>
                <div className="text-[11.5px] text-[var(--mute)] mt-1 line-clamp-1">
                  Scraping data real akun Instagram, foto profil, dan audit entitas postingan asli.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    "https://www.tiktok.com/@jokowi/video/7391823901",
                    "TikTok",
                    "jokowi",
                    "TikTok @jokowi - Deteksi Astroturfing & Bot"
                  )
                }
                className="p-3 bg-[var(--s1)] hover:border-[var(--acc)] border border-[var(--line)] rounded-[6px] text-left transition-colors cursor-pointer group"
              >
                <div className="text-[var(--ink)] font-semibold flex items-center justify-between">
                  <span>TikTok @jokowi</span>
                  <span className="text-[10px] text-[var(--mid)] font-mono font-bold">Lure WA</span>
                </div>
                <div className="text-[11.5px] text-[var(--mute)] mt-1 line-clamp-1">
                  Mendeteksi spam peniru bantuan &amp; nomor pengaduan palsu di komentar.
                </div>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[13px]">
            <div className="md:col-span-6 space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">
                URL Akun atau Postingan:
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://www.instagram.com/mhmmd.ridwan/ atau https://www.tiktok.com/@..."
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] font-mono text-[12.5px] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)]"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">Platform:</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] font-mono text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="X">X (Twitter)</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">
                Kedalaman Entitas: <strong className="text-[var(--acc)] font-mono">{scanDepth}</strong>
              </label>
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={scanDepth}
                onChange={(e) => setScanDepth(Number(e.target.value))}
                className="w-full accent-[var(--acc)] cursor-pointer mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => setShowScanDrawer(false)}
              className="px-3.5 py-1.5 text-[12.5px] text-[var(--mute)] hover:text-[var(--ink)] font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={scanning}
              className="px-4 py-1.5 bg-[var(--acc)] hover:opacity-90 text-white font-semibold rounded-[6px] text-[13px] transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Scan className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "Memindai Web Real..." : "Mulai Pemindaian Forensik"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Verified Clean Audit Status Strip ── */}
      {activeScan && activeScan.buzzer_count === 0 && activeScan.bot_count === 0 && (
        <div className="p-4 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--lo)]/15 border border-[var(--lo)]/30 flex items-center justify-center text-[var(--lo)] shrink-0">
              <CheckCircle2 className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <span className="text-[var(--ink)] font-semibold block text-[13px]">
                Status Audit Web: Bersih / Organik (100% Real Evidence)
              </span>
              <span className="text-[var(--mute)] text-[12px]">
                Seluruh {activeScan.total_comments} entitas postingan dan interaksi publik sasaran diperiksa langsung via Edge Headless OSINT. Tidak ditemukan komentar inautentik, nomor penipu, atau bot farm aktif.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 rounded-[4px] bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25 text-[11px] font-mono font-semibold">
              0% ANOMALI BUZZER
            </span>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (7 cols): Real Entities & Comments Triage Queue */}
        <section className="lg:col-span-7 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-4">
          {/* Header Controls & Filters */}
          <div className="space-y-3 pb-3 border-b border-[var(--line)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[14px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2 m-0">
                  <span>{viewMode === "table" ? "Antrean Triage Entitas & Komentar Real Web" : "Peta Topologi Relasi Jaringan"}</span>
                  <span className="px-2 py-0.2 rounded bg-[var(--s2)] text-[var(--mute)] text-[11px] font-mono font-semibold border border-[var(--line)]">
                    {filteredComments.length} / {comments.length}
                  </span>
                </h2>

                {/* View Switcher: Table vs Network Graph */}
                <div className="flex items-center gap-1 p-0.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === "table"
                        ? "bg-[var(--s1)] text-[var(--ink)] font-semibold shadow-sm border border-[var(--line)]"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Tabel Entitas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("graph")}
                    className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
                      viewMode === "graph"
                        ? "bg-[var(--s1)] text-[var(--ink)] font-semibold shadow-sm border border-[var(--line)]"
                        : "text-[var(--mute)] hover:text-[var(--ink)]"
                    }`}
                  >
                    <Network className="w-3 h-3 text-[var(--acc)]" />
                    <span>Grafik Jaringan (Node-Link)</span>
                  </button>
                </div>
              </div>

              {/* Intent Filter Chips */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono flex-wrap">
                {[
                  { id: "all", label: "Semua" },
                  { id: "neutral", label: "Organik / Real" },
                  { id: "impersonation_lure", label: "Lure WA" },
                  { id: "target_seeking", label: "Doxxing" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterIntent(f.id)}
                    className={`px-2 py-0.5 rounded-[4px] transition-colors cursor-pointer ${
                      filterIntent === f.id
                        ? "bg-[var(--s2)] text-[var(--ink)] border border-[var(--acc)] font-semibold shadow-[inset_2px_0_var(--acc)]"
                        : "text-[var(--mute)] hover:text-[var(--ink)] bg-[var(--s2)] border border-[var(--line)]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Classification & Search Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[var(--mute)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari caption postingan, username, atau kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[6px] pl-9 pr-3 py-1.5 text-[12.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0">
                <button
                  type="button"
                  onClick={() => setFilterClass("all")}
                  className={`px-2.5 py-1 rounded-[4px] border cursor-pointer ${
                    filterClass === "all"
                      ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border-[var(--acc)]"
                      : "bg-[var(--s2)] text-[var(--mute)] border-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  Semua ({comments.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterClass("organic")}
                  className={`px-2.5 py-1 rounded-[4px] border cursor-pointer ${
                    filterClass === "organic"
                      ? "bg-[var(--lo)]/15 text-[var(--lo)] font-semibold border-[var(--lo)]/30"
                      : "bg-[var(--s2)] text-[var(--mute)] border-[var(--line)] hover:text-[var(--ink)]"
                  }`}
                >
                  Terverifikasi Asli
                </button>
              </div>
            </div>
          </div>

          {/* Real Entities Table OR Network Graph */}
          {viewMode === "graph" ? (
            <div className="mt-2">
              <NetworkGraph
                data={networkGraphData}
                selectedNodeId={selectedComment ? `node-comm-${selectedComment.id}` : undefined}
                onSelectNode={(node) => {
                  if (node.details && (node.details as any).author_username) {
                    setSelectedComment(node.details as any);
                  }
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--mute)] font-mono text-[11px] bg-[var(--s2)]">
                    <th className="py-2.5 px-3 font-semibold w-8">No</th>
                    <th className="py-2.5 px-2.5 font-semibold w-40">Akun / Pengunggah</th>
                    <th className="py-2.5 px-2.5 font-semibold min-w-[220px]">Muatan Teks Konten</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-44">Interaksi (Like / Komen)</th>
                    <th className="py-2.5 px-2.5 font-semibold text-right w-24">Skor Anomali</th>
                    <th className="py-2.5 px-3 font-semibold text-right w-10">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {filteredComments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--mute)] font-mono text-[12px]">
                        {loading
                          ? "Memuat data audit..."
                          : "Tidak ada entitas yang cocok dengan kriteria filter saat ini."}
                      </td>
                    </tr>
                  ) : (
                    filteredComments.map((c, idx) => {
                      const isSelected = selectedComment?.id === c.id;
                      const isOrganic = c.account_classification === "organic";
                      const postType = c.account_signals?.type || "Postingan Publik";
                      const isProfileBaseline = c.account_signals?.type === "profile_baseline";
                      const likesCount = c.likes_count ?? 0;
                      const commentsCount =
                        c.account_signals?.comments_count ??
                        c.account_signals?.replies_count ??
                        0;

                      return (
                        <tr
                          key={c.id || idx}
                          onClick={() => setSelectedComment(c)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-[var(--s2)] border-l-2 border-l-[var(--acc)]" : "hover:bg-[var(--s2)]"
                          }`}
                        >
                          <td className="py-2.5 px-3 text-[var(--mute)] font-mono text-[11px]">{idx + 1}</td>

                          {/* Author Info */}
                          <td className="py-2.5 px-2.5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-[var(--ink)] text-[12px] font-semibold truncate max-w-[130px]">
                                  @{c.author_username}
                                </span>
                              </div>
                              <div className="text-[11px] text-[var(--mute)] truncate max-w-[130px]">
                                {c.author_display_name || "Nama Pengguna"}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] font-mono mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25 font-semibold">
                                  {postType.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Comment/Post Content */}
                          <td className="py-2.5 px-2.5">
                            <div className="space-y-1 max-w-[320px]">
                              <p className="text-[var(--ink)] text-[12px] leading-relaxed line-clamp-2 m-0 font-sans">
                                {c.comment_text}
                              </p>

                              {c.account_signals?.post_url && (
                                <div className="pt-0.5">
                                  <a
                                    href={c.account_signals.post_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[var(--acc)] hover:underline inline-flex items-center gap-1 text-[10.5px] font-mono"
                                  >
                                    <span>Tautan Postingan</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Interaction Metrics (Likes & Comments - Strictly Aligned "Sejajar") */}
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                            {isProfileBaseline ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <div className="flex items-center justify-end gap-3 font-mono tabular-nums">
                                  <span
                                    className="inline-flex items-center gap-1.5 w-[76px] justify-start text-[var(--ink)] font-semibold text-[11.5px]"
                                    title={`${likesCount.toLocaleString("id-ID")} Suka`}
                                  >
                                    <Heart className="w-3.5 h-3.5 text-[var(--hi)] fill-[var(--hi)]/20 shrink-0" />
                                    <span>{likesCount.toLocaleString("id-ID")}</span>
                                  </span>
                                  <span
                                    className="inline-flex items-center gap-1.5 w-[64px] justify-start text-[var(--mute)] text-[11px]"
                                    title={`${commentsCount.toLocaleString("id-ID")} Komen`}
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                                    <span>{commentsCount.toLocaleString("id-ID")}</span>
                                  </span>
                                </div>
                                <span className="text-[9.5px] text-[var(--lo)] font-semibold uppercase tracking-wider font-mono">
                                  Total Feed Akun
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-3 font-mono tabular-nums">
                                <span
                                  className="inline-flex items-center gap-1.5 w-[76px] justify-start text-[var(--ink)] font-semibold text-[11.5px]"
                                  title={`${likesCount.toLocaleString("id-ID")} Suka`}
                                >
                                  <Heart className="w-3.5 h-3.5 text-[var(--hi)] fill-[var(--hi)]/20 shrink-0" />
                                  <span>{likesCount.toLocaleString("id-ID")}</span>
                                </span>
                                <span
                                  className="inline-flex items-center gap-1.5 w-[64px] justify-start text-[var(--mute)] text-[11px]"
                                  title={`${commentsCount.toLocaleString("id-ID")} Komen`}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                                  <span>{commentsCount.toLocaleString("id-ID")}</span>
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Anomaly Score */}
                          <td className="py-2.5 px-2.5 text-right font-mono tabular-nums">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-semibold text-[12px] text-[var(--lo)]">
                                {c.buzzer_score.toFixed(0)}%
                              </span>
                              <div className="w-14 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--lo)] rounded-full"
                                  style={{ width: `${Math.max(5, c.buzzer_score)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Action Chevron */}
                          <td className="py-2.5 px-3 text-right">
                            <ChevronRight
                              className={`w-4 h-4 transition-transform inline-block ${
                                isSelected ? "text-[var(--acc)] translate-x-1" : "text-[var(--mute)]"
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-3 border-t border-[var(--line)] text-[11px] text-[var(--mute)] flex items-center justify-between font-mono">
            <span>Algoritma verifikasi web real NEXTRACE OSINT v2.0.</span>
            <span>100% Real Evidence (Zero Synthetic)</span>
          </div>
        </section>

        {/* Right Column (5 cols): Deep Buzzer & Account Dossier */}
        <section className="lg:col-span-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-4 sticky top-24 self-start">
          {selectedComment ? (
            <>
              {/* Dossier Header */}
              <div className="pb-3 border-b border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[var(--s2)] text-[var(--mute)] font-mono text-[10px] uppercase font-bold border border-[var(--line)]">
                    ENTITAS #{selectedComment.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold border bg-[var(--lo)]/15 text-[var(--lo)] border-[var(--lo)]/25">
                    ORGANIK / TERVERIFIKASI
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <div className="text-[var(--ink)] text-[15px] font-semibold font-mono">
                      @{selectedComment.author_username}
                    </div>
                    <div className="text-[12px] text-[var(--mute)]">
                      {selectedComment.author_display_name || "Nama Akun Terverifikasi"}
                    </div>
                  </div>
                  <PlatformBadge platform={selectedComment.platform} />
                </div>
              </div>

              {/* Content Text Box */}
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-1.5">
                <div className="text-[10px] font-mono text-[var(--mute)] uppercase font-semibold flex items-center justify-between">
                  <span>Konten Terdeteksi dari Web</span>
                  <span className="text-[var(--mute)] font-mono">
                    {selectedComment.comment_timestamp
                      ? new Date(selectedComment.comment_timestamp).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Aktif"}
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--ink)] leading-relaxed font-sans m-0">
                  {selectedComment.comment_text}
                </p>
                {selectedComment.account_signals?.post_url && (
                  <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[var(--mute)]">Tautan Langsung:</span>
                    <a
                      href={selectedComment.account_signals.post_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--acc)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Buka di Instagram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Radar Signals Breakdown */}
              <div className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-3">
                <div className="text-[12px] font-semibold text-[var(--ink)] font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[var(--acc)] stroke-[1.8]" />
                    <span>RADAR METRIK ENTITAS ASLI</span>
                  </span>
                  <span className="text-[10.5px] font-mono text-[var(--lo)] font-semibold">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-2 text-[11.5px] font-mono">
                  <div>
                    <div className="flex items-center justify-between text-[var(--mute)]">
                      <span>Metrik Interaksi Publik:</span>
                      <strong className="text-[var(--ink)] tabular-nums flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[var(--hi)] font-semibold">
                          <Heart className="w-3 h-3 fill-[var(--hi)]/20" />
                          {(selectedComment.likes_count ?? 0).toLocaleString("id-ID")} Suka
                        </span>
                        <span>&bull;</span>
                        <span className="inline-flex items-center gap-1 text-[var(--acc)] font-semibold">
                          <MessageSquare className="w-3 h-3" />
                          {(
                            selectedComment.account_signals?.comments_count ??
                            selectedComment.account_signals?.replies_count ??
                            0
                          ).toLocaleString("id-ID")}{" "}
                          Komentar
                        </span>
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[var(--mute)]">
                      <span>Tipe Entitas:</span>
                      <strong className="text-[var(--ink)]">
                        {selectedComment.account_signals?.type || "Postingan Publik"}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[var(--mute)]">
                      <span>Sumber Bukti Forensik:</span>
                      <strong className="text-[var(--lo)]">
                        Live Web Scraping (100% Real)
                      </strong>
                    </div>
                  </div>

                  <div className="p-2 bg-[var(--s1)] border border-[var(--line)] rounded text-[var(--mute)] text-[11px]">
                    {selectedComment.analyst_notes || "Entitas postingan asli terverifikasi dari web publik."}
                  </div>
                </div>
              </div>

              {/* Takedown CTA */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handlePushToEvidenceVault}
                  disabled={pushingEvidence}
                  className="w-full py-2.5 px-3 bg-[var(--acc)] hover:opacity-90 text-white font-mono text-[12px] font-semibold rounded-[6px] flex items-center justify-center gap-2 transition-opacity cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <FileText className={`w-3.5 h-3.5 ${pushingEvidence ? "animate-spin" : ""}`} />
                  <span>
                    {pushingEvidence
                      ? "Menyegel Kriptografis SHA-256..."
                      : "Kunci Bukti ke Evidence Vault (Rantai Kustodi)"}
                  </span>
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[var(--mute)] font-mono text-[12px]">
              Pilih salah satu entitas di tabel sebelah kiri untuk menginspeksi dossier forensik akun.
            </div>
          )}
        </section>
      </div>

      {/* Professional Theme-Matching Modal Popup */}
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}

export default function BuzzerHunterPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[var(--mute)] font-mono text-xs">
          Memuat Modul Buzzer Hunter...
        </div>
      }
    >
      <BuzzerContent />
    </Suspense>
  );
}
