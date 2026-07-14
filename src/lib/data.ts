import "server-only";
import { createClient } from "./supabase/server";
import type {
  CategoriaDespesa,
  Configuracao,
  Lancamento,
  LancamentoView,
  Meta,
  Profile,
} from "./types";

/** Perfil do usuário logado (ou null). */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function getCategorias(): Promise<CategoriaDespesa[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("categorias_despesa")
    .select("id,nome,grupo_dre")
    .order("nome");
  return (data as CategoriaDespesa[]) ?? [];
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").order("nome");
  return (data as Profile[]) ?? [];
}

export async function getVendedoras(): Promise<Profile[]> {
  const profiles = await getProfiles();
  return profiles.filter((p) => p.role === "vendedora");
}

export async function getConfig(): Promise<Configuracao | null> {
  const supabase = createClient();
  const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).single();
  return (data as Configuracao) ?? null;
}

export async function getMetas(): Promise<Meta[]> {
  const supabase = createClient();
  const { data } = await supabase.from("metas").select("*");
  return (data as Meta[]) ?? [];
}

interface FetchLancamentosOptions {
  desde?: string; // ISO inclusive
  ate?: string; // ISO inclusive
  tipos?: string[];
  apenasDoUsuario?: boolean; // vendedora: só os próprios (RLS já garante, mas útil)
}

/**
 * Busca lançamentos e resolve dados relacionados (categoria, vendedora, criador)
 * em JS, evita ambiguidade de embedding do PostgREST (vários FKs a profiles).
 */
export async function getLancamentos(
  opts: FetchLancamentosOptions = {},
): Promise<LancamentoView[]> {
  const supabase = createClient();
  let q = supabase.from("lancamentos").select("*").order("data", { ascending: false }).order("created_at", { ascending: false });
  if (opts.desde) q = q.gte("data", opts.desde);
  if (opts.ate) q = q.lte("data", opts.ate);
  if (opts.tipos && opts.tipos.length) q = q.in("tipo", opts.tipos);

  const { data: rows } = await q;
  const lancamentos = (rows as Lancamento[]) ?? [];

  const [categorias, profiles] = await Promise.all([getCategorias(), getProfiles()]);
  const catById = new Map(categorias.map((c) => [c.id, c]));
  const profById = new Map(profiles.map((p) => [p.id, p]));

  return lancamentos.map((l) => {
    const cat = l.categoria_id ? catById.get(l.categoria_id) : undefined;
    const vend = l.vendedora_id ? profById.get(l.vendedora_id) : undefined;
    const criador = profById.get(l.criado_por);
    const view: LancamentoView = {
      ...l,
      valor: Number(l.valor),
      categoria_nome: cat?.nome ?? null,
      categoria_grupo: cat?.grupo_dre ?? null,
      vendedora_nome: vend?.nome ?? null,
      criado_por_nome: criador?.nome ?? null,
    };
    return view;
  });
}

/** Todos os lançamentos de um ano (para DRE / Resultado). */
export function getLancamentosDoAno(ano: number) {
  return getLancamentos({ desde: `${ano}-01-01`, ate: `${ano}-12-31` });
}

/** Um lançamento específico (RLS aplica). Null se não encontrado/sem acesso. */
export async function getLancamentoById(id: string): Promise<LancamentoView | null> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("lancamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!row) return null;
  const l = row as Lancamento;

  const [categorias, profiles] = await Promise.all([getCategorias(), getProfiles()]);
  const cat = l.categoria_id ? categorias.find((c) => c.id === l.categoria_id) : undefined;
  const vend = l.vendedora_id ? profiles.find((p) => p.id === l.vendedora_id) : undefined;
  const criador = profiles.find((p) => p.id === l.criado_por);
  return {
    ...l,
    valor: Number(l.valor),
    categoria_nome: cat?.nome ?? null,
    categoria_grupo: cat?.grupo_dre ?? null,
    vendedora_nome: vend?.nome ?? null,
    criado_por_nome: criador?.nome ?? null,
  };
}

/** Clientes cadastradas (autocomplete e identificação). */
export async function getClientes(): Promise<import("./types").Cliente[]> {
  const supabase = createClient();
  const { data } = await supabase.from("clientes").select("id,nome,telefone").order("nome");
  return (data as import("./types").Cliente[]) ?? [];
}
