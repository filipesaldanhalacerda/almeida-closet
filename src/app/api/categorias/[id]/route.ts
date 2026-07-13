import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { categoriaGrupoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Altera o grupo do DRE de uma categoria de despesa (apenas gestor).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireGestor();
    const body = await req.json().catch(() => ({}));
    const parsed = categoriaGrupoSchema.safeParse({ id: params.id, ...body });
    if (!parsed.success) return jsonError("Dados inválidos");

    const supabase = createClient();
    const { error } = await supabase
      .from("categorias_despesa")
      .update({ grupo_dre: parsed.data.grupo_dre })
      .eq("id", params.id);
    if (error) return jsonError(error.message, 400);
    return jsonOk({ ok: true });
  });
}
