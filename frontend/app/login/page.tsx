"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, LogIn, Shield, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") ?? "/";

  useEffect(() => {
    if (isAuthenticated) router.replace(redirectTo);
  }, [isAuthenticated, redirectTo, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username.trim(), password);
      document.cookie = "nextrace_token=1; path=/; SameSite=Strict";
      router.replace(redirectTo);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-[380px] flex flex-col gap-5">

        {/* ── Brand Lockup (Logo | NEXTRACE) ── */}
        <div className="flex flex-col items-center gap-2 select-none">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-xl bg-[var(--acc)]/20 blur-sm" />
              <img
                src="/logo.png"
                alt="NEXTRACE"
                className="relative w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(134,168,208,0.4)]"
              />
            </div>
            <div className="h-6 w-px bg-[var(--line)]" aria-hidden="true" />
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--ink)] leading-none">
              NEXTRACE
            </h1>
          </div>
          <p className="text-[12px] text-[var(--mute)] tracking-tight">
            Platform Investigasi OSINT &amp; Cyber Threat Hunter
          </p>
        </div>

        {/* ── Login Card ── */}
        <div className="rounded-xl overflow-hidden bg-[var(--s1)] border border-[var(--line)] shadow-xl">
          {/* Card Header */}
          <div className="px-5 py-3.5 flex items-center gap-2.5 border-b border-[var(--line)]">
            <div className="p-1.5 rounded-lg bg-[var(--acc)]/15">
              <Shield className="w-4 h-4 stroke-[1.8] text-[var(--acc)]" />
            </div>
            <span className="text-[13.5px] font-semibold tracking-tight text-[var(--ink)]">
              Masuk ke Platform
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">

            {/* Username / Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Username atau Email
              </label>
              <div className="flex items-center gap-2.5 rounded-lg px-3 transition-colors bg-[var(--bg)] border border-[var(--line)] focus-within:border-[var(--acc)]">
                <User className="w-[15px] h-[15px] shrink-0 stroke-[1.7] text-[var(--mute)]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  autoComplete="username"
                  required
                  className="flex-1 py-2.5 text-[13.5px] bg-transparent border-0 outline-none text-[var(--ink)] placeholder:text-[var(--mute)] focus:ring-0 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[var(--mute)]">
                Kata Sandi
              </label>
              <div className="flex items-center gap-2.5 rounded-lg px-3 transition-colors bg-[var(--bg)] border border-[var(--line)] focus-within:border-[var(--acc)]">
                <Lock className="w-[15px] h-[15px] shrink-0 stroke-[1.7] text-[var(--mute)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  className="flex-1 py-2.5 text-[13.5px] bg-transparent border-0 outline-none text-[var(--ink)] placeholder:text-[var(--mute)] focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="shrink-0 transition-colors text-[var(--mute)] hover:text-[var(--ink)] p-1"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <EyeOff className="w-[15px] h-[15px] stroke-[1.7]" />
                  ) : (
                    <Eye className="w-[15px] h-[15px] stroke-[1.7]" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg px-3 py-2.5 bg-[var(--hi)]/10 border border-[var(--hi)]/30">
                <p className="text-[12.5px] leading-snug text-[var(--hi)]">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className="flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 font-bold text-[13.5px] text-[#0e1012] bg-[var(--acc)] hover:opacity-90 active:scale-[0.99] transition-all duration-150 select-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-[#0e1012]/30 border-t-[#0e1012] rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 stroke-[2.2]" />
              )}
              {isLoading ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[var(--mute)] select-none">
          © 2026 NEXTRACE — Platform Investigasi OSINT
        </p>
      </div>
    </div>
  );
}
