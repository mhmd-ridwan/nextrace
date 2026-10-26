"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Search,
  Moon,
  Sun,
  Shield,
  ExternalLink,
  Check,
  ChevronDown,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Theme initialization
    const theme = localStorage.getItem("nextrace_theme") || "dark";
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.removeAttribute("data-theme");
      setIsDark(true);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("nextrace_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("nextrace_theme", "dark");
      setIsDark(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    if (q.includes("buzzer") || q.includes("bot") || q.includes("komentar")) {
      router.push(`/buzzer?q=${encodeURIComponent(q)}`);
    } else if (q.includes("@")) {
      router.push(`/email?query=${encodeURIComponent(q)}`);
    } else if (q.startsWith("+") || /^\d+$/.test(q)) {
      router.push(`/nomor-hp?query=${encodeURIComponent(q)}`);
    } else if (q.includes(".") && !q.includes(" ")) {
      router.push(`/domain?query=${encodeURIComponent(q)}`);
    } else {
      router.push(`/media-sosial?q=${encodeURIComponent(q)}`);
    }
  };

  const notifications = [
    {
      id: "notif-1",
      title: "Bot buzzer astroturfing terdeteksi",
      desc: "Target TikTok @jokowi teridentifikasi 16 komentar astroturfing penipuan bansos.",
      time: "12.20 WIB",
      href: "/buzzer",
      priority: "high",
    },
    {
      id: "notif-2",
      title: "Akun kloning terdeteksi",
      desc: "@jokowi.official_bantuan pada platform TikTok memiliki kemiripan pHash 98.4%.",
      time: "10.05 WIB",
      href: "/media-sosial",
      priority: "high",
    },
    {
      id: "notif-3",
      title: "Domain tiruan phishing aktif",
      desc: "jokowi-bantuan2026.com terdeteksi menyebarkan tautan phishing giveaway palsu.",
      time: "08.40 WIB",
      href: "/domain?domain=jokowi-bantuan2026.com",
      priority: "med",
    },
  ];

  return (
    <div className="flex items-center gap-2.5 sm:gap-4 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 border-b border-[var(--line)] bg-[var(--s1)] sticky top-0 z-30 select-none">
      {/* Mobile Hamburger Toggle */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        className="lg:hidden p-2 -ml-1 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] transition-colors shrink-0"
        aria-label="Buka menu navigasi"
      >
        <Menu className="w-5 h-5 stroke-[1.8]" />
      </button>

      {/* Mobile Brand Logo */}
      <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0 mr-1 group">
        <img src="/logo.png" alt="NEXTRACE" className="w-7 h-7 object-contain" />
        <span className="font-bold text-[15px] tracking-tight text-[var(--ink)] hidden xs:inline">
          NEXTRACE
        </span>
      </Link>

      {/* Search Input Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-[560px] min-w-0">
        <div className="flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] rounded-lg px-2.5 sm:px-3 py-0 text-[var(--mute)] focus-within:border-[var(--acc)] transition-colors">
          <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0 text-[var(--mute)] stroke-[1.7]" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari target, akun, foto, domain, email..."
            aria-label="Pencarian"
            className="flex-1 min-w-0 bg-transparent border-0 text-[var(--ink)] font-inherit text-[12.5px] sm:text-[13.5px] py-1.5 sm:py-2 focus:outline-none placeholder:text-[var(--mute)]"
          />
          <span className="hidden sm:inline-block text-[11px] font-mono text-[var(--mute)] border border-[var(--line)] px-1.5 py-0.5 rounded bg-[var(--s1)] shrink-0">
            Ctrl+K
          </span>
        </div>
      </form>

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
        className="p-2 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)] transition-colors shrink-0"
      >
        {isDark ? (
          <Sun className="w-[18px] h-[18px] stroke-[1.7]" />
        ) : (
          <Moon className="w-[18px] h-[18px] stroke-[1.7]" />
        )}
      </button>

      {/* Notification Bell */}
      <div className="relative ml-auto shrink-0">
        <button
          type="button"
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowUserMenu(false);
          }}
          aria-label={`${unreadCount} notifikasi`}
          className="relative p-2 text-[var(--mute)] hover:text-[var(--ink)] transition-colors flex items-center justify-center rounded-lg hover:bg-[var(--s2)]"
        >
          <Bell className="w-[18px] h-[18px] stroke-[1.7]" />
          {unreadCount > 0 && (
            <em className="absolute top-0 right-0 bg-[var(--hi)] text-white font-semibold text-[10px] leading-none px-1.5 py-0.5 rounded-[9px] not-italic shadow-sm">
              {unreadCount}
            </em>
          )}
        </button>

        {/* Notifications Popover */}
        {showNotifications && (
          <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-96 bg-[var(--s1)] border border-[var(--line)] rounded-lg shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[var(--line)]">
              <span className="font-semibold text-[13.5px] text-[var(--ink)]">
                Notifikasi Peringatan
              </span>
              <button
                type="button"
                onClick={() => setUnreadCount(0)}
                className="text-[11px] text-[var(--acc)] hover:underline font-medium"
              >
                Tandai dibaca
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => setShowNotifications(false)}
                  className="flex gap-2.5 p-2 rounded-lg hover:bg-[var(--s2)] transition-colors text-left group"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      n.priority === "high"
                        ? "bg-[var(--hi)]"
                        : "bg-[var(--mid)]"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--ink)] group-hover:text-[var(--acc)] line-clamp-1">
                      {n.title}
                    </p>
                    <p className="text-[11.5px] text-[var(--mute)] line-clamp-2 mt-0.5">
                      {n.desc}
                    </p>
                    <span className="text-[10.5px] text-[var(--mute)] font-mono mt-1 block">
                      {n.time}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowNotifications(false);
          }}
          className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--s2)] transition-colors"
        >
          <span className="w-8 h-8 rounded-full bg-[var(--acc)]/15 border border-[var(--acc)]/30 grid place-items-center font-bold text-[11.5px] font-mono text-[var(--acc)] select-none">
            AN
          </span>
          <div className="text-left hidden md:block">
            <div className="text-[13px] font-semibold text-[var(--ink)] leading-tight">
              Admin Nextrace
            </div>
            <small className="block text-[11.5px] text-[var(--mute)] leading-[1.2]">
              Superadmin Cyber OSINT
            </small>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--mute)] hidden md:block" />
        </button>

        {showUserMenu && (
          <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 sm:w-64 bg-[var(--s1)] border border-[var(--line)] rounded-lg shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-[var(--line)] mb-1">
              <p className="text-[12.5px] font-medium text-[var(--ink)]">
                Admin Nextrace
              </p>
              <p className="text-[11px] text-[var(--mute)] font-mono">
                admin@nextrace.gov.id
              </p>
            </div>
            <Link
              href="/investigations"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] rounded text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--s2)]"
            >
              <Shield className="w-3.5 h-3.5" /> Ruang Kerja Kasus
            </Link>
            <div className="border-t border-[var(--line)] my-1" />
            <div className="px-3 py-1 text-[10.5px] text-[var(--mute)] flex justify-between items-center">
              <span>Status Sistem</span>
              <span className="text-[var(--lo)] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--lo)]" /> Siap
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
