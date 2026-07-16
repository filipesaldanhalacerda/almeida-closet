import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LancamentoCard } from "@/components/LancamentoCard";
import { LogoutButton } from "@/components/LogoutButton";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { BottomNav } from "@/components/vendedora/BottomNav";
import { getLancamentos, getSessionProfile } from "@/lib/data";
import { anoMes, brl, dataPorExtenso, hojeIso, iniciais } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início · Almeida Closet" };

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

  const somaVendas = (arr: typeof doMes) =>
    arr.filter((l) => l.tipo === "venda").reduce((s, l) => s + l.valor, 0);
  const vendasHoje = somaVendas(deHoje);
  const vendasMes = somaVendas(doMes);
  const qtdVendasMes = doMes.filter((l) => l.tipo === "venda").length;
  const qtdHoje = deHoje.length;

  const primeiroNome = profile.nome.split(" ")[0];
  const dataExtenso = (() => {
    const d = dataPorExtenso(hoje);
    return d.charAt(0).toUpperCase() + d.slice(1);
  })();

  return (
    <div className="animate-page-fade flex min-h-dvh flex-col">
      <PullToRefresh className="flex-1 overflow-y-auto pb-[calc(8.5rem+env(safe-area-inset-bottom))]">
        {/* Hero navy: número do dia em destaque (serifa Fraunces) */}
        <div className="relative overflow-hidden rounded-b-[30px] bg-night px-5 pb-9 pt-[calc(env(safe-area-inset-top)+1.1rem)] text-white shadow-night">
          <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-12 top-20 h-40 w-40 rounded-full bg-white/[.06] blur-2xl" />

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
            <div className="mt-1.5 font-display text-[clamp(44px,15vw,60px)] font-black leading-[.9] tracking-[-.02em] tnum">
              {brl(vendasHoje)}
            </div>
            <div className="mt-2 text-[13px] font-medium text-white/55">
              {qtdHoje === 0
                ? "Nenhum lançamento registrado ainda hoje"
                : `${qtdHoje} ${qtdHoje === 1 ? "lançamento" : "lançamentos"} hoje`}
            </div>
          </div>

          <div className="relative mt-6 flex items-center gap-3 rounded-[16px] bg-white/[.08] px-4 py-3 ring-1 ring-white/[.08]">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/10">
              <Icon name="chart" size={17} color="#fff" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[.12em] text-white/45">
                Total do mês
              </div>
              <div className="text-[15px] font-bold tnum">
                {brl(vendasMes)}
                <span className="ml-1 text-[12.5px] font-medium text-white/45">
                  · {qtdVendasMes} {qtdVendasMes === 1 ? "venda" : "vendas"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Corpo marfim */}
        <div className="px-5">
          {/* Ação principal (coral) sobreposta ao hero */}
          <Link
            href="/app/lancamentos/novo"
            className="relative z-10 -mt-6 flex h-[70px] items-center gap-3.5 rounded-[20px] bg-accent px-5 text-white shadow-primary transition-transform active:scale-[.99]"
          >
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-white/20">
              <Icon name="plus" size={24} color="#fff" strokeWidth={2.3} />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[17px] font-bold">Novo lançamento</span>
              <span className="text-[12.5px] font-medium text-white/80">
                Venda · Recebimento · Despesa
              </span>
            </span>
            <Icon
              name="chevronRight"
              size={22}
              color="rgba(255,255,255,.65)"
              className="ml-auto flex-none"
            />
          </Link>

          <div className="mb-3 mt-7 flex items-baseline justify-between px-0.5">
            <span className="font-display text-[20px] font-semibold tracking-[-.01em]">Hoje</span>
            <span className="text-[12.5px] font-semibold text-muted">
              {qtdHoje === 0 ? "nenhum item" : qtdHoje === 1 ? "1 item" : `${qtdHoje} itens`}
            </span>
          </div>

          {qtdHoje === 0 ? (
            <div className="flex flex-col items-center rounded-[22px] border border-dashed border-[#dcd3c4] bg-white/60 px-5 py-11 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-accent-soft text-accent">
                <Icon name="tag" size={24} />
              </div>
              <div className="mt-4 font-display text-[17px] font-semibold">Nenhuma venda hoje</div>
              <div className="mt-1.5 max-w-[240px] text-sm leading-[1.5] text-muted">
                Toque em Novo lançamento para registrar a primeira do dia.
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
