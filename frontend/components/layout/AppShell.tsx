"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex antialiased selection:bg-[var(--acc)] selection:text-white">
      {/* Sidebar with Mobile Drawer support */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-[232px] ml-0 flex flex-col min-h-screen bg-[var(--bg)] min-w-0 transition-all duration-200">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 min-w-0 bg-[var(--bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
