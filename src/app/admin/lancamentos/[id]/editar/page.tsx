import { notFound } from "next/navigation";
import { LancamentoForm } from "@/components/LancamentoForm";
import { getCategorias, getClientes, getLancamentoById, getVendedoras } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar lançamento — Almeida Closet" };

export default async function EditarLancamentoGestor({ params }: { params: { id: string } }) {
  const [lanc, categorias, vendedoras, clientes] = await Promise.all([
    getLancamentoById(params.id),
    getCategorias(),
    getVendedoras(),
    getClientes(),
  ]);
  if (!lanc) notFound();

  return (
    <LancamentoForm
      modo="gestor"
      categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
      vendedoras={vendedoras.map((v) => ({ id: v.id, nome: v.nome }))}
      clientes={clientes}
      inicial={lanc}
    />
  );
}
