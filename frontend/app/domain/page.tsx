"use client";

import React, { Suspense, useEffect, useState } from "react";
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
  FileCheck,
  RefreshCw,
  Calendar,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { DomainAuditRecord } from "@/types";

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

  const [domainInput, setDomainInput] = useState(initialDomain);
  const [record, setRecord] = useState<DomainAuditRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawWhois, setShowRawWhois] = useState(false);

  const handleLookup = async (targetDomain: string) => {
    if (!targetDomain.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.auditDomain(targetDomain.trim());
      setRecord(res);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan audit live domain.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDomain) {
      handleLookup(initialDomain);
    }
  }, [initialDomain]);

  const isHighRisk = record?.risk_status === "Tinggi";
  const isMedRisk = record?.risk_status === "Sedang";

  return (
    <div className="p-7 sm:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-6">
      {/* ── Page Header ── */}
      <div className="flex justify-between items-end gap-4 flex-wrap border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
            <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
              NEXTRACE OSINT &bull; LIVE DOMAIN &amp; DNS INTELLIGENCE &bull; WHOIS
            </span>
          </div>
          <h1 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
            Domain &amp; Reputasi Digital
          </h1>
          <p className="mt-1 mb-0 text-[13px] text-[var(--mute)]">
            Audit kepemilikan nama domain, rekaman DNS real-time, usia pendaftaran, dan verifikasi sertifikat TLS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/evidence"
            className="px-3.5 py-1.5 rounded-[6px] bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] text-[13px] font-medium transition-colors"
          >
            Buka Vault Bukti Digital
          </Link>
        </div>
      </div>

      {/* ── Search Bar ── */}
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
              placeholder="Masukkan nama domain atau URL (misal: presidenri.go.id, kemkes.go.id)"
              className="w-full bg-[var(--s2)] border border-[var(--line)] rounded-[6px] pl-10 pr-3 py-2 text-[13.5px] text-[var(--ink)] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)] font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[var(--acc)] hover:opacity-90 text-white rounded-[6px] font-semibold text-[13px] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? "Mengaudit DNS & WHOIS..." : "Cek Domain Real-Time"}</span>
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
                handleLookup(sample);
              }}
              className="px-2.5 py-0.5 rounded bg-[var(--s2)] border border-[var(--line)] hover:border-[var(--mute)] text-[var(--ink)] font-mono text-[11.5px] transition-colors shrink-0 cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded-[8px] flex items-center gap-2.5 text-[var(--hi)] text-[13px]">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {record && (
        <>
          {/* ── Domain Forensic Summary ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <section className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
              <div className="flex justify-between items-center text-[var(--mute)] text-[12.5px] font-medium mb-1">
                <span>Status Risiko &amp; Reputasi</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isHighRisk
                      ? "bg-[var(--hi)] animate-pulse"
                      : isMedRisk
                      ? "bg-[var(--mid)]"
                      : "bg-[var(--lo)]"
                  }`}
                />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <b
                  className={`text-[26px] font-bold leading-[1.2] ${
                    isHighRisk
                      ? "text-[var(--hi)]"
                      : isMedRisk
                      ? "text-[var(--mid)]"
                      : "text-[var(--lo)]"
                  }`}
                >
                  {record.risk_status}
                </b>
                <span className="text-[12px] font-mono text-[var(--mute)]">
                  (Skor Anomali: {record.risk_score}%)
                </span>
              </div>
              <p className="text-[12px] text-[var(--mute)] mt-2 leading-[1.4] m-0">
                {record.reputation_notes}
              </p>
              {record.risk_reasons && record.risk_reasons.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[var(--line)] space-y-1">
                  <div className="text-[10.5px] font-mono text-[var(--mute)] uppercase font-semibold">
                    Faktor Risiko Terdeteksi:
                  </div>
                  {record.risk_reasons.map((r, i) => (
                    <div key={i} className="text-[11.5px] text-[var(--ink)] flex items-start gap-1.5">
                      <span className="text-[var(--acc)]">&bull;</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}
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

              <div className="pt-3 border-t border-[var(--line)] mt-3">
                <Link
                  href="/reports"
                  className="w-full text-center block px-3 py-1.5 rounded-[6px] bg-[var(--acc)] text-white font-semibold text-[12.5px] hover:opacity-90 transition-opacity"
                >
                  Lampirkan ke Laporan Takedown
                </Link>
              </div>
            </section>
          </div>

          {/* ── Live DNS Records Table ── */}
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

            {/* Collapsible Raw WHOIS Output */}
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
  );
}

export default function DomainPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat modul intelijen domain...</div>}>
      <DomainContent />
    </Suspense>
  );
}
