import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";
import type { Profile } from "./types";

export function jsonError(mensagem: string, status = 400) {
  return NextResponse.json({ erro: mensagem }, { status });
}

export function jsonOk(data: unknown = { ok: true }, status = 200) {
  return NextResponse.json(data, { status });
}

/** Retorna o perfil autenticado ou null. */
export async function getUserProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

/** Garante usuário autenticado; lança resposta 401 se não. */
export async function requireUser(): Promise<Profile> {
  const p = await getUserProfile();
  if (!p) throw jsonError("Não autenticado", 401);
  if (!p.ativo) throw jsonError("Acesso desativado. Fale com a gerência.", 403);
  return p;
}

/** Garante gestor ativo. */
export async function requireGestor(): Promise<Profile> {
  const p = await requireUser();
  if (p.role !== "gestor") throw jsonError("Ação permitida apenas ao gestor", 403);
  return p;
}

/** Envolve o handler capturando respostas lançadas. */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof NextResponse) return e;
    console.error("[api] erro não tratado:", e);
    const msg = e instanceof Error ? e.message : "Erro interno";
    return jsonError(msg, 500);
  }
}
