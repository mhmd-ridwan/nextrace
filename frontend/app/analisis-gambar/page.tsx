"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Image as ImageIcon,
  Upload,
  Camera,
  MapPin,
  Clock,
  Hash,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Layers,
  User,
  ArrowRight,
  RefreshCw,
  Search,
  Sparkles,
  Info,
  Globe,
  Radio,
  Briefcase,
  AlertOctagon,
  CheckCircle2,
  Sliders,
  Filter,
  Eye,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  GlobalImageScanResponse,
  ImageComparisonMetrics,
  ImageForensicsResponse,
  Investigation,
  MatchedProfile,
} from "@/types";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

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

  if (p.includes("facebook")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#1877F2] flex items-center justify-center text-white font-bold text-[9px] shrink-0">
          f
        </span>
        <span>Facebook</span>
      </span>
    );
  }

  if (p.includes("telegram")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)]">
        <span className="w-3.5 h-3.5 rounded-[3px] bg-[#229ED9] flex items-center justify-center text-white text-[9px] shrink-0">
          ✈
        </span>
        <span>Telegram</span>
      </span>
    );
  }

  if (p.includes("resmi") || p.includes("anchor")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-bold bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/30">
        <CheckCircle2 className="w-3 h-3 text-[var(--lo)]" />
        <span>Akun Resmi Terverifikasi</span>
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

/* ── Smart Profile Avatar ── */
function SmartProfileAvatar({
  src,
  alt,
  className = "w-11 h-11 rounded-lg",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = !hasError ? (src ? api.getUploadUrl(src) : null) : null;

  return (
    <div
      className={`${className} bg-[var(--s2)] border border-[var(--line)] overflow-hidden shrink-0 flex items-center justify-center`}
    >
      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <User className="w-5 h-5 text-[var(--mute)]" />
      )}
    </div>
  );
}

interface ComparePreset {
  id: "identical" | "modified" | "different";
  label: string;
  badge: string;
  badgeClass: string;
  description: string;
}

const COMPARE_PRESETS: ComparePreset[] = [
  {
    id: "identical",
    label: "Identik 100%",
    badge: "100% MATCH",
    badgeClass: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30",
    description: "Dua citra profil identik sempurna (Hamming distance 0 bit)",
  },
  {
    id: "modified",
    label: "Dimodifikasi (~93%)",
    badge: "~93% VARIANT",
    badgeClass: "bg-[#eab308]/15 text-[#eab308] border-[#eab308]/30",
    description: "Citra asli vs varian kloning terkompresi / filter (Hamming: 3-4 bit)",
  },
  {
    id: "different",
    label: "Subjek Berbeda (<60%)",
    badge: "<60% DISTINCT",
    badgeClass: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30",
    description: "Dua citra profil yang berbeda sama sekali (Hamming > 15 bit)",
  },
];

