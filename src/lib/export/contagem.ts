import { type AbaKey, type ExportParams } from "./tipos";

// Contagem de linhas por seção (prévia da tela de Relatórios). Fica separada de
// excel.ts para a página de Relatórios não carregar o exceljs (~1MB) só para
// mostrar a prévia.
export function contarLinhas(p: ExportParams): Record<AbaKey, number> {
  const noRange = (iso: string | null) => !!iso && iso >= p.desde && iso <= p.ate;
  const receita = p.lancamentos.filter(
    (l) => (l.tipo === "venda" || l.tipo === "recebimento") && noRange(l.data),
  ).length;
  const despesa = p.lancamentos.filter((l) => l.tipo === "despesa" && noRange(l.data)).length;
  const capital = p.lancamentos.filter(
    (l) => l.tipo === "investimento" || l.tipo === "devolucao_capital",
  ).length;
  const fluxoDias = new Set(
    p.lancamentos
      .filter((l) => l.tipo === "recebimento" || l.tipo === "despesa" || l.tipo === "devolucao_capital")
      .map((l) => (l.tipo === "despesa" ? l.data_pagamento || l.data : l.data))
      .filter((d) => d >= p.desde && d <= p.ate),
  ).size;
  const vendedoras = new Set(
    p.lancamentos
      .filter((l) => l.tipo === "venda" && Number(l.data.slice(0, 4)) === p.ano)
      .map((l) => l.vendedora_id || l.criado_por),
  ).size;
  return { receita, despesa, dre: 12, fluxo: fluxoDias, resultado: vendedoras, capital };
}
