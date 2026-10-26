"use client";

import React, { useEffect, useCallback } from "react";
import { AlertTriangle, CheckCircle2, Info, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalDetailItem {
  label: string;
  value: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  details?: ModalDetailItem[] | string;
  isLoading?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Konfirmasi",
  cancelText = "Batal",
  variant = "danger",
  details,
  isLoading = false,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case "danger":
        return (
          <div className="w-10 h-10 rounded-full bg-[var(--hi)]/15 border border-[var(--hi)]/30 flex items-center justify-center shrink-0 text-[var(--hi)]">
            <Trash2 className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case "warning":
        return (
          <div className="w-10 h-10 rounded-full bg-[var(--mid)]/15 border border-[var(--mid)]/30 flex items-center justify-center shrink-0 text-[var(--mid)]">
            <AlertTriangle className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case "success":
        return (
          <div className="w-10 h-10 rounded-full bg-[var(--lo)]/15 border border-[var(--lo)]/30 flex items-center justify-center shrink-0 text-[var(--lo)]">
            <CheckCircle2 className="w-5 h-5 stroke-[2]" />
          </div>
        );
      case "info":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[var(--acc)]/15 border border-[var(--acc)]/30 flex items-center justify-center shrink-0 text-[var(--acc)]">
            <Info className="w-5 h-5 stroke-[2]" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "bg-[var(--hi)] hover:brightness-110 text-white";
      case "warning":
        return "bg-[var(--mid)] hover:brightness-110 text-black font-bold";
      case "success":
        return "bg-[var(--lo)] hover:brightness-110 text-white";
      case "info":
      default:
        return "bg-[var(--acc)] hover:brightness-110 text-white";
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-[3px] transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-[var(--s1)] border border-[var(--line)] rounded-[12px] shadow-2xl overflow-hidden transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header & Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {renderIcon()}
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)] tracking-tight leading-snug">
                  {title}
                </h3>
                <p className="text-[12.5px] text-[var(--mute)] leading-relaxed mt-1">
                  {description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] p-1 rounded-[6px] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Optional Details Box */}
          {details && (
            <div className="p-3 bg-[var(--s2)] border border-[var(--line)] rounded-[8px] font-mono text-[12px] space-y-1.5">
              {typeof details === "string" ? (
                <p className="text-[var(--ink)] whitespace-pre-wrap break-all">{details}</p>
              ) : (
                details.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <span className="text-[var(--mute)]">{item.label}:</span>
                    <span className="text-[var(--ink)] font-semibold truncate max-w-[240px]">
                      {item.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-5 py-3.5 bg-[var(--s2)]/50 border-t border-[var(--line)] flex items-center justify-end gap-2.5">
          {onConfirm && (
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-[6px] border border-[var(--line)] bg-transparent hover:bg-[var(--s2)] text-[var(--ink)] text-[12px] font-mono font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              } else {
                onClose();
              }
            }}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-[6px] text-[12px] font-mono font-semibold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50",
              getConfirmButtonClass()
            )}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
