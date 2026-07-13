import { notFound, redirect } from "next/navigation";
import { LancamentoForm } from "@/components/LancamentoForm";
import { FormHeader } from "@/components/vendedora/FormHeader";
import { getCategorias, getClientes, getLancamentoById, getSessionProfile } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Editar lançamento — Almeida Closet" };

export default async function EditarLancamentoVendedora({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const [lanc, categorias, clientes] = await Promise.all([
    getLancamentoById(params.id),
    getCategorias(),
    getClientes(),
  ]);
  // RLS garante que a vendedora só carrega lançamentos dela
  if (!lanc) notFound();

  return (
    <div className="flex min-h-screen flex-col px-5 pt-2">
      <FormHeader titulo="Editar lançamento" />
      <LancamentoForm
        modo="vendedora"
        categorias={categorias.map((c) => ({ id: c.id, nome: c.nome, grupo: c.grupo_dre }))}
        clientes={clientes}
        inicial={lanc}
      />
    </div>
  );
}
