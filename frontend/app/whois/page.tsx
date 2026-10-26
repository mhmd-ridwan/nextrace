"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Globe, Shield, Calendar, ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, Server } from "lucide-react";
import { api } from "@/lib/api";
import { WhoisLookupResult } from "@/types";

function WhoisContent() {
  const searchParams = useSearchParams();
  const initialDomain = searchParams.get("query") || searchParams.get("domain") || "presidenri.go.id";

  const [domainInput, setDomainInput] = useState(initialDomain);
  const [data, setData] = useState<WhoisLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.lookupWhois(target.trim());
      setData(res);
    } catch (err: any) {
      setError(err.message || "Gagal melakukan query WHOIS port 43.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDomain) {
      handleQuery(initialDomain);
    }
  }, [initialDomain]);

  return (
    <div className="p-7 sm:p-8 max-w-[1200px] mx-auto min-w-0 font-sans space-y-6">
      <div className="border-b border-[var(--line)] pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--lo)] animate-pulse" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
            NEXTRACE OSINT TOOLS &bull; LIVE WHOIS REGISTRY QUERY
          </span>
        </div>
        <h1 className="text-[22px] font-bold text-[var(--ink)] tracking-[-0.01em] m-0 flex items-center gap-2">
          <Search className="w-5 h-5 text-[var(--acc)] stroke-[1.8]" />
          Alat Cepat: WHOIS Domain Intelligence
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-[var(--mute)]">
          Audit pendaftaran nama domain, registrar resmi, privasi whois guard, dan tanggal kedaluwarsa langsung dari server registry port 43.
        </p>
      </div>

      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(domainInput);
          }}
        >
          <label className="text-[12px] font-semibold text-[var(--mute)] block mb-1">
            Nama Domain Target
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="misal: presidenri.go.id, google.com"
              className="flex-1 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] px-3.5 py-2 text-[13.5px] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--acc)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[var(--acc)] text-white rounded-[6px] text-[13px] font-semibold hover:opacity-90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{loading ? "Query Registry..." : "Query WHOIS Live"}</span>
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
            <div className="p-4 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] space-y-2 text-[12.5px] font-mono">
              <div className="text-[var(--mute)] font-semibold uppercase text-[11px] flex items-center justify-between">
                <span>Ringkasan Registrasi Resmi ({data.domain}):</span>
                <span className="text-[var(--lo)] font-semibold">100% REAL REGISTRY</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                <span className="text-[var(--mute)]">Registrar Resmi:</span>
                <span className="text-[var(--ink)] font-semibold">{data.fields.registrar}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                <span className="text-[var(--mute)]">Tanggal Pembuatan:</span>
                <span className="text-[var(--ink)]">{data.fields.created_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                <span className="text-[var(--mute)]">Tanggal Kedaluwarsa:</span>
                <span className="text-[var(--ink)]">{data.fields.expiry_date}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[var(--line)]">
                <span className="text-[var(--mute)]">Usia Domain:</span>
                <span className="text-[var(--lo)] font-semibold">{data.fields.age_formatted}</span>
              </div>
              {data.fields.nameservers && data.fields.nameservers.length > 0 && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[var(--mute)]">Nameservers:</span>
                  <span className="text-[var(--ink)] text-right">{data.fields.nameservers.join(", ")}</span>
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-mono text-[var(--mute)] uppercase font-semibold mb-1">
                Log Mentah Registry (Port 43 TCP Stream):
              </div>
              <pre className="p-3.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-[11px] font-mono text-[var(--mute)] overflow-x-auto max-h-[350px]">
                {data.raw_whois}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                href={`/domain?domain=${encodeURIComponent(data.domain)}`}
                className="text-[12.5px] font-mono text-[var(--acc)] hover:underline inline-flex items-center gap-1"
              >
                <span>Buka Audit Reputasi Domain Lengkap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WhoisToolPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[var(--mute)] font-mono text-[13px]">Memuat alat WHOIS...</div>}>
      <WhoisContent />
    </Suspense>
  );
}
