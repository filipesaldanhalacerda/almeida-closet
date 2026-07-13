import type { Configuracao, LancamentoView } from "@/lib/types";

/** Seções disponíveis nos relatórios (PDF e Excel). */
export type AbaKey = "receita" | "despesa" | "dre" | "fluxo" | "resultado" | "capital";

export const ABAS_INFO: { key: AbaKey; nome: string; cor: string; descricao: string }[] = [
  { key: "receita", nome: "Receita", cor: "#2f7d5b", descricao: "Vendas e recebimentos do período" },
  { key: "despesa", nome: "Despesa", cor: "#b04a34", descricao: "Despesas pagas no período" },
  { key: "dre", nome: "DRE", cor: "#8c6f52", descricao: "Matriz anual meses × contas" },
  { key: "fluxo", nome: "Fluxo de Caixa", cor: "#2b6f74", descricao: "Série diária com saldo acumulado" },
  { key: "resultado", nome: "Resultado de Vendas", cor: "#4a6b8a", descricao: "Por vendedora e modalidade (ano)" },
  { key: "capital", nome: "Investimento e Devolução", cor: "#8c6f52", descricao: "Aportes e retiradas (histórico)" },
];

export const TODAS_ABAS: AbaKey[] = ABAS_INFO.map((a) => a.key);

export interface ExportParams {
  ano: number;
  desde: string; // ISO
  ate: string; // ISO
  lancamentos: LancamentoView[];
  config: Configuracao | null;
}
