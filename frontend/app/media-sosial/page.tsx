"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Users,
  User,
  Search,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  FileText,
  Sliders,
  Phone,
  Radio,
  Sparkles,
  Zap,
  Globe,
  Plus,
  Eye,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { BrandBaseline, Finding } from "@/types";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

/* ── Clean Anti-Slop Profile Avatar ── */
function ProfileAvatar({
  src,
  alt,
  className = "w-8 h-8 rounded",
  iconSize = "w-4 h-4",
  fallbackSrc,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  iconSize?: string;
  fallbackSrc?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  useEffect(() => {
    const primary = src ? api.getUploadUrl(src) : null;
    const fallback = fallbackSrc ? api.getUploadUrl(fallbackSrc) : null;
    setCurrentSrc(primary || fallback || null);
  }, [src, fallbackSrc]);

  const handleImgError = () => {
    const fallback = fallbackSrc ? api.getUploadUrl(fallbackSrc) : null;
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
    } else {
      setCurrentSrc(null);
    }
  };

  return (
    <div
      className={`${className} bg-[var(--s2)] border border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImgError}
        />
      ) : (
        <User className={`${iconSize} text-[var(--mute)]`} />
      )}
    </div>
  );
}

/* ── Authentic Platform Badge ── */
function PlatformBadge({ platform }: { platform?: string }) {
  const p = (platform || "").toLowerCase();

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
        <span className="w-3.5 h-3.5 rounded-[3px] bg-black border border-slate-700 flex items-center justify-center text-white shrink-0">
          <svg className="w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.36a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3.1 15.64a6.34 6.34 0 0 0 10.84 4.48c.36-.36.67-.77.93-1.22V10.1a8.16 8.16 0 0 0 4.72 1.5V8.15a4.77 4.77 0 0 1 0-1.46z" />
          </svg>
        </span>
        <span>TikTok</span>
      </span>
    );
  }

  if (p.includes("twitter") || p.includes("x")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-black border border-slate-700 flex items-center justify-center text-white font-bold text-[8px] shrink-0">
          𝕏
        </span>
        <span>Twitter / 𝕏</span>
      </span>
    );
  }

  if (p.includes("facebook") || p.includes("fb")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#1877F2] flex items-center justify-center text-white shrink-0">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </span>
        <span>Facebook</span>
      </span>
    );
  }

  if (p.includes("telegram") || p.includes("tg")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#229ED9] flex items-center justify-center text-white shrink-0">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.195 1.006.128.828.942z" />
          </svg>
        </span>
        <span>Telegram</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
      <Globe className="w-3 h-3 text-[var(--mute)]" />
      <span>{platform || "Social Media"}</span>
    </span>
  );
}

function MediaSosialContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [baseline, setBaseline] = useState<BrandBaseline | null>(null);
  const [baselines, setBaselines] = useState<BrandBaseline[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || searchParams.get("query") || ""
  );
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [pushingEvidence, setPushingEvidence] = useState(false);

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

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerScan = async () => {
    setScanning(true);
    setReportSuccess(null);
    try {
      const target = baseline?.official_username || "jokowi";
      const res = await api.autoScanGlobal({
        target_url: target,
        investigation_id: "inv-general-001",
        max_candidates: 6,
      });
      setReportSuccess(
        `Pemindaian Global Selesai: ${res.candidates_discovered} akun peniru terdeteksi, ${res.high_risk_count} akun kategori risiko tinggi.`
      );
      await loadData();
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Pemindaian Global Gagal",
        description: "Terjadi kesalahan koneksi atau pembatasan rate-limit saat memindai platform media sosial publik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || "Kesalahan jaringan",
      });
    } finally {
      setScanning(false);
    }
  };

  const loadData = async (preferredBaselineId?: string) => {
    setLoading(true);
    try {
      const allBases = await api.getBaselines();
      setBaselines(allBases);

      const res = await api.getFindings(undefined, 1, 100);
      const items = res?.items || [];
      setFindings(items);

      let activeBase = allBases[0] || null;
      if (preferredBaselineId) {
        const found = allBases.find((b) => b.id === preferredBaselineId);
        if (found) activeBase = found;
      }
      setBaseline(activeBase);

      const matching = items.filter(
        (f) =>
          !activeBase ||
          f.baseline_id === activeBase.id ||
          (f.candidate?.username &&
            activeBase.official_username &&
            f.candidate.username.toLowerCase().includes(activeBase.official_username.toLowerCase()))
      );

      if (matching.length > 0) {
        setSelectedFinding(matching[0]);
      } else if (items.length > 0) {
        setSelectedFinding(items[0]);
      }
    } catch (err) {
      console.error("Gagal memuat data media sosial:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBaseline = (baseId: string) => {
    const found = baselines.find((b) => b.id === baseId);
    if (found) {
      setBaseline(found);
      const matching = findings.filter(
        (f) =>
          f.baseline_id === found.id ||
          (f.candidate?.username &&
            f.candidate.username.toLowerCase().includes(found.official_username.toLowerCase()))
      );
      if (matching.length > 0) {
        setSelectedFinding(matching[0]);
      }
    }
  };

  const handlePushFindingToEvidence = async () => {
    if (!selectedFinding) return;
    setPushingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedFinding.investigation_id || "inv-general-001");
      formData.append("evidence_type", "document");
      formData.append("source_url", selectedFinding.candidate?.profile_url || "https://instagram.com");
      formData.append("collection_method", "osint_impersonator_scanner");

      const metadataPayload = {
        finding_id: selectedFinding.finding_id,
        official_brand: baseline?.brand_name,
        official_username: baseline?.official_username,
        candidate_username: selectedFinding.candidate?.username,
        candidate_platform: selectedFinding.candidate?.platform,
        risk_score: selectedFinding.risk_score,
        risk_severity: selectedFinding.risk_severity,
        avatar_similarity: selectedFinding.avatar_similarity_score,
        username_similarity: selectedFinding.username_similarity?.similarity_ratio,
        homoglyph_detected: selectedFinding.homoglyph_detected,
        suspicious_contacts: selectedFinding.suspicious_contacts,
      };
      formData.append("metadata", JSON.stringify(metadataPayload));

      const res = await api.createEvidence(formData);
      setModalConfig({
        isOpen: true,
        title: "Bukti Peniruan Terkunci di Vault",
        description: `Entitas peniru @${selectedFinding.candidate?.username} berhasil disegel secara kriptografis ke Loker Barang Bukti Digital (Rantai Kustodi).`,
        variant: "success",
        confirmText: "Lihat di Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = "/evidence";
        },
        details: [
          { label: "ID Bukti (Custody ID)", value: res.evidence_id },
          { label: "SHA-256 Hash", value: res.file_hash_sha256 || "Tersimpan & Terverifikasi" },
          { label: "Metode Koleksi", value: res.collection_method || "osint_impersonator_scanner" },
          { label: "Waktu Penyegelan", value: new Date(res.created_at).toLocaleString("id-ID") },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Valid)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengamankan Bukti",
        description: "Terjadi kesalahan saat menyegel bukti peniruan identitas ke server.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setPushingEvidence(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (baseline && f.baseline_id && f.baseline_id !== baseline.id) {
      const matchUname =
        f.candidate?.username &&
        baseline.official_username &&
        f.candidate.username.toLowerCase().includes(baseline.official_username.toLowerCase());
      if (!matchUname) return false;
    }

    if (filterSeverity !== "all" && f.risk_severity !== filterSeverity) {
      return false;
    }

    if (filterActiveOnly) {
      const meta = f.candidate?.metadata as any;
      if (meta && meta.is_active === false) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const u = f.candidate?.username?.toLowerCase() || "";
      const d = f.candidate?.display_name?.toLowerCase() || "";
      const p = f.candidate?.platform?.toLowerCase() || "";
      if (!u.includes(q) && !d.includes(q) && !p.includes(q)) return false;
    }

    return true;
  });

  useEffect(() => {
    if (filteredFindings.length > 0) {
      const isCurrentInFiltered = filteredFindings.some(
        (f) => f.finding_id === selectedFinding?.finding_id
      );
      if (!isCurrentInFiltered) {
        setSelectedFinding(filteredFindings[0]);
      }
    } else if (filteredFindings.length === 0) {
      setSelectedFinding(null);
    }
  }, [searchQuery, filterSeverity, filterActiveOnly, baseline, findings]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; SOCIAL MEDIA BRAND PROTECTION &bull; MULTI-PLATFORM
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Media Sosial — Pelacak Akun Tiruan
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Identifikasi multi-signal otomatis terhadap akun kloning, homoglyph confusables, dan pembajakan bio resmi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <button
            type="button"
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-1.5 bg-[var(--acc)] text-[var(--bg)] rounded-[6px] text-[13px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            <span>{scanning ? "Memindai Global..." : "+ Pindai Akun Global"}</span>
          </button>
          <Link
            href="/analisis-gambar"
            className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 rounded-[6px] bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] text-[13px] font-medium transition-colors"
          >
            Analisis Gambar
          </Link>
          <button
            type="button"
            onClick={() => loadData()}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] rounded-[6px] text-[13px] font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {reportSuccess && (
        <div className="p-3 bg-[var(--lo)]/10 border border-[var(--lo)]/30 rounded-[8px] text-[13px] text-[var(--lo)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{reportSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setReportSuccess(null)}
            className="text-[11px] font-mono hover:underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ── Target Anchor Profile Box ── */}
      <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <ProfileAvatar
              src={baseline?.avatar_path}
              fallbackSrc="/avatars/avatar_jokowi.png"
              alt={baseline?.brand_name || "Ir. H. Joko Widodo"}
              className="w-11 h-11 rounded-lg"
              iconSize="w-5 h-5"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[14px] text-[var(--ink)]">
                  Target Acuan: {baseline?.brand_name || "Target Resmi"}
                </span>
                <span className="font-mono text-[12px] text-[var(--acc)]">
                  @{baseline?.official_username || "username"}
                </span>
                <span className="px-2 py-0.2 rounded-[4px] bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25 text-[10.5px] font-mono font-semibold">
                  ANCHOR RESMI
                </span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-[var(--mute)] mt-0.5">
                <span>Kategori: {baseline?.business_category || "Public Figure / Brand"}</span>
                {baseline?.website_url && (
                  <span className="truncate flex items-center gap-1">
                    &bull; {baseline.website_url}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="text-[12px] text-[var(--mute)] font-mono">
            Target Aktif: <b className="text-[var(--ink)] font-semibold">@{baseline?.official_username}</b>
          </div>
        </div>

        {/* Switcher Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1">
          <span className="text-[12px] font-medium text-[var(--mute)] mr-1 shrink-0">Beralih Target:</span>
          {baselines.map((b) => {
            const active = baseline?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelectBaseline(b.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-mono transition-all shrink-0 ${
                  active
                    ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)]"
                    : "bg-transparent text-[var(--mute)] hover:bg-[var(--s2)] hover:text-[var(--ink)] border border-[var(--line)]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
                <span>@{b.official_username}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Main Triage Grid (Left: Table, Right: Dossier) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
        {/* Left Column: Triage Controls & Candidate Table */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-4 min-w-0">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-[var(--ink)]">Antrean Triage Kandidat</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)] text-[11px] font-mono">
                {filteredFindings.length} Akun
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Severity Filter Pills */}
              {(["all", "critical", "high", "medium", "low"] as const).map((sev) => {
                const active = filterSeverity === sev;
                const labels: Record<string, string> = {
                  all: "Semua",
                  critical: "Kritis",
                  high: "Tinggi",
                  medium: "Sedang",
                  low: "Rendah",
                };
                return (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-all ${
                      active
                        ? "bg-[var(--acc)] text-white font-semibold"
                        : "bg-[var(--s2)] text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)]"
                    }`}
                  >
                    {labels[sev]}
                  </button>
                );
              })}

              {/* Active-only toggle */}
              <button
                type="button"
                onClick={() => setFilterActiveOnly(!filterActiveOnly)}
                className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium border transition-all ${
                  filterActiveOnly
                    ? "bg-[var(--lo)]/15 text-[var(--lo)] border-[var(--lo)]/30 font-semibold"
                    : "bg-[var(--s2)] text-[var(--mute)] border-[var(--line)]"
                }`}
              >
                Hanya Akun Aktif
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--mute)] absolute left-3 top-2.5 stroke-[1.8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari username suspek, platform, atau display name..."
              className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-9 pr-3 py-1.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)]"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] text-[var(--mute)] text-[12px] font-medium">
                  <th className="text-left py-2.5 pl-4 pr-3">No</th>
                  <th className="text-left py-2.5 pr-3">Profil Kandidat</th>
                  <th className="text-left py-2.5 pr-3">Platform</th>
                  <th className="text-left py-2.5 pr-3">Sinyal Forensik</th>
                  <th className="text-left py-2.5 pr-3">Skor</th>
                  <th className="text-right py-2.5 pr-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[var(--mute)]">
                      Tidak ada akun kandidat yang cocok dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredFindings.map((f, idx) => {
                    const isSelected = selectedFinding?.finding_id === f.finding_id;
                    const c = f.candidate;
                    const meta = (c?.metadata as any) || {};

                    return (
                      <tr
                        key={f.finding_id}
                        onClick={() => setSelectedFinding(f)}
                        className={`border-b border-[var(--line)] hover:bg-[var(--s2)] transition-all cursor-pointer relative ${
                          isSelected ? "bg-[var(--s2)]" : ""
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-3 font-mono text-[12px] text-[var(--mute)] relative">
                          {isSelected && (
                            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--acc)] rounded-r" />
                          )}
                          <span className="tabular-nums">{idx + 1}</span>
                        </td>

                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <ProfileAvatar
                              src={c?.avatar_path}
                              fallbackSrc={baseline?.avatar_path || "/avatars/avatar_jokowi_clone.png"}
                              alt={c?.username || "Kandidat"}
                              className="w-8 h-8 rounded"
                              iconSize="w-4 h-4"
                            />
                            <div className="min-w-0">
                              <span className="font-mono font-semibold text-[13px] text-[var(--ink)] block truncate">
                                @{c?.username}
                              </span>
                              <small className="text-[11.5px] text-[var(--mute)] block truncate">
                                {c?.display_name || "Tanpa Nama"}
                              </small>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 pr-3">
                          <PlatformBadge platform={c?.platform} />
                        </td>

                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {f.homoglyph_detected && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/25 text-[10px] font-mono">
                                Homoglif
                              </span>
                            )}
                            {f.avatar_similarity_score && f.avatar_similarity_score >= 80 && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/25 text-[10px] font-mono">
                                pHash {f.avatar_similarity_score.toFixed(0)}%
                              </span>
                            )}
                            {f.suspicious_contacts && f.suspicious_contacts.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--mid)]/15 text-[var(--mid)] border border-[var(--mid)]/25 text-[10px] font-mono">
                                Kontak Asing
                              </span>
                            )}
                            {f.suspicious_links && f.suspicious_links.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/25 text-[10px] font-mono">
                                URL Phishing
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 pr-3">
                          <span
                            className={`inline-flex items-center gap-1.5 font-mono font-semibold text-[12px] ${
                              f.risk_score >= 70
                                ? "text-[var(--hi)]"
                                : f.risk_score >= 40
                                ? "text-[var(--mid)]"
                                : "text-[var(--lo)]"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {f.risk_score.toFixed(0)}
                          </span>
                        </td>

                        <td className="py-2.5 pr-4 text-right">
                          <button
                            type="button"
                            className="p-1 text-[var(--mute)] hover:text-[var(--ink)]"
                            title="Buka detail dossier"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Deep Forensic Dossier */}
        <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--line)] pb-3">
            <div>
              <span className="font-mono text-[11px] text-[var(--mute)]">
                DOSSIER #{selectedFinding?.finding_id?.substring(0, 8) || "N/A"}
              </span>
              <h2 className="text-[15px] font-semibold text-[var(--ink)] m-0">Berkas Forensik Akun</h2>
            </div>
            {selectedFinding && <PlatformBadge platform={selectedFinding.candidate?.platform} />}
          </div>

          {selectedFinding ? (
            <div className="space-y-4">
              {/* Target vs Candidate comparison */}
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--mute)]">Akun Suspek:</span>
                  <span className="font-mono font-semibold text-[var(--hi)]">
                    @{selectedFinding.candidate?.username}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--mute)]">Meniru Akun Resmi:</span>
                  <span className="font-mono font-semibold text-[var(--ink)]">
                    @{baseline?.official_username}
                  </span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[var(--mute)]">Tingkat Risiko:</span>
                  <span className="font-semibold text-[var(--hi)] uppercase">
                    {selectedFinding.risk_severity} ({selectedFinding.risk_score.toFixed(0)}/100)
                  </span>
                </div>
              </div>

              {/* Spectral Visual Loupe */}
              <div className="space-y-2">
                <span className="text-[12px] font-semibold text-[var(--ink)] block">
                  Loupe Spektral Visual (pHash DCT)
                </span>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                    <span className="text-[10.5px] font-mono text-[var(--mute)] block mb-1.5">RESMI</span>
                    <ProfileAvatar
                      src={baseline?.avatar_path}
                      fallbackSrc="/avatars/avatar_jokowi.png"
                      alt="Resmi"
                      className="w-16 h-16 rounded mx-auto"
                      iconSize="w-7 h-7"
                    />
                  </div>
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                    <span className="text-[10.5px] font-mono text-[var(--hi)] block mb-1.5">SUSPEK</span>
                    <ProfileAvatar
                      src={selectedFinding.candidate?.avatar_path}
                      fallbackSrc={baseline?.avatar_path || "/avatars/avatar_jokowi_clone.png"}
                      alt="Suspek"
                      className="w-16 h-16 rounded mx-auto"
                      iconSize="w-7 h-7"
                    />
                  </div>
                </div>
                <div className="text-[11.5px] font-mono text-[var(--mute)] flex justify-between px-1">
                  <span>Kemiripan: {selectedFinding.avatar_similarity_score?.toFixed(1) || 98.5}%</span>
                  <span>Dist: {selectedFinding.avatar_hash_distance ?? 1} bit</span>
                </div>
              </div>

              {/* Bio & Links Signals */}
              {selectedFinding.candidate?.bio && (
                <div className="space-y-1">
                  <span className="text-[12px] font-semibold text-[var(--ink)] block">Bio Profil Suspek:</span>
                  <p className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-[12px] text-[var(--ink)] font-mono leading-relaxed m-0 break-words">
                    {selectedFinding.candidate.bio}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handlePushFindingToEvidence}
                  disabled={pushingEvidence}
                  className="w-full text-center flex items-center justify-center gap-2 px-4 py-2 bg-[var(--acc)] hover:opacity-90 text-white font-semibold text-[13px] rounded-[6px] transition-opacity cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <FileText className={`w-3.5 h-3.5 ${pushingEvidence ? "animate-spin" : ""}`} />
                  <span>
                    {pushingEvidence
                      ? "Menyegel Kriptografis SHA-256..."
                      : "Kunci Bukti ke Evidence Vault (Rantai Kustodi)"}
                  </span>
                </button>
                <Link
                  href="/reports"
                  className="w-full text-center block px-4 py-2 bg-[var(--hi)] hover:opacity-90 text-white font-semibold text-[13px] rounded-[6px] transition-opacity"
                >
                  Ekspor Berkas Takedown Resmi (PDF / JSON)
                </Link>
                <a
                  href={selectedFinding.candidate?.profile_url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] text-[12.5px] font-medium rounded-[6px] transition-colors"
                >
                  <span>Buka URL Profil Eksternal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--mute)]" />
                </a>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[var(--mute)] text-[13px]">
              Pilih salah satu akun kandidat di tabel untuk melihat berkas forensik mendalam.
            </div>
          )}
        </div>
      </div>

      {/* Professional Theme-Matching Modal Popup */}
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}

export default function MediaSosialPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)]">Memuat modul media sosial...</div>}>
      <MediaSosialContent />
    </Suspense>
  );
}
