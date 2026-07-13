import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireGestor } from "@/lib/api";
import { gerarCodigo } from "@/lib/codigo";
import { createClient } from "@/lib/supabase/server";
import { conviteSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

const VALIDADE_DIAS = 7;

// Gera um código de convite (novo acesso ou redefinição de senha).
export async function POST(req: NextRequest) {
  return handle(async () => {
    const gestor = await requireGestor();
    const body = await req.json().catch(() => ({}));
    const parsed = conviteSchema.safeParse(body);
    if (!parsed.success) return jsonError("Dados inválidos");
    const { tipo, alvo_profile_id } = parsed.data;

    if (tipo === "reset_senha" && !alvo_profile_id) {
      return jsonError("Selecione a vendedora para redefinir a senha");
    }

    const supabase = createClient();
    const expira = new Date(Date.now() + VALIDADE_DIAS * 24 * 60 * 60 * 1000).toISOString();

    // Tenta gerar código único (poucas tentativas bastam)
    let codigo = "";
    for (let i = 0; i < 6; i++) {
      codigo = gerarCodigo(6);
      const { data, error } = await supabase
        .from("convites")
        .insert({
          codigo,
          tipo,
          criado_por: gestor.id,
          alvo_profile_id: tipo === "reset_senha" ? alvo_profile_id : null,
          expira_em: expira,
        })
        .select("id,codigo,expira_em")
        .single();
      if (!error && data) {
        return jsonOk({ ok: true, codigo: data.codigo, expira_em: data.expira_em });
      }
      // 23505 = unique_violation → tenta outro código
      if (error && error.code !== "23505") return jsonError(error.message, 400);
    }
    return jsonError("Não foi possível gerar um código único, tente novamente", 500);
  });
}
