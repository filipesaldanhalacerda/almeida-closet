// Resultado de Vendas, por vendedora/mês e por modalidade. Ver README §8.
import { MODALIDADE_LABEL } from "../constants";
import type { LancamentoView, ModalidadeVenda } from "../types";
import { arr12, ymOf } from "./helpers";

// Paleta para segmentos empilhados por vendedora (design tokens §9)
export const CORES_VENDEDORA = ["#127c84", "#96683a", "#cb4a44", "#1f875c", "#4a6b8a", "#a07b3e"];

export interface VendedoraSerie {
  id: string;
  nome: string;
  cor: string;
  meses: number[]; // 12
  total: number;
  pct: number; // participação no total do ano
}

export interface ModalidadeAgg {
  modalidade: ModalidadeVenda;
  label: string;
  valor: number;
  pct: number;
}

export interface ResultadoVendasModel {
  ano: number;
  vendedoras: VendedoraSerie[];
  totalAno: number;
  // barras empilhadas por mês: cada mês tem segmentos por vendedora
  barras: { mes: number; total: number; segmentos: { id: string; cor: string; valor: number }[] }[];
  modalidades: ModalidadeAgg[];
}

export function calcularResultadoVendas(
  ls: LancamentoView[],
  ano: number,
): ResultadoVendasModel {
  const porVendedora = new Map<string, { nome: string; meses: number[] }>();

  for (const l of ls) {
    if (l.tipo !== "venda") continue;
    const { y, m } = ymOf(l.data);
    if (y !== ano) continue;
    const id = l.vendedora_id || l.criado_por || "—";
    const nome = l.vendedora_nome || l.criado_por_nome || "Sem vendedora";
    if (!porVendedora.has(id)) porVendedora.set(id, { nome, meses: arr12() });
    porVendedora.get(id)!.meses[m - 1] += Number(l.valor || 0);
  }

  const totalAno = [...porVendedora.values()].reduce(
    (s, v) => s + v.meses.reduce((a, b) => a + b, 0),
    0,
  );

  const vendedoras: VendedoraSerie[] = [...porVendedora.entries()]
    .map(([id, v], i) => {
      const total = v.meses.reduce((a, b) => a + b, 0);
      return {
        id,
        nome: v.nome,
        cor: CORES_VENDEDORA[i % CORES_VENDEDORA.length],
        meses: v.meses,
        total,
        pct: totalAno > 0 ? (total / totalAno) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total);

  const barras = Array.from({ length: 12 }, (_, mi) => {
    const segmentos = vendedoras.map((v) => ({ id: v.id, cor: v.cor, valor: v.meses[mi] }));
    const total = segmentos.reduce((s, x) => s + x.valor, 0);
    return { mes: mi + 1, total, segmentos };
  });

  // Por modalidade
  const modMap = new Map<ModalidadeVenda, number>([
    ["presencial", 0],
    ["condicional", 0],
    ["online", 0],
  ]);
  for (const l of ls) {
    if (l.tipo !== "venda" || !l.modalidade) continue;
    if (ymOf(l.data).y !== ano) continue;
    modMap.set(l.modalidade, (modMap.get(l.modalidade) || 0) + Number(l.valor || 0));
  }
  const totalMod = [...modMap.values()].reduce((a, b) => a + b, 0);
  const modalidades: ModalidadeAgg[] = [...modMap.entries()].map(([modalidade, valor]) => ({
    modalidade,
    label: MODALIDADE_LABEL[modalidade],
    valor,
    pct: totalMod > 0 ? (valor / totalMod) * 100 : 0,
  }));

  return { ano, vendedoras, totalAno, barras, modalidades };
}
