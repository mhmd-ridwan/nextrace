"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Image as ImageIcon,
  Users,
  Bot,
  Mail,
  Phone,
  Globe,
  Folder,
  FileText,
  Hash,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNav: NavItem[] = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Buzzer & Bot Hunter", href: "/buzzer", icon: Bot },
  { name: "Analisis gambar", href: "/analisis-gambar", icon: ImageIcon },
  { name: "Media sosial", href: "/media-sosial", icon: Users },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Nomor HP", href: "/nomor-hp", icon: Phone },
  { name: "Domain & ASM (Nuclei)", href: "/domain", icon: Globe },
  { name: "Ruang kerja kasus", href: "/investigations", icon: Folder },
  { name: "Laporan", href: "/reports", icon: FileText },
];

const quickTools: NavItem[] = [
  { name: "Hash", href: "/hash", icon: Hash },
  { name: "WHOIS", href: "/whois", icon: Search },
  { name: "DNS", href: "/dns", icon: Globe },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname]);

  const isCurrent = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "w-[260px] lg:w-[232px] bg-[var(--s1)] border-r border-[var(--line)] py-[20px] px-[14px] fixed left-0 top-0 h-screen z-50 lg:z-30 select-none flex flex-col justify-between overflow-y-auto transition-transform duration-200 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div>
          {/* Brand Header with Authentic NEXTRACE Radar Shield Logo & Mobile Close */}
          <div className="flex items-center justify-between pb-[18px] border-b border-[var(--line)] mb-4 px-1">
            <Link
              href="/"
              onClick={handleLinkClick}
              className="flex items-center gap-3 group text-[var(--ink)] min-w-0"
            >
              <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-[var(--acc)]/20 rounded-xl blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src="/logo.png"
                  alt="NEXTRACE Logo"
                  className="relative w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(134,168,208,0.5)] transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <b className="text-[17px] tracking-[0.02em] block leading-[1.1] font-bold text-[var(--ink)]">
                  NEXTRACE
                </b>
                <span className="text-[11px] text-[var(--mute)] block leading-tight truncate">
                  Platform investigasi OSINT
                </span>
              </div>
            </Link>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] transition-colors shrink-0"
              aria-label="Tutup navigasi"
            >
              <X className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>

          {/* Navigation */}
          <nav aria-label="Menu utama" className="flex flex-col gap-0.5">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-[6px] text-[13.5px] transition-colors relative group select-none",
                    active
                      ? "bg-[var(--s2)] text-[var(--ink)] font-semibold shadow-[inset_2px_0_var(--acc)]"
                      : "text-[var(--mute)] hover:bg-[var(--s2)] hover:text-[var(--ink)] font-medium"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] shrink-0 stroke-[1.7]",
                      active ? "text-[var(--acc)]" : "text-[var(--mute)] group-hover:text-[var(--ink)]"
                    )}
                  />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--hi)]/15 text-[var(--hi)] font-semibold border border-[var(--hi)]/25">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <p className="mt-5 mx-2.5 mb-1.5 text-[12px] text-[var(--mute)] border-t border-[var(--line)] pt-4 font-normal">
              Alat cepat
            </p>

            {quickTools.map((tool) => {
              const Icon = tool.icon;
              const active = isCurrent(tool.href);

              return (
                <Link
                  key={tool.name}
                  href={tool.href}
                  onClick={handleLinkClick}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-[6px] text-[13.5px] transition-colors group select-none",
                    active
                      ? "bg-[var(--s2)] text-[var(--ink)] font-semibold shadow-[inset_2px_0_var(--acc)]"
                      : "text-[var(--mute)] hover:bg-[var(--s2)] hover:text-[var(--ink)] font-medium"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-[18px] h-[18px] shrink-0 stroke-[1.7]",
                      active ? "text-[var(--acc)]" : "text-[var(--mute)] group-hover:text-[var(--ink)]"
                    )}
                  />
                  <span className="flex-1 truncate">{tool.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer System Status */}
        <div className="pt-3 pb-6 lg:pb-10 border-t border-[var(--line)] px-2">
          <div className="flex items-center justify-between text-[11px] text-[var(--mute)]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)]" />
              Backend Terhubung
            </span>
            <span className="font-mono text-[10px] text-[var(--mute)]">v2.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
