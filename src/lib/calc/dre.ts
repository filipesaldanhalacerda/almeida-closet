// DRE anual, matriz meses × contas, calculada dos lançamentos.
// Regras: ver design/README.md §8 e enunciado.
import { DRE_GRUPO_LABEL, FORMA_LABEL, RECEITA_BRUTA_FORMAS } from "../constants";
import type { DreGrupo, LancamentoView } from "../types";
import { arr12, ymOf } from "./helpers";

export interface DreLinha {
  nome: string;
  meses: number[]; // 12 posições
  total: number;
}

export interface DreGrupoAgg {
  label: string;
  meses: number[];
  total: number;
  children: DreLinha[];
}

export interface DreSubtotal {
  label: string;
  meses: number[];
  total: number;
}

export interface DreModel {
  ano: number;
  receitaBruta: DreGrupoAgg;
  deducoes: DreGrupoAgg;
  receitaLiquida: DreSubtotal;
  custosVariaveis: DreGrupoAgg;
  margemContribuicao: DreSubtotal;
  despesasAdministrativas: DreGrupoAgg;
  despesasFuncionarios: DreGrupoAgg;
  despesasFinanceiras: DreGrupoAgg;
  resultadoOperacional: DreSubtotal;
  investimentos: DreGrupoAgg;
  dividas: DreGrupoAgg;
  resultadoFinal: DreSubtotal;
  resumo: {
    receitaBruta: number;
    despesaTotal: number;
    margemPct: number; // resultado / receita bruta * 100
    resultadoFinal: number;
  };
}

function somaMeses(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i]);
}
function subMeses(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}
function totalDe(meses: number[]): number {
  return meses.reduce((s, v) => s + v, 0);
}

/** Agrega despesas de um grupo do DRE em linhas por categoria. */
function grupoDespesas(
  ls: LancamentoView[],
  ano: number,
  grupo: DreGrupo,
): DreGrupoAgg {
  const porCategoria = new Map<string, number[]>();
  for (const l of ls) {
    if (l.tipo !== "despesa") continue;
    if (l.categoria_grupo !== grupo) continue;
    const { y, m } = ymOf(l.data);
    if (y !== ano) continue;
    const nome = l.categoria_nome || "Sem categoria";
    if (!porCategoria.has(nome)) porCategoria.set(nome, arr12());
    porCategoria.get(nome)![m - 1] += Number(l.valor || 0);
  }
  const children: DreLinha[] = [...porCategoria.entries()]
    .map(([nome, meses]) => ({ nome, meses, total: totalDe(meses) }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const meses = children.reduce((acc, c) => somaMeses(acc, c.meses), arr12());
  return { label: DRE_GRUPO_LABEL[grupo], meses, total: totalDe(meses), children };
}

/** Agrega vendas por forma de pagamento (Receita Bruta). */
function receitaBruta(ls: LancamentoView[], ano: number): DreGrupoAgg {
  const porForma = new Map<string, number[]>();
  for (const f of RECEITA_BRUTA_FORMAS) porForma.set(FORMA_LABEL[f], arr12());
  for (const l of ls) {
    if (l.tipo !== "venda" || !l.forma_pagamento) continue;
    const { y, m } = ymOf(l.data);
    if (y !== ano) continue;
    const nome = FORMA_LABEL[l.forma_pagamento];
    if (!porForma.has(nome)) porForma.set(nome, arr12());
    porForma.get(nome)![m - 1] += Number(l.valor || 0);
  }
  const children: DreLinha[] = [...porForma.entries()].map(([nome, meses]) => ({
    nome,
    meses,
    total: totalDe(meses),
  }));
  const meses = children.reduce((acc, c) => somaMeses(acc, c.meses), arr12());
  return { label: "Receita Bruta", meses, total: totalDe(meses), children };
}

export function calcularDre(ls: LancamentoView[], ano: number): DreModel {
  const rb = receitaBruta(ls, ano);
  const ded = grupoDespesas(ls, ano, "deducoes");
  const cv = grupoDespesas(ls, ano, "custos_variaveis");
  const adm = grupoDespesas(ls, ano, "despesas_administrativas");
  const func = grupoDespesas(ls, ano, "despesas_funcionarios");
  const fin = grupoDespesas(ls, ano, "despesas_financeiras");
  const inv = grupoDespesas(ls, ano, "investimentos");
  const div = grupoDespesas(ls, ano, "dividas");

  const rlMeses = subMeses(rb.meses, ded.meses);
  const mcMeses = subMeses(rlMeses, cv.meses);
  const roMeses = subMeses(subMeses(subMeses(mcMeses, adm.meses), func.meses), fin.meses);
  const rfMeses = subMeses(subMeses(roMeses, inv.meses), div.meses);

  const despesaTotalMeses = [
    ded,
    cv,
    adm,
    func,
    fin,
    inv,
    div,
  ].reduce((acc, g) => somaMeses(acc, g.meses), arr12());

  const receitaBrutaAno = totalDe(rb.meses);
  const resultadoFinalAno = totalDe(rfMeses);

  return {
    ano,
    receitaBruta: rb,
    deducoes: ded,
    receitaLiquida: { label: "= Receita Líquida", meses: rlMeses, total: totalDe(rlMeses) },
    custosVariaveis: cv,
    margemContribuicao: {
      label: "= Margem de Contribuição",
      meses: mcMeses,
      total: totalDe(mcMeses),
    },
    despesasAdministrativas: adm,
    despesasFuncionarios: func,
    despesasFinanceiras: fin,
    resultadoOperacional: {
      label: "= Resultado Operacional",
      meses: roMeses,
      total: totalDe(roMeses),
    },
    investimentos: inv,
    dividas: div,
    resultadoFinal: { label: "= Resultado Final", meses: rfMeses, total: resultadoFinalAno },
    resumo: {
      receitaBruta: receitaBrutaAno,
      despesaTotal: totalDe(despesaTotalMeses),
      margemPct: receitaBrutaAno > 0 ? (resultadoFinalAno / receitaBrutaAno) * 100 : 0,
      resultadoFinal: resultadoFinalAno,
    },
  };
}
