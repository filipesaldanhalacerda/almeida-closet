import type { LancamentoView } from "../types";

/** Ano/mês (1-12) de uma ISO date, sem depender de fuso (parse manual). */
export function ymOf(iso: string): { y: number; m: number; d: number } {
  const p = iso.slice(0, 10).split("-");
  return { y: +p[0], m: +p[1], d: +p[2] };
}

export function noMes(iso: string | null | undefined, ano: number, mes: number): boolean {
  if (!iso) return false;
  const { y, m } = ymOf(iso);
  return y === ano && m === mes;
}

export function noAno(iso: string | null | undefined, ano: number): boolean {
  if (!iso) return false;
  return ymOf(iso).y === ano;
}

export function soma(ls: { valor: number }[]): number {
  return ls.reduce((acc, l) => acc + Number(l.valor || 0), 0);
}

export function arr12(): number[] {
  return new Array(12).fill(0);
}

/** Compara ISO dates como string (funciona por serem zero-padded). */
export function isoLte(a: string, b: string): boolean {
  return a.slice(0, 10) <= b.slice(0, 10);
}
export function isoLt(a: string, b: string): boolean {
  return a.slice(0, 10) < b.slice(0, 10);
}

export const vendas = (ls: LancamentoView[]) => ls.filter((l) => l.tipo === "venda");
export const recebimentos = (ls: LancamentoView[]) =>
  ls.filter((l) => l.tipo === "recebimento");
export const despesas = (ls: LancamentoView[]) => ls.filter((l) => l.tipo === "despesa");
