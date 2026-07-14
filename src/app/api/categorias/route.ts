import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { categoriaNovaSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Cria uma nova categoria de despesa (apenas gestor). Nome é único.
export async function POST(req: NextRequest) {
  return handle(async () => {
    await requireGestor();
    const body = await req.json().catch(() => ({}));
    const parsed = categoriaNovaSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const { nome, grupo_dre } = parsed.data;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("categorias_despesa")
      .insert({ nome, grupo_dre })
      .select("id,nome,grupo_dre")
      .single();

    if (error) {
      // 23505 = nome já cadastrado (coluna única)
      if (error.code === "23505") {
        return jsonError("Já existe uma categoria com esse nome");
      }
      return jsonError(error.message, 400);
    }
    return jsonOk({ ok: true, categoria: data });
  });
}
