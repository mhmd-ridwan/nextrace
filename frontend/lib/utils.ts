import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "N/A";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatSeverity(severity: string) {
  const s = severity?.toLowerCase();
  switch (s) {
    case "critical":
      return {
        label: "CRITICAL",
        color: "text-red-400 border-red-500/40 bg-red-950/40",
        badge: "bg-red-500 text-white",
        dot: "bg-red-500",
      };
    case "high":
      return {
        label: "HIGH",
        color: "text-rose-400 border-rose-500/40 bg-rose-950/40",
        badge: "bg-rose-500 text-white",
        dot: "bg-rose-500",
      };
    case "medium":
      return {
        label: "MEDIUM",
        color: "text-amber-400 border-amber-500/40 bg-amber-950/40",
        badge: "bg-amber-500 text-black font-semibold",
        dot: "bg-amber-500",
      };
    case "low":
    default:
      return {
        label: "LOW",
        color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/40",
        badge: "bg-emerald-600 text-white",
        dot: "bg-emerald-500",
      };
  }
}

export function formatScore(score: number): { color: string; label: string } {
  if (score >= 80) return { color: "text-red-400", label: "Critical Risk" };
  if (score >= 60) return { color: "text-rose-400", label: "High Risk" };
  if (score >= 30) return { color: "text-amber-400", label: "Medium Risk" };
  return { color: "text-emerald-400", label: "Low Risk" };
}
