/**
 * Seed do Almeida Closet: cria o gestor, 3 vendedoras, saldo inicial, metas e
 * ~60 lançamentos variados ao longo de 2026 (vendas + recebimentos + despesas +
 * capital). Idempotente: usuários já existentes são reaproveitados; os
 * lançamentos de exemplo são recriados a cada execução (limpos e reinseridos).
 *
 * Uso:  npm run seed
 * Requer .env.local com NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e
 * (opcional) SEED_GESTOR_* / AUTH_EMAIL_DOMAIN.
 */
import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

loadEnv({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DOMAIN = process.env.AUTH_EMAIL_DOMAIN || "almeidacloset.local";

if (!URL || !SERVICE) {
  console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const email = (u: string) => `${u.toLowerCase()}@${DOMAIN}`;

// LCG determinístico para dados reproduzíveis
let _seed = 20260711;
function rnd() {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const money = (min: number, max: number) => Math.round((min + rnd() * (max - min)) * 100) / 100;

async function acharUserPorEmail(e: string): Promise<string | null> {
  // pagina até achar (base pequena)
  for (let page = 1; page <= 10; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const u = data.users.find((x) => x.email?.toLowerCase() === e.toLowerCase());
    if (u) return u.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function criarOuObterUsuario(
  nome: string,
  username: string,
  senha: string,
  role: "gestor" | "vendedora",
): Promise<string> {
  const e = email(username);
  let id = await acharUserPorEmail(e);
  if (!id) {
    const { data, error } = await admin.auth.admin.createUser({
      email: e,
      password: senha,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { nome, username },
    });
    if (error || !data.user) throw new Error(`Falha ao criar ${username}: ${error?.message}`);
    id = data.user.id;
  } else {
    await admin.auth.admin.updateUserById(id, { password: senha, app_metadata: { role } });
  }
  await admin.from("profiles").upsert({ id, nome, username, role, ativo: true }, { onConflict: "id" });
  return id;
}

async function main() {
  console.log("→ Criando usuários…");
  const gestorId = await criarOuObterUsuario(
    process.env.SEED_GESTOR_NOME || "Rafael Almeida",
    process.env.SEED_GESTOR_USUARIO || "rafael",
    process.env.SEED_GESTOR_SENHA || "almeida123",
    "gestor",
  );
  const vendedoras = [
    { nome: "Thainá Alves", username: "thaina" },
    { nome: "Maria Clara", username: "mariaclara" },
    { nome: "Lucyelli Souza", username: "lucyelli" },
  ];
  const vendIds: Record<string, string> = {};
  for (const v of vendedoras) {
    vendIds[v.username] = await criarOuObterUsuario(v.nome, v.username, "vendedora123", "vendedora");
  }
  const vendList = vendedoras.map((v) => ({ ...v, id: vendIds[v.username] }));

  console.log("→ Configuração e metas…");
  await admin
    .from("configuracoes")
    .update({ saldo_inicial_caixa: 8500, saldo_inicial_data: "2026-01-01" })
    .eq("id", 1);
  const metasDefault: Record<string, number> = { thaina: 25000, mariaclara: 22000, lucyelli: 15000 };
  for (const v of vendList) {
    await admin.from("metas").upsert(
      { vendedora_id: v.id, valor: metasDefault[v.username] ?? 20000 },
      { onConflict: "vendedora_id" },
    );
  }

  // Categorias por nome
  const { data: cats } = await admin.from("categorias_despesa").select("id,nome");
  const catId = (nome: string) => cats?.find((c) => c.nome === nome)?.id as string | undefined;

  console.log("→ Cadastro de clientes…");
  const clientesCadastro: [string, string][] = [
    ["Amanda Jabor", "(22) 99811-2233"],
    ["Luciana Dutra", "(22) 99722-3344"],
    ["Joyce Rangel", "(22) 99633-4455"],
    ["Marina Alves", "(22) 99544-5566"],
    ["Patrícia Nunes", "(22) 99455-6677"],
    ["Bruna Sales", "(22) 99366-7788"],
    ["Camila Rocha", "(22) 99277-8899"],
    ["Fernanda Lima", "(22) 99188-9900"],
  ];
  const { data: clientesExistentes } = await admin.from("clientes").select("id,nome");
  const nomesExistentes = new Set((clientesExistentes ?? []).map((c) => c.nome.toLowerCase()));
  for (const [nome, telefone] of clientesCadastro) {
    if (nomesExistentes.has(nome.toLowerCase())) {
      await admin.from("clientes").update({ telefone }).ilike("nome", nome);
    } else {
      await admin.from("clientes").insert({ nome, telefone });
    }
  }

  console.log("→ Limpando lançamentos de exemplo anteriores…");
  await admin.from("lancamentos").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("→ Gerando lançamentos…");
  const clientes = [
    "Amanda Jabor", "Luciana Dutra", "Joyce Rangel", "Marina Alves",
    "Patrícia Nunes", "Bruna Sales", "Camila Rocha", "Fernanda Lima",
  ];
  const formas = ["cartao_credito", "cartao_debito", "crediario", "dinheiro", "pix_transferencia", "cheque"];
  const meios = ["pix", "cartao_credito", "cartao_debito", "dinheiro", "picpay", "transferencia"];
  const modalidades = ["presencial", "condicional", "online"];
  const dd = (m: number, d: number) => `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const rows: Record<string, unknown>[] = [];

  // Vendas + recebimentos: várias por mês (Jan..Jul), por vendedora
  for (let mes = 1; mes <= 7; mes++) {
    const qtd = 13 + Math.floor(rnd() * 6); // 13-18 vendas por vendedora/mês
    for (const v of vendList) {
      for (let i = 0; i < qtd; i++) {
        const dia = 1 + Math.floor(rnd() * 27);
        const forma = pick(formas);
        const valor = money(150, 890);
        const cliente = pick(clientes);
        const modalidade = pick(modalidades);
        rows.push({
          tipo: "venda", valor, data: dd(mes, dia), forma_pagamento: forma,
          cliente, modalidade, vendedora_id: v.id, criado_por: v.id,
        });
        // recebimento correspondente: à vista recebe tudo; crediário recebe uma parte
        const recValor = forma === "crediario" ? Math.round(valor * (0.3 + rnd() * 0.4) * 100) / 100 : valor;
        const meio = forma === "crediario" ? pick(["pix", "dinheiro"]) : pick(meios);
        const ehCartao = forma.startsWith("cartao");
        const band = ehCartao ? pick(["VISA", "MASTER", "ELO"]) : null;
        rows.push({
          tipo: "recebimento", valor: recValor, data: dd(mes, dia),
          meio,
          cliente: ehCartao ? null : cliente,
          bandeira: band,
          cliente_ou_bandeira: ehCartao ? band : cliente,
          vendedora_id: v.id, criado_por: v.id,
        });
      }
    }
  }

  // Despesas recorrentes mensais (criadas pelo gestor)
  const despMensais: [string, number, string][] = [
    ["Aluguel", 2600, "Imobiliária Central"],
    ["Energia", 780, "Companhia de Energia"],
    ["Folha de Pagamento", 4200, "Funcionárias"],
    ["Fornecedor", 6800, "Confecções Sul"],
    ["Comissão de Vendas", 1400, "Equipe de vendas"],
    ["Simples Nacional", 1300, "Receita Federal"],
    ["Embalagens", 520, "Gráfica Sul"],
    ["Internet", 220, "Provedor Net"],
    ["Propaganda e Marketing", 900, "Agência Local"],
    ["Taxas Bancárias", 210, "Banco"],
  ];
  for (let mes = 1; mes <= 7; mes++) {
    for (const [cat, base, credor] of despMensais) {
      const id = catId(cat);
      if (!id) continue;
      const valor = Math.round(base * (0.9 + rnd() * 0.2) * 100) / 100;
      const dia = 5 + Math.floor(rnd() * 10);
      rows.push({
        tipo: "despesa", valor, data: dd(mes, dia), categoria_id: id, credor,
        mes_referencia: `${["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho"][mes-1]}/2026`,
        data_vencimento: dd(mes, dia), data_pagamento: dd(mes, dia), criado_por: gestorId,
      });
    }
  }

  // Investimentos pontuais (grupo DRE investimentos / dívidas)
  const invMaq = catId("Máquinas e Equipamentos");
  if (invMaq) rows.push({ tipo: "despesa", valor: 3500, data: dd(2, 14), categoria_id: invMaq, credor: "Loja de Equipamentos", mes_referencia: "Fevereiro/2026", data_vencimento: dd(2, 14), data_pagamento: dd(2, 14), criado_por: gestorId });
  const obras = catId("Obras");
  if (obras) rows.push({ tipo: "despesa", valor: 8000, data: dd(5, 8), categoria_id: obras, credor: "Construtora", mes_referencia: "Maio/2026", data_vencimento: dd(5, 8), data_pagamento: dd(5, 8), criado_por: gestorId });
  const emp = catId("Empréstimos");
  if (emp) rows.push({ tipo: "despesa", valor: 700, data: dd(6, 10), categoria_id: emp, credor: "Banco", mes_referencia: "Junho/2026", data_vencimento: dd(6, 10), data_pagamento: dd(6, 10), criado_por: gestorId });

  // Capital: aportes e devoluções
  rows.push({ tipo: "investimento", valor: 20000, data: dd(1, 10), descricao: "Aporte inicial dos sócios", criado_por: gestorId });
  rows.push({ tipo: "investimento", valor: 12000, data: dd(5, 5), descricao: "Aporte para reforma da loja", criado_por: gestorId });
  rows.push({ tipo: "devolucao_capital", valor: 5000, data: dd(3, 12), descricao: "Retirada de pró-labore extra", criado_por: gestorId });
  rows.push({ tipo: "devolucao_capital", valor: 8000, data: dd(6, 20), descricao: "Retirada de lucros", criado_por: gestorId });

  // Alguns lançamentos "de hoje" (2026-07-11) para o dashboard
  const hoje = "2026-07-11";
  rows.push({ tipo: "venda", valor: 299, data: hoje, forma_pagamento: "crediario", cliente: "Amanda Jabor", modalidade: "presencial", vendedora_id: vendList[0].id, criado_por: vendList[0].id });
  rows.push({ tipo: "recebimento", valor: 100, data: hoje, meio: "dinheiro", cliente: "Amanda Jabor", cliente_ou_bandeira: "Amanda Jabor", vendedora_id: vendList[0].id, criado_por: vendList[0].id });
  rows.push({ tipo: "venda", valor: 750, data: hoje, forma_pagamento: "crediario", cliente: "Bruna Sales", modalidade: "presencial", vendedora_id: vendList[1].id, criado_por: vendList[1].id });

  const { error } = await admin.from("lancamentos").insert(rows);
  if (error) throw new Error("Falha ao inserir lançamentos: " + error.message);

  console.log(`✓ Seed concluído: ${rows.length} lançamentos, ${vendList.length} vendedoras, 1 gestor.`);
  console.log(`  Gestor: usuário "${process.env.SEED_GESTOR_USUARIO || "rafael"}" / senha "${process.env.SEED_GESTOR_SENHA || "almeida123"}"`);
  console.log(`  Vendedoras: thaina / mariaclara / lucyelli — senha "vendedora123"`);
}

main().catch((e) => {
  console.error("Erro no seed:", e.message);
  process.exit(1);
});
