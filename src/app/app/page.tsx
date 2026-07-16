import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { LancamentoCard } from "@/components/LancamentoCard";
import { LogoutButton } from "@/components/LogoutButton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { BottomNav } from "@/components/vendedora/BottomNav";
import { getLancamentos, getSessionProfile } from "@/lib/data";
import { anoMes, brl, dataPorExtenso, hojeIso, iniciais } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início · Almeida Closet" };

// Atalhos de criação (grade de ações). Deep-link com o tipo pré-selecionado.
const ACOES: { tipo: string; label: string; icon: IconName; fg: string; bg: string }[] = [
  { tipo: "venda", label: "Venda", icon: "tag", fg: "#1f875c", bg: "#e5f1ea" },
  { tipo: "recebimento", label: "Recebimento", icon: "banknote", fg: "#127c84", bg: "#ddeff0" },
  { tipo: "despesa", label: "Despesa", icon: "arrowOut", fg: "#cb4a44", bg: "#fae7e3" },
];

export default async function HomeVendedora() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const hoje = hojeIso();
  const { ano, mes } = anoMes(hoje);
  const inicioMes = `${ano}-${String(mes).padStart(2, "0")}-01`;

  // Um único fetch do mês; a RLS já restringe aos lançamentos da própria vendedora.
  const doMes = (await getLancamentos({ desde: inicioMes, ate: hoje })).filter(
    (l) => l.criado_por === profile.id,
  );
  const deHoje = doMes.filter((l) => l.data.slice(0, 10) === hoje);

  const soma = (arr: typeof doMes, tipo: string) =>
    arr.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.valor, 0);
  const vendasHoje = soma(deHoje, "venda");
  const vendasMes = soma(doMes, "venda");
  const recebidoHoje = soma(deHoje, "recebimento");
  const qtdVendasMes = doMes.filter((l) => l.tipo === "venda").length;
  const qtdHoje = deHoje.length;
  const ticket = qtdVendasMes > 0 ? Math.round(vendasMes / qtdVendasMes) : 0;

  const primeiroNome = profile.nome.split(" ")[0];
  const dataExtenso = (() => {
    const d = dataPorExtenso(hoje);
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  const stats: { label: string; valor: string; icon: IconName; cor: string }[] = [
    { label: "Este mês", valor: brl(vendasMes), icon: "chart", cor: "#127c84" },
    { label: "Ticket médio", valor: brl(ticket), icon: "banknote", cor: "#96683a" },
    { label: "Recebido hoje", valor: brl(recebidoHoje), icon: "wallet", cor: "#1f875c" },
    { label: "Vendas no mês", valor: String(qtdVendasMes), icon: "trophy", cor: "#e8674c" },
  ];

  return (
    <div className="animate-page-fade flex min-h-dvh flex-col">
      <PullToRefresh className="flex-1 overflow-y-auto pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        {/* Hero navy: saudação + total do dia gigante (serifa) */}
        <div className="relative overflow-hidden rounded-b-[34px] bg-night px-5 pb-12 pt-[calc(env(safe-area-inset-top)+1.1rem)] text-white shadow-night">
          <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 top-24 h-40 w-40 rounded-full bg-white/[.06] blur-2xl" />

          <header className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-white/[.12] text-[15px] font-extrabold ring-1 ring-white/15">
                {iniciais(profile.nome)}
              </span>
              <div className="min-w-0">
                <div className="truncate text-[11px] font-bold uppercase tracking-[.16em] text-white/45">
                  {dataExtenso}
                </div>
                <div className="truncate text-[18px] font-bold tracking-[-.01em]">
                  Olá, {primeiroNome}
                </div>
              </div>
            </div>
            <LogoutButton
              iconOnly
              className="h-10 w-10 flex-none justify-center rounded-full bg-white/[.1] !text-white/85 ring-1 ring-white/[.12] active:scale-95"
            />
          </header>

          <div className="relative mt-8">
            <div className="text-[12px] font-semibold uppercase tracking-[.16em] text-white/50">
              Vendas de hoje
            </div>
            <div className="mt-1.5 font-display text-[clamp(46px,15vw,62px)] font-black leading-[.9] tracking-[-.02em] tnum">
              {brl(vendasHoje)}
            </div>
            <div className="mt-2 text-[13px] font-medium text-white/55">
              {qtdHoje === 0
                ? "Nenhum lançamento registrado ainda hoje"
                : `${qtdHoje} ${qtdHoje === 1 ? "lançamento" : "lançamentos"} hoje`}
            </div>
          </div>
        </div>

        {/* Carrossel de métricas, sobreposto ao hero (estilo iFood) */}
        <div className="no-scrollbar -mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 pt-1">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex min-w-[43%] snap-start flex-col gap-3 rounded-[18px] border border-line bg-white p-3.5 shadow-card xs:min-w-[38%]"
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-[11px]"
                style={{ background: `${s.cor}1a` }}
              >
                <Icon name={s.icon} size={17} color={s.cor} />
              </span>
              <div>
                <div className="text-[11.5px] font-semibold text-muted">{s.label}</div>
                <div className="mt-0.5 font-display text-[19px] font-bold leading-none tnum">
                  {s.valor}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ações rápidas */}
        <div className="mt-6 px-5">
          <div className="mb-3 px-0.5 font-display text-[17px] font-semibold tracking-[-.01em]">
            O que você quer registrar?
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ACOES.map((a) => (
              <Link
                key={a.tipo}
                href={`/app/lancamentos/novo?tipo=${a.tipo}`}
                className="flex flex-col items-center gap-2.5 rounded-[18px] border border-line bg-white px-2 py-4 shadow-card transition-transform active:scale-[.97]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-[15px]"
                  style={{ background: a.bg }}
                >
                  <Icon name={a.icon} size={22} color={a.fg} />
                </span>
                <span className="text-[12.5px] font-bold text-ink-2">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Atividade de hoje */}
        <div className="mt-7 px-5">
          <div className="mb-3 flex items-baseline justify-between px-0.5">
            <span className="font-display text-[20px] font-semibold tracking-[-.01em]">Hoje</span>
            <Link href="/app/lancamentos" className="text-[12.5px] font-bold text-accent active:opacity-70">
              Ver tudo
            </Link>
          </div>

          {qtdHoje === 0 ? (
            <div className="flex flex-col items-center rounded-[22px] border border-dashed border-[#dcd3c4] bg-white/60 px-5 py-11 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-accent-soft text-accent">
                <Icon name="tag" size={24} />
              </div>
              <div className="mt-4 font-display text-[17px] font-semibold">Nenhum registro hoje</div>
              <div className="mt-1.5 max-w-[240px] text-sm leading-[1.5] text-muted">
                Use os atalhos acima para registrar a primeira do dia.
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {deHoje.map((l) => (
                <LancamentoCard key={l.id} l={l} href={`/app/lancamentos/${l.id}/editar`} />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
