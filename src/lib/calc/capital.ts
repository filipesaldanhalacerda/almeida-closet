// Capital — listas de aportes (investimento) e devoluções, com acumulado.
import type { LancamentoView } from "../types";
import { noAno } from "./helpers";

export interface CapitalItem {
  id: string;
  desc: string;
  data: string;
  valor: number;
  acumulado: number;
}

export interface CapitalModel {
  aportes: CapitalItem[];
  devolucoes: CapitalItem[];
  totalAportes: number;
  totalDevolucoes: number;
  liquido: number;
}

function listaComAcumulado(
  ls: LancamentoView[],
  tipo: "investimento" | "devolucao_capital",
): { itens: CapitalItem[]; total: number } {
  const filtrados = ls
    .filter((l) => l.tipo === tipo)
    .sort((a, b) => a.data.localeCompare(b.data));
  let acc = 0;
  const itens = filtrados.map((l) => {
    acc += Number(l.valor || 0);
    return {
      id: l.id,
      desc: l.descricao || (tipo === "investimento" ? "Aporte" : "Devolução de capital"),
      data: l.data,
      valor: Number(l.valor || 0),
      acumulado: acc,
    };
  });
  return { itens, total: acc };
}

export function calcularCapital(ls: LancamentoView[], ano?: number): CapitalModel {
  const base = ano == null ? ls : ls.filter((l) => noAno(l.data, ano));
  const ap = listaComAcumulado(base, "investimento");
  const dev = listaComAcumulado(base, "devolucao_capital");
  return {
    aportes: ap.itens,
    devolucoes: dev.itens,
    totalAportes: ap.total,
    totalDevolucoes: dev.total,
    liquido: ap.total - dev.total,
  };
}
