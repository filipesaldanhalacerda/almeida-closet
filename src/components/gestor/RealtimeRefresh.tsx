"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Assina mudanças na tabela de lançamentos (Supabase Realtime) e atualiza a
 * página do gestor em tempo real. Sem configuração pública, não faz nada.
 */
export function RealtimeRefresh() {
  const router = useRouter();

  React.useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const supabase = createClient();
    const canal = supabase
      .channel("lancamentos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "lancamentos" }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 800);
      })
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [router]);

  return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
      <span className="h-2 w-2 rounded-full bg-venda-fg" />
      tempo real
    </span>
  );
}
