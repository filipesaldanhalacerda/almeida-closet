import { StatCard } from "@/components/gestor/charts";
import { calcularFluxo } from "@/lib/calc/fluxo";
import { getConfig, getLancamentos } from "@/lib/data";
import { brl, hojeIso, isoParaBR, periodoLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fluxo de caixa · Almeida Closet" };

export default async function FluxoDeCaixaPage({
  searchParams,
}: {
  searchParams: { ano?: string; mes?: string };
}) {
  const [hy, hm] = hojeIso().split("-");
  const ano = Number(searchParams.ano) || Number(hy);
  const mes = Number(searchParams.mes) || Number(hm);

  const [lancamentos, config] = await Promise.all([getLancamentos({}), getConfig()]);
  const f = calcularFluxo(
    lancamentos,
    ano,
    mes,
    config?.saldo_inicial_caixa ?? 0,
    config?.saldo_inicial_data ?? null,
  );

  // pontos do gráfico de saldo final
  const serie = [f.saldoInicialMes, ...f.dias.map((d) => d.saldoFinal)];
  const min = Math.min(...serie, 0);
  const max = Math.max(...serie, 1);
  const range = max - min || 1;
  const W = 700;
  const H = 150;
  const coords = serie.map((v, i) => {
    const x = serie.length > 1 ? (i / (serie.length - 1)) * W : 0;
    const y = H - ((v - min) / range) * (H - 10) - 5;
    return [x, y] as const;
  });
  const pts = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPts = `0,${H} ${pts} ${W},${H}`;

  // menor saldo do mês (dia mais crítico)
  const pior = f.dias.reduce(
    (acc, d) => (d.saldoFinal < acc.valor ? { valor: d.saldoFinal, dia: d.diaIso } : acc),
    { valor: Infinity, dia: "" },
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Saldo inicial" valor={brl(f.saldoInicialMes)} />
        <StatCard titulo="Entradas no mês" valor={brl(f.entradas)} cor="#1f875c" />
        <StatCard titulo="Saídas no mês" valor={brl(f.saidas)} cor="#cb4a44" />
        <StatCard
          titulo="Saldo final"
          valor={brl(f.saldoFinal)}
          dark
          sub={
            pior.dia ? (
              <span style={{ color: pior.valor < 0 ? "#e6a993" : "rgba(255,255,255,.45)" }}>
                menor saldo: {brl(pior.valor)} em {isoParaBR(pior.dia)}
              </span>
            ) : undefined
          }
        />
      </div>

      <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[15px] font-bold">Evolução do saldo · {periodoLabel(ano, mes)}</span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <span className="h-2 w-2 rounded-full bg-receb-fg" />
            saldo acumulado
          </span>
        </div>
        {f.dias.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">Sem movimentações neste mês.</p>
        ) : (
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" className="block">
            <defs>
              <linearGradient id="fluxoArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#127c84" stopOpacity=".16" />
                <stop offset="100%" stopColor="#127c84" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={areaPts} fill="url(#fluxoArea)" />
            {min < 0 && (
              <line
                x1="0"
                x2={W}
                y1={H - ((0 - min) / range) * (H - 10) - 5}
                y2={H - ((0 - min) / range) * (H - 10) - 5}
                stroke="#eccec5"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            )}
            <polyline points={pts} fill="none" stroke="#127c84" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
       <div className="overflow-x-auto">
        <div className="min-w-[600px]">
        <div className="grid grid-cols-[90px_1fr_1fr_1fr_1fr] gap-3 border-b border-line-2 bg-panel px-5 py-3 text-[11.5px] font-bold uppercase tracking-[.04em] text-faint md:grid-cols-[110px_1fr_1fr_1fr_1fr]">
          <span>Dia</span>
          <span className="text-right">Entradas</span>
          <span className="text-right">Saídas</span>
          <span className="text-right">Saldo do dia</span>
          <span className="text-right">Saldo final</span>
        </div>
        {f.dias.length === 0 && <div className="p-8 text-center text-sm text-muted">Sem movimentações.</div>}
        {f.dias.map((d) => (
          <div
            key={d.diaIso}
            className="grid grid-cols-[90px_1fr_1fr_1fr_1fr] items-center gap-3 border-b border-[#f4f1ec] px-5 py-3 transition-colors last:border-0 hover:bg-panel md:grid-cols-[110px_1fr_1fr_1fr_1fr]"
            style={{ background: d.negativo ? "#fbf1ee" : undefined }}
          >
            <span className="text-[13px] font-bold">{d.dia}</span>
            <span className="text-right text-[13px] font-semibold text-venda-fg tnum">{d.entradas ? brl(d.entradas) : "—"}</span>
            <span className="text-right text-[13px] font-semibold text-desp-fg tnum">{d.saidas ? brl(d.saidas) : "—"}</span>
            <span className="text-right text-[13px] font-bold tnum" style={{ color: d.saldoDia < 0 ? "#cb4a44" : "#1a2130" }}>
              {brl(d.saldoDia)}
            </span>
            <span className="text-right text-[13.5px] font-extrabold tnum" style={{ color: d.saldoFinal < 0 ? "#cb4a44" : "#1a2130" }}>
              {brl(d.saldoFinal)}
            </span>
          </div>
        ))}
        </div>
       </div>
      </div>
    </div>
  );
}
