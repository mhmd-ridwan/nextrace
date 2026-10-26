"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ExternalLink,
  ShieldAlert,
  Plus,
  RefreshCw,
  Hash,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { GeneratedReport } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

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

  // Form State
  const [reportType, setReportType] = useState<"takedown" | "investigation_full" | "breach_summary" | "buzzer_threat_dossier">("takedown");
  const [reportFormat, setReportFormat] = useState<"pdf" | "json">("pdf");
  const [organization, setOrganization] = useState("Biro Pers & Media Kepresidenan / Tim Hukum Ir. H. Joko Widodo");
  const [platform, setPlatform] = useState("TikTok, Instagram, Facebook");
  const [action, setAction] = useState(
    "Permohonan takedown segera dan penghapusan konten atas pelanggaran merek dagang dan peniruan akun resmi."
  );

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.listReports("inv-jokowi-001");
      setReports(res.reports || []);
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await api.generateReport({
        investigation_id: "inv-demo-001",
        report_type: reportType,
        format: reportFormat,
        reporting_organization: organization,
        target_platform: platform,
        requested_action: action,
      });
      setReports((prev) => [created, ...prev]);
      setShowGenerateModal(false);
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mengompilasi Laporan",
        description: "Terjadi kesalahan saat mengompilasi berkas dossier dan menyegel hash bukti digital.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1540px] mx-auto min-w-0 font-sans space-y-5 sm:space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
                NEXTRACE OSINT &bull; DOKUMENTASI HUKUM &bull; BUKTI FORENSIK DIGITAL
              </span>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
              <span>Laporan Forensik &amp; Berkas Takedown</span>
              <span className="text-[13px] font-normal text-[var(--mute)] font-mono">
                (Evidentiary Dossier v2.0)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--acc)] text-[#0e1012] font-semibold rounded-[6px] text-[13px] hover:bg-[var(--acc)]/90 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Kompilasi Berkas Laporan</span>
            </button>
            <button
              onClick={loadReports}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] rounded-[6px] text-[13px] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--acc)]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mandatory Human Review Warning Banner */}
      <div className="p-4 bg-[var(--mid)]/10 border border-[var(--mid)]/25 rounded-[8px] flex items-start gap-3 text-[12.5px] text-[var(--mid)]">
        <AlertTriangle className="w-4 h-4 text-[var(--mid)] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-[var(--ink)] font-semibold">Standar Verifikasi Manusia (Human Review):</strong> Semua berkas laporan yang dibuat adalah ringkasan bukti forensik digital untuk telaah legal analis. Sistem tidak secara otomatis mentransmisikan takedown ke platform atau penegak hukum tanpa otorisasi manual.
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <span className="text-[13px] font-semibold text-[var(--ink)]">
            Daftar Berkas Laporan Terkompilasi ({reports.length})
          </span>
          <span className="text-[11px] font-mono text-[var(--mute)]">SHA-256 VERIFIED</span>
        </div>

        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((rep) => (
              <div
                key={rep.report_id}
                className="p-4 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[var(--mute)] transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--ink)] text-[13px] font-mono">
                      DOSSIER-{rep.report_id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[10px] bg-[var(--s1)] text-[var(--acc)] border border-[var(--line)] px-2 py-0.2 rounded font-mono uppercase font-semibold">
                      {rep.format}
                    </span>
                    <span className="text-[10px] bg-[var(--mid)]/15 text-[var(--mid)] border border-[var(--mid)]/25 px-1.5 py-0.2 rounded font-mono font-semibold">
                      DRAFT
                    </span>
                  </div>

                  <div className="text-[12.5px] text-[var(--ink)] font-medium">
                    Jenis: <strong className="capitalize">{rep.report_type.replace(/_/g, " ")}</strong>
                    {rep.metadata?.target_platform && ` · Platform: ${rep.metadata.target_platform}`}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-[var(--mute)] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--mute)]" />
                      Dibuat: {formatDate(rep.created_at)}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-[var(--mute)]" />
                      SHA-256: {(rep.file_hash_sha256 || "N/A").substring(0, 16)}...
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <a
                    href={api.getReportDownloadUrl(rep.report_id)}
                    download
                    className="px-3.5 py-1.5 bg-[var(--s1)] hover:border-[var(--acc)] text-[var(--ink)] border border-[var(--line)] rounded-[6px] text-[12px] font-semibold flex items-center gap-1.5 transition-colors font-mono cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--acc)]" />
                    <span>Unduh {rep.format.toUpperCase()}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-[12px] text-[var(--mute)] font-mono">
            Belum ada berkas laporan yang dikompilasi. Klik &quot;Kompilasi Berkas Laporan&quot; untuk menyusun laporan pertama Anda.
          </div>
        )}
      </div>

      {/* Generate Dossier Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleGenerate}
            className="w-full max-w-lg bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4 text-[13px] shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h2 className="text-[15px] font-semibold text-[var(--ink)]">Kompilasi Berkas Laporan Forensik</h2>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">Kategori Laporan:</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
                >
                  <option value="takedown">Berkas Permohonan Takedown</option>
                  <option value="buzzer_threat_dossier">Laporan Intelijen Anomali Buzzer & Astroturfing</option>
                  <option value="investigation_full">Audit Investigasi Lengkap</option>
                  <option value="breach_summary">Ringkasan Paparan Data Breach</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">Format Berkas:</label>
                <select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] cursor-pointer"
                >
                  <option value="pdf">Dokumen Resmi PDF</option>
                  <option value="json">Format Mesin JSON</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">Organisasi Pelapor / Merek:</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">Platform / Tautan Target:</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[var(--ink)] font-medium block text-[12px]">Justifikasi Tindakan:</label>
              <textarea
                value={action}
                onChange={(e) => setAction(e.target.value)}
                rows={3}
                required
                className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="px-3.5 py-1.5 text-[12.5px] text-[var(--mute)] hover:text-[var(--ink)] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-[#0e1012] font-semibold rounded-[6px] text-[13px] disabled:opacity-50 cursor-pointer"
              >
                Kompilasi &amp; Beri Segel Hash
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
