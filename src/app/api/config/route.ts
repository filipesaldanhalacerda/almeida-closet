import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { configSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Atualiza o saldo inicial do caixa (apenas gestor).
export async function PUT(req: NextRequest) {
  return handle(async () => {
    await requireGestor();
    const body = await req.json().catch(() => ({}));
    const parsed = configSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");

    const supabase = createClient();
    const { error } = await supabase
      .from("configuracoes")
      .update({
        saldo_inicial_caixa: parsed.data.saldo_inicial_caixa,
        saldo_inicial_data: parsed.data.saldo_inicial_data ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ ok: true });
  });
}
