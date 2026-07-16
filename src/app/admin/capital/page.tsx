import { StatCard } from "@/components/gestor/charts";
import { calcularCapital, type CapitalItem } from "@/lib/calc/capital";
import { getLancamentos } from "@/lib/data";
import { brl, isoParaBR } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Capital · Almeida Closet" };

export default async function CapitalPage() {
  // Só os tipos de capital (fração mínima dos lançamentos), não a tabela toda.
  const lancamentos = await getLancamentos({ tipos: ["investimento", "devolucao_capital"] });
  const c = calcularCapital(lancamentos);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
        <StatCard titulo="Total de aportes" valor={brl(c.totalAportes)} cor="#1f875c" />
        <StatCard titulo="Total de devoluções" valor={brl(c.totalDevolucoes)} cor="#cb4a44" />
        <StatCard titulo="Capital líquido investido" valor={brl(c.liquido)} dark />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ListaCapital titulo="Investimento (aportes)" cor="#1f875c" itens={c.aportes} />
        <ListaCapital titulo="Devolução de capital (retiradas)" cor="#cb4a44" itens={c.devolucoes} />
      </div>
    </div>
  );
}

function ListaCapital({ titulo, cor, itens }: { titulo: string; cor: string; itens: CapitalItem[] }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
      <div className="px-5 pb-3 pt-4 text-xs font-bold uppercase tracking-[.08em]" style={{ color: cor }}>
        {titulo}
      </div>
      <div className="overflow-x-auto">
       <div className="min-w-[480px]">
      <div className="grid grid-cols-[1fr_82px_96px_100px] gap-2 px-5 pb-2.5 text-[11px] font-bold uppercase text-faint">
        <span>Descrição</span>
        <span>Data</span>
        <span className="text-right">Valor</span>
        <span className="text-right">Acumulado</span>
      </div>
      {itens.length === 0 && <div className="px-5 py-6 text-sm text-muted">Nenhum lançamento.</div>}
      {itens.map((x) => (
        <div key={x.id} className="grid grid-cols-[1fr_82px_96px_100px] items-center gap-2 border-t border-[#f4f1ec] px-5 py-2.5 transition-colors hover:bg-panel">
          <span className="truncate text-[13px] font-semibold">{x.desc}</span>
          <span className="text-[12.5px] text-muted">{isoParaBR(x.data)}</span>
          <span className="text-right text-[13px] font-bold tnum" style={{ color: cor }}>{brl(x.valor)}</span>
          <span className="text-right text-[13px] font-extrabold tnum">{brl(x.acumulado)}</span>
        </div>
      ))}
       </div>
      </div>
    </div>
  );
}

