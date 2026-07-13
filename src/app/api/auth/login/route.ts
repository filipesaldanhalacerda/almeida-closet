import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk } from "@/lib/api";
import { usernameParaEmail } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handle(async () => {
    const body = await req.json().catch(() => ({}));
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const { usuario, senha } = parsed.data;
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usernameParaEmail(usuario),
      password: senha,
    });
    if (error || !data.user) {
      return jsonError("Usuário ou senha incorretos", 401);
    }

    // Confere se o perfil está ativo
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,ativo")
      .eq("id", data.user.id)
      .single();

    if (profile && profile.ativo === false) {
      await supabase.auth.signOut();
      return jsonError("Acesso desativado. Fale com a gerência.", 403);
    }

    const role = (data.user.app_metadata?.role as string) || profile?.role || "vendedora";
    return jsonOk({ ok: true, role, redirect: role === "gestor" ? "/admin" : "/app" });
  });
}
