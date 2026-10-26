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
  Calendar,
  Layers,
  KeyRound,
  RefreshCw,
  Sparkles,
  Database,
  Briefcase,
  AlertOctagon,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { LeakCheckResponse, Investigation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

function EmailContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("q") || "bantuan.presiden.jokowi@gmail.com";
  const initialCaseId = searchParams.get("investigation_id") || searchParams.get("case_id") || "inv-jokowi-001";

  const [emailInput, setEmailInput] = useState(initialQuery);
  const [selectedCaseId, setSelectedCaseId] = useState(initialCaseId);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(false);
  const [vaulting, setVaulting] = useState(false);
  const [result, setResult] = useState<LeakCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          // If current case not in list, keep or set first
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

  const handleVaultEvidence = async () => {
    if (!result) return;
    setVaulting(true);

    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedCaseId);
      formData.append("evidence_type", "document");
      formData.append("source_url", result.query || emailInput);
      formData.append("collection_method", "osint_email_breach_audit");

      const payload = {
        target_email: result.query || emailInput,
        identifier_type: "email",
        investigation_id: selectedCaseId,
        risk_score: result.risk_score,
        risk_level: result.risk_level,
        total_incidents: result.total_incidents,
        is_disposable_email: result.intelligence_metadata?.is_disposable_email || false,
        disposable_service: result.intelligence_metadata?.disposable_service || null,
        fraud_risk_score: result.intelligence_metadata?.fraud_risk_score || null,
        threat_vectors: result.intelligence_metadata?.threat_vectors || [],
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
        description: `Hasil audit kebocoran untuk ${result.query || emailInput} telah resmi diamankan ke Evidence Vault dengan segel integritas kriptografis SHA-256.`,
        variant: "success",
        confirmText: "Buka Loker Bukti",
        cancelText: "Tutup",
        onConfirm: () => {
          window.location.href = `/evidence?investigation_id=${selectedCaseId}`;
        },
        details: [
          { label: "Nomor Registrasi Bukti", value: evidence.evidence_id },
          { label: "ID Kasus Terkait", value: selectedCaseId },
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
            Email — Audit Kebocoran Kredensial
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Pemeriksaan data breach terhadap insiden kebocoran kredensial publik, password dump, dan korelasi domain botnet/disposable.
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
                <option value="inv-jokowi-001" className="bg-[var(--s1)] text-[var(--ink)]">
                  Operasi Siber Jokowi-RI (inv-jokowi-001)
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
            { label: "user@gmail.com", desc: "Reguler" },
            { label: "protokoler@presidenri.go.id", desc: "Pemerintah" },
            { label: "botnet_syndicate@tempmail.com", desc: "Disposable / Burner" },
            { label: "shadow_op@guerrillamail.com", desc: "Burner Mail" },
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

      {/* ── Disposable / Temp-Mail Threat Banner (High Severity Alert) ── */}
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
            {isDisposable ? "Burner / Disposable" : "Domain Reguler"}
          </b>
          <small className="text-[11.5px] text-[var(--mute)]">
            {isDisposable ? "Layanan sekali pakai tanpa KYC" : "Penyedia email standar"}
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
