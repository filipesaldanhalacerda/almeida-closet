import { LancamentoForm } from "@/components/LancamentoForm";
import { getCategorias, getClientes } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Novo lançamento · Almeida Closet" };

export default async function NovoLancamentoVendedora({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const [categorias, clientes] = await Promise.all([getCategorias(), getClientes()]);

  return (
    <div className="animate-page-fade flex min-h-dvh flex-col">
      {/* O fluxo em etapas tem cabeçalho próprio (voltar + progresso). */}
      <LancamentoForm
        modo="vendedora"
        tipoPreset={searchParams.tipo}
        categorias={categorias.map((c) => ({ id: c.id, nome: c.nome, grupo: c.grupo_dre }))}
        clientes={clientes}
      />
    </div>
  );
}
