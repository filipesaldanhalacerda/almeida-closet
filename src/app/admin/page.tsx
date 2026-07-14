import { Icon, iconeDoTipo } from "@/components/Icon";
import { DeltaBadge, HBar, Sparkline } from "@/components/gestor/charts";
import { RealtimeRefresh } from "@/components/gestor/RealtimeRefresh";
import { tituloLancamento } from "@/components/LancamentoCard";
import { calcularDashboard } from "@/lib/calc/dashboard";
import { corDoTipo } from "@/lib/constants";
import { getConfig, getLancamentos, getMetas, getVendedoras } from "@/lib/data";
import { brl, brlSinal, fmtInt, hojeIso, iniciais, isoParaBR, pct, periodoLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard · Almeida Closet" };

export default async function DashboardGestor({
  searchParams,
}: {
  searchParams: { ano?: string; mes?: string };
}) {
  const hoje = hojeIso();
  const [hy, hm] = hoje.split("-");
  const ano = Number(searchParams.ano) || Number(hy);
  const mes = Number(searchParams.mes) || Number(hm);

  const [lancamentos, config, metas, vendedoras] = await Promise.all([
    getLancamentos({}),
    getConfig(),
    getMetas(),
    getVendedoras(),
  ]);

  const d = calcularDashboard(lancamentos, ano, mes, {
    saldoInicialCaixa: config?.saldo_inicial_caixa ?? 0,
    saldoInicialData: config?.saldo_inicial_data ?? null,
    metas: metas.map((m) => ({ vendedora_id: m.vendedora_id, valor: m.valor })),
    vendedoras: vendedoras.map((v) => ({ id: v.id, nome: v.nome })),
    hoje,
    limiteRecentes: 6,
  });

  const maxBar = Math.max(1, ...d.serie6.flatMap((s) => [s.recebido, s.despesa]));

  const kpis = [
    { label: "Recebido no mês", hint: "o que entrou", value: brl(d.recebido), color: "#2f7d5b", bg: "#e7f1ec", icon: "banknote" as const, delta: d.delta.recebido, bom: d.delta.recebido >= 0 },
    { label: "Despesas", hint: "o que saiu", value: brl(d.despesas), color: "#b04a34", bg: "#f7e8e2", icon: "arrowOut" as const, delta: d.delta.despesas, bom: d.delta.despesas <= 0 },
    { label: "Vendas (volume)", hint: `${d.vendasCount} ${d.vendasCount === 1 ? "venda" : "vendas"}`, value: brl(d.vendasVolume), color: "#2b6f74", bg: "#e2eff0", icon: "tag" as const, delta: d.delta.vendas, bom: d.delta.vendas >= 0 },
    { label: "Ticket médio", hint: "por venda", value: brl(d.ticketMedio), color: "#42403b", bg: "#efece5", icon: "chart" as const, delta: d.delta.ticket, bom: d.delta.ticket >= 0 },
    { label: "Saldo de caixa", hint: "acumulado", value: brl(d.saldoCaixa), color: d.saldoCaixa < 0 ? "#b04a34" : "#1c1a17", bg: "#f2ece2", icon: "wallet" as const, delta: null, bom: true },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Resumo do dia (extra) */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[14px] border px-5 py-3.5 text-[13.5px] font-semibold"
        style={{
          borderColor: d.semLancamentosHoje ? "#eccec5" : "#dfe9df",
          background: d.semLancamentosHoje ? "#fbf1ee" : "#f0f6f1",
        }}
      >
        {d.semLancamentosHoje ? (
          <span className="flex items-center gap-2 text-desp-fg">
            <Icon name="alert" size={18} color="#b04a34" />
            Nenhum lançamento registrado ainda hoje.
          </span>
        ) : (
          <>
            <span className="flex items-center gap-2 text-ink-2">
              <Icon name="calendar" size={17} color="#2f7d5b" /> Hoje:
            </span>
            <span className="text-ink-2">
              <b>{d.resumoDia.vendas}</b> {d.resumoDia.vendas === 1 ? "venda" : "vendas"}
            </span>
            <span className="text-venda-fg">
              <b>{brl(d.resumoDia.recebido)}</b> recebidos
            </span>
            <span className="text-desp-fg">
              <b>{brl(d.resumoDia.despesas)}</b> em despesas
            </span>
          </>
        )}
      </div>

      {/* Hero resultado do mês */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-card px-6 py-6 text-white"
        style={{
          background:
            "radial-gradient(130% 180% at 88% -30%, #34302a 0%, #262320 45%, #1c1a17 100%)",
        }}
      >
        <div className="min-w-0">
          <div className="text-[13px] font-semibold tracking-[.03em] text-white/60">
            Resultado do mês · {periodoLabel(ano, mes)}
          </div>
          <div className="mt-1.5 text-[clamp(28px,8vw,42px)] font-extrabold tracking-[-.02em] tnum">{brl(d.resultado)}</div>
          <div className="mt-2 text-[13.5px] text-white/70">
            Entrou <b className="text-[#8fd6b4]">{brl(d.recebido)}</b> · Saiu{" "}
            <b className="text-[#e6a993]">{brl(d.despesas)}</b>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[.14em] text-white/45">
            Recebido · últimos 6 meses
          </span>
          <Sparkline values={d.serie6.map((s) => s.recebido)} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="min-w-0 rounded-card border border-line bg-white p-[18px] shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px]" style={{ background: k.bg }}>
                <Icon name={k.icon} size={18} color={k.color} />
              </span>
              {k.delta !== null && <DeltaBadge valor={k.delta} bom={k.bom} />}
            </div>
            <div className="mt-4 text-[19px] font-extrabold tracking-[-.015em] tnum sm:text-[23px]" style={{ color: k.color }}>
              {k.value}
            </div>
            <div className="mt-1 text-[13px] font-bold text-ink-2">{k.label}</div>
            <div className="text-xs text-faint">{k.hint}</div>
          </div>
        ))}
      </div>

      {/* Recebido × Despesa + Ranking */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[15px] font-bold">Recebido × Despesa</span>
            <span className="flex gap-3.5 text-xs font-semibold text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-venda-fg" />Recebido</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[#d99a86]" />Despesa</span>
            </span>
          </div>
          <div className="flex h-[184px] items-end justify-between pt-4">
            {d.serie6.map((s) => (
              <div key={`${s.ano}-${s.mes}`} className="flex flex-1 flex-col items-center gap-2.5">
                <div className="flex h-[150px] items-end gap-[3px] sm:gap-[5px]">
                  <div className="w-3 rounded-t-[4px] bg-venda-fg sm:w-4" style={{ height: `${(s.recebido / maxBar) * 150}px` }} title={brl(s.recebido)} />
                  <div className="w-3 rounded-t-[4px] bg-[#d99a86] sm:w-4" style={{ height: `${(s.despesa / maxBar) * 150}px` }} title={brl(s.despesa)} />
                </div>
                <span className="text-xs font-semibold text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <span className="text-[15px] font-bold">Vendas por vendedora</span>
          <div className="mt-4 flex flex-col gap-4">
            {d.ranking.length === 0 && <p className="text-sm text-muted">Sem vendas no período.</p>}
            {d.ranking.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[10px] bg-[#efece5] text-xs font-extrabold text-ink-2">
                  {iniciais(r.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13.5px] font-bold">{r.nome}</span>
                    <span className="text-[13.5px] font-extrabold tnum">{brl(r.valor)}</span>
                  </div>
                  <div className="mt-1.5">
                    <HBar largura={r.pctBarra} cor="#2b6f74" />
                  </div>
                  <div className="mt-1 text-[11.5px] text-faint">{r.qtd} {r.qtd === 1 ? "venda" : "vendas"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Receita por forma + Despesas por categoria */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BreakCard titulo="Receita por forma de pagamento" itens={d.receitaPorForma} cor="#2f7d5b" />
        <BreakCard titulo="Despesas por categoria" itens={d.despesasPorCategoria} cor="#b04a34" />
      </div>

      {/* Comparativo anual + Metas */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <span className="text-[15px] font-bold">Comparativo com {ano - 1}</span>
          <p className="mt-1 text-xs text-muted">{periodoLabel(ano, mes)} × {periodoLabel(ano - 1, mes)}</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <CompCell label="Recebido" atual={d.comparativoAno.atual.recebido} ant={d.comparativoAno.anterior.recebido} bomSeMaior />
            <CompCell label="Despesas" atual={d.comparativoAno.atual.despesas} ant={d.comparativoAno.anterior.despesas} bomSeMaior={false} />
            <CompCell label="Resultado" atual={d.comparativoAno.atual.resultado} ant={d.comparativoAno.anterior.resultado} bomSeMaior />
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <span className="text-[15px] font-bold">Metas de venda do mês</span>
          <div className="mt-4 flex flex-col gap-4">
            {d.metas.length === 0 && (
              <p className="text-sm text-muted">Defina metas em Configurações para acompanhar o progresso.</p>
            )}
            {d.metas.map((m) => (
              <div key={m.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-bold">{m.nome}</span>
                  <span className="text-[13px] font-semibold text-ink-3">
                    {brl(m.vendas)} {m.meta > 0 && <span className="text-faint">/ {brl(m.meta)}</span>}
                  </span>
                </div>
                <HBar largura={m.pct} cor={m.pctReal >= 100 ? "#2f7d5b" : "#8c6f52"} />
                <div className="mt-1 text-[11.5px] font-semibold" style={{ color: m.pctReal >= 100 ? "#2f7d5b" : "#a09a90" }}>
                  {m.meta > 0 ? `${pct(m.pctReal, 0)} da meta` : "sem meta definida"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top clientes + Últimos lançamentos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Icon name="trophy" size={18} color="#8c6f52" />
            <span className="text-[15px] font-bold">Top clientes do ano</span>
          </div>
          <div className="mt-3 flex flex-col">
            {d.topClientes.length === 0 && <p className="py-4 text-sm text-muted">Sem vendas no ano.</p>}
            {d.topClientes.map((c, i) => (
              <div key={c.nome} className="flex items-center gap-3 border-t border-[#f2efe9] py-2.5 first:border-0">
                <span className="w-5 text-[13px] font-extrabold text-faint">{i + 1}</span>
                <span className="flex-1 truncate text-[13.5px] font-semibold">{c.nome}</span>
                <span className="text-xs text-faint">{c.qtd}x</span>
                <span className="text-[13.5px] font-extrabold tnum">{brl(c.valor)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[15px] font-bold">Últimos lançamentos</span>
            <RealtimeRefresh />
          </div>
          <div className="flex flex-col">
            {d.recentes.map((e) => {
              const { titulo, sub } = tituloLancamento(e);
              const cor = corDoTipo(e.tipo);
              const saida = e.tipo === "despesa" || e.tipo === "devolucao_capital";
              return (
                <div key={e.id} className="flex items-center gap-3.5 border-t border-[#f2efe9] py-3 first:border-0">
                  <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px]" style={{ background: cor.bg }}>
                    <Icon name={iconeDoTipo(e.tipo)} size={18} color={cor.fg} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{titulo}</div>
                    <div className="truncate text-[12.5px] text-muted">
                      {sub} · {e.vendedora_nome || e.criado_por_nome || "—"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold tnum" style={{ color: cor.fg }}>
                      {brlSinal(e.valor, saida)}
                    </div>
                    <div className="text-[11.5px] text-faint-3">{isoParaBR(e.data)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakCard({ titulo, itens, cor }: { titulo: string; itens: { label: string; valor: number; pct: number }[]; cor: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
      <span className="text-[15px] font-bold">{titulo}</span>
      <div className="mt-4 flex flex-col gap-3">
        {itens.length === 0 && <p className="text-sm text-muted">Sem dados no período.</p>}
        {itens.map((x) => (
          <div key={x.label}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-ink-2">{x.label}</span>
              <span className="text-[13px] font-bold tnum">{brl(x.valor)}</span>
            </div>
            <HBar largura={x.pct} cor={cor} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CompCell({ label, atual, ant, bomSeMaior }: { label: string; atual: number; ant: number; bomSeMaior: boolean }) {
  const delta =
    ant === 0 ? (atual > 0 ? 100 : atual < 0 ? -100 : 0) : ((atual - ant) / Math.abs(ant)) * 100;
  const bom = bomSeMaior ? delta >= 0 : delta <= 0;
  return (
    <div className="min-w-0 rounded-[12px] bg-app p-2.5 sm:p-3">
      <div className="truncate text-[11px] font-bold uppercase tracking-[.05em] text-faint">{label}</div>
      <div className="mt-1 text-[13px] font-extrabold tnum sm:text-[15px]">{brl(atual)}</div>
      <div className="mt-0.5 text-[11.5px] font-semibold" style={{ color: bom ? "#2f7d5b" : "#b04a34" }}>
        {delta >= 0 ? "+" : "−"}
        {pct(Math.abs(delta), 0)}
      </div>
    </div>
  );
}
