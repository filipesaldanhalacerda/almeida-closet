// Dashboard do gestor — KPIs, gráficos e "extras" (resumo do dia, top clientes,
// comparativo anual, metas). Tudo calculado dos lançamentos.
import { FORMA_LABEL } from "../constants";
import type { LancamentoView } from "../types";
import { isoLte, noAno, noMes, soma, ymOf } from "./helpers";

export interface SerieMes {
  ano: number;
  mes: number;
  label: string; // abbr
  recebido: number;
  despesa: number;
}

export interface RankItem {
  id: string;
  nome: string;
  valor: number;
  qtd: number;
  pctBarra: number; // 0..100 relativo ao líder
}

export interface BreakItem {
  label: string;
  valor: number;
  pct: number;
}

export interface MetaProgresso {
  id: string;
  nome: string;
  vendas: number;
  meta: number;
  pct: number; // 0..100 (limitado a 100 na barra, valor real no texto)
  pctReal: number;
}

export interface DashboardModel {
  periodo: { ano: number; mes: number };
  recebido: number;
  despesas: number;
  resultado: number;
  vendasVolume: number;
  vendasCount: number;
  ticketMedio: number;
  saldoCaixa: number;
  delta: {
    recebido: number;
    despesas: number;
    vendas: number;
    ticket: number;
  };
  serie6: SerieMes[];
  ranking: RankItem[];
  receitaPorForma: BreakItem[];
  despesasPorCategoria: BreakItem[];
  recentes: LancamentoView[];
  resumoDia: { data: string; vendas: number; recebido: number; despesas: number };
  semLancamentosHoje: boolean;
  topClientes: { nome: string; valor: number; qtd: number }[];
  comparativoAno: {
    atual: { recebido: number; despesas: number; resultado: number };
    anterior: { recebido: number; despesas: number; resultado: number };
    deltaResultado: number;
  };
  metas: MetaProgresso[];
}

const MESES_ABBR = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function recebidoMes(ls: LancamentoView[], a: number, m: number) {
  return soma(ls.filter((l) => l.tipo === "recebimento" && noMes(l.data, a, m)));
}
function despesaMes(ls: LancamentoView[], a: number, m: number) {
  return soma(ls.filter((l) => l.tipo === "despesa" && noMes(l.data, a, m)));
}
function vendasMes(ls: LancamentoView[], a: number, m: number) {
  return ls.filter((l) => l.tipo === "venda" && noMes(l.data, a, m));
}

