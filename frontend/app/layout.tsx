import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "NEXTRACE — Platform Investigasi OSINT & Cyber Threat Hunter",
  description:
    "NEXTRACE: Sistem Terpadu Deteksi Buzzer, Identifikasi Akun Tiruan & Pelacak Jejak Kebocoran Data.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark">
      <body className="antialiased bg-background text-slate-100 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
