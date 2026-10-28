"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/lib/auth";

interface AppShellProps {
  children: React.ReactNode;
}

const SHELL_EXCLUDED = ["/login"];

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  const isPublicPage = SHELL_EXCLUDED.includes(pathname);

  // While auth state loads, show a minimal blank screen to avoid flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[var(--line)] border-t-[var(--acc)] rounded-full animate-spin" />
      </div>
    );
  }

  // Login page — render without shell chrome
  if (isPublicPage || !isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex antialiased selection:bg-[var(--acc)] selection:text-white">
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 lg:ml-[232px] ml-0 flex flex-col min-h-screen bg-[var(--bg)] min-w-0 transition-all duration-200">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 min-w-0 bg-[var(--bg)]">{children}</main>
      </div>
    </div>
  );
}
