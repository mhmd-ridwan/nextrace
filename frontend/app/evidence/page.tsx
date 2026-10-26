"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  ShieldCheck,
  AlertTriangle,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Fingerprint,
  RefreshCw,
  ExternalLink,
  Plus,
  Info,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { EvidenceArtifact, EvidenceVerifyResult } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

export default function DigitalEvidencePage() {
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState<EvidenceArtifact[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceArtifact | null>(null);
  const [verificationResult, setVerificationResult] = useState<EvidenceVerifyResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form State
  const [evidenceType, setEvidenceType] = useState("screenshot");
  const [sourceUrl, setSourceUrl] = useState("https://www.tiktok.com/@jokowi.official_bantuan");
  const [collectionMethod, setCollectionMethod] = useState("manual_capture");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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
    loadEvidence();
  }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.listEvidence();
      if (res && res.items && res.items.length > 0) {
        setEvidenceList(res.items);
        setSelectedEvidence(res.items[0]);
      } else {
        const ev = await api.getEvidence("ev-jokowi-001");
        if (ev) {
          setEvidenceList([ev]);
          setSelectedEvidence(ev);
        }
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: string) => {
    setVerifying(true);
    try {
      const res = await api.verifyEvidence(id);
      setVerificationResult(res);
      const updated = await api.getEvidence(id);
      setSelectedEvidence(updated);
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Verifikasi Bukti Gagal",
        description: "Gagal memverifikasi integritas hash kriptografi SHA-256 berkas bukti.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setModalConfig({
        isOpen: true,
        title: "Berkas Belum Dipilih",
        description: "Silakan pilih berkas bukti digital yang valid (gambar, dokumen, log HAR) sebelum mengunggah.",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("investigation_id", "inv-demo-001");
      formData.append("evidence_type", evidenceType);
      formData.append("source_url", sourceUrl);
      formData.append("collection_method", collectionMethod);
      formData.append("file", uploadFile);

      const created = await api.createEvidence(formData);
      setEvidenceList((prev) => [created, ...prev]);
      setSelectedEvidence(created);
      setShowUploadModal(false);
      setUploadFile(null);
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengunggah Bukti",
        description: "Terjadi kesalahan saat memproses dan menyegel hash bukti digital ke server.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
                NEXTRACE OSINT &bull; RANTAI KUSTODI DIGITAL &bull; INTEGRITAS BUKTI
              </span>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
              <span>Loker Barang Bukti Digital &amp; Rantai Kustodi</span>
              <span className="text-[13px] font-normal text-[var(--mute)] font-mono">
                (Digital Evidence Locker v2.0)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--acc)] text-[#0e1012] font-semibold rounded-[6px] text-[13px] hover:bg-[var(--acc)]/90 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Unggah Bukti Digital</span>
            </button>
            <button
              onClick={loadEvidence}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] rounded-[6px] text-[13px] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--acc)]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Artifact Manifest */}
        <div className="lg:col-span-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <span className="text-[13px] font-semibold text-[var(--ink)]">
              Bukti Terdaftar ({evidenceList.length})
            </span>
            <span className="text-[11px] font-mono text-[var(--mute)]">SHA-256 HASHED</span>
          </div>

          <div className="space-y-2">
            {evidenceList.map((ev) => {
              const isSelected = selectedEvidence?.evidence_id === ev.evidence_id;
              return (
                <div
                  key={ev.evidence_id}
                  onClick={() => {
                    setSelectedEvidence(ev);
                    setVerificationResult(null);
                  }}
                  className={`p-3.5 rounded-[8px] border transition-colors cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[var(--s2)] border-[var(--acc)]"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-[var(--mute)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-semibold text-[var(--ink)] uppercase">
                      [{ev.evidence_type}] {ev.evidence_id.substring(0, 16)}...
                    </span>
                    <span className="text-[10px] px-2 py-0.2 rounded font-mono font-semibold bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25">
                      SEALED
                    </span>
                  </div>

                  <div className="text-[11px] text-[var(--mute)] font-mono truncate">
                    Sumber: {ev.source_url}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--mute)] font-mono pt-1 border-t border-[var(--line)]">
                    <span>Metode: {ev.collection_method}</span>
                    <span>{formatDate(ev.captured_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Integrity & Custody Trail */}
        <div className="lg:col-span-7 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-5">
          {selectedEvidence ? (
            <>
              {/* Header Info */}
              <div className="pb-4 border-b border-[var(--line)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--mute)] font-mono uppercase">
                    ID BUKTI: {selectedEvidence.evidence_id}
                  </span>
                  <button
                    onClick={() => handleVerify(selectedEvidence.evidence_id)}
                    disabled={verifying}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[var(--s2)] hover:border-[var(--acc)] border border-[var(--line)] text-[var(--ink)] rounded-[6px] text-[12px] font-mono transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>{verifying ? "Memverifikasi..." : "Audit Hash SHA-256"}</span>
                  </button>
                </div>

                <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] space-y-1 font-mono text-[11.5px]">
                  <div className="text-[var(--mute)]">FINGERPRINT SHA-256:</div>
                  <div className="text-[var(--acc)] break-all font-semibold">
                    {selectedEvidence.sha256_hash}
                  </div>
                </div>
              </div>

              {/* Verification Result Banner */}
              {verificationResult && (
                <div
                  className={`p-3.5 rounded-[8px] border flex items-start gap-3 text-[12.5px] ${
                    verificationResult.status === "intact"
                      ? "bg-[var(--lo)]/10 border-[var(--lo)]/25 text-[var(--lo)]"
                      : "bg-[var(--hi)]/10 border-[var(--hi)]/25 text-[var(--hi)]"
                  }`}
                >
                  {verificationResult.status === "intact" ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold">
                      {verificationResult.status === "intact"
                        ? "Integritas Kriptografi Terverifikasi Utuh (100% Cocok)"
                        : "Peringatan: Hash Bukti Mengalami Modifikasi!"}
                    </div>
                    <div className="text-[11.5px] font-mono text-[var(--mute)]">
                      {verificationResult.message}
                    </div>
                  </div>
                </div>
              )}

              {/* Chain of Custody Log */}
              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">
                  Log Audit Rantai Kustodi (Chain-of-Custody)
                </h3>

                <div className="space-y-2">
                  {selectedEvidence.chain_of_custody && selectedEvidence.chain_of_custody.length > 0 ? (
                    selectedEvidence.chain_of_custody.map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] space-y-1 text-[12px]"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px]">
                          <span className="font-semibold text-[var(--ink)] uppercase">
                            Aksi: {log.action}
                          </span>
                          <span className="text-[var(--mute)]">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="text-[var(--mute)]">
                          Petugas: <strong className="text-[var(--ink)]">{log.actor}</strong> &bull; Catatan: {log.notes}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[var(--mute)] font-mono text-[12px]">
                      Belum ada catatan rantai kustodi.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[var(--mute)] font-mono text-[12px]">
              Pilih artefak barang bukti di sebelah kiri untuk melihat rincian integritas.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpload}
            className="w-full max-w-lg bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4 text-[13px] shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h2 className="text-[15px] font-semibold text-[var(--ink)]">
                Unggah Artefak Bukti Forensik
              </h2>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  Jenis Bukti:
                </label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
                >
                  <option value="screenshot">Screenshot / Tangkapan Layar</option>
                  <option value="image_avatar">Foto Profil / Avatar</option>
                  <option value="html_snapshot">Snapshot HTML Web</option>
                  <option value="har_log">Log Jaringan HAR</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  URL Sumber Bukti:
                </label>
                <input
                  type="url"
                  required
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  Berkas Bukti (Gambar / Log):
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-[var(--s2)] file:text-[var(--ink)] file:text-[12px] file:font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-3.5 py-1.5 text-[12.5px] text-[var(--mute)] hover:text-[var(--ink)] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-[#0e1012] font-semibold rounded-[6px] text-[13px] disabled:opacity-50 cursor-pointer"
              >
                Unggah &amp; Segel Bukti
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Professional Theme-Matching Modal Popup */}
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}
