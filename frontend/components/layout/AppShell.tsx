"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex antialiased selection:bg-[var(--acc)] selection:text-white">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[232px] flex flex-col min-h-screen bg-[var(--bg)] min-w-0">
        <Header />
        <main className="flex-1 min-w-0 bg-[var(--bg)]">
          {children}
        </main>
      </div>
    </div>
  );
}
