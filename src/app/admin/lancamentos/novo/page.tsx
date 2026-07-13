import { LancamentoForm } from "@/components/LancamentoForm";
import { getCategorias, getClientes, getVendedoras } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo lançamento — Almeida Closet" };

export default async function NovoLancamentoGestor() {
  const [categorias, vendedoras, clientes] = await Promise.all([
    getCategorias(),
    getVendedoras(),
    getClientes(),
  ]);

  return (
    <LancamentoForm
      modo="gestor"
      categorias={categorias.map((c) => ({ id: c.id, nome: c.nome, grupo: c.grupo_dre }))}
      vendedoras={vendedoras.map((v) => ({ id: v.id, nome: v.nome }))}
      clientes={clientes}
    />
  );
}
