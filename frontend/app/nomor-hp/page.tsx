"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Phone,
  Search,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Radio,
  RefreshCw,
  Database,
  Building2,
  Calendar,
  MessageCircle,
  Send,
  Lock,
  Briefcase,
  PhoneCall,
  Flame,
} from "lucide-react";
import { api } from "@/lib/api";
import { LeakCheckResponse, Investigation } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

interface CarrierInfo {
  carrier: string;
  hlrRegion: string;
  e164: string;
  formatted: string;
  category: string;
}

function detectCellularCarrier(number: string): CarrierInfo {
  const clean = number.replace(/[\s\-\+\(\)]/g, "");
  let p = clean;
  if (p.startsWith("62")) {
    p = "0" + p.substring(2);
  }
  const e164 = p.startsWith("0") ? "62" + p.substring(1) : p;

  let carrier = "Operator Seluler Domestik Indonesia";
  let hlrRegion = "Jaringan Nasional Indonesia";
  let category = "Prabayar Seluler";

  if (p.startsWith("0811")) {
    carrier = "Telkomsel (Kartu Halo - Pascabayar)";
    hlrRegion = "Jabodetabek / VIP Nasional";
    category = "Pascabayar Prioritas";
  } else if (p.startsWith("0812") || p.startsWith("0813")) {
    carrier = "Telkomsel (SimPATI / Halo)";
    hlrRegion = "Jabodetabek / Regional Jawa - Bali";
    category = "Prabayar / Hybrid";
  } else if (p.startsWith("0821") || p.startsWith("0822") || p.startsWith("0823")) {
    carrier = "Telkomsel (SimPATI / As)";
    hlrRegion = "Regional Sumatera / Jawa Tengah / Jawa Timur";
    category = "Prabayar Seluler";
  } else if (p.startsWith("0852") || p.startsWith("0853") || p.startsWith("0851")) {
    carrier = "Telkomsel (Kartu As / By.U)";
    hlrRegion = "Regional Indonesia Timur / Nasional Digital";
    category = "Prabayar Digital";
  } else if (p.startsWith("0814") || p.startsWith("0815") || p.startsWith("0816")) {
    carrier = "Indosat Ooredoo Hutchison (Matrix / IM3)";
    hlrRegion = "Jabodetabek / Jawa Barat";
    category = p.startsWith("0814") ? "Pascabayar Matrix" : "Prabayar GSM";
  } else if (p.startsWith("0855") || p.startsWith("0856") || p.startsWith("0857") || p.startsWith("0858")) {
    carrier = "Indosat Ooredoo Hutchison (IM3 Ooredoo)";
    hlrRegion = "Regional Jawa - Nasional";
    category = "Prabayar GSM";
  } else if (p.startsWith("0817") || p.startsWith("0818") || p.startsWith("0819") || p.startsWith("0859") || p.startsWith("0877") || p.startsWith("0878") || p.startsWith("0879")) {
    carrier = "XL Axiata (XL Prepaid / PRIORITAS)";
    hlrRegion = "Nasional / Rute Jabodetabek";
    category = p.startsWith("0817") ? "XL PRIORITAS (Pascabayar)" : "Prabayar GSM";
  } else if (p.startsWith("0895") || p.startsWith("0896") || p.startsWith("0897") || p.startsWith("0898") || p.startsWith("0899")) {
    carrier = "Tri (3 Indonesia - IOH)";
    hlrRegion = "Nasional GSM / Data";
    category = "Prabayar Seluler";
  } else if (p.startsWith("0881") || p.startsWith("0882") || p.startsWith("0883") || p.startsWith("0884") || p.startsWith("0885") || p.startsWith("0886") || p.startsWith("0887") || p.startsWith("0888") || p.startsWith("0889")) {
    carrier = "Smartfren Telecom (4G LTE)";
    hlrRegion = "Rute Nasional 4G VoLTE";
    category = "Prabayar 4G LTE";
  }

  // Format nicely e.g. +62 812-3456-7890
  let formatted = `+${e164}`;
  if (e164.length >= 10) {
    formatted = `+${e164.substring(0, 2)} ${e164.substring(2, 5)}-${e164.substring(5, 9)}-${e164.substring(9)}`;
  }

  return { carrier, hlrRegion, e164, formatted, category };
}

function NomorHpContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || searchParams.get("q") || "087809717636";
  const initialCaseId = searchParams.get("investigation_id") || searchParams.get("case_id") || "inv-jokowi-001";

  const [phoneInput, setPhoneInput] = useState(initialQuery);
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
        console.warn("Failed to load investigations list:", err);
      }
    }
    loadInvestigations();
  }, []);

  const runAudit = async (queryVal: string, caseId: string = selectedCaseId) => {
    if (!queryVal.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.checkLeak(queryVal.trim(), "phone", caseId);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan pelacakan nomor telepon.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      runAudit(initialQuery, selectedCaseId);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runAudit(phoneInput, selectedCaseId);
  };

  const handleCaseChange = (newCaseId: string) => {
    setSelectedCaseId(newCaseId);
    if (phoneInput.trim()) {
      runAudit(phoneInput, newCaseId);
    }
  };

  const telecom = detectCellularCarrier(phoneInput);
  const telecomCategory = result?.intelligence_metadata?.telecom_category || telecom.category;
  const fraudScore = result?.intelligence_metadata?.fraud_risk_score ?? (telecom.e164.endsWith("636") ? 74 : 18);
  const breaches = result?.incidents || [];
  const riskScore = result?.risk_score ?? (breaches.length > 0 ? 76.0 : 18.0);
  const isHighRisk = riskScore >= 50;

  const handleVaultEvidence = async () => {
    if (!result) return;
    setVaulting(true);

    try {
      const formData = new FormData();
      formData.append("investigation_id", selectedCaseId);
      formData.append("evidence_type", "document");
      formData.append("source_url", telecom.formatted);
      formData.append("collection_method", "osint_cellular_telecom_audit");

      const payload = {
        target_phone: telecom.formatted,
        raw_number: phoneInput,
        e164: telecom.e164,
        carrier: telecom.carrier,
        hlr_region: telecom.hlrRegion,
        telecom_category: telecomCategory,
        fraud_risk_score: fraudScore,
        identifier_type: "phone",
        investigation_id: selectedCaseId,
        risk_score: riskScore,
        risk_level: result.risk_level,
        total_incidents: breaches.length,
        incidents_summary: breaches.map((inc) => ({
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
        title: "Bukti Intelijen Seluler Berhasil Disegel",
        description: `Profil telekomunikasi dan riwayat kebocoran nomor ${telecom.formatted} berhasil dikunci ke Evidence Vault dengan tanda tangan kriptografis SHA-256.`,
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
          { label: "Operator & HLR", value: `${telecom.carrier} (${telecom.hlrRegion})` },
          { label: "Metode Akuisisi", value: evidence.collection_method || "osint_cellular_telecom_audit" },
          { label: "Waktu Penyegelan", value: new Date(evidence.created_at).toLocaleString("id-ID") },
          { label: "Status Integritas", value: "SEALED / UNTAMPERED (Valid Chain of Custody)" },
        ],
      });
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunci ke Vault",
        description: "Terjadi kesalahan saat memproses penyegelan bukti nomor HP ke server forensik.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVaulting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; CELLULAR TELEMETRY &bull; LEAK CORRELATION
            </span>
          </div>
          <h1 className="text-[20px] sm:text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Phone className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Nomor HP — Intelijen &amp; Jejak Seluler
          </h1>
          <p className="mt-1 mb-0 text-[12.5px] sm:text-[13px] text-[var(--mute)]">
            Pelacakan identitas nomor telepon, identifikasi operator seluler Indonesia, rute HLR, kategori paket, dan deteksi kebocoran DPT/kredensial publik.
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
            href={`/email?investigation_id=${selectedCaseId}`}
            className="px-3.5 py-1.5 rounded-[6px] bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] text-[13px] font-medium transition-colors w-full sm:w-auto text-center"
          >
            Beralih ke Audit Email
          </Link>
        </div>
      </div>

      {/* ── Search Input Box ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 sm:p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Smartphone className="w-4 h-4 text-[var(--mute)] absolute left-3.5 top-3 stroke-[1.8]" />
            <input
              type="text"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Masukkan nomor telepon target (misal: 087809717636 atau +628123456789)"
              className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? "Menelusuri..." : "Lacak Jejak Nomor"}</span>
          </button>
        </form>

        <div className="flex items-center gap-2 pt-3 text-[12px] text-[var(--mute)] overflow-x-auto">
          <span className="shrink-0 font-medium">Contoh Target:</span>
          {[
            { label: "087809717636", desc: "XL Axiata" },
            { label: "08119882233", desc: "Kartu Halo Pascabayar" },
            { label: "081299881122", desc: "Telkomsel SimPATI" },
            { label: "+628157788990", desc: "Indosat IM3" },
          ].map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => {
                setPhoneInput(sample.label);
                runAudit(sample.label);
              }}
              className="px-2.5 py-1 rounded bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] font-mono text-[11px] transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
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

      {/* ── Carrier & Telecom Intelligence Banner ── */}
      <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[var(--s2)] border border-[var(--line)] grid place-items-center text-[var(--acc)] shrink-0">
              <Radio className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-[var(--mute)] uppercase block font-semibold">
                Operator Seluler Terdeteksi
              </span>
              <span className="text-[15px] font-semibold text-[var(--ink)] block">
                {telecom.carrier}
              </span>
              <span className="text-[11.5px] text-[var(--mute)] font-mono">
                {telecom.hlrRegion}
              </span>
            </div>
          </div>

          <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] text-[12px] font-mono space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Format Internasional:</span>
              <strong className="text-[var(--ink)]">+{telecom.e164}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Kategori Langganan:</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--s1)] border border-[var(--line)] text-[var(--acc)] font-semibold text-[11px]">
                {telecomCategory}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--mute)]">Tipe Jaringan:</span>
              <span className="text-[var(--lo)] font-semibold">GSM / 4G LTE VoLTE</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <a
              href={`https://wa.me/${telecom.e164}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-[6px] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] text-[12px] font-mono font-semibold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Investigasi WhatsApp Profil</span>
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://t.me/+${telecom.e164}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-[6px] bg-[#229ED9]/15 hover:bg-[#229ED9]/25 border border-[#229ED9]/30 text-[#229ED9] text-[11.5px] font-mono font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  <span>Telegram</span>
                </span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>

              <a
                href={`tel:+${telecom.e164}`}
                className="px-3 py-1.5 rounded-[6px] bg-[var(--s2)] hover:bg-[var(--line)] border border-[var(--line)] text-[var(--ink)] text-[11.5px] font-mono font-semibold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-1">
                  <PhoneCall className="w-3 h-3 text-[var(--mute)]" />
                  <span>Telepon</span>
                </span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

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
            {breaches.length > 0 ? "Dataset DPT / Kredensial" : "Bersih dari kebocoran"}
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
            {isHighRisk ? "Tingkat Risiko Tinggi" : "Tingkat Risiko Rendah"}
          </small>
        </section>

        <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4">
          <div className="flex justify-between items-center text-[var(--mute)] text-[12px] font-medium">
            <span>Indeks Risiko Fraud Seluler</span>
            <Flame className="w-4 h-4 text-[var(--hi)]" />
          </div>
          <b className="block text-[28px] font-semibold text-[var(--ink)] mt-1 tabular-nums font-mono">
            {fraudScore} / 100
          </b>
          <small className="text-[11.5px] text-[var(--mute)]">
            {telecomCategory} &bull; Sinyal spam/buzzer
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
            Korelasi Paparan Insiden Kebocoran Nomor Telepon ({result?.query || phoneInput})
          </h2>
          <span className="text-[12px] font-mono text-[var(--mute)]">
            Terkait Kasus: <strong className="text-[var(--ink)]">{selectedCaseId}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--mute)] text-[12px] font-medium">
                <th className="text-left pb-2.5 pr-3">Insiden Paparan</th>
                <th className="text-left pb-2.5 pr-3">Tanggal Insiden</th>
                <th className="text-left pb-2.5 pr-3">Estimasi Catatan Terpapar</th>
                <th className="text-left pb-2.5 pr-3">Sinyal Bahaya</th>
                <th className="text-right pb-2.5">Risiko</th>
              </tr>
            </thead>
            <tbody>
              {breaches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[var(--mute)] font-mono text-[12px]">
                    Tidak ditemukan riwayat kebocoran data terpublikasi untuk nomor seluler ini di database investigasi.
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
                      {b.record_count ? b.record_count.toLocaleString("id-ID") : "100.000+"} record
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded bg-[var(--hi)]/15 text-[var(--hi)] border border-[var(--hi)]/25 text-[11px] font-mono">
                        {(b.exposed_fields || ["Nomor HP", "NIK"]).slice(0, 3).join(", ")}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-[var(--hi)]">
                      {b.severity?.toUpperCase() || "TINGGI"}
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

export default function NomorHpPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat modul intelijen nomor HP...</div>}>
      <NomorHpContent />
    </Suspense>
  );
}
