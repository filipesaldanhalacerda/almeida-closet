import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk } from "@/lib/api";
import { normalizarCodigo } from "@/lib/codigo";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarCodigoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Valida um código de convite (sem autenticação). Retorna o tipo e, para reset,
// o nome do alvo. Não expõe dados sensíveis.
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = validarCodigoSchema.safeParse(body);
    if (!parsed.success) return jsonError("Código inválido");

    const codigo = normalizarCodigo(parsed.data.codigo);
    const admin = createAdminClient();
    const { data: convite } = await admin
      .from("convites")
      .select("id,tipo,usado_por,expira_em,alvo_profile_id")
      .eq("codigo", codigo)
      .maybeSingle();

    if (!convite) return jsonError("Código não encontrado", 404);
    if (convite.usado_por) return jsonError("Este código já foi utilizado", 410);
    if (new Date(convite.expira_em).getTime() < Date.now()) {
      return jsonError("Este código expirou. Peça um novo à gerência.", 410);
    }

    let alvoNome: string | null = null;
    if (convite.tipo === "reset_senha" && convite.alvo_profile_id) {
      const { data: alvo } = await admin
        .from("profiles")
        .select("nome")
        .eq("id", convite.alvo_profile_id)
        .single();
      alvoNome = alvo?.nome ?? null;
    }

    return jsonOk({ ok: true, tipo: convite.tipo, alvoNome });
  });
}
