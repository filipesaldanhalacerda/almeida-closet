"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { esvaziarFila, quantidadeNaFila } from "@/lib/offline-queue";

/** Registra o service worker e reenvia a fila offline ao reconectar. */
export function PWARegister() {
  const router = useRouter();

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    async function flush() {
      if (quantidadeNaFila() === 0) return;
      const n = await esvaziarFila();
      if (n > 0) router.refresh();
    }

    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [router]);

  return null;
}
