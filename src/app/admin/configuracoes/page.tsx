import { Configuracoes } from "@/components/gestor/Configuracoes";
import { getCategorias, getConfig, getMetas, getVendedoras } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configurações · Almeida Closet" };

export default async function ConfiguracoesPage() {
  const [config, categorias, vendedoras, metas] = await Promise.all([
    getConfig(),
    getCategorias(),
    getVendedoras(),
    getMetas(),
  ]);

  const metaMap = new Map(metas.map((m) => [m.vendedora_id, m.valor]));

  return (
    <Configuracoes
      saldoInicial={config?.saldo_inicial_caixa ?? 0}
      saldoData={config?.saldo_inicial_data ?? null}
      vendedoras={vendedoras.map((v) => ({ id: v.id, nome: v.nome, meta: metaMap.get(v.id) ?? 0 }))}
      categorias={categorias}
    />
  );
}
