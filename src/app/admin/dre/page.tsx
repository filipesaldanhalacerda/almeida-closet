import { DreTable } from "@/components/gestor/DreTable";
import { calcularDre } from "@/lib/calc/dre";
import { getLancamentos } from "@/lib/data";
import { hojeIso } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "DRE anual · Almeida Closet" };

export default async function DrePage({ searchParams }: { searchParams: { ano?: string } }) {
  const anoAtual = Number(hojeIso().slice(0, 4));
  const ano = Number(searchParams.ano) || anoAtual;

  const lancamentos = await getLancamentos({});
  const anosData = new Set<number>(lancamentos.map((l) => Number(l.data.slice(0, 4))));
  anosData.add(anoAtual);
  anosData.add(ano);
  const anos = [...anosData].sort((a, b) => a - b);

  const model = calcularDre(lancamentos, ano);
  const modelAnterior = calcularDre(lancamentos, ano - 1);

  return <DreTable model={model} ano={ano} anos={anos} resumoAnterior={modelAnterior.resumo} />;
}
