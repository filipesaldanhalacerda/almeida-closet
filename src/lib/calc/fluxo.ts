// Fluxo de Caixa — série diária a partir do saldo inicial.
// Entradas = Σ recebimentos do dia. Saídas = despesas pagas (data_pagamento)
// + devoluções de capital. Saldo Final = acumulado. Ver design/README.md §8.
import type { LancamentoView } from "../types";
import { isoLt, ymOf } from "./helpers";

export interface FluxoDia {
  dia: string; // dd/mm
  diaIso: string;
  entradas: number;
  saidas: number;
  saldoDia: number;
  saldoFinal: number;
  negativo: boolean;
}

export interface FluxoModel {
  ano: number;
  mes: number;
  saldoInicialMes: number; // saldo no início do mês selecionado
  entradas: number;
  saidas: number;
  saldoFinal: number;
  dias: FluxoDia[];
}

/** Data que afeta o caixa para cada lançamento (null se não afeta). */
function dataCaixa(l: LancamentoView): { data: string | null; entrada: number; saida: number } {
  if (l.tipo === "recebimento") return { data: l.data, entrada: Number(l.valor || 0), saida: 0 };
  if (l.tipo === "despesa")
    return { data: l.data_pagamento || l.data, entrada: 0, saida: Number(l.valor || 0) };
  if (l.tipo === "devolucao_capital")
    return { data: l.data, entrada: 0, saida: Number(l.valor || 0) };
  return { data: null, entrada: 0, saida: 0 };
}

export function calcularFluxo(
  ls: LancamentoView[],
  ano: number,
  mes: number,
  saldoInicialCaixa: number,
  saldoInicialData?: string | null,
): FluxoModel {
  const inicioMes = `${ano}-${String(mes).padStart(2, "0")}-01`;

  // Saldo acumulado antes do início do mês (a partir do saldo inicial config).
  let saldoInicialMes = Number(saldoInicialCaixa || 0);
  const doMes: { diaIso: string; entrada: number; saida: number }[] = [];

  for (const l of ls) {
    const { data, entrada, saida } = dataCaixa(l);
    if (!data) continue;
    if (saldoInicialData && isoLt(data, saldoInicialData)) continue; // antes da base
    const { y, m } = ymOf(data);
    if (y === ano && m === mes) {
      doMes.push({ diaIso: data, entrada, saida });
    } else if (isoLt(data, inicioMes)) {
      saldoInicialMes += entrada - saida;
    }
  }

  // Agrupa por dia
  const mapa = new Map<string, { entradas: number; saidas: number }>();
  for (const r of doMes) {
    if (!mapa.has(r.diaIso)) mapa.set(r.diaIso, { entradas: 0, saidas: 0 });
    const g = mapa.get(r.diaIso)!;
    g.entradas += r.entrada;
    g.saidas += r.saida;
  }

  const diasOrdenados = [...mapa.keys()].sort();
  let saldo = saldoInicialMes;
  let totalEntradas = 0;
  let totalSaidas = 0;
  const dias: FluxoDia[] = diasOrdenados.map((diaIso) => {
    const g = mapa.get(diaIso)!;
    const saldoDia = g.entradas - g.saidas;
    saldo += saldoDia;
    totalEntradas += g.entradas;
    totalSaidas += g.saidas;
    const { d, m } = ymOf(diaIso);
    return {
      dia: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
      diaIso,
      entradas: g.entradas,
      saidas: g.saidas,
      saldoDia,
      saldoFinal: saldo,
      negativo: saldo < 0,
    };
  });

  return {
    ano,
    mes,
    saldoInicialMes,
    entradas: totalEntradas,
    saidas: totalSaidas,
    saldoFinal: saldo,
    dias,
  };
}
