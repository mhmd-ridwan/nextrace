"use client";

import React, { useEffect, useState } from "react";
import {
  FolderGit2,
  Plus,
  Clock,
  Layers,
  ShieldAlert,
  FileCheck2,
  FileText,
  UserX,
  Database,
  Calendar,
  Tag,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { Investigation, InvestigationTimeline, TimelineEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

export default function InvestigationsPage() {
  const [loading, setLoading] = useState(true);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [timeline, setTimeline] = useState<InvestigationTimeline | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
  const [newTitle, setNewTitle] = useState("");
  const [newOrg, setNewOrg] = useState("NEXTRACE Digital Defense");
  const [newBrand, setNewBrand] = useState("Ir. H. Joko Widodo");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    setLoading(true);
    try {
      const res = await api.listInvestigations(1, 20);
      if (res && res.items) {
        setInvestigations(res.items);
        if (res.items.length > 0) {
          selectInvestigation(res.items[0]);
        }
      }
    } catch {
      // offline handled
    } finally {
      setLoading(false);
    }
  };

  const selectInvestigation = async (inv: Investigation) => {
    setSelectedInv(inv);
    try {
      const full = await api.getInvestigation(inv.id);
      setSelectedInv(full);
      const tl = await api.getInvestigationTimeline(inv.id);
      setTimeline(tl);
    } catch {
      // fallback
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await api.createInvestigation({
        title: newTitle,
        organization: newOrg,
        target_brand: newBrand,
        priority: newPriority,
        description: newDesc,
        tags: ["brand-protection", "osint-investigation"],
      });
      setInvestigations((prev) => [created, ...prev]);
      selectInvestigation(created);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Mendaftarkan Kasus",
        description: "Terjadi kendala saat menyimpan berkas kasus investigasi baru ke database.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-[var(--hi)]/15 text-[var(--hi)] border-[var(--hi)]/25";
      case "medium":
        return "bg-[var(--mid)]/15 text-[var(--mid)] border-[var(--mid)]/25";
      default:
        return "bg-[var(--lo)]/15 text-[var(--lo)] border-[var(--lo)]/25";
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header & Action ── */}
      <div className="bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" />
              <span className="text-[11px] font-mono font-semibold tracking-wider text-[var(--mute)] uppercase">
                NEXTRACE OSINT &bull; MANAJEMEN KASUS &bull; RANTAI BUKTI DIGITAL
              </span>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
              <span>Ruang Kerja Kasus Investigasi</span>
              <span className="text-[13px] font-normal text-[var(--mute)] font-mono">
                (Dossier &amp; Lini Masa Forensik)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--acc)] text-[#0e1012] font-semibold rounded-[6px] text-[13px] hover:bg-[var(--acc)]/90 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>Buka Berkas Kasus Baru</span>
            </button>
            <button
              onClick={loadInvestigations}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--s2)] text-[var(--ink)] border border-[var(--line)] hover:border-[var(--mute)] rounded-[6px] text-[13px] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[var(--acc)]" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Dossier List */}
        <div className="lg:col-span-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <span className="text-[13px] font-semibold text-[var(--ink)]">
              Daftar Kasus Aktif ({investigations.length})
            </span>
            <span className="text-[11px] font-mono text-[var(--mute)]">OSINT DOCKETS</span>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-0.5">
            {investigations.map((inv) => {
              const isSelected = selectedInv?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => selectInvestigation(inv)}
                  className={`p-3.5 rounded-[8px] border transition-colors cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[var(--s2)] border-[var(--acc)]"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-[var(--mute)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[var(--ink)] text-[13.5px] leading-snug">
                      {inv.title}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold shrink-0 border ${getPriorityBadge(
                        inv.priority
                      )}`}
                    >
                      {inv.priority.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[12px] text-[var(--mute)] line-clamp-2 leading-relaxed">
                    {inv.description || "Kasus investigasi siber identitas aktif."}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[var(--mute)] font-mono pt-2 border-t border-[var(--line)]">
                    <span>Target: {inv.target_brand || "Multi-Target"}</span>
                    <span>Status: {inv.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Dossier & Unified Timeline */}
        <div className="lg:col-span-7 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-5">
          {selectedInv ? (
            <>
              {/* Dossier Header */}
              <div className="pb-4 border-b border-[var(--line)] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--mute)] font-mono uppercase">
                    ID BERKAS: {selectedInv.id}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded font-mono font-semibold bg-[var(--lo)]/15 text-[var(--lo)] border border-[var(--lo)]/25">
                    {selectedInv.status.toUpperCase()}
                  </span>
                </div>

                <h2 className="text-[17px] font-semibold text-[var(--ink)] leading-tight">
                  {selectedInv.title}
                </h2>

                <p className="text-[13px] text-[var(--mute)] leading-relaxed">
                  {selectedInv.description}
                </p>

                {/* Dossier Metrics Row */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-center">
                    <div className="text-[11px] text-[var(--mute)] font-mono">KANDIDAT</div>
                    <div className="text-[18px] font-semibold font-mono text-[var(--ink)] mt-0.5 tabular-nums">
                      {selectedInv.stats?.findings_count ?? 6}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-center">
                    <div className="text-[11px] text-[var(--mute)] font-mono">RISIKO TINGGI</div>
                    <div className="text-[18px] font-semibold font-mono text-[var(--hi)] mt-0.5 tabular-nums">
                      {selectedInv.stats?.high_risk_findings ?? 3}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-center">
                    <div className="text-[11px] text-[var(--mute)] font-mono">BARANG BUKTI</div>
                    <div className="text-[18px] font-semibold font-mono text-[var(--ink)] mt-0.5 tabular-nums">
                      {selectedInv.stats?.evidence_count ?? 1}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] text-center">
                    <div className="text-[11px] text-[var(--mute)] font-mono">ALIAS JEJAK</div>
                    <div className="text-[18px] font-semibold font-mono text-[var(--ink)] mt-0.5 tabular-nums">
                      {selectedInv.stats?.aliases_count ?? 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">
                    Lini Masa Kronologis Forensik
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="flex items-center gap-1.5 text-[var(--hi)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--hi)]" /> Teramati
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--mid)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--mid)]" /> Dilaporkan
                    </span>
                    <span className="flex items-center gap-1.5 text-[var(--acc)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--acc)]" /> Analis
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-[var(--line)]">
                  {timeline?.events && timeline.events.length > 0 ? (
                    timeline.events.map((evt, idx) => {
                      let badge = "bg-[var(--s2)] text-[var(--mute)] border-[var(--line)]";
                      let dotColor = "bg-[var(--mute)]";
                      if (evt.event_source === "observed") {
                        badge = "bg-[var(--hi)]/15 text-[var(--hi)] border-[var(--hi)]/25";
                        dotColor = "bg-[var(--hi)]";
                      }
                      if (evt.event_source === "reported") {
                        badge = "bg-[var(--mid)]/15 text-[var(--mid)] border-[var(--mid)]/25";
                        dotColor = "bg-[var(--mid)]";
                      }
                      if (evt.event_source === "analyst") {
                        badge = "bg-[var(--acc)]/15 text-[var(--acc)] border-[var(--acc)]/25";
                        dotColor = "bg-[var(--acc)]";
                      }

                      return (
                        <div
                          key={evt.event_id || idx}
                          className="pl-7 relative space-y-1 p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px]"
                        >
                          <div
                            className={`absolute left-2.5 top-4 w-2 h-2 rounded-full ${dotColor}`}
                          />
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-[13px] text-[var(--ink)]">
                              {evt.title || evt.event_title}
                            </span>
                            <span
                              className={`text-[9.5px] px-1.5 py-0.2 rounded font-mono font-semibold border ${badge}`}
                            >
                              {evt.event_source.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-[12px] text-[var(--mute)] leading-relaxed">
                            {evt.description || evt.event_description}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-[var(--mute)] font-mono pt-1">
                            <span>Waktu: {formatDate(evt.timestamp)}</span>
                            <span>Entitas: {evt.related_entity_type || evt.entity_type || evt.event_type}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center text-[var(--mute)] font-mono text-[12px]">
                      Belum ada peristiwa pada lini masa kronologis berkas ini.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[var(--mute)] font-mono text-[12px]">
              Pilih berkas kasus di sebelah kiri untuk melihat detail dossier forensik.
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: Create New Investigation Docket ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <h2 className="text-[15px] font-semibold text-[var(--ink)]">
                Buka Berkas Kasus Investigasi Baru
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  Judul Kasus:
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Audit Akun Kloning &amp; Investigasi Phishing Q4"
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[var(--ink)] font-medium block text-[12px]">
                    Organisasi:
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrg}
                    onChange={(e) => setNewOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[var(--ink)] font-medium block text-[12px]">
                    Merek / Entitas Target:
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  Tingkat Prioritas Kasus:
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
                >
                  <option value="low">Rendah (Low)</option>
                  <option value="medium">Sedang (Medium)</option>
                  <option value="high">Tinggi (High)</option>
                  <option value="critical">Kritis (Critical)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[var(--ink)] font-medium block text-[12px]">
                  Deskripsi &amp; Lingkup Investigasi:
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Keterangan singkat mengenai indikasi serangan siber atau pemalsuan identitas..."
                  className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--line)] rounded-[6px] text-[var(--ink)] text-[12.5px] placeholder:text-[var(--mute)] focus:outline-none focus:border-[var(--acc)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-1.5 text-[12.5px] text-[var(--mute)] hover:text-[var(--ink)] font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-[#0e1012] font-semibold rounded-[6px] text-[13px] transition-colors cursor-pointer"
              >
                Daftarkan Kasus
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
