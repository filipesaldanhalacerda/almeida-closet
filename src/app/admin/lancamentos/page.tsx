import { LancamentosTable } from "@/components/gestor/LancamentosTable";
import { getLancamentos, getVendedoras } from "@/lib/data";
import { hojeIso } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lançamentos · Almeida Closet" };

export default async function LancamentosGestor({
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

  const [lancamentos, vendedoras] = await Promise.all([
    getLancamentos({ desde, ate }),
    getVendedoras(),
  ]);

  return (
    <LancamentosTable
      lancamentos={lancamentos}
      vendedoras={vendedoras.map((v) => ({ id: v.id, nome: v.nome }))}
    />
  );
}
