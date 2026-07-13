import { LancamentoForm } from "@/components/LancamentoForm";
import { FormHeader } from "@/components/vendedora/FormHeader";
import { getCategorias, getClientes } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo lançamento — Almeida Closet" };

export default async function NovoLancamentoVendedora() {
  const [categorias, clientes] = await Promise.all([
    getCategorias(),
    getClientes(),
  ]);

  return (
    <div className="flex min-h-screen flex-col px-5 pt-2">
      <FormHeader titulo="Novo lançamento" />
      <LancamentoForm
        modo="vendedora"
        categorias={categorias.map((c) => ({ id: c.id, nome: c.nome }))}
        clientes={clientes}
      />
    </div>
  );
}