function AnalisisGambarContent() {
  const searchParams = useSearchParams();
  const sampleParam = searchParams.get("sample");
  const tabParam = searchParams.get("tab");
  const initialCaseId = searchParams.get("investigation_id") || "";

  // 3 Separated Tabs: "global" | "exif" | "compare"
  const [activeTab, setActiveTab] = useState<"global" | "exif" | "compare">(
    tabParam === "exif" ? "exif" : tabParam === "compare" ? "compare" : "global"
  );

  // Dynamic Case Management
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  // ── Tab 1: Global Profile Search State ──
  const [globalScanResult, setGlobalScanResult] = useState<GlobalImageScanResponse | null>(null);
  const [globalScanning, setGlobalScanning] = useState(false);
  const [globalScanStage, setGlobalScanStage] = useState(0);
  const [globalScanError, setGlobalScanError] = useState<string | null>(null);
  const [globalPlatformFilter, setGlobalPlatformFilter] = useState<string>("all");
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false);
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 1 Preview Card State (Sebelah Kiri)
  const [globalPreviewUrl, setGlobalPreviewUrl] = useState<string | null>(null);
  const [globalFileName, setGlobalFileName] = useState<string>("Belum ada berkas");
  const [globalFileSize, setGlobalFileSize] = useState<string>("-");
  const [globalDimensions, setGlobalDimensions] = useState<string>("-");

  // ── Tab 2: Pure EXIF & Hardware Forensics State ──
  const [exifData, setExifData] = useState<ImageForensicsResponse | null>(null);
  const [exifLoading, setExifLoading] = useState(false);
  const [exifError, setExifError] = useState<string | null>(null);
  const [isDraggingExif, setIsDraggingExif] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [exifSearch, setExifSearch] = useState("");
  const exifFileInputRef = useRef<HTMLInputElement | null>(null);

  // Tab 2 Preview Card State (Sebelah Kiri)
  const [exifPreviewUrl, setExifPreviewUrl] = useState<string | null>(null);
  const [exifFileName, setExifFileName] = useState<string>("Belum ada berkas");
  const [exifFileSize, setExifFileSize] = useState<string>("-");
  const [exifDimensions, setExifDimensions] = useState<string>("-");

  // ── Tab 3: Direct Dual-Image Spectral Comparator State ──
  const [compareFileA, setCompareFileA] = useState<File | null>(null);
  const [comparePreviewA, setComparePreviewA] = useState<string | null>(null);
  const [compareFileAName, setCompareFileAName] = useState<string>("");

  const [compareFileB, setCompareFileB] = useState<File | null>(null);
  const [comparePreviewB, setComparePreviewB] = useState<string | null>(null);
  const [compareFileBName, setCompareFileBName] = useState<string>("");

  const [isDraggingA, setIsDraggingA] = useState(false);
  const [isDraggingB, setIsDraggingB] = useState(false);
  const fileInputARef = useRef<HTMLInputElement | null>(null);
  const fileInputBRef = useRef<HTMLInputElement | null>(null);

  const [compareLoading, setCompareLoading] = useState(false);
  const [compareMetrics, setCompareMetrics] = useState<ImageComparisonMetrics | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Vaulting State & Professional Modal
  const [vaultLoadingId, setVaultLoadingId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info" | "success";
    details?: ModalDetailItem[] | string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  // Load active investigations
  useEffect(() => {
    async function loadInvestigations() {
      try {
        const res = await api.listInvestigations(1, 50);
        if (res.items && res.items.length > 0) {
          setInvestigations(res.items);
          if (!res.items.some((i) => i.id === selectedCaseId)) {
            setSelectedCaseId(res.items[0].id);
          }
        }
      } catch (err) {
        console.warn("Gagal memuat investigasi:", err);
      }
    }
    loadInvestigations();
  }, []);

  // ── TAB 1 HANDLERS: Global Profile Reverse Search ──
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleUploadAndScanGlobal = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setGlobalPreviewUrl(localUrl);
    setGlobalFileName(file.name);
    setGlobalFileSize((file.size / 1024).toFixed(1) + " KB");

    setGlobalScanning(true);
    setGlobalScanStage(1);
    setGlobalScanError(null);

    // Progressive biometric scanning animation timeline (~1.9s)
    const animPromise = (async () => {
      await delay(450);
      setGlobalScanStage(2);
      await delay(500);
      setGlobalScanStage(3);
      await delay(500);
      setGlobalScanStage(4);
      await delay(450);
    })();

    const apiPromise = api.scanImageGlobal(file, selectedCaseId, 85.0);

    try {
      const [_, res] = await Promise.all([animPromise, apiPromise]);
      setGlobalScanResult(res);
      if (res.forensics.preview_data_url) {
        setGlobalPreviewUrl(res.forensics.preview_data_url);
      }
      setGlobalFileName(res.forensics.file_name);
      setGlobalFileSize(res.forensics.file_size_formatted);
      setGlobalDimensions(`${res.forensics.dimensions.width} × ${res.forensics.dimensions.height} px`);
    } catch (err: any) {
      setGlobalScanError(err.message || "Gagal memproses pemindaian profil global.");
    } finally {
      setGlobalScanning(false);
      setGlobalScanStage(0);
    }
  };

  const handleSelectGlobalSample = async (sampleType: "jokowi_official" | "iphone_gps") => {
    setGlobalScanning(true);
    setGlobalScanStage(1);
    setGlobalScanError(null);

    const animPromise = (async () => {
      await delay(400);
      setGlobalScanStage(2);
      await delay(450);
      setGlobalScanStage(3);
      await delay(450);
      setGlobalScanStage(4);
      await delay(350);
    })();

    const apiPromise = api.getGlobalImageScanSample(sampleType, selectedCaseId, 85.0);

    try {
      const [_, res] = await Promise.all([animPromise, apiPromise]);
      setGlobalScanResult(res);
      if (res.forensics.preview_data_url) {
        setGlobalPreviewUrl(res.forensics.preview_data_url);
      }
      setGlobalFileName(res.forensics.file_name);
      setGlobalFileSize(res.forensics.file_size_formatted);
      setGlobalDimensions(`${res.forensics.dimensions.width} × ${res.forensics.dimensions.height} px`);
    } catch (err: any) {
      setGlobalScanError(err.message || "Gagal memuat sampel pencarian global.");
    } finally {
      setGlobalScanning(false);
      setGlobalScanStage(0);
    }
  };

  // ── TAB 2 HANDLERS: Pure EXIF Analysis ──
  const handleUploadExifOnly = async (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setExifPreviewUrl(localUrl);
    setExifFileName(file.name);
    setExifFileSize((file.size / 1024).toFixed(1) + " KB");

    setExifLoading(true);
    setExifError(null);

    try {
      const res = await api.analyzeImageExif(file);
      setExifData(res);
      if (res.preview_data_url) {
        setExifPreviewUrl(res.preview_data_url);
      }
      setExifFileName(res.file_name);
      setExifFileSize(res.file_size_formatted);
      setExifDimensions(`${res.dimensions.width} × ${res.dimensions.height} px`);
    } catch (err: any) {
      setExifError(err.message || "Gagal memproses forensik berkas citra.");
    } finally {
      setExifLoading(false);
    }
  };

  const handleSelectExifSample = async (sampleType: "iphone_gps" | "canon_dslr" | "photoshop_tampered") => {
    setExifLoading(true);
    setExifError(null);

    try {
      const res = await api.getForensicSample(sampleType);
      setExifData(res);
      if (res.preview_data_url) {
        setExifPreviewUrl(res.preview_data_url);
      }
      setExifFileName(res.file_name);
      setExifFileSize(res.file_size_formatted);
      setExifDimensions(`${res.dimensions.width} × ${res.dimensions.height} px`);
    } catch (err: any) {
      setExifError(err.message || "Gagal memuat sampel forensik EXIF.");
    } finally {
      setExifLoading(false);
    }
  };

  const handleResetExif = () => {
    setExifData(null);
    setExifPreviewUrl(null);
    setExifFileName("Belum ada berkas");
    setExifFileSize("-");
    setExifDimensions("-");
    setExifError(null);
    if (exifFileInputRef.current) {
      exifFileInputRef.current.value = "";
    }
  };

  const handleCopyHash = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // One-Click Vaulting of Matched Profile
  const handleVaultProfileMatch = async (match: MatchedProfile) => {
    if (!globalScanResult) return;
    setVaultLoadingId(match.candidate_id);

    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedCaseId);
      formData.append("evidence_type", "document");
      formData.append("source_url", match.profile_url);
      formData.append("collection_method", "osint_image_reverse_search");

      const payload = {
        scan_file: globalScanResult.forensics.file_name,
        target_phash: globalScanResult.target_phash,
        target_sha256: globalScanResult.target_sha256,
        matched_candidate_id: match.candidate_id,
        matched_username: match.username,
        matched_platform: match.platform,
        visual_similarity_score: match.visual_similarity_score,
        hash_distance: match.hash_distance,
        match_classification: match.match_classification,
        risk_severity: match.risk_severity,
        risk_score: match.risk_score,
        threat_indicators: match.threat_indicators,
        suspicious_contacts: match.suspicious_contacts,
        audited_at: new Date().toISOString(),
      };
      formData.append("metadata", JSON.stringify(payload));

      const evidence = await api.createEvidence(formData);

      setModalConfig({
        isOpen: true,
        title: "Bukti Kloning Profil Tersegel di Vault",
        description: `Profil peniru @${match.username} (${match.platform}) dengan kemiripan visual ${match.visual_similarity_score}% berhasil dikunci ke Evidence Vault.`,
        variant: "success",
        confirmText: "Lihat di Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = selectedCaseId ? `/evidence?investigation_id=${selectedCaseId}` : "/evidence";
        },
        details: [
          { label: "Nomor Registrasi Bukti", value: evidence.evidence_id },
          { label: "ID Kasus Terkait", value: selectedCaseId || "Umum (Standalone)" },
          { label: "Hash Kriptografis (SHA-256)", value: evidence.file_hash_sha256 || "TERVERIFIKASI" },
          { label: "Tingkat Kemiripan Visual", value: `${match.visual_similarity_score}% (Dist: ${match.hash_distance} bit)` },
          { label: "Platform Target", value: match.platform },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Valid Chain-of-Custody)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci Bukti",
        description: "Terjadi kesalahan saat menyegel bukti ke server forensik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaultLoadingId(null);
    }
  };

  // Vaulting for Pure EXIF Analysis
  const handleVaultExifEvidence = async () => {
    if (!exifData) return;
    setVaultLoadingId("exif_pure");

    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedCaseId);
      formData.append("file_name", exifData.file_name);
      formData.append("sha256_hash", exifData.hashes.sha256);
      formData.append(
        "metadata_json",
        JSON.stringify({
          dimensions: exifData.dimensions,
          camera: exifData.camera,
          optics: exifData.optics,
          gps: exifData.gps,
          software: exifData.software,
          chronology: exifData.chronology,
          hashes: exifData.hashes,
        })
      );

      const res = await api.vaultImageEvidence(formData);
      setModalConfig({
        isOpen: true,
        title: "Metadata EXIF Berhasil Disegel",
        description: `Bukti telemetri berkas citra ${exifData.file_name} berhasil dikunci ke Evidence Vault dengan segel SHA-256.`,
        variant: "success",
        confirmText: "Buka Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = selectedCaseId ? `/evidence?investigation_id=${selectedCaseId}` : "/evidence";
        },
        details: [
          { label: "ID Bukti Vault", value: res.evidence_id },
          { label: "SHA-256 Digest", value: res.file_hash_sha256 || exifData.hashes.sha256 },
          { label: "Kamera / Perangkat", value: `${exifData.camera.make || "N/A"} ${exifData.camera.model || ""}` },
          { label: "Lokasi GPS", value: exifData.gps.has_gps ? (exifData.gps.location_hint || "Tersedia") : "Tidak ada koordinat" },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci EXIF",
        description: "Terjadi kesalahan saat menyimpan bukti EXIF ke server forensik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaultLoadingId(null);
    }
  };

  // ── TAB 3 HANDLERS: Direct Dual-Image Spectral Comparator ──
  const handleSelectCompareFileA = (file: File) => {
    setCompareFileA(file);
    setCompareFileAName(file.name);
    setComparePreviewA(URL.createObjectURL(file));
    setCompareMetrics(null);
    setCompareError(null);
  };

  const handleSelectCompareFileB = (file: File) => {
    setCompareFileB(file);
    setCompareFileBName(file.name);
    setComparePreviewB(URL.createObjectURL(file));
    setCompareMetrics(null);
    setCompareError(null);
  };

  const handleRunComparison = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!compareFileA || !compareFileB) {
      setCompareError("Harap unggah kedua berkas citra (Foto Acuan A dan Foto Suspek B) terlebih dahulu.");
      return;
    }

    setCompareLoading(true);
    setCompareError(null);

    try {
      const res = await api.compareImages(compareFileA, compareFileB);
      setCompareMetrics(res);
      if (res.file_a_preview) setComparePreviewA(res.file_a_preview);
      if (res.file_b_preview) setComparePreviewB(res.file_b_preview);
    } catch (err: any) {
      setCompareError(err.message || "Gagal melakukan komparasi spektral citra.");
    } finally {
      setCompareLoading(false);
    }
  };

  const handleSelectComparePreset = async (preset: "identical" | "modified" | "different") => {
    setCompareLoading(true);
    setCompareError(null);

    try {
      const res = await api.getCompareSample(preset);
      setCompareMetrics(res);
      setComparePreviewA(res.file_a_preview || null);
      setCompareFileAName(res.file_a_name);
      setComparePreviewB(res.file_b_preview || null);
      setCompareFileBName(res.file_b_name);
      setCompareFileA(null);
      setCompareFileB(null);
    } catch (err: any) {
      setCompareError(err.message || "Gagal memuat sampel komparasi spektral.");
    } finally {
      setCompareLoading(false);
    }
  };

  const handleResetComparison = () => {
    setCompareFileA(null);
    setComparePreviewA(null);
    setCompareFileAName("");
    setCompareFileB(null);
    setComparePreviewB(null);
    setCompareFileBName("");
    setCompareMetrics(null);
    setCompareError(null);
    if (fileInputARef.current) fileInputARef.current.value = "";
    if (fileInputBRef.current) fileInputBRef.current.value = "";
  };

  const handleVaultComparisonEvidence = async () => {
    if (!compareMetrics) return;
    setVaultLoadingId("compare_spectral");

    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedCaseId);
      formData.append("evidence_type", "image");
      formData.append("source_url", `local://spectral-compare/${compareMetrics.file_a_name}-vs-${compareMetrics.file_b_name}`);
      formData.append("collection_method", "spectral_phash_comparator");

      const payload = {
        comparison_type: "dual_image_spectral",
        file_a_name: compareMetrics.file_a_name,
        file_b_name: compareMetrics.file_b_name,
        file_a_dimensions: compareMetrics.file_a_dimensions,
        file_b_dimensions: compareMetrics.file_b_dimensions,
        file_a_hashes: compareMetrics.file_a_hashes,
        file_b_hashes: compareMetrics.file_b_hashes,
        similarity_score: compareMetrics.similarity_score,
        phash_hamming_distance: compareMetrics.phash_hamming_distance,
        dhash_hamming_distance: compareMetrics.dhash_hamming_distance,
        verdict: compareMetrics.verdict,
        match_classification: compareMetrics.match_classification,
        audited_at: new Date().toISOString(),
      };
      formData.append("metadata", JSON.stringify(payload));

      const evidence = await api.createEvidence(formData);

      setModalConfig({
        isOpen: true,
        title: "Hasil Komparasi Spektral Tersegel",
        description: `Bukti komparasi spektral antara ${compareMetrics.file_a_name} dan ${compareMetrics.file_b_name} berhasil dikunci ke Evidence Vault.`,
        variant: "success",
        confirmText: "Lihat di Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = selectedCaseId ? `/evidence?investigation_id=${selectedCaseId}` : "/evidence";
        },
        details: [
          { label: "Nomor Registrasi Bukti", value: evidence.evidence_id },
          { label: "Klasifikasi Spektral", value: compareMetrics.match_classification },
          { label: "Skor Kemiripan Visual", value: `${compareMetrics.similarity_score}%` },
          { label: "Hamming Bit Distance", value: `pHash: ${compareMetrics.phash_hamming_distance} bit, dHash: ${compareMetrics.dhash_hamming_distance} bit` },
          { label: "SHA-256 Gambar A", value: compareMetrics.file_a_hashes.sha256 },
          { label: "SHA-256 Gambar B", value: compareMetrics.file_b_hashes.sha256 },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci Bukti Komparasi",
        description: "Terjadi kesalahan saat menyegel bukti ke server forensik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaultLoadingId(null);
    }
  };

  // Filtered profiles for Tab 1
  const globalProfiles = globalScanResult?.matched_profiles || [];
  const filteredGlobalProfiles =
    globalPlatformFilter === "all"
      ? globalProfiles
      : globalProfiles.filter((p) => p.platform.toLowerCase().includes(globalPlatformFilter.toLowerCase()));

  // Filter raw EXIF for Tab 2
  const filteredRawExif = exifData
    ? Object.entries(exifData.raw_exif).filter(
        ([key, val]) =>
          key.toLowerCase().includes(exifSearch.toLowerCase()) ||
          val.toLowerCase().includes(exifSearch.toLowerCase())
      )
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; VISUAL FORENSICS &bull; AUTONOMOUS GLOBAL PROFILE SCANNER
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-tight m-0 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Analisis Gambar &amp; Forensik Citra Digital
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Pencarian profil pengguna global otomatis dengan 1 foto, ekstraksi forensik metadata EXIF kamera, dan komparasi spektral pHash.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* ── 3 DEDICATED TOP TABS ── */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--s1)] border border-[var(--line)] rounded-[8px] overflow-x-auto max-w-full pb-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "global"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>Pencarian Profil Global</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("exif")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "exif"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[var(--mute)]" />
              <span>Forensik EXIF &amp; Kamera</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("compare")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "compare"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[var(--mute)]" />
              <span>Komparasi Avatar 1-on-1</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: PENCARIAN PROFIL GLOBAL (AUTONOMOUS REVERSE SEARCH) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "global" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* ── Side-by-Side: Card Preview Foto (KIRI) & Card Upload (KANAN) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Card Preview Foto Diupload (Sebelah Kiri) */}
            <div className={`lg:col-span-4 bg-[var(--s1)] border rounded-[10px] p-4 flex flex-col justify-between space-y-3 transition-all duration-300 ${
              globalScanning ? "border-[var(--acc)] shadow-[0_0_20px_rgba(134,168,208,0.15)]" : "border-[var(--line)]"
            }`}>
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-[11px] font-mono font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>Foto Target Aktif</span>
                  </span>
                  {globalScanning ? (
                    <span className="px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)] font-mono text-[10px] font-semibold flex items-center gap-1.5 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>MEMINDAI CITRA...</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-[var(--lo)]/15 text-[var(--lo)] font-mono text-[10px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)]" />
                      <span>TERVERIFIKASI</span>
                    </span>
                  )}
                </div>

                {/* Thumbnail Display with Biometric Scan HUD */}
                <div className="mt-3 relative w-full h-52 rounded-[8px] bg-[var(--s2)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                  {globalPreviewUrl ? (
                    <>
                      <img
                        src={globalPreviewUrl}
                        alt={globalFileName}
                        className="w-full h-full object-contain p-1 transition-transform duration-300"
                      />

                      {/* Laser Sweep & Ambient Grid Scanning Line */}
                      {globalScanning && (
                        <>
                          <div className="absolute inset-x-0 h-[2.5px] bg-[var(--acc)] shadow-[0_0_16px_3px_var(--acc)] z-30 pointer-events-none animate-scan-laser" />
                          <div className="absolute inset-0 bg-[var(--acc)]/10 z-20 pointer-events-none animate-scan-grid-pulse" />
                        </>
                      )}

                      {/* Biometric Face Tracking Corners Reticle */}
                      <div className={`absolute inset-3 border rounded pointer-events-none z-20 flex flex-col justify-between p-2 transition-all duration-300 ${
                        globalScanning ? "border-[var(--acc)]/40" : "border-transparent"
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className={`w-3.5 h-3.5 border-t-2 border-l-2 ${globalScanning ? "border-[var(--acc)] animate-pulse" : "border-[var(--line)]"}`} />
                          {globalScanning && (
                            <span className="text-[9px] font-mono font-bold text-[var(--acc)] bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded tracking-widest border border-[var(--acc)]/40">
                              BIOMETRIC SCAN
                            </span>
                          )}
                          <span className={`w-3.5 h-3.5 border-t-2 border-r-2 ${globalScanning ? "border-[var(--acc)] animate-pulse" : "border-[var(--line)]"}`} />
                        </div>

                        {globalScanning && (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="w-10 h-10 rounded-full border-2 border-dashed border-[var(--acc)]/70 animate-spin" />
                            <span className="text-[10px] font-mono text-[var(--ink)] bg-black/85 px-2 py-0.5 rounded border border-[var(--line)]">
                              Tahap {globalScanStage}/4
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-end">
                          <span className={`w-3.5 h-3.5 border-b-2 border-l-2 ${globalScanning ? "border-[var(--acc)] animate-pulse" : "border-[var(--line)]"}`} />
                          {globalScanning && (
                            <span className="text-[9px] font-mono text-[var(--mute)] bg-black/85 px-1.5 py-0.5 rounded">
                              DCT pHash &bull; 64-BIT
                            </span>
                          )}
                          <span className={`w-3.5 h-3.5 border-b-2 border-r-2 ${globalScanning ? "border-[var(--acc)] animate-pulse" : "border-[var(--line)]"}`} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[var(--mute)] p-4 text-center">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[12px] font-mono">Belum ada foto yang diunggah</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Details */}
              <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-1 text-[11.5px] font-mono">
                <div className="flex justify-between items-center text-[var(--ink)] font-semibold truncate">
                  <span className="text-[var(--mute)] font-normal text-[11px]">Nama Berkas:</span>
                  <span className="truncate ml-2" title={globalFileName}>{globalFileName}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--mute)]">
                  <span>Ukuran / Resolusi:</span>
                  <span className="text-[var(--ink)]">{globalFileSize} &bull; {globalDimensions}</span>
                </div>
                {globalScanResult && (
                  <div className="flex justify-between items-center text-[var(--mute)] pt-1 border-t border-[var(--line)]/50">
                    <span>pHash:</span>
                    <span className="text-[var(--acc)] font-semibold">{globalScanResult.target_phash}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Upload (Sebelah Kanan) */}
            <div className="lg:col-span-8 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[12px] font-semibold text-[var(--ink)] uppercase tracking-wider block">
                  Unggah 1 Foto &bull; Pencarian Profil Pengguna Lintas Platform
                </span>
                <p className="text-[12px] text-[var(--mute)] mt-1 mb-0">
                  Cukup unggah 1 foto profil target. Sistem langsung melakukan reverse search profil &amp; kloning di media sosial.
                </p>
              </div>

              {/* Drop Zone Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingGlobal(true);
                }}
                onDragLeave={() => setIsDraggingGlobal(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingGlobal(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleUploadAndScanGlobal(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => globalFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-all flex-1 flex flex-col justify-center items-center ${
                  isDraggingGlobal
                    ? "border-[var(--acc)] bg-[var(--acc)]/5"
                    : globalScanning
                    ? "border-[var(--acc)]/50 bg-[var(--acc)]/5"
                    : "border-[var(--line)] hover:border-[var(--mute)] bg-[var(--s2)]/40 hover:bg-[var(--s2)]"
                }`}
              >
                <input
                  ref={globalFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/tiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadAndScanGlobal(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2.5">
                  <div className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all ${
                    globalScanning
                      ? "bg-[var(--acc)]/15 border-[var(--acc)] text-[var(--acc)] shadow-[0_0_15px_rgba(134,168,208,0.3)]"
                      : "bg-[var(--s2)] border-[var(--line)] text-[var(--acc)]"
                  }`}>
                    {globalScanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {globalScanning ? "Sedang Memindai Citra & Melakukan Reverse Search Global..." : "Tarik & Lepas Foto di Sini, atau Klik untuk Mengganti Berkas"}
                  </div>
                  <p className="text-[12px] text-[var(--mute)] max-w-md m-0">
                    {globalScanning
                      ? "Mengekstrak sidik jari visual DCT 64-bit dan mencocokkan ke akun target di TikTok, Instagram, Facebook, Telegram, dan 𝕏."
                      : "Mendukung JPG, PNG, WEBP. Mesin otomatis menghitung pHash dan mencocokkannya ke TikTok, Instagram, Facebook, Telegram, dan 𝕏."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Scanning Telemetry Banner */}
          {globalScanning && (
            <div className="bg-[var(--s1)] border border-[var(--acc)]/50 rounded-[10px] p-5 space-y-4 animate-in fade-in shadow-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[var(--acc)] animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--acc)] relative" />
                  </div>
                  <div>
                    <span className="text-[13.5px] font-bold text-[var(--ink)] tracking-tight block">
                      Radar Pemindaian Profil Global Sedang Mengidentifikasi Target...
                    </span>
                    <span className="text-[12px] font-mono text-[var(--mute)]">
                      Algoritma: 64-bit Perceptual DCT &bull; Deep Visual Hashing &bull; Multi-Platform OSINT Crawler
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[var(--s2)] border border-[var(--line)] text-[11px] font-mono font-semibold text-[var(--acc)]">
                    Progres: {globalScanStage === 1 ? "25%" : globalScanStage === 2 ? "50%" : globalScanStage === 3 ? "75%" : "100%"}
                  </span>
                </div>
              </div>

              {/* Dynamic Glowing Progress Bar */}
              <div className="w-full bg-[var(--s2)] h-1.5 rounded-full overflow-hidden border border-[var(--line)]">
                <div
                  className="h-full bg-[var(--acc)] transition-all duration-300 ease-out shadow-[0_0_10px_var(--acc)]"
                  style={{
                    width:
                      globalScanStage === 1
                        ? "25%"
                        : globalScanStage === 2
                        ? "50%"
                        : globalScanStage === 3
                        ? "75%"
                        : "100%",
                  }}
                />
              </div>

              {/* Stage Telemetry Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-[11.5px] font-mono">
                <div className={`p-2.5 rounded border transition-all ${
                  globalScanStage >= 1
                    ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)] font-semibold shadow-sm"
                    : "border-[var(--line)] text-[var(--mute)] opacity-50"
                }`}>
                  <div className="text-[10px] text-[var(--mute)] mb-0.5">TAHAP 01</div>
                  <div>Ekstraksi Matriks DCT &amp; SHA-256</div>
                </div>
                <div className={`p-2.5 rounded border transition-all ${
                  globalScanStage >= 2
                    ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)] font-semibold shadow-sm"
                    : "border-[var(--line)] text-[var(--mute)] opacity-50"
                }`}>
                  <div className="text-[10px] text-[var(--mute)] mb-0.5">TAHAP 02</div>
                  <div>Ekstraksi Biometrik Wajah &amp; pHash</div>
                </div>
                <div className={`p-2.5 rounded border transition-all ${
                  globalScanStage >= 3
                    ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)] font-semibold shadow-sm"
                    : "border-[var(--line)] text-[var(--mute)] opacity-50"
                }`}>
                  <div className="text-[10px] text-[var(--mute)] mb-0.5">TAHAP 03</div>
                  <div>Querying Jaringan TikTok, IG, FB, TG, 𝕏</div>
                </div>
                <div className={`p-2.5 rounded border transition-all ${
                  globalScanStage >= 4
                    ? "bg-[var(--s2)] border-[var(--acc)] text-[var(--ink)] font-semibold shadow-sm"
                    : "border-[var(--line)] text-[var(--mute)] opacity-50"
                }`}>
                  <div className="text-[10px] text-[var(--mute)] mb-0.5">TAHAP 04</div>
                  <div>Korelasi Jarak Bit &amp; Kloning</div>
                </div>
              </div>
            </div>
          )}

          {/* Skeleton Discovery Cards while Scanning */}
          {globalScanning && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                <span className="text-[13px] font-semibold text-[var(--ink)] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--acc)] animate-ping" />
                  <span>Menyisir Jaringan Media Sosial Global untuk Foto Ini...</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--mute)]">
                  Live OSINT Pipeline Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { platform: "TikTok", label: "Menyisir akun pancingan video & bio..." },
                  { platform: "Instagram", label: "Memeriksa profil kloning & bio..." },
                  { platform: "Facebook", label: "Menganalisis grup & halaman publik..." },
                  { platform: "Telegram", label: "Memindai kanal publik & bot APK..." },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center text-[var(--acc)]">
                          <RefreshCw className="w-5 h-5 animate-spin opacity-40" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-4 w-32 bg-[var(--s2)] rounded" />
                          <div className="h-3 w-20 bg-[var(--s2)]/60 rounded" />
                          <div className="h-4 w-16 bg-[var(--s2)] rounded text-[10px] font-mono text-[var(--mute)] flex items-center px-1">
                            {item.platform}
                          </div>
                        </div>
                      </div>
                      <div className="h-6 w-20 bg-[var(--s2)] rounded" />
                    </div>
                    <div className="pt-2 border-t border-[var(--line)] text-[11px] font-mono text-[var(--mute)] flex items-center justify-between">
                      <span>Status: Querying...</span>
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {globalScanError && (
            <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{globalScanError}</span>
            </div>
          )}

          {/* Results View for Global Profile Search */}
          {globalScanResult && !globalScanning && (
            <div className="space-y-6">
              {/* Telemetry KPI Overview Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
                    <span>Entitas Teridentifikasi</span>
                    <User className="w-4 h-4 text-[var(--acc)]" />
                  </div>
                  <b className="block text-[18px] font-semibold text-[var(--ink)] mt-1.5 truncate">
                    {globalScanResult.matched_entity_name}
                  </b>
                  <small className="text-[11px] text-[var(--mute)] font-mono truncate block">
                    Berkas: {globalScanResult.forensics.file_name}
                  </small>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
                    <span>Total Profil Terdeteksi</span>
                    <Globe className="w-4 h-4 text-[var(--mute)]" />
                  </div>
                  <b className="block text-[28px] font-semibold text-[var(--ink)] mt-1 tabular-nums font-mono">
                    {globalScanResult.total_profiles_matched} Akun
                  </b>
                  <small className="text-[11.5px] text-[var(--mute)]">
                    Lintas TikTok, IG, FB, TG, 𝕏
                  </small>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
                    <span>Akun Klon / Bahaya</span>
                    <AlertOctagon className="w-4 h-4 text-[var(--hi)]" />
                  </div>
                  <b className="block text-[28px] font-semibold text-[var(--hi)] mt-1 tabular-nums font-mono">
                    {globalScanResult.high_risk_matches} Kloning
                  </b>
                  <small className="text-[11.5px] text-[var(--hi)] font-semibold">
                    Kategori Risiko Tinggi / Kritis
                  </small>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
                    <span>Sidik Jari pHash</span>
                    <Hash className="w-4 h-4 text-[var(--mute)]" />
                  </div>
                  <b className="block text-[16px] font-mono font-semibold text-[var(--ink)] mt-2 tracking-wider truncate">
                    {globalScanResult.target_phash}
                  </b>
                  <small className="text-[11px] text-[var(--mute)] font-mono">
                    SHA-256: {globalScanResult.target_sha256.slice(0, 12)}...
                  </small>
                </section>
              </div>

              {/* Filter Platform Chips */}
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-3 flex-wrap gap-2">
                <span className="text-[13px] font-semibold text-[var(--ink)]">
                  Daftar Akun Pengguna Terdeteksi Menggunakan Foto Ini
                </span>

                <div className="flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto">
                  <span className="text-[var(--mute)] font-sans mr-1">Filter Platform:</span>
                  {["all", "tiktok", "instagram", "facebook", "telegram", "x"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setGlobalPlatformFilter(p)}
                      className={`px-2 py-0.5 rounded transition-colors uppercase ${
                        globalPlatformFilter === p
                          ? "bg-[var(--acc)] text-white font-bold"
                          : "bg-[var(--s2)] text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matched Profiles Cards Grid */}
              <div className="space-y-4">
                {filteredGlobalProfiles.length === 0 ? (
                  <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-8 text-center text-[var(--mute)] font-mono text-[13px]">
                    Tidak ada akun pada filter platform "{globalPlatformFilter.toUpperCase()}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredGlobalProfiles.map((match) => {
                      const isAnchor = match.is_official_anchor;
                      const isCritical = match.risk_severity === "critical";

                      return (
                        <div
                          key={match.candidate_id}
                          className={`bg-[var(--s1)] border rounded-[10px] p-4 flex flex-col justify-between transition-all ${
                            isAnchor
                              ? "border-[var(--lo)]/40 bg-[var(--lo)]/5"
                              : isCritical
                              ? "border-[var(--hi)]/40 hover:border-[var(--hi)]"
                              : "border-[var(--line)] hover:border-[var(--mute)]"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Profile Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <SmartProfileAvatar
                                  src={match.avatar_path || match.avatar_url}
                                  alt={match.username}
                                  className="w-12 h-12 rounded-lg"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-[14px] text-[var(--ink)] truncate block">
                                      {match.display_name}
                                    </span>
                                  </div>
                                  <span className="text-[12px] font-mono text-[var(--mute)] block truncate">
                                    @{match.username}
                                  </span>
                                  <div className="mt-1">
                                    <PlatformBadge platform={match.platform} />
                                  </div>
                                </div>
                              </div>

                              {/* Visual Similarity Pill */}
                              <div className="text-right shrink-0 font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    match.visual_similarity_score >= 95
                                      ? "bg-[var(--hi)] text-black"
                                      : match.visual_similarity_score >= 85
                                      ? "bg-[var(--acc)] text-white"
                                      : "bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)]"
                                  }`}
                                >
                                  {match.visual_similarity_score.toFixed(1)}% Match
                                </span>
                                <span className="block text-[10px] text-[var(--mute)] mt-0.5">
                                  Dist: {match.hash_distance} bit
                                </span>
                              </div>
                            </div>

                            {/* Classification & Threat Indicators */}
                            <div className="space-y-1.5 pt-2 border-t border-[var(--line)] text-[12px]">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-[var(--mute)]">Klasifikasi:</span>
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    isAnchor
                                      ? "text-[var(--lo)]"
                                      : isCritical
                                      ? "text-[var(--hi)]"
                                      : "text-[var(--acc)]"
                                  }`}
                                >
                                  {match.match_classification}
                                </span>
                              </div>

                              {match.threat_indicators && match.threat_indicators.length > 0 && (
                                <div className="space-y-1">
                                  {match.threat_indicators.map((threat, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[11.5px] text-[var(--ink)] flex items-start gap-1.5 leading-snug"
                                    >
                                      <AlertTriangle
                                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                          isAnchor ? "text-[var(--lo)]" : "text-[var(--hi)]"
                                        }`}
                                      />
                                      <span>{threat}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {match.suspicious_contacts && match.suspicious_contacts.length > 0 && (
                                <div className="text-[11px] font-mono text-[var(--mute)] flex items-center gap-1.5">
                                  <span className="font-semibold text-[var(--hi)]">Kontak Terkait:</span>
                                  <span>{match.suspicious_contacts.join(", ")}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[var(--line)]">
                            <a
                              href={match.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11.5px] font-mono text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
                            >
                              <span>Buka Profil Asli</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {!isAnchor && (
                              <button
                                type="button"
                                onClick={() => handleVaultProfileMatch(match)}
                                disabled={vaultLoadingId === match.candidate_id}
                                className="px-2.5 py-1 rounded bg-[var(--acc)] hover:opacity-90 text-white font-semibold text-[11px] font-mono transition-opacity flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {vaultLoadingId === match.candidate_id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Lock className="w-3 h-3" />
                                )}
                                <span>Kunci ke Evidence Vault</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: FORENSIK EXIF & METADATA KAMERA (STANDALONE TAB) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "exif" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* ── Side-by-Side: Card Preview Foto (KIRI) & Card Upload (KANAN) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Card Preview Foto Diupload (Sebelah Kiri) */}
            <div className="lg:col-span-4 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                  <span className="text-[11px] font-mono font-semibold text-[var(--mute)] uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>Foto Forensik Aktif</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    {exifData && (
                      <button
                        type="button"
                        onClick={handleResetExif}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--mute)] hover:text-[var(--hi)] hover:bg-[var(--hi)]/10 border border-[var(--line)] transition-colors cursor-pointer"
                        title="Kosongkan berkas aktif"
                      >
                        Reset
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold flex items-center gap-1 ${
                      exifData
                        ? "bg-[var(--lo)]/15 text-[var(--lo)]"
                        : "bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)]"
                    }`}>
                      {exifData && <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)] animate-pulse" />}
                      <span>{exifData ? "EXIF TERANALISIS" : "MENUNGGU BERKAS"}</span>
                    </span>
                  </div>
                </div>

                {/* Thumbnail Display */}
                <div className="mt-3 relative w-full h-48 rounded-[8px] bg-[var(--s2)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                  {exifPreviewUrl ? (
                    <img
                      src={exifPreviewUrl}
                      alt={exifFileName}
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-[var(--mute)] p-4 text-center">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-[12px] font-mono">Belum ada foto yang diunggah</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Details */}
              <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-1 text-[11.5px] font-mono">
                <div className="flex justify-between items-center text-[var(--ink)] font-semibold truncate">
                  <span className="text-[var(--mute)] font-normal text-[11px]">Nama Berkas:</span>
                  <span className="truncate ml-2" title={exifFileName}>{exifFileName}</span>
                </div>
                <div className="flex justify-between items-center text-[var(--mute)]">
                  <span>Ukuran / Resolusi:</span>
                  <span className="text-[var(--ink)]">{exifFileSize} &bull; {exifDimensions}</span>
                </div>
                {exifData && (
                  <div className="flex justify-between items-center text-[var(--mute)] pt-1 border-t border-[var(--line)]/50">
                    <span>Perangkat:</span>
                    <span className="text-[var(--lo)] font-semibold truncate ml-2">
                      {exifData.camera.make ? `${exifData.camera.make} ${exifData.camera.model || ""}` : "DSLR / Mirrorless"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Upload & Sampel Uji Coba (Sebelah Kanan) */}
            <div className="lg:col-span-8 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 flex flex-col justify-between space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-[12px] font-semibold text-[var(--ink)] uppercase tracking-wider block">
                    Unggah Berkas Citra &bull; Forensik EXIF Hardware
                  </span>
                  <p className="text-[12px] text-[var(--mute)] mt-0.5 mb-0">
                    Ekstraksi otomatis hardware kamera, parameter optik, indikasi manipulasi software, dan koordinat satelit GPS.
                  </p>
                </div>

                {/* Pojok Kanan Card: Sampel Uji Coba dengan Teks Ringkas */}
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectExifSample("photoshop_tampered")}
                    disabled={exifLoading}
                    className="px-2.5 py-1 rounded bg-[var(--s2)] hover:bg-[var(--s1)] text-[var(--ink)] border border-[var(--line)] hover:border-[#ef4444] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Uji sampel foto hasil manipulasi Adobe Photoshop"
                  >
                    <AlertTriangle className="w-3 h-3 text-[#ef4444]" />
                    <span>Photoshop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectExifSample("iphone_gps")}
                    disabled={exifLoading}
                    className="px-2.5 py-1 rounded bg-[var(--s2)] hover:bg-[var(--s1)] text-[var(--ink)] border border-[var(--line)] hover:border-[#38bdf8] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Uji sampel foto iPhone dengan koordinat satelit GPS"
                  >
                    <MapPin className="w-3 h-3 text-[#38bdf8]" />
                    <span>iPhone GPS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectExifSample("canon_dslr")}
                    disabled={exifLoading}
                    className="px-2.5 py-1 rounded bg-[var(--s2)] hover:bg-[var(--s1)] text-[var(--ink)] border border-[var(--line)] hover:border-[#22c55e] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Uji sampel foto kamera profesional Canon DSLR asli"
                  >
                    <Camera className="w-3 h-3 text-[#22c55e]" />
                    <span>Canon DSLR</span>
                  </button>
                </div>
              </div>

              {/* Drop Zone Box for EXIF */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingExif(true);
                }}
                onDragLeave={() => setIsDraggingExif(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingExif(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleUploadExifOnly(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => exifFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[8px] p-5 text-center cursor-pointer transition-all flex-1 flex flex-col justify-center items-center ${
                  isDraggingExif
                    ? "border-[var(--acc)] bg-[var(--acc)]/5"
                    : "border-[var(--line)] hover:border-[var(--mute)] bg-[var(--s2)]/40 hover:bg-[var(--s2)]"
                }`}
              >
                <input
                  ref={exifFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/tiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleUploadExifOnly(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center text-[var(--acc)]">
                    {exifLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {exifLoading
                      ? "Mengekstrak Metadata EXIF & Kriptografi..."
                      : exifData
                      ? "Tarik & Lepas Foto di Sini, atau Klik untuk Mengganti Berkas"
                      : "Tarik & Lepas Foto di Sini, atau Klik untuk Memilih Berkas"}
                  </div>
                  <p className="text-[12px] text-[var(--mute)] max-w-md m-0">
                    Mendukung berkas JPEG/JPG murni kamera, TIFF, PNG ber-metadata, dan RAW.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {exifError && (
            <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{exifError}</span>
            </div>
          )}

          {/* Empty state when no photo uploaded */}
          {!exifData && !exifLoading && (
            <div className="p-8 rounded-[10px] bg-[var(--s1)] border border-[var(--line)] border-dashed text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center text-[var(--mute)]">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[14px] font-semibold text-[var(--ink)] m-0">Menunggu Berkas Citra untuk Forensik EXIF</h3>
                <p className="text-[12.5px] text-[var(--mute)] max-w-lg m-0">
                  Unggah berkas foto kamera melalui area di atas, atau klik salah satu sampel uji coba cepat (<span className="text-[#ef4444] font-mono font-medium">Photoshop</span>, <span className="text-[#38bdf8] font-mono font-medium">iPhone GPS</span>, <span className="text-[#22c55e] font-mono font-medium">Canon DSLR</span>) di sudut kanan atas untuk mengekstraksi metadata hardware.
                </p>
              </div>
            </div>
          )}

          {/* Deep EXIF Display */}
          {exifData && (
            <div className="space-y-6">
              {/* Telemetry Header Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block font-semibold">
                    Kamera &amp; Perangkat Keras
                  </span>
                  <strong className="text-[15px] text-[var(--ink)] block">
                    {exifData.camera.make ? `${exifData.camera.make} ${exifData.camera.model || ""}` : "Tidak Ada Tag Make/Model"}
                  </strong>
                  <span className="text-[12px] text-[var(--mute)] font-mono block">
                    {exifData.camera.lens_model || "Lensa Tidak Tersemat"}
                  </span>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block font-semibold">
                    Optik &amp; Pencahayaan
                  </span>
                  <strong className="text-[15px] text-[var(--ink)] block">
                    {exifData.optics.exposure_time || "N/A"} &bull; {exifData.optics.f_number || "N/A"}
                  </strong>
                  <span className="text-[12px] text-[var(--mute)] font-mono block">
                    ISO {exifData.optics.iso || "Auto"} &bull; {exifData.optics.focal_length || "Focal N/A"}
                  </span>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-1">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block font-semibold">
                    Integritas Software
                  </span>
                  <strong
                    className={`text-[15px] block ${
                      exifData.software.tampering_detected ? "text-[var(--hi)]" : "text-[var(--lo)]"
                    }`}
                  >
                    {exifData.software.tampering_detected ? "Indikasi Manipulasi Terdeteksi" : "Autentik / Bersih"}
                  </strong>
                  <span className="text-[12px] text-[var(--mute)] font-mono block truncate">
                    {exifData.software.software || "Firmware Kamera Standar"}
                  </span>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block font-semibold">
                    Rantai Kustodi Bukti
                  </span>
                  <button
                    type="button"
                    onClick={handleVaultExifEvidence}
                    disabled={vaultLoadingId === "exif_pure"}
                    className="w-full text-center px-3 py-2 rounded-[6px] bg-[var(--acc)] hover:opacity-90 text-white font-semibold text-[12px] font-mono transition-opacity flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {vaultLoadingId === "exif_pure" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                    <span>Kunci EXIF ke Vault</span>
                  </button>
                </section>
              </div>

              {/* GPS Satellite Telemetry */}
              {exifData.gps.has_gps && (
                <div className="bg-[var(--s1)] border border-[#38bdf8]/40 rounded-[10px] p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#38bdf8]" />
                      <h3 className="text-[14px] font-bold text-[var(--ink)] m-0">
                        Telemetri Satelit GPS Tersemat (Lokasi Fisik Foto)
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {exifData.gps.google_maps_url && (
                        <a
                          href={exifData.gps.google_maps_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[11px] font-mono font-semibold flex items-center gap-1"
                        >
                          <span>Buka Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {exifData.gps.openstreetmap_url && (
                        <a
                          href={exifData.gps.openstreetmap_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-[var(--s2)] border border-[var(--line)] text-[var(--ink)] text-[11px] font-mono flex items-center gap-1"
                        >
                          <span>OpenStreetMap</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="text-[12.5px] font-mono text-[var(--ink)] m-0">
                    Koordinat: <strong>{exifData.gps.location_hint}</strong> &bull; Ketinggian: <strong>{exifData.gps.altitude} m DPL</strong>
                  </p>
                </div>
              )}

              {/* Cryptographic Hashes */}
              <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-2 text-[12px] font-mono">
                <div className="flex justify-between items-center text-[var(--mute)]">
                  <span className="font-semibold text-[var(--ink)]">Sidik Jari Kriptografis Berkas</span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(exifData.hashes.sha256)}
                    className="flex items-center gap-1 text-[var(--acc)] hover:underline cursor-pointer"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHash ? "Tersalin" : "Salin SHA-256"}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] text-[var(--ink)] break-all select-all">
                  SHA-256: {exifData.hashes.sha256}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11.5px] pt-1">
                  <div>MD5: <span className="text-[var(--mute)]">{exifData.hashes.md5}</span></div>
                  <div>pHash: <span className="text-[var(--acc)]">{exifData.hashes.phash}</span></div>
                  <div>dHash: <span className="text-[var(--mute)]">{exifData.hashes.dhash}</span></div>
                </div>
              </div>

              {/* Raw EXIF Explorer */}
              <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-3">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-bold text-[var(--ink)] m-0">
                    Penjelajah Header EXIF Lengkap ({filteredRawExif.length} Tag)
                  </h3>
                  <input
                    type="text"
                    value={exifSearch}
                    onChange={(e) => setExifSearch(e.target.value)}
                    placeholder="Cari nama atau nilai tag EXIF..."
                    className="bg-[var(--s2)] border border-[var(--line)] rounded-[5px] px-3 py-1 text-[12px] text-[var(--ink)] font-mono placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] w-full sm:w-64"
                  />
                </div>

                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-[12px] font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--mute)] text-left">
                        <th className="py-1.5 pr-4 w-1/3">Tag EXIF</th>
                        <th className="py-1.5">Nilai Header</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRawExif.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-[var(--mute)]">
                            Tidak ada tag EXIF yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredRawExif.map(([tagKey, tagVal]) => (
                          <tr key={tagKey} className="border-b border-[var(--line)]/50 hover:bg-[var(--s2)]">
                            <td className="py-1.5 pr-4 text-[var(--ink)] font-semibold">{tagKey}</td>
                            <td className="py-1.5 text-[var(--mute)] break-all">{tagVal}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: KOMPARASI SPEKTRAL CITRA 1-ON-1 (DIRECT DUAL-IMAGE) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "compare" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-[15px] font-bold text-[var(--ink)] m-0 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--acc)]" />
                  <span>Komparasi Citra Spektral 1-on-1 (Dual-Image)</span>
                </h2>
                <p className="text-[12.5px] text-[var(--mute)] m-0 mt-0.5">
                  Bandingkan dua citra langsung via ekstraksi pHash, dHash, dan Hamming bit distance untuk mendeteksi peniruan, modifikasi visual, atau perbedaan subjek.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                {COMPARE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectComparePreset(preset.id)}
                    disabled={compareLoading}
                    className="px-2.5 py-1 rounded bg-[var(--s2)] hover:bg-[var(--s1)] text-[var(--ink)] border border-[var(--line)] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title={preset.description}
                  >
                    <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${preset.badgeClass}`}>
                      {preset.badge}
                    </span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Side-by-Side Dual Upload Zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card Gambar A */}
              <div className="bg-[var(--s2)]/40 border border-[var(--line)] rounded-[8px] p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                  <span className="text-[11px] font-mono font-semibold text-[var(--lo)] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--lo)]" />
                    <span>Gambar A &bull; Foto Acuan / Asli</span>
                  </span>
                  {comparePreviewA && (
                    <button
                      type="button"
                      onClick={() => fileInputARef.current?.click()}
                      className="text-[11px] font-mono text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                  )}
                </div>

                {comparePreviewA ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-44 rounded-[6px] bg-[var(--s1)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                      <img src={comparePreviewA} alt="Gambar A" className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="p-2 rounded bg-[var(--s1)] border border-[var(--line)] flex justify-between items-center text-[11px] font-mono">
                      <span className="text-[var(--mute)]">Berkas:</span>
                      <span className="text-[var(--ink)] font-semibold truncate ml-2 max-w-[200px]" title={compareFileAName || compareMetrics?.file_a_name}>
                        {compareFileAName || compareMetrics?.file_a_name || "Gambar_A.jpg"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingA(true); }}
                    onDragLeave={() => setIsDraggingA(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingA(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectCompareFileA(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputARef.current?.click()}
                    className={`border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[176px] ${
                      isDraggingA ? "border-[var(--lo)] bg-[var(--lo)]/5" : "border-[var(--line)] hover:border-[var(--mute)] bg-[var(--s1)]/40 hover:bg-[var(--s1)]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center text-[var(--lo)] mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-[12.5px] font-semibold text-[var(--ink)]">
                      Unggah Foto Acuan A
                    </span>
                    <p className="text-[11.5px] text-[var(--mute)] m-0 mt-0.5">
                      Tarik &amp; lepas atau klik untuk memilih berkas foto resmi
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputARef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectCompareFileA(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Card Gambar B */}
              <div className="bg-[var(--s2)]/40 border border-[var(--line)] rounded-[8px] p-4 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                  <span className="text-[11px] font-mono font-semibold text-[var(--hi)] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--hi)]" />
                    <span>Gambar B &bull; Foto Pembanding / Suspek</span>
                  </span>
                  {comparePreviewB && (
                    <button
                      type="button"
                      onClick={() => fileInputBRef.current?.click()}
                      className="text-[11px] font-mono text-[var(--mute)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    >
                      Ganti Berkas
                    </button>
                  )}
                </div>

                {comparePreviewB ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-44 rounded-[6px] bg-[var(--s1)] border border-[var(--line)] overflow-hidden flex items-center justify-center">
                      <img src={comparePreviewB} alt="Gambar B" className="w-full h-full object-contain p-1" />
                    </div>
                    <div className="p-2 rounded bg-[var(--s1)] border border-[var(--line)] flex justify-between items-center text-[11px] font-mono">
                      <span className="text-[var(--mute)]">Berkas:</span>
                      <span className="text-[var(--ink)] font-semibold truncate ml-2 max-w-[200px]" title={compareFileBName || compareMetrics?.file_b_name}>
                        {compareFileBName || compareMetrics?.file_b_name || "Gambar_B.jpg"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingB(true); }}
                    onDragLeave={() => setIsDraggingB(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingB(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleSelectCompareFileB(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputBRef.current?.click()}
                    className={`border-2 border-dashed rounded-[6px] p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[176px] ${
                      isDraggingB ? "border-[var(--hi)] bg-[var(--hi)]/5" : "border-[var(--line)] hover:border-[var(--mute)] bg-[var(--s1)]/40 hover:bg-[var(--s1)]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--s2)] border border-[var(--line)] flex items-center justify-center text-[var(--hi)] mb-2">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-[12.5px] font-semibold text-[var(--ink)]">
                      Unggah Foto Pembanding B
                    </span>
                    <p className="text-[11.5px] text-[var(--mute)] m-0 mt-0.5">
                      Tarik &amp; lepas atau klik untuk memilih berkas foto suspek
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputBRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleSelectCompareFileB(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
              <div className="text-[12px] font-mono text-[var(--mute)]">
                {compareFileA && compareFileB ? (
                  <span className="text-[var(--lo)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kedua berkas siap untuk dikomparasi</span>
                  </span>
                ) : (
                  <span>Unggah berkas Gambar A dan Gambar B, atau pilih sampel preset di atas</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(comparePreviewA || comparePreviewB || compareMetrics) && (
                  <button
                    type="button"
                    onClick={handleResetComparison}
                    className="px-3 py-2 rounded-[6px] bg-[var(--s2)] hover:bg-[var(--s1)] text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)] text-[12px] font-mono transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRunComparison()}
                  disabled={compareLoading || (!compareFileA && !compareMetrics)}
                  className="px-4 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {compareLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  <span>Jalankan Komparasi Spektral</span>
                </button>
              </div>
            </div>

            {compareError && (
              <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{compareError}</span>
              </div>
            )}
          </div>

          {/* Results Section */}
          {compareMetrics && (
            <div className="space-y-6">
              {/* Executive Verdict Banner */}
              <div className="p-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] space-y-4">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-[var(--line)]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${
                        compareMetrics.match_classification === "EXACT_MATCH"
                          ? "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30"
                          : compareMetrics.match_classification === "CLONED_IMAGE"
                          ? "bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30"
                          : compareMetrics.match_classification === "MODIFIED_VARIANT"
                          ? "bg-[#eab308]/15 text-[#eab308] border-[#eab308]/30"
                          : "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30"
                      }`}>
                        {compareMetrics.match_classification.replace("_", " ")}
                      </span>
                      <span className="text-[12px] font-mono text-[var(--mute)]">
                        Metrik Spektral: pHash &amp; dHash (64-bit)
                      </span>
                    </div>
                    <div className="text-[14px] font-semibold text-[var(--ink)]">
                      {compareMetrics.verdict}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[var(--mute)] uppercase block">Kemiripan Visual</span>
                      <span className="text-[28px] font-bold font-mono tabular-nums text-[var(--ink)] tracking-tight">
                        {compareMetrics.similarity_score.toFixed(1)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleVaultComparisonEvidence}
                      disabled={vaultLoadingId === "compare_spectral"}
                      className="px-3.5 py-2 rounded-[6px] bg-[var(--acc)] hover:opacity-90 text-white text-[12px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {vaultLoadingId === "compare_spectral" ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Lock className="w-3.5 h-3.5" />
                      )}
                      <span>Kunci ke Vault</span>
                    </button>
                  </div>
                </div>

                {/* Bit Distance Metric Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <span className="text-[11px] font-mono text-[var(--mute)] block">pHash Hamming Distance</span>
                    <span className="text-[16px] font-mono font-bold text-[var(--ink)] tabular-nums mt-0.5 block">
                      {compareMetrics.phash_hamming_distance} <span className="text-[12px] font-normal text-[var(--mute)]">/ 64 bit</span>
                    </span>
                    <span className="text-[10.5px] text-[var(--mute)] font-mono">
                      {compareMetrics.phash_hamming_distance === 0 ? "0 perbedaan frekuensi spektral" : `${compareMetrics.phash_hamming_distance} bit berbeda`}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <span className="text-[11px] font-mono text-[var(--mute)] block">dHash Hamming Distance</span>
                    <span className="text-[16px] font-mono font-bold text-[var(--ink)] tabular-nums mt-0.5 block">
                      {compareMetrics.dhash_hamming_distance} <span className="text-[12px] font-normal text-[var(--mute)]">/ 64 bit</span>
                    </span>
                    <span className="text-[10.5px] text-[var(--mute)] font-mono">Gradien diferensial pixel</span>
                  </div>

                  <div className="p-3 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <span className="text-[11px] font-mono text-[var(--mute)] block">Rasio Dimensi A vs B</span>
                    <span className="text-[13px] font-mono font-bold text-[var(--ink)] mt-0.5 block">
                      {compareMetrics.file_a_dimensions.aspect_ratio} vs {compareMetrics.file_b_dimensions.aspect_ratio}
                    </span>
                    <span className="text-[10.5px] text-[var(--mute)] font-mono">
                      {compareMetrics.file_a_dimensions.width}×{compareMetrics.file_a_dimensions.height} vs {compareMetrics.file_b_dimensions.width}×{compareMetrics.file_b_dimensions.height}
                    </span>
                  </div>

                  <div className="p-3 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <span className="text-[11px] font-mono text-[var(--mute)] block">Integritas Kriptografis</span>
                    <span className={`text-[13px] font-mono font-bold mt-0.5 block ${
                      compareMetrics.file_a_hashes.sha256 === compareMetrics.file_b_hashes.sha256
                        ? "text-[#22c55e]"
                        : "text-[var(--mute)]"
                    }`}>
                      {compareMetrics.file_a_hashes.sha256 === compareMetrics.file_b_hashes.sha256
                        ? "SHA-256 IDENTIK"
                        : "DIGEST BERBEDA"}
                    </span>
                    <span className="text-[10.5px] text-[var(--mute)] font-mono">Verifikasi digest SHA-256</span>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Detailed Hash & Metadata Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Column Gambar A */}
                <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                    <span className="text-[11px] font-mono font-semibold text-[var(--lo)] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--lo)]" />
                      <span>Telemetri Gambar A (Acuan)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[var(--mute)]">{compareMetrics.file_a_size_formatted}</span>
                  </div>

                  <div className="space-y-2 text-[12px] font-mono">
                    <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-1">
                      <div className="flex justify-between text-[var(--mute)]">
                        <span>Nama Berkas:</span>
                        <span className="text-[var(--ink)] font-semibold truncate ml-2" title={compareMetrics.file_a_name}>{compareMetrics.file_a_name}</span>
                      </div>
                      <div className="flex justify-between text-[var(--mute)]">
                        <span>Resolusi &amp; Aspek:</span>
                        <span className="text-[var(--ink)]">{compareMetrics.file_a_dimensions.width} &times; {compareMetrics.file_a_dimensions.height} px ({compareMetrics.file_a_dimensions.aspect_ratio})</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-2">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>Perceptual Hash (pHash):</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_a_hashes.phash)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin pHash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--lo)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_a_hashes.phash}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>Difference Hash (dHash):</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_a_hashes.dhash)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin dHash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--ink)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_a_hashes.dhash}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>SHA-256 Digest:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_a_hashes.sha256)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin SHA-256"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--mute)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_a_hashes.sha256}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column Gambar B */}
                <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[var(--line)]">
                    <span className="text-[11px] font-mono font-semibold text-[var(--hi)] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--hi)]" />
                      <span>Telemetri Gambar B (Suspek)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[var(--mute)]">{compareMetrics.file_b_size_formatted}</span>
                  </div>

                  <div className="space-y-2 text-[12px] font-mono">
                    <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-1">
                      <div className="flex justify-between text-[var(--mute)]">
                        <span>Nama Berkas:</span>
                        <span className="text-[var(--ink)] font-semibold truncate ml-2" title={compareMetrics.file_b_name}>{compareMetrics.file_b_name}</span>
                      </div>
                      <div className="flex justify-between text-[var(--mute)]">
                        <span>Resolusi &amp; Aspek:</span>
                        <span className="text-[var(--ink)]">{compareMetrics.file_b_dimensions.width} &times; {compareMetrics.file_b_dimensions.height} px ({compareMetrics.file_b_dimensions.aspect_ratio})</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-2">
                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>Perceptual Hash (pHash):</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_b_hashes.phash)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin pHash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--lo)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_b_hashes.phash}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>Difference Hash (dHash):</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_b_hashes.dhash)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin dHash"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--ink)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_b_hashes.dhash}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[11px] text-[var(--mute)] mb-0.5">
                          <span>SHA-256 Digest:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(compareMetrics.file_b_hashes.sha256)}
                            className="hover:text-[var(--ink)] transition-colors cursor-pointer"
                            title="Salin SHA-256"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] font-mono text-[var(--mute)] break-all bg-[var(--s1)] p-1.5 rounded border border-[var(--line)] select-all">
                          {compareMetrics.file_b_hashes.sha256}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Matrix Interpretation Card */}
              <div className="p-4 rounded-[10px] bg-[var(--s1)] border border-[var(--line)] space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[var(--acc)]" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink)] font-mono">
                    Matriks Interpretasi Forensik Spektral pHash (64-Bit Hamming)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11.5px] font-mono">
                  <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <div className="text-[#22c55e] font-bold">0 bit (100% Match)</div>
                    <div className="text-[var(--mute)] mt-0.5">Kloning identik sempurna / byte-level duplicate tanpa perubahan frekuensi visual.</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <div className="text-[#38bdf8] font-bold">1 - 5 bit (92% - 98%)</div>
                    <div className="text-[var(--mute)] mt-0.5">Varian modifikasi (re-encoding JPEG, crop ringan, watermark, atau rotasi mikro).</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <div className="text-[#eab308] font-bold">6 - 10 bit (84% - 91%)</div>
                    <div className="text-[var(--mute)] mt-0.5">Kemiripan pola substansial (kemungkinan variasi angle pemotretan atau filter kontras tinggi).</div>
                  </div>
                  <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)]">
                    <div className="text-[#ef4444] font-bold">&gt; 10 bit (&lt;84%)</div>
                    <div className="text-[var(--mute)] mt-0.5">Citra berbeda secara struktur visual dan spektral frekuensi gambar.</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Professional Modal for Evidence Custody Seal ── */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        variant={modalConfig.variant}
        details={modalConfig.details}
      />
    </div>
  );
}

export default function AnalisisGambarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat modul analisis gambar...</div>}>
      <AnalisisGambarContent />
    </Suspense>
  );
}
