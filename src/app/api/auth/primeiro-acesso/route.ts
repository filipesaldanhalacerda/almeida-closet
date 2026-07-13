import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk } from "@/lib/api";
import { normalizarCodigo } from "@/lib/codigo";
import { usernameParaEmail } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { primeiroAcessoSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Ativa o acesso de uma nova vendedora a partir de um código novo_acesso:
// cria o usuário no Auth + o perfil, marca o convite como usado e faz login.
export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = primeiroAcessoSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const { nome, username, senha } = parsed.data;
    const codigo = normalizarCodigo(parsed.data.codigo);
    const admin = createAdminClient();

    // 1) Valida convite
    const { data: convite } = await admin
      .from("convites")
      .select("id,tipo,usado_por,expira_em")
      .eq("codigo", codigo)
      .maybeSingle();
    if (!convite) return jsonError("Código não encontrado", 404);
    if (convite.tipo !== "novo_acesso")
      return jsonError("Este código é de redefinição de senha, não de novo acesso");
    if (convite.usado_por) return jsonError("Este código já foi utilizado", 410);
    if (new Date(convite.expira_em).getTime() < Date.now())
      return jsonError("Este código expirou. Peça um novo à gerência.", 410);

    // 2) Username único
    const { data: existente } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existente) return jsonError("Esse nome de usuário já existe. Escolha outro.");

    // 3) Cria usuário no Auth (e-mail sintético, sem confirmação)
    const email = usernameParaEmail(username);
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      app_metadata: { role: "vendedora" },
      user_metadata: { nome, username },
    });
    if (createErr || !created.user) {
      return jsonError(createErr?.message || "Não foi possível criar o acesso");
    }
    const userId = created.user.id;

    // 4) Cria o perfil
    const { error: profErr } = await admin.from("profiles").insert({
      id: userId,
      nome,
      username,
      role: "vendedora",
      ativo: true,
    });
    if (profErr) {
      // rollback do usuário criado
      await admin.auth.admin.deleteUser(userId);
      return jsonError("Não foi possível criar o perfil: " + profErr.message);
    }

    // 5) Marca convite como usado
    await admin
      .from("convites")
      .update({ usado_por: userId, usado_em: new Date().toISOString() })
      .eq("id", convite.id);

    // 6) Login automático (define cookies de sessão)
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (signErr) return jsonOk({ ok: true, redirect: "/login", nome });

    return jsonOk({ ok: true, redirect: "/app", nome });
  });
}
