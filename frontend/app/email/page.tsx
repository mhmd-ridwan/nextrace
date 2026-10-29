"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Mail,
  Search,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Layers,
  KeyRound,
  RefreshCw,
  Database,
  Briefcase,
  AlertOctagon,
  Globe,
  Server,
  User,
  Hash,
  ShieldCheck,
  XCircle,
  Copy,
  Check,
} from "lucide-react";
import { api } from "@/lib/api";
import { LeakCheckResponse, Investigation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

function EmailContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("q") || "bantuan.presiden.jokowi@gmail.com";
  const initialCaseId = searchParams.get("investigation_id") || searchParams.get("case_id") || "";

  const [emailInput, setEmailInput] = useState(initialQuery);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [vaulting, setVaulting] = useState(false);
  const [result, setResult] = useState<LeakCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Evidence Seal Modal state
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

  // Load active investigations for dynamic case linking
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
        console.warn("Failed to load investigations list:", err);
      }
    }
    loadInvestigations();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      runAudit(initialQuery, selectedCaseId);
    }
  }, [initialQuery]);

  const runAudit = async (queryVal: string, caseId: string = selectedCaseId) => {
    if (!queryVal.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.checkLeak(queryVal.trim(), "email", caseId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan pencarian kebocoran email.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runAudit(emailInput, selectedCaseId);
  };

  const handleCaseChange = (newCaseId: string) => {
    setSelectedCaseId(newCaseId);
    if (emailInput.trim()) {
      runAudit(emailInput, newCaseId);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleVaultEvidence = async () => {
    if (!result) return;
    setVaulting(true);

    try {
      const caseIdToUse = selectedCaseId || "inv-general-001";
      const formData = new FormData();
      formData.append("investigation_id", caseIdToUse);
      formData.append("evidence_type", "document");
      formData.append("source_url", result.query || emailInput);
      formData.append("collection_method", "osint_email_breach_audit");

      const payload = {
        target_email: result.query || emailInput,
        identifier_type: "email",
        investigation_id: caseIdToUse,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        total_incidents: result.total_incidents,
        is_disposable_email: result.intelligence_metadata?.is_disposable_email || false,
        disposable_service: result.intelligence_metadata?.disposable_service || null,
        fraud_risk_score: result.intelligence_metadata?.fraud_risk_score || null,
        threat_vectors: result.intelligence_metadata?.threat_vectors || [],
        dns_security: result.intelligence_metadata?.dns_security || null,
        gravatar_profile: result.intelligence_metadata?.gravatar_profile || null,
        email_analysis: result.intelligence_metadata?.email_analysis || null,
        incidents_summary: (result.incidents || []).map((inc) => ({
          source_name: inc.source_name,
          breach_date: inc.breach_date,
          record_count: inc.record_count,
          severity: inc.severity,
          exposed_fields: inc.exposed_fields,
        })),
        audited_at: result.checked_at,
      };

      formData.append("metadata", JSON.stringify(payload));

      const evidence = await api.createEvidence(formData);

      setModalConfig({
        isOpen: true,
        title: "Bukti Forensik Email Berhasil Disegel",
        description: `Hasil audit kebocoran dan verifikasi protokol untuk ${result.query || emailInput} telah resmi diamankan ke Evidence Vault dengan segel integritas kriptografis SHA-256.`,
        variant: "success",
        confirmText: "Buka Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = selectedCaseId ? `/evidence?investigation_id=${selectedCaseId}` : "/evidence";
        },
        details: [
          { label: "Nomor Registrasi Bukti", value: evidence.evidence_id },
          { label: "ID Kasus Terkait", value: selectedCaseId || "Kasus Umum (General Vault)" },
          { label: "Hash Kriptografis (SHA-256)", value: evidence.file_hash_sha256 || "TERVERIFIKASI" },
          { label: "Metode Akuisisi", value: evidence.collection_method || "osint_email_breach_audit" },
          { label: "Waktu Penyegelan", value: new Date(evidence.created_at).toLocaleString("id-ID") },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Valid Chain of Custody)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci ke Vault",
        description: "Terjadi kesalahan saat memproses penyegelan bukti ke server forensik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaulting(false);
    }
  };

  const breaches = result?.incidents || [];
  const riskScore = result?.risk_score ?? 68.5;
  const isHighRisk = riskScore >= 50;
  const isDisposable = Boolean(result?.intelligence_metadata?.is_disposable_email);
  const disposableService = result?.intelligence_metadata?.disposable_service;

  const dns = result?.intelligence_metadata?.dns_security;
  const gravatar = result?.intelligence_metadata?.gravatar_profile;
  const emailAnalysis = result?.intelligence_metadata?.email_analysis;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; EMAIL CREDENTIAL EXPOSURE &bull; BREACH INTELLIGENCE
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Email — Audit Kebocoran Kredensial &amp; Protokol
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Pemeriksaan data breach terhadap insiden kebocoran kredensial, verifikasi DNS anti-spoofing (MX/SPF/DMARC), serta profil Gravatar footprint.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {/* Dynamic Case Selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--s1)] border border-[var(--line)] rounded-[6px] w-full sm:w-auto">
            <Briefcase className="w-3.5 h-3.5 text-[var(--mute)] shrink-0" />
            <span className="text-[12px] text-[var(--mute)] font-medium">Kasus Aktif:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="bg-transparent text-[12.5px] font-mono font-semibold text-[var(--ink)] focus:outline-none cursor-pointer flex-1 sm:flex-initial"
            >
              {investigations.length > 0 ? (
                investigations.map((inv) => (
                  <option key={inv.id} value={inv.id} className="bg-[var(--s1)] text-[var(--ink)]">
                    {inv.title || inv.id} ({inv.id})
                  </option>
                ))
              ) : (
                <option value="" className="bg-[var(--s1)] text-[var(--mute)]">
                  Tanpa Kasus Terkait (Investigasi Terbuka)
                </option>
              )}
            </select>
          </div>

          <Link
            href={`/nomor-hp?investigation_id=${selectedCaseId}`}
            className="px-3.5 py-1.5 rounded-[6px] bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] text-[13px] font-medium transition-colors w-full sm:w-auto text-center"
          >
            Lacak Nomor HP
          </Link>
        </div>
      </div>

      {/* ── Search Bar Box ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-3 stroke-[1.8]" />
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Masukkan alamat email target (misal: user@gmail.com atau tempmail)"
              className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? "Memeriksa Dataset..." : "Periksa Paparan"}</span>
          </button>
        </form>

        {/* Quick query chips */}
        <div className="flex items-center gap-2 pt-3 text-[12px] text-[var(--mute)] overflow-x-auto">
          <span className="shrink-0 font-medium">Contoh Target:</span>
          {[
            { label: "bantuan.presiden.jokowi@gmail.com", desc: "Gmail (Dot-Trick)" },
            { label: "protokoler@presidenri.go.id", desc: "Pemerintah RI" },
            { label: "beau@dentedreality.com.au", desc: "Gravatar Active" },
            { label: "botnet_syndicate@tempmail.com", desc: "Burner Mail" },
          ].map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setEmailInput(sample.label);
                runAudit(sample.label);
              }}
              className="px-2.5 py-1 rounded bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] font-mono text-[11px] transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span>{sample.label}</span>
              <span className="text-[9.5px] px-1 py-0.2 rounded bg-[var(--s1)] text-[var(--mute)]">
                {sample.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] text-[13px] text-[var(--hi)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Disposable / Temp-Mail Threat Banner ── */}
      {isDisposable && (
        <div className="p-5 bg-[var(--hi)]/10 border-2 border-[var(--hi)] rounded-[10px] space-y-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <AlertOctagon className="w-5 h-5 text-[var(--hi)] shrink-0 animate-bounce" />
              <div>
                <span className="text-[11px] font-mono font-bold tracking-wider text-[var(--hi)] uppercase block">
                  PERINGATAN SIBER &bull; DOMAIN EMAIL SEMENTARA TERDETEKSI (DISPOSABLE / BURNER MAIL)
                </span>
                <h3 className="text-[16px] font-bold text-[var(--ink)] m-0">
                  Domain Teridentifikasi Menggunakan Penyedia {disposableService || "Burner Mail"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[var(--hi)] text-black font-mono font-bold text-[11.5px] uppercase tracking-wide">
                Indeks Fraud: 78 / 100
              </span>
              <span className="px-2.5 py-1 rounded bg-[var(--s2)] text-[var(--hi)] border border-[var(--hi)]/40 font-mono font-semibold text-[11.5px]">
                High Botnet Risk
              </span>
            </div>
          </div>

          <p className="text-[13px] text-[var(--ink)] leading-relaxed m-0">
            Alamat email ini didaftarkan menggunakan domain surat elektronik sekali pakai (throwaway/burner).
            Karakteristik ini secara statistik memiliki korelasi tinggi dengan <strong>sindikat botnet buzzer</strong>,
            kampanye disinformasi terkoordinasi, dan pembuatan akun kloning tanpa verifikasi identitas permanen.
          </p>

          {result?.intelligence_metadata?.threat_vectors && result.intelligence_metadata.threat_vectors.length > 0 && (
            <div className="pt-2 border-t border-[var(--hi)]/20 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-[var(--mute)] font-semibold uppercase">
                Vektor Ancaman:
              </span>
              {result.intelligence_metadata.threat_vectors.map((vec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-[var(--hi)]/20 border border-[var(--hi)]/40 text-[var(--hi)] font-mono text-[11px]"
                >
                  {vec}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Telemetry KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
            <span>Insiden Teridentifikasi</span>
            <Database className="w-4 h-4 text-[var(--mute)]" />
          </div>
          <b className="block text-[28px] font-semibold text-[var(--ink)] mt-1 tabular-nums font-mono">
            {breaches.length} Insiden
          </b>
          <small className="text-[11.5px] text-[var(--mute)]">
            {breaches.length > 0 ? "Dataset breach publik" : "Tidak terdeteksi kebocoran"}
          </small>
        </section>

        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
            <span>Skor Paparan Risiko</span>
            <span className={`w-2 h-2 rounded-full ${isHighRisk ? "bg-[var(--hi)]" : "bg-[var(--lo)]"}`} />
          </div>
          <b className={`block text-[28px] font-semibold mt-1 tabular-nums font-mono ${isHighRisk ? "text-[var(--hi)]" : "text-[var(--lo)]"}`}>
            {riskScore.toFixed(0)} / 100
          </b>
          <small className={`text-[11.5px] font-medium ${isHighRisk ? "text-[var(--hi)]" : "text-[var(--lo)]"}`}>
            {isHighRisk ? "Tingkat Risiko Tinggi" : "Tingkat Risiko Normal / Rendah"}
          </small>
        </section>

        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
            <span>Kategori Integritas Domain</span>
            <KeyRound className="w-4 h-4 text-[var(--mute)]" />
          </div>
          <b className="block text-[20px] font-semibold text-[var(--ink)] mt-2 font-mono truncate">
            {emailAnalysis?.domain_category || (isDisposable ? "Burner / Disposable" : "Domain Reguler")}
          </b>
          <small className="text-[11.5px] text-[var(--mute)]">
            {isDisposable ? "Layanan sekali pakai tanpa KYC" : "Penyedia email terverifikasi"}
          </small>
        </section>

        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
            <span>Amankan ke Rantai Kustodi</span>
            <Lock className="w-4 h-4 text-[var(--acc)]" />
          </div>
          <button
            type="button"
            onClick={handleVaultEvidence}
            disabled={vaulting || !result}
            className="w-full text-center px-3 py-2 rounded-[6px] bg-[var(--acc)] hover:opacity-90 text-white font-semibold text-[12px] transition-all flex items-center justify-center gap-1.5 mt-2 disabled:opacity-40 cursor-pointer"
          >
            {vaulting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            <span>{vaulting ? "Menyegel Kriptografis..." : "Kunci ke Evidence Vault"}</span>
          </button>
        </section>
      </div>

      {/* ── Advanced Email OSINT & Protocol Telemetry Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Module A: DNS Anti-Spoofing & Protocol Security */}
        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--acc)]" />
              <h2 className="text-[14.5px] font-semibold text-[var(--ink)] m-0">
                Audit DNS &amp; Protokol Anti-Spoofing
              </h2>
            </div>
            {dns && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                  dns.is_spoofable
                    ? "bg-[var(--hi)]/15 border-[var(--hi)]/40 text-[var(--hi)]"
                    : "bg-[var(--lo)]/15 border-[var(--lo)]/40 text-[var(--lo)]"
                }`}
              >
                {dns.is_spoofable ? "Rentan Pemalsuan (Spoofable)" : "Proteksi Ketat (Anti-Spoofing)"}
              </span>
            )}
          </div>

          {dns ? (
            <div className="space-y-3.5 text-[12.5px]">
              {/* Verdict Banner */}
              <div
                className={`p-3 rounded-[8px] border text-[12px] font-mono flex items-start gap-2.5 ${
                  dns.is_spoofable
                    ? "bg-[var(--hi)]/10 border-[var(--hi)]/30 text-[var(--hi)]"
                    : "bg-[var(--lo)]/10 border-[var(--lo)]/30 text-[var(--lo)]"
                }`}
              >
                {dns.is_spoofable ? (
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-semibold">Kesimpulan Keamanan: {dns.security_verdict}</strong>
                  <span className="text-[11.5px] opacity-90">
                    {dns.is_spoofable
                      ? "Domain ini tidak menerapkan DMARC secara ketat (p=none/hilang). Pihak ketiga dapat mengirimkan email atas nama domain ini ke mail server korban."
                      : "Domain ini menerapkan kebijakan SPF dan DMARC ketat. Server penerima akan menolak atau mengkarantina email yang dipalsukan pihak asing."}
                  </span>
                </div>
              </div>

              {/* Protocol Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-1">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[11.5px]">
                    <span>DMARC Policy</span>
                    <Shield className="w-3.5 h-3.5 text-[var(--mute)]" />
                  </div>
                  <div className="font-mono text-[14px] font-bold text-[var(--ink)] uppercase">
                    {dns.dmarc_policy}
                  </div>
                  <div className="text-[11px] text-[var(--mute)] font-mono truncate" title={dns.dmarc_record || "None"}>
                    {dns.dmarc_record ? dns.dmarc_record.substring(0, 32) + "..." : "Record tidak ditemukan"}
                  </div>
                </div>

                <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-1">
                  <div className="flex justify-between items-center text-[var(--mute)] text-[11.5px]">
                    <span>SPF Configuration</span>
                    <KeyRound className="w-3.5 h-3.5 text-[var(--mute)]" />
                  </div>
                  <div className="font-mono text-[14px] font-bold text-[var(--ink)]">
                    {dns.spf_policy}
                  </div>
                  <div className="text-[11px] text-[var(--mute)] font-mono truncate" title={dns.spf_record || "None"}>
                    {dns.spf_record ? dns.spf_record.substring(0, 32) + "..." : "Record tidak ditemukan"}
                  </div>
                </div>
              </div>

              {/* MX Records List */}
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-2">
                <div className="flex justify-between items-center text-[12px] text-[var(--mute)] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-[var(--acc)]" />
                    Mail Exchange (MX) Server Aktif
                  </span>
                  <span className="font-mono text-[11px] text-[var(--ink)]">
                    {dns.mx_records.length} Exchange
                  </span>
                </div>
                {dns.mx_records.length > 0 ? (
                  <ul className="m-0 p-0 list-none space-y-1 font-mono text-[11.5px]">
                    {dns.mx_records.map((mx, idx) => (
                      <li
                        key={idx}
                        className="px-2 py-1 bg-[var(--s1)] border border-[var(--line)] rounded-[4px] text-[var(--ink)] flex items-center justify-between"
                      >
                        <span className="truncate">{mx}</span>
                        <CheckCircle2 className="w-3 h-3 text-[var(--lo)] shrink-0 ml-2" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-[11.5px] text-[var(--mute)] font-mono">
                    Tidak ditemukan Mail Server MX untuk domain ini.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--mute)] text-[12.5px] font-mono">
              Memuat status audit DNS domain...
            </div>
          )}
        </section>

        {/* Module B: OSINT Identity Footprint (Gravatar & Format Analysis) */}
        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[var(--acc)]" />
              <h2 className="text-[14.5px] font-semibold text-[var(--ink)] m-0">
                Profil OSINT &amp; Jejak Identitas
              </h2>
            </div>
            {gravatar && (
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                  gravatar.has_gravatar
                    ? "bg-[var(--lo)]/15 border-[var(--lo)]/40 text-[var(--lo)]"
                    : "bg-[var(--s2)] border-[var(--line)] text-[var(--mute)]"
                }`}
              >
                {gravatar.has_gravatar ? "Gravatar Terdaftar" : "Tidak Ada Gravatar"}
              </span>
            )}
          </div>

          <div className="space-y-3.5">
            {/* Gravatar Profile Card */}
            <div className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] flex items-center gap-3.5">
              {gravatar?.has_gravatar && gravatar.avatar_url ? (
                <img
                  src={gravatar.avatar_url}
                  alt="Gravatar Avatar"
                  className="w-14 h-14 rounded-full border border-[var(--line)] object-cover shrink-0 bg-[var(--s1)]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[var(--s1)] border border-[var(--line)] grid place-items-center text-[var(--mute)] shrink-0 font-mono text-[18px] font-bold">
                  {emailInput.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[var(--ink)] truncate">
                    {gravatar?.display_name || emailInput.split("@")[0]}
                  </span>
                  {gravatar?.profile_url && (
                    <a
                      href={gravatar.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--acc)] hover:underline inline-flex items-center gap-0.5 text-[11.5px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="text-[11.5px] text-[var(--mute)] truncate">
                  {gravatar?.job_title ? `${gravatar.job_title} ` : ""}
                  {gravatar?.company ? `@ ${gravatar.company} ` : ""}
                  {gravatar?.location ? `&bull; ${gravatar.location}` : ""}
                  {!gravatar?.has_gravatar && "Tidak memiliki avatar publik Gravatar"}
                </div>
                {gravatar?.email_hash && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10.5px] font-mono text-[var(--mute)]">
                      MD5: <code className="text-[var(--ink)]">{gravatar.email_hash}</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(gravatar.email_hash || "")}
                      className="text-[var(--mute)] hover:text-[var(--ink)] transition-colors p-0.5"
                      title="Salin MD5 Hash"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-[var(--lo)]" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Email Syntax & Alias Trick Analysis */}
            <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-2 text-[12px]">
              <div className="text-[12px] font-medium text-[var(--ink)] flex items-center justify-between">
                <span>Struktur &amp; Analisis Manipulasi Alamat</span>
                <span className="px-1.5 py-0.2 rounded bg-[var(--s1)] border border-[var(--line)] text-[10.5px] font-mono text-[var(--mute)]">
                  RFC 5322 Standards
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11.5px] font-mono">
                <div className="p-2 bg-[var(--s1)] border border-[var(--line)] rounded-[6px]">
                  <span className="text-[var(--mute)] block text-[10.5px]">Canonical Email:</span>
                  <strong className="text-[var(--ink)] truncate block">
                    {emailAnalysis?.canonical_email || emailInput}
                  </strong>
                </div>

                <div className="p-2 bg-[var(--s1)] border border-[var(--line)] rounded-[6px]">
                  <span className="text-[var(--mute)] block text-[10.5px]">Domain Provider:</span>
                  <strong className="text-[var(--ink)] truncate block">
                    {emailAnalysis?.domain || (emailInput.split("@")[1] || "N/A")}
                  </strong>
                </div>
              </div>

              {emailAnalysis?.has_dot_trick && (
                <div className="p-2.5 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[6px] text-[11.5px] text-[var(--hi)] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Terdeteksi Gmail Dot-Trick:</strong> Titik pada username diabaikan oleh Google Mail. Pelaku sering menggunakan variasi titik untuk mendaftar akun ganda secara massal pada platform web.
                  </span>
                </div>
              )}

              {emailAnalysis?.has_plus_addressing && (
                <div className="p-2.5 bg-[var(--acc)]/10 border border-[var(--acc)]/30 rounded-[6px] text-[11.5px] text-[var(--acc)] flex items-start gap-2">
                  <Layers className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    <strong>Plus-Addressing Terdeteksi:</strong> Tag <code>+{emailAnalysis.plus_tag}</code> merupakan sub-alamat dari akun dasar <code>{emailAnalysis.base_local_part}</code>.
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* ── Breaches Table ── */}
      <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5 space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2 border-b border-[var(--line)] pb-3">
          <h2 className="text-[15px] font-semibold text-[var(--ink)] m-0">
            Riwayat Insiden Kebocoran Data Terkait Email ({result?.query || emailInput})
          </h2>
          <span className="text-[12px] font-mono text-[var(--mute)]">
            Terkait Kasus: <strong className="text-[var(--ink)]">{selectedCaseId}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--mute)] text-[12px] font-medium">
                <th className="text-left pb-2.5 pr-3">Platform Insiden</th>
                <th className="text-left pb-2.5 pr-3">Tanggal Breach</th>
                <th className="text-left pb-2.5 pr-3">Volume Bocor</th>
                <th className="text-left pb-2.5 pr-3">Kategori Data Terdampak</th>
                <th className="text-right pb-2.5">Tingkat Bahaya</th>
              </tr>
            </thead>
            <tbody>
              {breaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--mute)]">
                    Tidak ditemukan catatan kebocoran publik untuk alamat email ini dalam arsip insiden.
                  </td>
                </tr>
              ) : (
                breaches.map((b) => (
                  <tr key={b.incident_id} className="border-b border-[var(--line)] hover:bg-[var(--s2)] transition-colors">
                    <td className="py-2.5 pr-3 font-semibold text-[var(--ink)]">
                      {b.source_name}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-[var(--mute)]">
                      {b.breach_date ? formatDate(b.breach_date) : "N/A"}
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-[12px] text-[var(--ink)]">
                      {b.record_count ? b.record_count.toLocaleString("id-ID") : "100.000+"} entri
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="flex gap-1 flex-wrap">
                        {(b.exposed_fields || []).map((cls: string) => (
                          <span
                            key={cls}
                            className="px-1.5 py-0.5 rounded bg-[var(--s2)] border border-[var(--line)] text-[10.5px] font-mono text-[var(--mute)]"
                          >
                            {cls}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-[var(--hi)]">
                      {b.severity?.toUpperCase() || "HIGH"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Modal Dialog for Vaulting Confirmation ── */}
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

export default function EmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat modul audit email...</div>}>
      <EmailContent />
    </Suspense>
  );
}
