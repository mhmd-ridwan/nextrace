"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LeakTracerRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get("type");
    const query = searchParams.get("query") || searchParams.get("q") || "";

    if (type === "phone" || query.startsWith("+") || (/^\d+$/.test(query.replace(/[\s\-\+\(\)]/g, "")) && query.length <= 15)) {
      router.replace(`/nomor-hp${query ? `?query=${encodeURIComponent(query)}` : ""}`);
      return;
    }

    if (query.includes(".") && !query.includes("@")) {
      router.replace(`/domain${query ? `?query=${encodeURIComponent(query)}` : ""}`);
      return;
    }

    router.replace(`/email${query ? `?query=${encodeURIComponent(query)}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex items-center gap-3 text-sm text-[var(--mute)] font-mono">
        <span className="w-2 h-2 rounded-full bg-[var(--acc)] animate-ping" />
        <span>Mengalihkan ke modul investigasi NEXTRACE...</span>
      </div>
    </div>
  );
}

export default function LeakTracerPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[var(--mute)] font-mono">
          Memuat pengalihan rute...
        </div>
      }
    >
      <LeakTracerRedirect />
    </Suspense>
  );
}
