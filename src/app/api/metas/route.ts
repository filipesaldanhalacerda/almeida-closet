import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { metaSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Define/atualiza a meta mensal de uma vendedora (upsert). Apenas gestor.
export async function PUT(req: NextRequest) {
  return handle(async () => {
    await requireGestor();
    const body = await req.json().catch(() => ({}));
    const parsed = metaSchema.safeParse(body);
    if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");

    const supabase = createClient();
    const { error } = await supabase
      .from("metas")
      .upsert(
        {
          vendedora_id: parsed.data.vendedora_id,
          valor: parsed.data.valor,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "vendedora_id" },
      );
    if (error) return jsonError(error.message, 400);
    return jsonOk({ ok: true });
  });
}
