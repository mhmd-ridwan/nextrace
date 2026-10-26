"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Copy,
  Check,
  ShieldAlert,
  Inbox,
  AlertTriangle,
  Clock,
  Send,
  RefreshCw,
  Plus,
  Info,
  Radio,
} from "lucide-react";
import { api } from "@/lib/api";
import { EmailAlias, InboundEvent } from "@/types";
import { formatDate } from "@/lib/utils";
import { Modal, ModalDetailItem } from "@/components/ui/Modal";

export default function SmartAliasPage() {
  const [loading, setLoading] = useState(false);
  const [aliases, setAliases] = useState<EmailAlias[]>([]);
  const [selectedAlias, setSelectedAlias] = useState<EmailAlias | null>(null);
  const [events, setEvents] = useState<InboundEvent[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const [serviceLabel, setServiceLabel] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("protokoler@presidenri.go.id");
  const [generatedAlias, setGeneratedAlias] = useState<EmailAlias | null>(null);

  useEffect(() => {
    loadAliases();
  }, []);

  const loadAliases = async () => {
    try {
      const list = await api.listAliases("inv-jokowi-001");
      setAliases(list);
      if (list.length > 0) {
        selectAlias(list[0]);
      }
    } catch {
      // Backend offline handled
    }
  };

  const selectAlias = async (alias: EmailAlias) => {
    setSelectedAlias(alias);
    try {
      const res = await api.getAlias(alias.alias_id);
      setEvents(res.events || []);
    } catch {
      setEvents([]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceLabel.trim() || !primaryEmail.trim()) return;

    setLoading(true);
    try {
      const res = await api.generateAlias(
        serviceLabel.trim(),
        primaryEmail.trim(),
        "inv-demo-001"
      );
      setGeneratedAlias(res);
      setAliases((prev) => [res, ...prev]);
      setSelectedAlias(res);
      setServiceLabel("");
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Gagal Membuat Alias",
        description: "Terjadi kesalahan saat men-generate smart baiting email alias baru.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSimulateInbound = async (aliasId: string) => {
    try {
      const evt = await api.recordInboundEvent(aliasId, {
        sender_domain: "marketing.unauthorized-partner.test",
        subject_snippet: "[UNSOLICITED] Exclusive catalog distribution",
        headers_meta: { "x-sender-ip": "203.0.113.195", routing: "direct-smtp" },
        message_fingerprint: "sha256_mock_inbound_982b1c",
      });
      setEvents((prev) => [evt, ...prev]);
    } catch (err: any) {
      setModalConfig({
        isOpen: true,
        title: "Simulasi Insiden Gagal",
        description: "Gagal menyimulasikan penerimaan email masuk dari domain spam pihak ketiga.",
        variant: "danger",
        confirmText: "Tutup",
        details: err.message || String(err),
      });
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
                NEXTRACE OSINT &bull; ATRIBUSI KEBOCORAN &bull; SMART ALIAS TRACER
              </span>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2.5">
              <span>Smart Alias &amp; Atribusi Kebocoran Mitra</span>
              <span className="text-[13px] font-normal text-[var(--mute)] font-mono">
                (Vector Leak Attribution v2.0)
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 text-[11.5px] text-[var(--mid)] font-mono bg-[var(--mid)]/10 px-3 py-1.5 rounded-[6px] border border-[var(--mid)]/25">
            <Radio className="w-3.5 h-3.5 text-[var(--mid)]" />
            <span>Simulasi Pelacakan Vektor Aktif</span>
          </div>
        </div>
      </div>

      {/* Alias Generator Card */}
      <div className="p-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] space-y-4">
        <h2 className="text-[13px] font-semibold text-[var(--ink)]">
          Buat Alias Email Terisolasi per Vendor
        </h2>

        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-[var(--ink)]">
              Nama Vendor / Platform Pihak Ketiga:
            </label>
            <input
              type="text"
              required
              value={serviceLabel}
              onChange={(e) => setServiceLabel(e.target.value)}
              placeholder="e.g. Tokopedia, Mitra Logistics, Vendor X"
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[6px] px-3 py-2 text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[12px] font-medium text-[var(--ink)]">
              Email Utama Penampung:
            </label>
            <input
              type="email"
              required
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--line)] rounded-[6px] px-3 py-2 text-[var(--ink)] text-[12.5px] focus:outline-none focus:border-[var(--acc)] font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-[var(--acc)] hover:bg-[var(--acc)]/90 text-[#0e1012] font-semibold text-[13px] rounded-[6px] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2]" />
              <span>{loading ? "Memproses..." : "Terbitkan Alias Unik"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid: Left Aliases List, Right Inbound Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Active Aliases List */}
        <div className="lg:col-span-5 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-4 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
            <span className="text-[13px] font-semibold text-[var(--ink)]">
              Daftar Alias Aktif ({aliases.length})
            </span>
            <span className="text-[11px] font-mono text-[var(--mute)]">COMPARTMENTALIZED</span>
          </div>

          <div className="space-y-2">
            {aliases.map((al) => {
              const isSelected = selectedAlias?.alias_id === al.alias_id;
              return (
                <div
                  key={al.alias_id}
                  onClick={() => selectAlias(al)}
                  className={`p-3.5 rounded-[8px] border transition-colors cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[var(--s2)] border-[var(--acc)]"
                      : "bg-[var(--s1)] border-[var(--line)] hover:border-[var(--mute)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[var(--ink)] text-[13px]">
                      {al.service_label}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(al.alias_address || al.alias_email || "", al.alias_id);
                      }}
                      className="text-[var(--mute)] hover:text-[var(--ink)] flex items-center gap-1 text-[11px] font-mono"
                      title="Salin alamat alias"
                    >
                      {copiedId === al.alias_id ? (
                        <Check className="w-3.5 h-3.5 text-[var(--lo)]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === al.alias_id ? "Tersalin" : "Salin"}</span>
                    </button>
                  </div>

                  <div className="font-mono text-[12px] text-[var(--acc)] truncate">
                    {al.alias_address || al.alias_email}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[var(--mute)] font-mono pt-1 border-t border-[var(--line)]">
                    <span>Penerusan: {al.primary_email}</span>
                    <span className="text-[var(--hi)] font-semibold">
                      {al.inbound_count ?? 0} Ancaman Masuk
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Inbound Exposure Events */}
        <div className="lg:col-span-7 bg-[var(--s1)] border border-[var(--line)] rounded-[10px] p-5 space-y-4">
          {selectedAlias ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
                <div>
                  <span className="text-[11px] text-[var(--mute)] font-mono uppercase">
                    DETAIL ATRIBUSI: {selectedAlias.service_label}
                  </span>
                  <div className="font-mono text-[13px] font-semibold text-[var(--ink)]">
                    {selectedAlias.alias_address || selectedAlias.alias_email}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSimulateInbound(selectedAlias.alias_id)}
                  className="px-3 py-1.5 bg-[var(--s2)] hover:border-[var(--acc)] border border-[var(--line)] rounded-[6px] text-[12px] font-mono text-[var(--ink)] flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Send className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span>Simulasi Email Masuk Spam</span>
                </button>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-[13px] font-semibold text-[var(--ink)] font-mono uppercase tracking-wider">
                  Log Insiden Masuk (Bukti Paparan)
                </h3>

                {events.length > 0 ? (
                  events.map((evt) => (
                    <div
                      key={evt.event_id}
                      className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[6px] space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[var(--hi)] font-semibold">
                          Domain Pengirim: {evt.sender_domain}
                        </span>
                        <span className="text-[var(--mute)]">{formatDate(evt.received_at)}</span>
                      </div>

                      <div className="text-[12px] text-[var(--ink)] font-medium font-mono">
                        Subjek: &ldquo;{evt.subject_snippet}&rdquo;
                      </div>

                      <div className="text-[11px] text-[var(--mute)] font-mono flex items-center justify-between pt-1 border-t border-[var(--line)]">
                        <span>IP: {evt.headers_meta?.["x-sender-ip"] || "203.0.113.195"}</span>
                        <span>Fingerprint: {(evt.message_fingerprint || "N/A").substring(0, 16)}...</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-[var(--mute)] font-mono text-[12px]">
                    Belum ada insiden spam terdeteksi pada alias ini. Klik &quot;Simulasi Email Masuk Spam&quot; untuk menguji deteksi atribusi.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-[var(--mute)] font-mono text-[12px]">
              Pilih alias email di sebelah kiri untuk melihat catatan atribusi.
            </div>
          )}
        </div>
      </div>

      {/* Professional Theme-Matching Modal Popup */}
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}
