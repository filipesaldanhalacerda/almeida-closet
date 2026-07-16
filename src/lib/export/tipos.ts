import type { Configuracao, LancamentoView } from "@/lib/types";

/** Seções disponíveis nos relatórios (PDF e Excel). */
export type AbaKey = "receita" | "despesa" | "dre" | "fluxo" | "resultado" | "capital";

export const ABAS_INFO: { key: AbaKey; nome: string; cor: string; descricao: string }[] = [
  { key: "receita", nome: "Receita", cor: "#1f875c", descricao: "Vendas e recebimentos do período" },
  { key: "despesa", nome: "Despesa", cor: "#cb4a44", descricao: "Despesas pagas no período" },
  { key: "dre", nome: "DRE", cor: "#96683a", descricao: "Matriz anual meses × contas" },
  { key: "fluxo", nome: "Fluxo de Caixa", cor: "#127c84", descricao: "Série diária com saldo acumulado" },
  { key: "resultado", nome: "Resultado de Vendas", cor: "#4a6b8a", descricao: "Por vendedora e modalidade (ano)" },
  { key: "capital", nome: "Investimento e Devolução", cor: "#96683a", descricao: "Aportes e retiradas (histórico)" },
];

export const TODAS_ABAS: AbaKey[] = ABAS_INFO.map((a) => a.key);

export interface ExportParams {
  ano: number;
  desde: string; // ISO
  ate: string; // ISO
  lancamentos: LancamentoView[];
  config: Configuracao | null;
}
