import { ResultadoVendas } from "@/components/gestor/ResultadoVendas";
import { calcularResultadoVendas } from "@/lib/calc/resultado";
import { getLancamentos } from "@/lib/data";
import { hojeIso } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultado de vendas · Almeida Closet" };

export default async function ResultadoDeVendasPage({ searchParams }: { searchParams: { ano?: string } }) {
  const anoAtual = Number(hojeIso().slice(0, 4));
  const ano = Number(searchParams.ano) || anoAtual;

  const lancamentos = await getLancamentos({});
  const anosData = new Set<number>(lancamentos.map((l) => Number(l.data.slice(0, 4))));
  anosData.add(anoAtual);
  anosData.add(ano);
  const anos = [...anosData].sort((a, b) => a - b);

  const model = calcularResultadoVendas(lancamentos, ano);
  return <ResultadoVendas model={model} ano={ano} anos={anos} />;
}
