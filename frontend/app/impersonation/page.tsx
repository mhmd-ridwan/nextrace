"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ImpersonationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    const q = searchParams.get("q") || searchParams.get("query");

    if (tab === "image") {
      router.replace("/analisis-gambar");
      return;
    }

    if (q) {
      router.replace(`/media-sosial?q=${encodeURIComponent(q)}`);
      return;
    }

    router.replace("/media-sosial");
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3 text-sm text-[var(--mute)] font-mono">
        <span className="w-2 h-2 rounded-full bg-[var(--acc)] animate-ping" />
        <span>Mengalihkan ke modul Media Sosial NEXTRACE...</span>
      </div>
    </div>
  );
}

export default function ImpersonationPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--mute)] font-mono">
          Memuat pengalihan rute...
        </div>
      }
    >
      <ImpersonationRedirect />
    </Suspense>
  );
}
