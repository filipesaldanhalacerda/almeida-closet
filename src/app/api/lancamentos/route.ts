import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireUser } from "@/lib/api";
import { getLancamentos } from "@/lib/data";
import { montarRowLancamento } from "@/lib/lancamento-row";
import { createClient } from "@/lib/supabase/server";
import { lancamentoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Lista paginada dos lançamentos do próprio usuário (para o "carregar mais"
// da lista da vendedora). limite/offset via querystring.
export async function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const limite = Math.min(100, Math.max(1, Number(searchParams.get("limite")) || 30));
    const offset = Math.max(0, Number(searchParams.get("offset")) || 0);
    const lancamentos = await getLancamentos({ criadoPor: user.id, limite, offset });
    return jsonOk({ lancamentos });
  });
}

// Cria um lançamento. RLS garante criado_por = auth.uid().
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));

    // Vendedora só cria capital? Não, capital é só do gestor.
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
    row.criado_por = user.id;

    const supabase = createClient();
    const { data, error } = await supabase.from("lancamentos").insert(row).select("id").single();
    if (error) return jsonError(error.message, 400);

    // Venda com recebimento embutido: cria os dois lançamentos num envio só
    if (input.tipo === "venda" && input.recebimento) {
      const rowReceb = montarRowLancamento(
        {
          tipo: "recebimento",
          valor: input.recebimento.valor,
          data: input.data,
          cliente: input.cliente,
          bandeira: "",
          meio: input.recebimento.meio,
          vendedora_id: input.vendedora_id ?? undefined,
        },
        { criadoPor: user.id, roleCriador: user.role },
      );
      rowReceb.criado_por = user.id;
      const { data: dataReceb, error: errReceb } = await supabase
        .from("lancamentos")
        .insert(rowReceb)
        .select("id")
        .single();
      if (errReceb) {
        // rollback da venda para não ficar registro pela metade
        await supabase.from("lancamentos").delete().eq("id", data.id);
        return jsonError("Não foi possível registrar o recebimento junto: " + errReceb.message, 400);
      }
      return jsonOk({ ok: true, id: data.id, recebimentoId: dataReceb.id });
    }

    return jsonOk({ ok: true, id: data.id });
  });
}
