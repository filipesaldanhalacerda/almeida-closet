import { Equipe, type TeamRow } from "@/components/gestor/Equipe";
import { getLancamentos, getVendedoras } from "@/lib/data";
import { hojeIso, periodoLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipe · Almeida Closet" };

export default async function EquipePage({
  searchParams,
}: {
  searchParams: { ano?: string; mes?: string };
}) {
  const [hy, hm] = hojeIso().split("-");
  const ano = Number(searchParams.ano) || Number(hy);
  const mes = Number(searchParams.mes) || Number(hm);
  const ultimo = new Date(ano, mes, 0).getDate();
  const desde = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ate = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;

  const [vendedoras, doMes] = await Promise.all([
    getVendedoras(),
    getLancamentos({ desde, ate }),
  ]);

  const time: TeamRow[] = vendedoras.map((v) => {
    const dela = doMes.filter((l) => l.criado_por === v.id || l.vendedora_id === v.id);
    const volume = dela.filter((l) => l.tipo === "venda").reduce((s, l) => s + l.valor, 0);
    return { id: v.id, nome: v.nome, ativo: v.ativo, qtd: dela.length, volume };
  });

  return <Equipe time={time} periodo={periodoLabel(ano, mes)} />;
}
