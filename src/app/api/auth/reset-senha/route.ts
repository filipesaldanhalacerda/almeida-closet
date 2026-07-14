import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk } from "@/lib/api";
import { normalizarCodigo } from "@/lib/codigo";
import { usernameParaEmail } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resetSenhaSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Redefine a senha de uma vendedora a partir de um código reset_senha.
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = resetSenhaSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const { senha } = parsed.data;
    const codigo = normalizarCodigo(parsed.data.codigo);
    const admin = createAdminClient();

    const { data: convite } = await admin
      .from("convites")
      .select("id,tipo,usado_por,expira_em,alvo_profile_id")
      .eq("codigo", codigo)
      .maybeSingle();
    if (!convite) return jsonError("Código não encontrado", 404);
    if (convite.tipo !== "reset_senha")
      return jsonError("Este código é de novo acesso, não de redefinição");
    if (convite.usado_por) return jsonError("Este código já foi utilizado", 410);
    if (new Date(convite.expira_em).getTime() < Date.now())
      return jsonError("Este código expirou. Peça um novo à gerência.", 410);
    if (!convite.alvo_profile_id) return jsonError("Código inválido");

    const { data: alvo } = await admin
      .from("profiles")
      .select("id,username")
      .eq("id", convite.alvo_profile_id)
      .single();
    if (!alvo) return jsonError("Vendedora não encontrada", 404);

    // Reserva o convite atomicamente antes de redefinir (fecha a corrida de
    // uso concorrente do mesmo código). Só 1 requisição "ganha" o update.
    const { data: claim } = await admin
      .from("convites")
      .update({ usado_por: alvo.id, usado_em: new Date().toISOString() })
      .eq("id", convite.id)
      .is("usado_por", null)
      .select("id")
      .maybeSingle();
    if (!claim) return jsonError("Este código já foi utilizado", 410);

    const { error: updErr } = await admin.auth.admin.updateUserById(alvo.id, {
      password: senha,
    });
    if (updErr) {
      // desfaz a reserva para permitir nova tentativa
      await admin.from("convites").update({ usado_por: null, usado_em: null }).eq("id", convite.id);
      return jsonError("Não foi possível redefinir a senha: " + updErr.message);
    }

    // Login automático
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: usernameParaEmail(alvo.username),
      password: senha,
    });
    if (signErr) return jsonOk({ ok: true, redirect: "/login" });

    return jsonOk({ ok: true, redirect: "/app" });
  });
}
