"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Globe, ArrowRight, Server, Shield, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { DnsLookupResult } from "@/types";

function DnsContent() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("query") || searchParams.get("domain") || "presidenri.go.id";

  const [domainInput, setDomainInput] = useState(initialDomain);
  const [data, setData] = useState<DnsLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookupDns(target.trim());
      setData(res);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan resolusi DNS publik.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDomain) {
      handleResolve(initialDomain);
    }
  }, [initialDomain]);

  const recordKeys = data?.records ? Object.keys(data.records) : [];

  return (
    <div className="p-7 sm:p-8 max-w-[1200px] mx-auto min-w-0 font-sans space-y-6">
      <div className="border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
            NEXTRACE OSINT TOOLS &bull; REAL-TIME DNS RECORD RESOLVER
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
          Alat Cepat: DNS Records &amp; Nameserver Analysis
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-[var(--mute)]">
          Inspeksi real-time rekaman A, AAAA, MX, NS, TXT, SPF, DKIM, dan pemetaan infrastruktur server nama domain.
        </p>
      </div>

      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleResolve(domainInput);
          }}
        >
          <label className="text-[12px] font-semibold text-[var(--mute)] block mb-1">
            Nama Host atau Domain Target
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="misal: presidenri.go.id, bca.co.id"
              className="flex-1 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] px-3.5 py-2 text-[13.5px] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--acc)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[var(--acc)] text-white rounded-[6px] text-[13px] font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
              <span>{loading ? "Meresolusi DNS..." : "Resolusi DNS Real-Time"}</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-[var(--hi)]/10 border border-[var(--hi)]/30 rounded text-[var(--hi)] text-[12px] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {data && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2 text-[12px] font-mono">
              <span className="text-[var(--mute)]">
                Hasil Resolusi DNS untuk: <strong className="text-[var(--ink)]">{data.domain}</strong>
              </span>
              <span className="text-[var(--lo)] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% REAL LIVE DNS</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12.5px] font-mono">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[var(--mute)] text-[11.5px] bg-[var(--s2)]">
                    <th className="text-left py-2 px-3 w-28">Tipe</th>
                    <th className="text-left py-2 px-3">Nilai Konfigurasi Terdeteksi</th>
                    <th className="text-right py-2 px-3 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {recordKeys.map((type) => {
                    const values = data.records[type] || [];
                    if (values.length === 0) {
                      return (
                        <tr key={type} className="text-[var(--mute)]/50">
                          <td className="py-2 px-3 font-semibold">{type}</td>
                          <td className="py-2 px-3 italic text-[11px]">(Tidak ada rekaman)</td>
                          <td className="py-2 px-3 text-right text-[11px]">NONE</td>
                        </tr>
                      );
                    }
                    return values.map((val, idx) => (
                      <tr key={`${type}-${idx}`} className="hover:bg-[var(--s2)]">
                        <td className="py-2 px-3 font-semibold text-[var(--acc)]">
                          {type} {values.length > 1 ? `#${idx + 1}` : ""}
                        </td>
                        <td className="py-2 px-3 text-[var(--ink)] break-all max-w-[500px]">{val}</td>
                        <td className="py-2 px-3 text-right text-[var(--lo)] font-semibold text-[11px]">
                          RESOLVED
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href={`/domain?domain=${encodeURIComponent(data.domain)}`}
                className="text-[12.5px] font-mono text-[var(--acc)] hover:underline inline-flex items-center gap-1"
              >
                <span>Lihat Analisis Reputasi Domain Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DnsToolPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat alat DNS...</div>}>
      <DnsContent />
    </Suspense>
  );
}
