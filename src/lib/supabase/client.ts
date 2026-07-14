"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente do Supabase para uso no navegador (componentes client).
// Chamado dentro de componentes/hooks, nunca no topo do módulo, para não
// executar durante o build.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
