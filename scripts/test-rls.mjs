// Verificação de RLS: cada vendedora só enxerga os próprios lançamentos.
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
loadEnv({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const dom = process.env.AUTH_EMAIL_DOMAIN || "almeidacloset.local";

async function comoVendedora(user) {
  const c = createClient(URL, ANON);
  const { data: auth, error } = await c.auth.signInWithPassword({ email: `${user}@${dom}`, password: "vendedora123" });
  if (error) throw new Error(`login ${user}: ${error.message}`);
  const uid = auth.user.id;
  const { data: rows } = await c.from("lancamentos").select("id,tipo,criado_por");
  const alheios = rows.filter((r) => r.criado_por !== uid);
  const despesas = rows.filter((r) => r.tipo === "despesa");
  return { uid, total: rows.length, alheios: alheios.length, despesas: despesas.length };
}

async function comoAnon() {
  const c = createClient(URL, ANON);
  const { data: rows } = await c.from("lancamentos").select("id");
  return rows?.length ?? 0;
}

const thaina = await comoVendedora("thaina");
const maria = await comoVendedora("mariaclara");
const anon = await comoAnon();

console.log("Thainá:    vê", thaina.total, "lançamentos |", thaina.alheios, "alheios |", thaina.despesas, "despesas do gestor");
console.log("Maria:     vê", maria.total, "lançamentos |", maria.alheios, "alheios |", maria.despesas, "despesas do gestor");
console.log("Anônimo:   vê", anon, "lançamentos");

const ok =
  thaina.alheios === 0 && thaina.despesas === 0 &&
  maria.alheios === 0 && maria.despesas === 0 &&
  thaina.uid !== maria.uid && thaina.total > 0 && maria.total > 0 && anon === 0;

console.log(ok ? "\n✓ RLS OK: isolamento por vendedora funcionando; anônimo bloqueado." : "\n✗ FALHA no RLS!");
process.exit(ok ? 0 : 1);
