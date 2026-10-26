"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Sliders,
  Database,
  Lock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { SystemInfo } from "@/types";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/api/v1");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    setApiUrl(api.getApiBaseUrl());
    loadInfo();
  }, []);

  const loadInfo = async () => {
    try {
      const info = await api.getSystemInfo();
      setSystemInfo(info);
    } catch {
      // offline handled
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      api.setApiBaseUrl(apiUrl);
      const health = await api.getHealth();
      if (health.status === "healthy") {
        setTestResult({ ok: true, message: "Terhubung sukses ke server FastAPI NEXTRACE." });
        loadInfo();
      } else {
        setTestResult({ ok: false, message: `Status tidak terduga: ${health.status}` });
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || "Gagal menghubungi backend." });
    } finally {
      setTesting(false);
    }
  };

  const heuristicWeights = [
    { factor: "Avatar Perceptual Hash (pHash)", weight: "30%", desc: "Kemiripan struktur luminansi citra & jarak bit Hamming 64-bit DCT" },
    { factor: "Username Edit Distance / Levenshtein", weight: "25%", desc: "Substitusi karakter, typosquatting, dan jumlah langkah edit" },
    { factor: "Display Name Similarity", weight: "15%", desc: "Rasio kemiripan nama terverifikasi setelah normalisasi Unicode NFKC" },
    { factor: "Cross-Script Homoglyph Detection", weight: "10%", desc: "Substitusi huruf visual Cyrillic, Greek, atau IPA ke alfabet Latin" },
    { factor: "Suspicious Link / Punycode URLs", weight: "10%", desc: "Shortener URL, domain punycode, dan parameter pengalihan phishing" },
    { factor: "Unauthorized Contact Details", weight: "5%", desc: "Nomor WhatsApp atau rekening tidak resmi yang dicantumkan di bio" },
    { factor: "Urgency / Impersonation Bio Terms", weight: "5%", desc: "Kosakata penipuan: 'official reseller', 'transfer segera', 'giveaway'" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
            NEXTRACE OSINT &bull; KONFIGURASI SISTEM &bull; PARAMETER HEURISTIK
          </span>
        </div>
        <h1 className="text-[20px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
          <span>Pengaturan &amp; Bobot Heuristik</span>
          <span className="text-[13px] font-normal text-[var(--mute)] font-mono">
            (System Engine Tuning v2.0)
          </span>
        </h1>
      </div>

      {/* Backend API Configuration Card */}
      <div className="p-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] space-y-4">
        <h2 className="text-[13px] font-semibold text-[var(--ink)] flex items-center gap-2">
          <Server className="w-4 h-4 text-[var(--acc)] stroke-[1.7]" />
          <span>Gateway Koneksi Backend API</span>
        </h2>

        <div className="space-y-3 text-[13px]">
          <div>
            <label className="block text-[var(--ink)] mb-1 font-mono text-[12px]">
              URL Endpoint FastAPI REST
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] px-3 py-2 text-[var(--ink)] font-mono text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-[#0e1012] rounded-[6px] font-semibold text-[13px] flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
                <span>Uji Koneksi</span>
              </button>
            </div>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-[6px] border flex items-center gap-2 font-mono text-[12px] ${
                testResult.ok
                  ? "bg-[var(--lo)]/10 border-[var(--lo)]/25 text-[var(--lo)]"
                  : "bg-[var(--hi)]/10 border-[var(--hi)]/25 text-[var(--hi)]"
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--lo)] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[var(--hi)] shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {systemInfo && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-[11px] font-mono">
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                <span className="text-[var(--mute)] block uppercase">NAMA ENGINE</span>
                <span className="text-[var(--ink)] font-semibold">{systemInfo.app_name}</span>
              </div>
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                <span className="text-[var(--mute)] block uppercase">VERSI KERNEL</span>
                <span className="text-[var(--ink)] font-semibold">{systemInfo.app_version}</span>
              </div>
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                <span className="text-[var(--mute)] block uppercase">LINGKUNGAN</span>
                <span className="text-[var(--ink)] font-semibold">{systemInfo.environment}</span>
              </div>
              <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px]">
                <span className="text-[var(--mute)] block uppercase">MODE DEMO</span>
                <span className="text-[var(--acc)] font-semibold">{systemInfo.demo_mode ? "AKTIF" : "OFF"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heuristic Weight Distribution Table */}
      <div className="p-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] space-y-4">
        <h2 className="text-[13px] font-semibold text-[var(--ink)] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[var(--acc)] stroke-[1.7]" />
          <span>Distribusi Bobot Multi-Signal Heuristik</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--mute)] font-mono text-[11px] bg-[var(--s2)]">
                <th className="py-2.5 px-3 font-semibold">Faktor Sinyal Forensik</th>
                <th className="py-2.5 px-3 font-semibold">Bobot</th>
                <th className="py-2.5 px-3 font-semibold">Deskripsi Algoritmik</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {heuristicWeights.map((h, idx) => (
                <tr key={idx} className="hover:bg-[var(--s2)] transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-[var(--ink)]">{h.factor}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[var(--acc)] tabular-nums">{h.weight}</td>
                  <td className="py-2.5 px-3 text-[var(--mute)] text-[12px]">{h.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
