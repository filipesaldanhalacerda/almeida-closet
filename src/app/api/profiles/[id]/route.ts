import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Ativa/desativa uma vendedora (apenas gestor).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireGestor();
    const body = await req.json().catch(() => ({}));
    if (typeof body.ativo !== "boolean") return jsonError("Campo 'ativo' obrigatório");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ativo: body.ativo })
      .eq("id", params.id)
      .eq("role", "vendedora") // segurança: não altera outro gestor
      .select("id,ativo");
    if (error) return jsonError(error.message, 400);
    if (!data || data.length === 0) return jsonError("Vendedora não encontrada", 404);
    return jsonOk({ ok: true, ativo: body.ativo });
  });
}
