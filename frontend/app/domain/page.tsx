"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Globe,
  Search,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Server,
  RefreshCw,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
  Radio,
  Zap,
  Layers,
  Bug,
  Terminal,
  Copy,
  Check,
  AlertOctagon,
  FileText,
  Briefcase,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  DomainAuditRecord,
  NucleiScanResponse,
  NucleiVulnerabilityItem,
  SubdomainItem,
  SubdomainScanResponse,
} from "@/types";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

const QUICK_PRESETS = [
  "presidenri.go.id",
  "bca.co.id",
  "kemkes.go.id",
  "jokowi-bantuan2026.com",
];

function DomainContent() {
  const searchParams = useSearchParams();
  const initialDomain =
    searchParams.get("query") || searchParams.get("domain") || "presidenri.go.id";

  const [activeTab, setActiveTab] = useState<"whois" | "subdomains" | "nuclei">("whois");

  // Tab 1: WHOIS & DNS State
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [record, setRecord] = useState<DomainAuditRecord | null>(null);
  const [loadingWhois, setLoadingWhois] = useState(false);
  const [errorWhois, setErrorWhois] = useState<string | null>(null);
  const [showRawWhois, setShowRawWhois] = useState(false);

  // Tab 2: Subdomain Finder State
  const [subdomainInput, setSubdomainInput] = useState(initialDomain);
  const [subdomainResult, setSubdomainResult] = useState<SubdomainScanResponse | null>(null);
  const [loadingSubdomains, setLoadingSubdomains] = useState(false);
  const [errorSubdomains, setErrorSubdomains] = useState<string | null>(null);
  const [subdomainFilter, setSubdomainFilter] = useState("");
  const [filterOnlyLive, setFilterOnlyLive] = useState(false);

  // Tab 3: Nuclei Engine State & Live Stream
  const [nucleiTarget, setNucleiTarget] = useState(initialDomain);
  const [nucleiPreset, setNucleiPreset] = useState<"default" | "wordpress" | "cve">("default");
  const [nucleiResult, setNucleiResult] = useState<NucleiScanResponse | null>(null);
  const [loadingNuclei, setLoadingNuclei] = useState(false);
  const [errorNuclei, setErrorNuclei] = useState<string | null>(null);
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([
    "critical",
    "high",
    "medium",
    "low",
  ]);
  const [terminalLogs, setTerminalLogs] = useState<
    Array<{ id: string; level: string; message: string; timestamp: string }>
  >([]);
  const [autoScrollTerminal, setAutoScrollTerminal] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [copiedCurlId, setCopiedCurlId] = useState<string | null>(null);
  const [copiedSubdomain, setCopiedSubdomain] = useState<string | null>(null);
  const [vaultLoadingId, setVaultLoadingId] = useState<string | null>(null);

  // Modal State
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

  const closeModal = () => setModalConfig((prev) => ({ ...prev, isOpen: false }));

  // Auto-load WHOIS on mount
  useEffect(() => {
    if (initialDomain) {
      handleLookup(initialDomain);
      setSubdomainInput(initialDomain);
      setNucleiTarget(initialDomain);
    }
  }, [initialDomain]);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (autoScrollTerminal && terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs, autoScrollTerminal]);

  // Tab 1: Lookup Handler
  const handleLookup = async (targetDomain: string) => {
    if (!targetDomain.trim()) return;
    setLoadingWhois(true);
    setErrorWhois(null);

    try {
      const res = await api.auditDomain(targetDomain.trim());
      setRecord(res);
    } catch (err: any) {
      setErrorWhois(err.message || "Gagal melakukan audit live domain.");
    } finally {
      setLoadingWhois(false);
    }
  };

  // Tab 2: Subdomain Enumeration Handler
  const handleScanSubdomains = async (domainToScan: string) => {
    if (!domainToScan.trim()) return;
    setLoadingSubdomains(true);
    setErrorSubdomains(null);

    try {
      const res = await api.scanSubdomains(domainToScan.trim(), 80);
      setSubdomainResult(res);
    } catch (err: any) {
      setErrorSubdomains(err.message || "Gagal menjalankan Subdomain Finder.");
    } finally {
      setLoadingSubdomains(false);
    }
  };

  // Tab 3: Nuclei Vulnerability Scan & SSE Stream Handler
  const handleRunNuclei = async (
    targetToScan: string,
    presetOverride?: "default" | "wordpress" | "cve"
  ) => {
    if (!targetToScan.trim()) return;
    const target = targetToScan.trim();
    const activePreset = presetOverride || nucleiPreset;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingNuclei(true);
    setErrorNuclei(null);

    // Initialize clean state for live scan
    setNucleiResult({
      target,
      preset: activePreset,
      total_findings: 0,
      critical_count: 0,
      high_count: 0,
      medium_count: 0,
      low_count: 0,
      info_count: 0,
      findings: [],
      scanned_at: new Date().toISOString(),
      execution_time_seconds: 0,
    });

    const now = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-init`,
        level: "INFO",
        message: `Memulai audit keamanan NEXTRACE (Preset: ${activePreset.toUpperCase()}) pada ${target}...`,
        timestamp: now,
      },
    ]);

    try {
      await api.streamNuclei(
        {
          target,
          preset: activePreset,
          severity: selectedSeverities,
        },
        {
          onLog: (log) => {
            setTerminalLogs((prev) => [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                level: log.level,
                message: log.message,
                timestamp: log.timestamp,
              },
            ]);
          },
          onFinding: (finding) => {
            setNucleiResult((prev) => {
              if (!prev) return null;
              const exists = prev.findings.some(
                (f) =>
                  f.template_id === finding.template_id &&
                  f.matched_at === finding.matched_at
              );
              if (exists) return prev;

              const updatedFindings = [finding, ...prev.findings];
              return {
                ...prev,
                total_findings: updatedFindings.length,
                critical_count: updatedFindings.filter((f) => f.severity === "critical").length,
                high_count: updatedFindings.filter((f) => f.severity === "high").length,
                medium_count: updatedFindings.filter((f) => f.severity === "medium").length,
                low_count: updatedFindings.filter((f) => f.severity === "low").length,
                info_count: updatedFindings.filter((f) => f.severity === "info").length,
                findings: updatedFindings,
              };
            });
          },
          onSummary: (summary) => {
            setNucleiResult(summary);
          },
          onError: (err) => {
            setErrorNuclei(err.message || "Gagal melakukan streaming audit Nuclei.");
            setTerminalLogs((prev) => [
              ...prev,
              {
                id: `${Date.now()}-err`,
                level: "ERROR",
                message: `Kesalahan stream: ${err.message || "Koneksi terputus"}`,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          },
          onComplete: () => {
            setLoadingNuclei(false);
          },
        },
        controller.signal
      );
    } catch (err: any) {
      if (!controller.signal.aborted) {
        setErrorNuclei(err.message || "Gagal menghubungkan streaming audit Nuclei.");
      }
    } finally {
      setLoadingNuclei(false);
    }
  };

  const handleAbortScan = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoadingNuclei(false);
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: `${Date.now()}-abort`,
          level: "WARN",
          message: "Audit dihentikan oleh pengguna (ABORTED).",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleClearTerminal = () => {
    setTerminalLogs([]);
  };

  const handleCopyLogs = () => {
    const raw = terminalLogs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(raw);
    setCopiedCurlId("all-logs");
    setTimeout(() => setCopiedCurlId(null), 2000);
  };

  // Switch to Nuclei with selected subdomain
  const handleSendToNuclei = (subdomain: string) => {
    setNucleiTarget(subdomain);
    setActiveTab("nuclei");
    handleRunNuclei(subdomain);
  };

  const handleCopyText = (text: string, id: string, type: "curl" | "subdomain") => {
    navigator.clipboard.writeText(text);
    if (type === "curl") {
      setCopiedCurlId(id);
      setTimeout(() => setCopiedCurlId(null), 2000);
    } else {
      setCopiedSubdomain(id);
      setTimeout(() => setCopiedSubdomain(null), 2000);
    }
  };

  // Vault a security finding into Evidence Vault
  const handleVaultFinding = async (item: NucleiVulnerabilityItem | SubdomainItem) => {
    const isSubdomain = "subdomain" in item;
    const identifier = isSubdomain ? item.subdomain : item.template_id;
    setVaultLoadingId(identifier);

    try {
      const formData = new FormData();
      formData.append("investigation_id", "inv-general-001");
      formData.append("evidence_type", "document");
      formData.append(
        "source_url",
        isSubdomain ? `https://${item.subdomain}` : item.matched_at
      );
      formData.append(
        "collection_method",
        isSubdomain ? "osint_subdomain_takeover_detector" : "nuclei_vulnerability_scanner"
      );

      const metadataPayload = isSubdomain
        ? {
            subdomain: item.subdomain,
            cname: item.cname,
            takeover_risk: item.is_takeover_risk,
            service: item.takeover_service,
            status_code: item.status_code,
          }
        : {
            template_id: item.template_id,
            name: item.name,
            severity: item.severity,
            matched_at: item.matched_at,
            cve_id: item.cve_id,
            curl_command: item.curl_command,
          };

      formData.append("metadata", JSON.stringify(metadataPayload));

      const res = await api.createEvidence(formData);
      setModalConfig({
        isOpen: true,
        title: "Temuan Berhasil Dikunci ke Evidence Vault",
        description: `Bukti digital ${isSubdomain ? item.subdomain : item.name} resmi diamankan ke loker barang bukti forensik dengan segel SHA-256.`,
        variant: "success",
        confirmText: "Buka Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = "/evidence";
        },
        details: [
          { label: "ID Bukti Vault", value: res.evidence_id },
          { label: "SHA-256 Hash", value: res.file_hash_sha256 || "TERVERIFIKASI" },
          {
            label: "Metode Akuisisi",
            value: isSubdomain ? "Subdomain Takeover Detector" : "Nuclei Security Engine",
          },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Chain of Custody)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci Bukti",
        description: "Terjadi kesalahan saat menyegel bukti ke server.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaultLoadingId(null);
    }
  };

  // Filtered subdomains
  const filteredSubdomains = (subdomainResult?.subdomains || []).filter((s) => {
    if (filterOnlyLive && !s.is_live) return false;
    if (subdomainFilter.trim()) {
      const q = subdomainFilter.toLowerCase();
      return (
        s.subdomain.toLowerCase().includes(q) ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.server && s.server.toLowerCase().includes(q)) ||
        (s.cname && s.cname.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const isHighRisk = record?.risk_status === "Tinggi";
  const isMedRisk = record?.risk_status === "Sedang";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; ATTACK SURFACE MANAGEMENT &bull; NUCLEI ENGINE
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Domain &amp; Attack Surface Intelligence
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Audit kepemilikan WHOIS/DNS, penemuan subdomain infrastruktur (Subfinder), dan pemindaian kerentanan otomatis (Nuclei Engine v3.11).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* ── 3 NAVIGATION TABS ── */}
          <div className="flex items-center gap-1.5 p-1 bg-[var(--s1)] border border-[var(--line)] rounded-[8px] overflow-x-auto max-w-full pb-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("whois")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "whois"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
              <span>WHOIS &amp; DNS</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("subdomains");
                if (!subdomainResult && domainInput) {
                  handleScanSubdomains(domainInput);
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "subdomains"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Subdomain Finder</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("nuclei")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[5px] text-[12px] font-mono transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                activeTab === "nuclei"
                  ? "bg-[var(--s2)] text-[var(--ink)] font-semibold border border-[var(--acc)] shadow-sm"
                  : "text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-[#ef4444]" />
              <span>Pemindai Nuclei</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: WHOIS & DNS REPUTATION ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "whois" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Search Bar */}
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLookup(domainInput);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <Globe className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-3 stroke-[1.8]" />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="Masukkan nama domain target (misal: presidenri.go.id, bca.co.id)"
                  className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loadingWhois}
                className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loadingWhois ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>{loadingWhois ? "Mengaudit DNS & WHOIS..." : "Cek Domain Real-Time"}</span>
              </button>
            </form>

            <div className="flex items-center gap-2 pt-3 text-[12px] text-[var(--mute)] overflow-x-auto">
              <span className="shrink-0 font-medium">Domain Sasaran Cepat:</span>
              {QUICK_PRESETS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setDomainInput(sample);
                    setSubdomainInput(sample);
                    setNucleiTarget(sample);
                    handleLookup(sample);
                  }}
                  className="px-2.5 py-1 rounded bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] font-mono text-[11px] transition-colors shrink-0"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {errorWhois && (
            <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorWhois}</span>
            </div>
          )}

          {record && (
            <>
              {/* Executive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12.5px] font-medium mb-1">
                    <span>Status &amp; Indeks Reputasi</span>
                    <Shield className="w-4 h-4 text-[var(--mute)]" />
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <b
                      className={`text-[22px] font-bold font-mono ${
                        isHighRisk ? "text-[var(--hi)]" : isMedRisk ? "text-[var(--mid)]" : "text-[var(--lo)]"
                      }`}
                    >
                      {record.risk_status.toUpperCase()}
                    </b>
                    <span className="text-[12px] text-[var(--mute)] font-mono">
                      (Skor Risiko: {record.risk_score}/100)
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {record.risk_reasons.map((r, i) => (
                      <div key={i} className="text-[11.5px] text-[var(--mute)] flex items-start gap-1.5 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)] shrink-0 mt-1" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[12.5px] font-medium mb-1">
                    <span>Registrar &amp; Usia Domain</span>
                    <Calendar className="w-4 h-4 text-[var(--mute)]" />
                  </div>
                  <b className="block text-[14.5px] font-semibold text-[var(--ink)] mt-2 leading-snug">
                    {record.registrar}
                  </b>
                  <div className="text-[12px] text-[var(--mute)] font-mono mt-3 space-y-1.5">
                    <div>
                      Usia: <strong className="text-[var(--ink)]">{record.domain_age_formatted}</strong>
                    </div>
                    <div>Terdaftar: {record.created_date}</div>
                    <div>Kedaluwarsa: {record.expiry_date}</div>
                  </div>
                </section>

                <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center text-[var(--mute)] text-[12.5px] font-medium mb-1">
                      <span>Infrastruktur IP &amp; TLS</span>
                      <Lock className="w-4 h-4 text-[var(--mute)]" />
                    </div>
                    <b className="block text-[14px] font-mono font-semibold text-[var(--ink)] mt-2">
                      {record.primary_ip}
                    </b>
                    <small className="text-[12px] text-[var(--mute)] block mt-1 line-clamp-1">
                      SSL: {record.ssl_issuer}
                    </small>
                    {record.ssl_expiry && record.ssl_expiry !== "-" && (
                      <small className="text-[11px] text-[var(--mute)] font-mono block mt-0.5">
                        Valid sampai: {record.ssl_expiry}
                      </small>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--line)] mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubdomainInput(record.clean_domain);
                        setActiveTab("subdomains");
                        handleScanSubdomains(record.clean_domain);
                      }}
                      className="flex-1 text-center px-3 py-1.5 rounded-[6px] bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] text-[12px] font-mono transition-colors"
                    >
                      Pindai Subdomain
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNucleiTarget(record.clean_domain);
                        setActiveTab("nuclei");
                        handleRunNuclei(record.clean_domain);
                      }}
                      className="flex-1 text-center px-3 py-1.5 rounded-[6px] bg-[var(--acc)] text-white font-semibold text-[12px] hover:opacity-90 transition-opacity"
                    >
                      Audit Nuclei
                    </button>
                  </div>
                </section>
              </div>

              {/* Live DNS Records Table */}
              <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
                  <h2 className="text-[14.5px] font-semibold text-[var(--ink)] m-0 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[var(--acc)]" />
                    <span>Rekaman DNS Publik ({record.clean_domain})</span>
                    <span className="px-2 py-0.2 rounded bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25 text-[10.5px] font-mono font-semibold">
                      100% REAL-TIME RESOLVED
                    </span>
                  </h2>
                  <span className="text-[11px] font-mono text-[var(--mute)]">
                    Diaudit: {new Date(record.audited_at).toLocaleTimeString("id-ID")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse text-[13px]">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--mute)] text-[12px] font-medium bg-[var(--s2)]">
                        <th className="text-left py-2 px-3">Tipe Rekaman</th>
                        <th className="text-left py-2 px-3">Titik Sasaran / Host</th>
                        <th className="text-left py-2 px-3">Nilai Konfigurasi Terdeteksi</th>
                        <th className="text-right py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[12px] divide-y divide-[var(--line)]">
                      {record.ip_addresses.map((ip, idx) => (
                        <tr key={`a-${ip}-${idx}`} className="hover:bg-[var(--s2)]">
                          <td className="py-2.5 px-3 font-semibold text-[var(--acc)]">
                            A (IPv4) {idx === 0 ? "(Utama)" : ""}
                          </td>
                          <td className="py-2.5 px-3 text-[var(--ink)]">@ ({record.clean_domain})</td>
                          <td className="py-2.5 px-3 text-[var(--ink)]">{ip}</td>
                          <td className="py-2.5 px-3 text-right text-[var(--lo)] font-semibold">RESOLVED</td>
                        </tr>
                      ))}

                      {record.nameservers.map((ns, idx) => (
                        <tr key={`ns-${ns}-${idx}`} className="hover:bg-[var(--s2)]">
                          <td className="py-2.5 px-3 font-semibold text-[var(--acc)]">NS #{idx + 1}</td>
                          <td className="py-2.5 px-3 text-[var(--ink)]">@</td>
                          <td className="py-2.5 px-3 text-[var(--ink)]">{ns}</td>
                          <td className="py-2.5 px-3 text-right text-[var(--lo)] font-semibold">RESOLVED</td>
                        </tr>
                      ))}

                      {record.dns_records?.MX &&
                        record.dns_records.MX.map((mx, idx) => (
                          <tr key={`mx-${mx}-${idx}`} className="hover:bg-[var(--s2)]">
                            <td className="py-2.5 px-3 font-semibold text-[var(--mid)]">MX #{idx + 1}</td>
                            <td className="py-2.5 px-3 text-[var(--ink)]">Mail Exchanger</td>
                            <td className="py-2.5 px-3 text-[var(--ink)]">{mx}</td>
                            <td className="py-2.5 px-3 text-right text-[var(--lo)] font-semibold">ACTIVE</td>
                          </tr>
                        ))}

                      {record.dns_records?.TXT &&
                        record.dns_records.TXT.map((txt, idx) => (
                          <tr key={`txt-${idx}`} className="hover:bg-[var(--s2)]">
                            <td className="py-2.5 px-3 font-semibold text-[var(--mute)]">TXT #{idx + 1}</td>
                            <td className="py-2.5 px-3 text-[var(--ink)]">Verification / SPF</td>
                            <td className="py-2.5 px-3 text-[var(--ink)] break-all max-w-[400px]">{txt}</td>
                            <td className="py-2.5 px-3 text-right text-[var(--lo)] font-semibold">RESOLVED</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {record.raw_whois && (
                  <div className="pt-3 border-t border-[var(--line)]">
                    <button
                      type="button"
                      onClick={() => setShowRawWhois(!showRawWhois)}
                      className="flex items-center gap-1.5 text-[12px] font-mono text-[var(--acc)] hover:underline cursor-pointer"
                    >
                      {showRawWhois ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showRawWhois ? "Sembunyikan Raw WHOIS Log" : "Lihat Log Mentah WHOIS Port 43"}</span>
                    </button>

                    {showRawWhois && (
                      <pre className="mt-3 p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-[11px] font-mono text-[var(--mute)] overflow-x-auto max-h-[300px]">
                        {record.raw_whois}
                      </pre>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: SUBDOMAIN FINDER (SUBFINDER + CT LOGS + TAKEOVER) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "subdomains" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScanSubdomains(subdomainInput);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <Radio className="w-4 h-4 text-[#38bdf8] absolute left-3.5 top-3 stroke-[1.8]" />
                <input
                  type="text"
                  value={subdomainInput}
                  onChange={(e) => setSubdomainInput(e.target.value)}
                  placeholder="Masukkan domain apex (misal: bca.co.id, presidenri.go.id)"
                  className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={loadingSubdomains}
                className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {loadingSubdomains ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>{loadingSubdomains ? "Memindai Subdomain..." : "Temukan Subdomain (Subfinder)"}</span>
              </button>
            </form>
          </div>

          {errorSubdomains && (
            <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorSubdomains}</span>
            </div>
          )}

          {subdomainResult && (
            <>
              {/* Telemetry Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--s1)] border border-[var(--line)] rounded-[10px]">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block">
                    Total Subdomain Ditemukan
                  </span>
                  <strong className="text-[24px] font-mono font-bold text-[var(--ink)] block mt-1">
                    {subdomainResult.total_found}
                  </strong>
                  <span className="text-[11.5px] text-[var(--mute)] font-mono">
                    Waktu Scan: {subdomainResult.execution_time_seconds} detik
                  </span>
                </div>

                <div className="p-4 bg-[var(--s1)] border border-[var(--line)] rounded-[10px]">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block">
                    Host Aktif / Live Probe
                  </span>
                  <strong className="text-[24px] font-mono font-bold text-[var(--lo)] block mt-1">
                    {subdomainResult.live_count}
                  </strong>
                  <span className="text-[11.5px] text-[var(--mute)] font-mono">
                    Merespon DNS A / HTTP Web
                  </span>
                </div>

                <div className="p-4 bg-[var(--s1)] border border-[var(--line)] rounded-[10px]">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block">
                    Risiko Subdomain Takeover
                  </span>
                  <strong
                    className={`text-[24px] font-mono font-bold block mt-1 ${
                      subdomainResult.takeover_risk_count > 0 ? "text-[var(--hi)] animate-pulse" : "text-[var(--lo)]"
                    }`}
                  >
                    {subdomainResult.takeover_risk_count} CNAME Dangling
                  </strong>
                  <span className="text-[11.5px] text-[var(--mute)] font-mono">
                    {subdomainResult.takeover_risk_count > 0
                      ? "Ditemukan CNAME tanpa backend aktif"
                      : "Semua CNAME aman"}
                  </span>
                </div>
              </div>

              {/* Subdomain Table with Filter */}
              <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-[var(--ink)] m-0">
                      Daftar Subdomain Terpetakan ({filteredSubdomains.length})
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[var(--s2)] border border-[var(--line)] text-[11px] font-mono text-[var(--mute)]">
                      Subfinder Engine
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <input
                      type="text"
                      value={subdomainFilter}
                      onChange={(e) => setSubdomainFilter(e.target.value)}
                      placeholder="Cari subdomain, judul, CNAME..."
                      className="px-3 py-1 bg-[var(--s2)] border border-[var(--line)] rounded-[5px] text-[12px] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--acc)] w-56"
                    />
                    <button
                      type="button"
                      onClick={() => setFilterOnlyLive(!filterOnlyLive)}
                      className={`px-2.5 py-1 rounded-[5px] text-[11.5px] font-mono transition-colors ${
                        filterOnlyLive
                          ? "bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/30 font-semibold"
                          : "bg-[var(--s2)] text-[var(--mute)] border border-[var(--line)]"
                      }`}
                    >
                      Hanya Host Aktif
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] font-mono border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[var(--line)] text-[var(--mute)] text-left bg-[var(--s2)]">
                        <th className="py-2 px-3 w-8">No</th>
                        <th className="py-2 px-3">Subdomain (FQDN)</th>
                        <th className="py-2 px-3">Status HTTP</th>
                        <th className="py-2 px-3">Judul Web / Server</th>
                        <th className="py-2 px-3">IP / CNAME</th>
                        <th className="py-2 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {filteredSubdomains.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-[var(--mute)]">
                            Tidak ada subdomain yang cocok dengan kriteria filter.
                          </td>
                        </tr>
                      ) : (
                        filteredSubdomains.map((sub, idx) => {
                          const isCopied = copiedSubdomain === sub.subdomain;
                          return (
                            <tr key={sub.subdomain} className="hover:bg-[var(--s2)] transition-colors">
                              <td className="py-2.5 px-3 text-[var(--mute)]">{idx + 1}</td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[var(--ink)]">
                                    {sub.subdomain}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyText(sub.subdomain, sub.subdomain, "subdomain")}
                                    className="p-1 text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
                                    title="Salin FQDN"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-[var(--lo)]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                  {sub.is_takeover_risk && (
                                    <span className="px-1.5 py-0.2 rounded bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/30 text-[9.5px] font-bold">
                                      TAKEOVER RISK ({sub.takeover_service})
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                {sub.status_code ? (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10.5px] font-bold ${
                                      sub.status_code >= 200 && sub.status_code < 300
                                        ? "bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/30"
                                        : sub.status_code >= 300 && sub.status_code < 400
                                        ? "bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30"
                                        : "bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/30"
                                    }`}
                                  >
                                    {sub.status_code}
                                  </span>
                                ) : (
                                  <span className="text-[var(--mute)]">DNS Only</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 max-w-[200px] truncate text-[var(--mute)]">
                                <span className="text-[var(--ink)] font-normal block truncate">
                                  {sub.title || "-"}
                                </span>
                                {sub.server && (
                                  <small className="text-[10px] text-[var(--mute)] block">
                                    Server: {sub.server}
                                  </small>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-[var(--mute)]">
                                <div>{sub.ip_addresses[0] || "-"}</div>
                                {sub.cname && (
                                  <div className="text-[10px] text-[var(--acc)] truncate max-w-[150px]">
                                    CNAME: {sub.cname}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSendToNuclei(sub.subdomain)}
                                    className="px-2 py-1 rounded bg-[var(--acc)] text-white hover:opacity-90 font-semibold text-[10.5px] transition-opacity cursor-pointer flex items-center gap-1"
                                    title="Pindai kerentanan subdomain ini dengan Nuclei"
                                  >
                                    <Bug className="w-3 h-3" />
                                    <span>Pindai Nuclei</span>
                                  </button>
                                  {sub.is_takeover_risk && (
                                    <button
                                      type="button"
                                      onClick={() => handleVaultFinding(sub)}
                                      disabled={vaultLoadingId === sub.subdomain}
                                      className="px-2 py-1 rounded bg-[var(--hi)] text-white font-semibold text-[10.5px] transition-opacity cursor-pointer flex items-center gap-1"
                                    >
                                      <Lock className="w-3 h-3" />
                                      <span>Kunci Bukti</span>
                                    </button>
                                  )}
                                  <a
                                    href={`https://${sub.subdomain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded bg-[var(--s2)] text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)]"
                                    title="Buka web eksternal"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: NUCLEI VULNERABILITY SCANNER (PROJECTDISCOVERY) ── */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === "nuclei" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <span className="text-[11px] font-mono font-semibold text-[var(--mute)] uppercase tracking-wider block">
                  PROJECTDISCOVERY NUCLEI V3.11 &bull; TARGETED AUDIT ENGINE
                </span>
                <h2 className="text-[15px] font-bold text-[var(--ink)] m-0 mt-0.5">
                  Pemindaian Kerentanan Celah Keamanan Terarah
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 font-mono text-[11px] font-bold">
                AUDIT AKTIF BERIZIN
              </span>
            </div>

            {/* Preset Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono font-medium text-[var(--mute)] uppercase tracking-wider block">
                Pilih Mode &amp; Profil Audit:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNucleiPreset("default")}
                  className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer ${
                    nucleiPreset === "default"
                      ? "bg-[var(--s2)] border-[var(--acc)] shadow-sm"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-zinc-700 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-[var(--ink)]">
                      Scan Standar
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9.5px] font-mono font-bold">
                      OSINT
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--mute)] mt-1 mb-0 leading-snug">
                    Misconfig umum, open panels, file .env &amp; .git leak, dan takeover.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNucleiPreset("wordpress")}
                  className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer ${
                    nucleiPreset === "wordpress"
                      ? "bg-[var(--s2)] border-violet-500 shadow-sm"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-zinc-700 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-[var(--ink)]">
                      WordPress Recon
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 text-[9.5px] font-mono font-bold">
                      PROBE
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--mute)] mt-1 mb-0 leading-snug">
                    User enum via REST API, XML-RPC pingback, debug.log, backup db, &amp; CVE.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setNucleiPreset("cve")}
                  className={`p-3 rounded-[6px] border text-left transition-all cursor-pointer ${
                    nucleiPreset === "cve"
                      ? "bg-[var(--s2)] border-red-500 shadow-sm"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-zinc-700 opacity-80"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Bug className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="text-[12px] font-semibold text-[var(--ink)]">
                      CVE &amp; RCE Audit
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[9.5px] font-mono font-bold">
                      EXPLOITS
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--mute)] mt-1 mb-0 leading-snug">
                    Remote code execution, SQLi, LFI, SSRF, &amp; high-impact exploit vectors.
                  </p>
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunNuclei(nucleiTarget);
              }}
              className="space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Terminal className="w-4 h-4 text-[#ef4444] absolute left-3.5 top-3 stroke-[1.8]" />
                  <input
                    type="text"
                    value={nucleiTarget}
                    onChange={(e) => setNucleiTarget(e.target.value)}
                    placeholder="Masukkan target URL atau subdomain (misal: https://dev.target.go.id)"
                    className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={loadingNuclei}
                    className="px-5 py-2 bg-[#ef4444] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {loadingNuclei ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                    <span>{loadingNuclei ? "Streaming Audit..." : "Jalankan Audit Nuclei"}</span>
                  </button>

                  {loadingNuclei && (
                    <button
                      type="button"
                      onClick={handleAbortScan}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-[6px] font-semibold text-[13px] transition-all cursor-pointer shrink-0"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              {/* Severity Filter Toggles */}
              <div className="flex items-center gap-2 text-[11.5px] font-mono flex-wrap pt-1">
                <span className="text-[var(--mute)] font-medium">Tingkat Keparahan (Severity):</span>
                {(["critical", "high", "medium", "low"] as const).map((sev) => {
                  const active = selectedSeverities.includes(sev);
                  return (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setSelectedSeverities(selectedSeverities.filter((s) => s !== sev));
                        } else {
                          setSelectedSeverities([...selectedSeverities, sev]);
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-[4px] border font-semibold uppercase text-[10.5px] transition-colors cursor-pointer ${
                        active
                          ? sev === "critical"
                            ? "bg-red-500/20 text-red-400 border-red-500/40"
                            : sev === "high"
                            ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                            : sev === "medium"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                          : "bg-[var(--s2)] text-[var(--mute)] border-[var(--line)] opacity-60"
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
              </div>
            </form>
          </div>

          {/* ── LIVE TERMINAL LOG STREAM CONSOLE ── */}
          <div className="bg-[#090b0e] border border-[var(--line)] rounded-[8px] overflow-hidden font-mono text-[11.5px]">
            {/* Terminal Bar Header */}
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#0e1217] border-b border-[var(--line)] text-zinc-300 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      loadingNuclei ? "bg-emerald-500 animate-ping" : "bg-zinc-600"
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold tracking-wider uppercase ${
                      loadingNuclei ? "text-emerald-400" : "text-zinc-400"
                    }`}
                  >
                    {loadingNuclei ? "● STREAM LIVE (ACTIVE)" : "● STANDBY"}
                  </span>
                </div>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-[11px] text-zinc-400 hidden sm:inline">
                  Target: <span className="text-zinc-200">{nucleiTarget || "—"}</span>
                </span>
                <span className="text-zinc-600 hidden sm:inline">|</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold uppercase">
                  {nucleiPreset}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAutoScrollTerminal(!autoScrollTerminal)}
                  className={`px-2 py-0.5 rounded text-[10.5px] border transition-colors cursor-pointer ${
                    autoScrollTerminal
                      ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                      : "bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300"
                  }`}
                  title="Otomatis bergulir ke pesan terbaru"
                >
                  Auto-scroll: {autoScrollTerminal ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyLogs}
                  disabled={terminalLogs.length === 0}
                  className="px-2 py-0.5 rounded text-[10.5px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-40 flex items-center gap-1"
                  title="Salin seluruh log terminal"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedCurlId === "all-logs" ? "Tersalin!" : "Salin Log"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearTerminal}
                  disabled={terminalLogs.length === 0}
                  className="px-2 py-0.5 rounded text-[10.5px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
                  title="Bersihkan buffer log terminal"
                >
                  Bersihkan
                </button>

                {loadingNuclei && (
                  <button
                    type="button"
                    onClick={handleAbortScan}
                    className="px-2.5 py-0.5 rounded text-[10.5px] bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800/80 transition-colors cursor-pointer font-bold"
                  >
                    Hentikan
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowTerminal(!showTerminal)}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  title={showTerminal ? "Sembunyikan Terminal" : "Tampilkan Terminal"}
                >
                  {showTerminal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Terminal Body Output */}
            {showTerminal && (
              <div className="p-3.5 max-h-60 overflow-y-auto space-y-1 bg-[#07090b] text-zinc-300 scrollbar-thin">
                {terminalLogs.length === 0 ? (
                  <div className="text-zinc-600 text-[11px] py-4 text-center select-none font-mono">
                    Konsol log terminal siap. Jalankan audit Nuclei untuk melihat streaming baris-per-baris secara realtime.
                  </div>
                ) : (
                  terminalLogs.map((log) => {
                    const lvl = log.level.toUpperCase();
                    const isCrit = lvl.includes("CRITICAL");
                    const isHigh = lvl.includes("HIGH");
                    const isMed = lvl.includes("MEDIUM");
                    const isWp = lvl.includes("WP-AUDIT");
                    const isDone = lvl.includes("DONE");
                    const isWarn = lvl.includes("WARN");

                    return (
                      <div key={log.id} className="leading-relaxed flex items-start gap-2 break-all font-mono">
                        <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                        <span
                          className={`shrink-0 font-bold ${
                            isCrit
                              ? "text-red-400 bg-red-950/50 px-1 rounded"
                              : isHigh
                              ? "text-orange-400 font-semibold"
                              : isMed
                              ? "text-amber-400"
                              : isWp
                              ? "text-purple-400"
                              : isDone
                              ? "text-emerald-400"
                              : isWarn
                              ? "text-yellow-400"
                              : "text-sky-400"
                          }`}
                        >
                          [{log.level}]
                        </span>
                        <span
                          className={`${
                            isCrit
                              ? "text-red-200 font-semibold"
                              : isDone
                              ? "text-emerald-300 font-bold"
                              : "text-zinc-300"
                          }`}
                        >
                          {log.message}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={terminalBottomRef} />
              </div>
            )}
          </div>

          {errorNuclei && (
            <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorNuclei}</span>
            </div>
          )}

          {nucleiResult && (
            <>
              {/* Finding Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3.5 bg-[var(--s1)] border border-[var(--line)] rounded-[8px]">
                  <span className="text-[11px] font-mono text-[var(--mute)] uppercase block">Total Temuan</span>
                  <strong className="text-[20px] font-mono font-bold text-[var(--ink)] block mt-0.5">
                    {nucleiResult.total_findings}
                  </strong>
                </div>

                <div className="p-3.5 bg-[var(--s1)] border border-red-500/30 rounded-[8px]">
                  <span className="text-[11px] font-mono text-red-400 uppercase block font-semibold">Critical</span>
                  <strong className="text-[20px] font-mono font-bold text-red-400 block mt-0.5">
                    {nucleiResult.critical_count}
                  </strong>
                </div>

                <div className="p-3.5 bg-[var(--s1)] border border-orange-500/30 rounded-[8px]">
                  <span className="text-[11px] font-mono text-orange-400 uppercase block font-semibold">High</span>
                  <strong className="text-[20px] font-mono font-bold text-orange-400 block mt-0.5">
                    {nucleiResult.high_count}
                  </strong>
                </div>

                <div className="p-3.5 bg-[var(--s1)] border border-amber-500/30 rounded-[8px]">
                  <span className="text-[11px] font-mono text-amber-400 uppercase block font-semibold">Medium</span>
                  <strong className="text-[20px] font-mono font-bold text-amber-400 block mt-0.5">
                    {nucleiResult.medium_count}
                  </strong>
                </div>

                <div className="p-3.5 bg-[var(--s1)] border border-blue-500/30 rounded-[8px] col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-mono text-blue-400 uppercase block font-semibold">Low</span>
                  <strong className="text-[20px] font-mono font-bold text-blue-400 block mt-0.5">
                    {nucleiResult.low_count}
                  </strong>
                </div>
              </div>

              {/* Findings Dossier List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[var(--ink)]">
                    Hasil Analisis Forensik Nuclei ({nucleiResult.findings.length} Kerentanan)
                  </span>
                  <span className="text-[11px] font-mono text-[var(--mute)]">
                    Selesai dalam {nucleiResult.execution_time_seconds}s
                  </span>
                </div>

                {nucleiResult.findings.length === 0 ? (
                  <div className="p-8 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[var(--lo)] mx-auto" />
                    <h3 className="text-[14px] font-semibold text-[var(--ink)] m-0">
                      Tidak Ditemukan Kerentanan Kritis atau File Terbuka
                    </h3>
                    <p className="text-[12px] text-[var(--mute)] max-w-md mx-auto m-0">
                      Target tidak merespon celah takeover, miskonfigurasi panel admin, atau kebocoran kredensial .env.
                    </p>
                  </div>
                ) : (
                  nucleiResult.findings.map((item) => {
                    const sev = item.severity.toLowerCase();
                    const isCopied = copiedCurlId === item.template_id;
                    const isVaulting = vaultLoadingId === item.template_id;

                    return (
                      <div
                        key={`${item.template_id}-${item.matched_at}`}
                        className={`p-4 bg-[var(--s1)] border rounded-[10px] space-y-3 transition-all ${
                          sev === "critical"
                            ? "border-red-500/50 bg-red-950/10"
                            : sev === "high"
                            ? "border-orange-500/40"
                            : sev === "medium"
                            ? "border-amber-500/40"
                            : "border-[var(--line)]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                  sev === "critical"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                    : sev === "high"
                                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                                    : sev === "medium"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                                }`}
                              >
                                {sev}
                              </span>
                              <h3 className="text-[14px] font-bold text-[var(--ink)] m-0">
                                {item.name}
                              </h3>
                              {item.cve_id && (
                                <span className="px-1.5 py-0.2 rounded bg-[var(--s2)] border border-[var(--line)] text-[10.5px] font-mono text-[var(--mute)]">
                                  {item.cve_id}
                                </span>
                              )}
                            </div>
                            <span className="text-[11.5px] font-mono text-[var(--mute)] block">
                              Template: {item.template_id} &bull; Tipe: {item.type || "http"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleVaultFinding(item)}
                              disabled={isVaulting}
                              className="px-3 py-1.5 rounded bg-[var(--acc)] text-white hover:opacity-90 font-semibold text-[11.5px] font-mono flex items-center gap-1.5 transition-opacity cursor-pointer disabled:opacity-50"
                            >
                              <Lock className={`w-3.5 h-3.5 ${isVaulting ? "animate-spin" : ""}`} />
                              <span>{isVaulting ? "Menyegel..." : "Kunci ke Evidence Vault"}</span>
                            </button>
                            <a
                              href={item.matched_at}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded bg-[var(--s2)] text-[var(--mute)] hover:text-[var(--ink)] border border-[var(--line)]"
                              title="Buka endpoint temuan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* Matched URL & Extracted Data */}
                        <div className="p-2.5 rounded bg-[var(--s2)] border border-[var(--line)] space-y-1.5 font-mono text-[11.5px]">
                          <div className="flex items-center justify-between gap-2 truncate">
                            <span className="text-[var(--mute)] shrink-0">Titik Rentan:</span>
                            <span className="text-[var(--ink)] font-semibold truncate">
                              {item.matched_at}
                            </span>
                          </div>

                          {item.extracted_results && item.extracted_results.length > 0 && (
                            <div className="pt-1 border-t border-[var(--line)]/50">
                              <span className="text-[var(--mute)] block mb-0.5">Bukti Ekstraksi:</span>
                              <div className="space-y-0.5">
                                {item.extracted_results.map((ex, i) => (
                                  <div key={i} className="text-[#38bdf8] break-all bg-black/40 p-1 rounded">
                                    {ex}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Description & Remediation */}
                        {item.description && (
                          <p className="text-[12px] text-[var(--mute)] m-0 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {item.remediation && (
                          <div className="p-2.5 rounded bg-[var(--lo)]/10 border border-[var(--lo)]/25 text-[11.5px] font-mono text-[var(--lo)] flex items-start gap-2">
                            <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span><b>Mitigasi:</b> {item.remediation}</span>
                          </div>
                        )}

                        {/* Reproducible Curl Box */}
                        {item.curl_command && (
                          <div className="flex items-center justify-between gap-2 p-2 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] font-mono text-[11px]">
                            <span className="text-[var(--mute)] truncate">
                              $ {item.curl_command}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(item.curl_command!, item.template_id, "curl")}
                              className="px-2 py-0.5 rounded bg-[var(--s1)] border border-[var(--line)] hover:text-[var(--ink)] text-[var(--mute)] shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-[var(--lo)]" /> : <Copy className="w-3 h-3" />}
                              <span>{isCopied ? "Tersalin" : "Salin Curl"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}

export default function DomainPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-[var(--mute)] font-mono text-[13px]">
          Memuat modul intelijen domain &amp; attack surface...
        </div>
      }
    >
      <DomainContent />
    </Suspense>
  );
}