function pctDelta(atual: number, anterior: number): number {
  // Sem base de comparação: sinaliza pelo sinal do valor atual (evita mostrar
  // um prejuízo como +100% "verde" quando o ano anterior foi zero).
  if (anterior === 0) return atual > 0 ? 100 : atual < 0 ? -100 : 0;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

function mesAnterior(a: number, m: number): { a: number; m: number } {
  return m === 1 ? { a: a - 1, m: 12 } : { a, m: m - 1 };
}

/** Último dia (data) do mês selecionado, ISO. */
function fimDoMesIso(a: number, m: number): string {
  const ultimo = new Date(a, m, 0).getDate();
  return `${a}-${String(m).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
}

export function calcularDashboard(
  ls: LancamentoView[],
  ano: number,
  mes: number,
  opts: {
    saldoInicialCaixa: number;
    saldoInicialData?: string | null;
    metas: { vendedora_id: string; valor: number }[];
    vendedoras: { id: string; nome: string }[];
    hoje: string;
    limiteRecentes?: number;
  },
): DashboardModel {
  const recebido = recebidoMes(ls, ano, mes);
  const despesas = despesaMes(ls, ano, mes);
  const resultado = recebido - despesas;
  const vendasDoMes = vendasMes(ls, ano, mes);
  const vendasVolume = soma(vendasDoMes);
  const vendasCount = vendasDoMes.length;
  const ticketMedio = vendasCount > 0 ? vendasVolume / vendasCount : 0;

  // Saldo de caixa até o fim do mês selecionado
  const fim = fimDoMesIso(ano, mes);
  const base = opts.saldoInicialData;
  let saldoCaixa = Number(opts.saldoInicialCaixa || 0);
  for (const l of ls) {
    let data: string | null = null;
    let sinal = 0;
    if (l.tipo === "recebimento") {
      data = l.data;
      sinal = 1;
    } else if (l.tipo === "despesa") {
      data = l.data_pagamento || l.data;
      sinal = -1;
    } else if (l.tipo === "devolucao_capital") {
      data = l.data;
      sinal = -1;
    }
    if (!data) continue;
    if (base && data.slice(0, 10) < base.slice(0, 10)) continue;
    if (isoLte(data, fim)) saldoCaixa += sinal * Number(l.valor || 0);
  }

  // Deltas vs mês anterior
  const pa = mesAnterior(ano, mes);
  const recebidoAnt = recebidoMes(ls, pa.a, pa.m);
  const despesaAnt = despesaMes(ls, pa.a, pa.m);
  const vendasAntArr = vendasMes(ls, pa.a, pa.m);
  const vendasAnt = soma(vendasAntArr);
  const ticketAnt = vendasAntArr.length ? vendasAnt / vendasAntArr.length : 0;

  // Série dos últimos 6 meses
  const serie6: SerieMes[] = [];
  let cy = ano;
  let cm = mes;
  const stack: { a: number; m: number }[] = [];
  for (let i = 0; i < 6; i++) {
    stack.unshift({ a: cy, m: cm });
    const p = mesAnterior(cy, cm);
    cy = p.a;
    cm = p.m;
  }
  for (const { a, m } of stack) {
    serie6.push({
      ano: a,
      mes: m,
      label: MESES_ABBR[m - 1],
      recebido: recebidoMes(ls, a, m),
      despesa: despesaMes(ls, a, m),
    });
  }

  // Ranking de vendas por vendedora (mês)
  const rankMap = new Map<string, { nome: string; valor: number; qtd: number }>();
  for (const l of vendasDoMes) {
    const id = l.vendedora_id || l.criado_por || "—";
    const nome = l.vendedora_nome || l.criado_por_nome || "Sem vendedora";
    if (!rankMap.has(id)) rankMap.set(id, { nome, valor: 0, qtd: 0 });
    const r = rankMap.get(id)!;
    r.valor += Number(l.valor || 0);
    r.qtd += 1;
  }
  const rankArr = [...rankMap.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.valor - a.valor);
  const maxRank = Math.max(1, ...rankArr.map((r) => r.valor));
  const ranking: RankItem[] = rankArr.map((r) => ({
    id: r.id,
    nome: r.nome,
    valor: r.valor,
    qtd: r.qtd,
    pctBarra: (r.valor / maxRank) * 100,
  }));

  // Receita por forma de pagamento (vendas do mês)
  const formaMap = new Map<string, number>();
  for (const l of vendasDoMes) {
    if (!l.forma_pagamento) continue;
    const label = FORMA_LABEL[l.forma_pagamento];
    formaMap.set(label, (formaMap.get(label) || 0) + Number(l.valor || 0));
  }
  const totalForma = [...formaMap.values()].reduce((a, b) => a + b, 0);
  const receitaPorForma: BreakItem[] = [...formaMap.entries()]
    .map(([label, valor]) => ({ label, valor, pct: totalForma ? (valor / totalForma) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor);

  // Despesas por categoria (mês)
  const catMap = new Map<string, number>();
  for (const l of ls) {
    if (l.tipo !== "despesa" || !noMes(l.data, ano, mes)) continue;
    const label = l.categoria_nome || "Sem categoria";
    catMap.set(label, (catMap.get(label) || 0) + Number(l.valor || 0));
  }
  const totalCat = [...catMap.values()].reduce((a, b) => a + b, 0);
  const despesasPorCategoria: BreakItem[] = [...catMap.entries()]
    .map(([label, valor]) => ({ label, valor, pct: totalCat ? (valor / totalCat) * 100 : 0 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  // Recentes
  const recentes = [...ls]
    .sort((a, b) => (b.created_at || b.data).localeCompare(a.created_at || a.data))
    .slice(0, opts.limiteRecentes ?? 6);

  // Resumo do dia (hoje)
  const hoje = opts.hoje;
  const doHoje = ls.filter((l) => l.data.slice(0, 10) === hoje.slice(0, 10));
  const resumoDia = {
    data: hoje,
    vendas: doHoje.filter((l) => l.tipo === "venda").length,
    recebido: soma(doHoje.filter((l) => l.tipo === "recebimento")),
    despesas: soma(doHoje.filter((l) => l.tipo === "despesa")),
  };
  const semLancamentosHoje = doHoje.length === 0;

  // Top 10 clientes por valor comprado (vendas do ano)
  const cliMap = new Map<string, { valor: number; qtd: number }>();
  for (const l of ls) {
    if (l.tipo !== "venda" || !noAno(l.data, ano)) continue;
    const nome = (l.cliente || "").trim();
    if (!nome) continue;
    if (!cliMap.has(nome)) cliMap.set(nome, { valor: 0, qtd: 0 });
    const c = cliMap.get(nome)!;
    c.valor += Number(l.valor || 0);
    c.qtd += 1;
  }
  const topClientes = [...cliMap.entries()]
    .map(([nome, v]) => ({ nome, valor: v.valor, qtd: v.qtd }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  // Comparativo mês atual × mesmo mês do ano anterior
  const recAtualAno = recebidoMes(ls, ano, mes);
  const despAtualAno = despesaMes(ls, ano, mes);
  const recAntAno = recebidoMes(ls, ano - 1, mes);
  const despAntAno = despesaMes(ls, ano - 1, mes);
  const comparativoAno = {
    atual: { recebido: recAtualAno, despesas: despAtualAno, resultado: recAtualAno - despAtualAno },
    anterior: {
      recebido: recAntAno,
      despesas: despAntAno,
      resultado: recAntAno - despAntAno,
    },
    deltaResultado: pctDelta(recAtualAno - despAtualAno, recAntAno - despAntAno),
  };

  // Metas por vendedora (vendas do mês vs meta)
  const metaMap = new Map(opts.metas.map((m) => [m.vendedora_id, Number(m.valor || 0)]));
  const vendasPorVend = new Map<string, number>();
  for (const l of vendasDoMes) {
    const id = l.vendedora_id || l.criado_por || "—";
    vendasPorVend.set(id, (vendasPorVend.get(id) || 0) + Number(l.valor || 0));
  }
  const metas: MetaProgresso[] = opts.vendedoras
    .map((v) => {
      const vendas = vendasPorVend.get(v.id) || 0;
      const meta = metaMap.get(v.id) || 0;
      const pctReal = meta > 0 ? (vendas / meta) * 100 : 0;
      return { id: v.id, nome: v.nome, vendas, meta, pct: Math.min(100, pctReal), pctReal };
    })
    .filter((m) => m.meta > 0 || m.vendas > 0);

  return {
    periodo: { ano, mes },
    recebido,
    despesas,
    resultado,
    vendasVolume,
    vendasCount,
    ticketMedio,
    saldoCaixa,
    delta: {
      recebido: pctDelta(recebido, recebidoAnt),
      despesas: pctDelta(despesas, despesaAnt),
      vendas: pctDelta(vendasVolume, vendasAnt),
      ticket: pctDelta(ticketMedio, ticketAnt),
    },
    serie6,
    ranking,
    receitaPorForma,
    despesasPorCategoria,
    recentes,
    resumoDia,
    semLancamentosHoje,
    topClientes,
    comparativoAno,
    metas,
  };
}
