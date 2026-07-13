import { NextRequest } from "next/server";
import { handle, jsonError, jsonOk, requireUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { clienteSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

// Lista de clientes cadastradas (para autocomplete).
export async function GET() {
  return handle(async () => {
    await requireUser();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("id,nome,telefone")
      .order("nome");
    if (error) return jsonError(error.message, 400);
    return jsonOk({ clientes: data ?? [] });
  });
}

// Cadastra uma cliente (qualquer usuária logada). Nome duplicado devolve a existente.
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const parsed = clienteSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    const { nome, telefone } = parsed.data;
    const supabase = createClient();

    const { data, error } = await supabase
      .from("clientes")
      .insert({ nome, telefone: telefone || null, criado_por: user.id })
      .select("id,nome,telefone")
      .single();

    if (error) {
      // 23505 = nome já cadastrado → devolve a existente (idempotente)
      if (error.code === "23505") {
        const { data: existente } = await supabase
          .from("clientes")
          .select("id,nome,telefone")
          .ilike("nome", nome)
          .maybeSingle();
        if (existente) return jsonOk({ ok: true, cliente: existente, jaExistia: true });
      }
      return jsonError(error.message, 400);
    }
    return jsonOk({ ok: true, cliente: data });
  });
}
