import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireUser } from "@/lib/api";
import { montarRowLancamento } from "@/lib/lancamento-row";
import { createClient } from "@/lib/supabase/server";
import { lancamentoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Edita um lançamento. RLS garante que vendedora só edita os próprios;
// gestor edita qualquer um.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = lancamentoSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const input = parsed.data;

    if (
      (input.tipo === "devolucao_capital" || input.tipo === "investimento") &&
      user.role !== "gestor"
    ) {
      return jsonError("Movimentações de capital são exclusivas do gestor", 403);
    }

    const row = montarRowLancamento(input, {
      criadoPor: user.id,
      roleCriador: user.role,
    });
    row.atualizado_por = user.id;

    const supabase = createClient();
    const { data, error } = await supabase
      .from("lancamentos")
      .update(row)
      .eq("id", params.id)
      .select("id");
    if (error) return jsonError(error.message, 400);
    if (!data || data.length === 0) return jsonError("Lançamento não encontrado", 404);

    return jsonOk({ ok: true, id: params.id });
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("lancamentos")
      .delete()
      .eq("id", params.id)
      .select("id");
    if (error) return jsonError(error.message, 400);
    if (!data || data.length === 0) return jsonError("Lançamento não encontrado", 404);
    return jsonOk({ ok: true });
  });
}
