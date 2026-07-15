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
      <PullToRefresh className="flex-1 overflow-y-auto px-5 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        {/* Cabeçalho, saudação + Sair claro */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-ink text-[16px] font-extrabold text-white">
              {iniciais(profile.nome)}
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[.16em] text-faint-2">
                Vendedora
              </div>
              <div className="truncate text-[22px] font-extrabold leading-tight tracking-[-.015em]">
                Olá, {primeiroNome}
              </div>
            </div>
          </div>
          <LogoutButton
            iconOnly={false}
            className="h-10 flex-none gap-1.5 rounded-full border border-line bg-white px-3.5 text-[13px] font-bold text-ink-3 shadow-card active:scale-[.97] active:border-[#eccec5] active:bg-desp-bg active:text-desp-fg"
          />
        </header>

        {/* Resumo do dia */}
        <div className="mt-5 rounded-[22px] border border-line bg-white p-5 shadow-card">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-faint">
            <Icon name="calendar" size={14} color="#8c867b" />
            {dataExtenso}
          </div>
          <div className="mt-3 text-[13px] font-semibold text-muted">Suas vendas de hoje</div>
          <div className="mt-0.5 text-[clamp(32px,11vw,44px)] font-extrabold tracking-[-.02em] tnum text-venda-fg">
            {brl(vendasHoje)}
          </div>
          <div className="mt-0.5 text-[13px] text-muted">
            {qtdHoje === 0
              ? "Nenhum lançamento registrado ainda hoje"
              : `${qtdHoje} ${qtdHoje === 1 ? "lançamento" : "lançamentos"} hoje`}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line-2 pt-3.5">
            <span className="text-[12.5px] font-semibold text-ink-3">Total do mês</span>
            <span className="text-[13.5px] font-extrabold tnum">
              {brl(vendasMes)}{" "}
              <span className="text-[12px] font-semibold text-faint">
                · {qtdVendasMes} {qtdVendasMes === 1 ? "venda" : "vendas"}
              </span>
            </span>
          </div>
        </div>

        {/* Ação principal */}
        <Link
          href="/app/lancamentos/novo"
          className="mt-4 flex h-[76px] w-full items-center gap-3.5 rounded-[18px] bg-ink px-[22px] text-left text-white shadow-primary transition-transform active:scale-[.99]"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[13px] bg-white/[.14]">
            <Icon name="plus" size={24} color="#fff" strokeWidth={2.3} />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[18px] font-bold">Novo lançamento</span>
            <span className="text-[13px] font-medium text-white/65">
              Venda · Recebimento · Despesa
            </span>
          </span>
          <Icon name="chevronRight" size={22} color="rgba(255,255,255,.55)" className="ml-auto flex-none" />
        </Link>

        {/* Lançamentos de hoje */}
        <div className="mx-0.5 mb-3 mt-7 flex items-baseline justify-between">
          <span className="text-base font-bold">Seus lançamentos de hoje</span>
          <span className="text-[13px] font-semibold text-muted">
            {qtdHoje === 0 ? "nenhum" : qtdHoje === 1 ? "1 item" : `${qtdHoje} itens`}
          </span>
        </div>

        {qtdHoje === 0 ? (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#ddd8cf] bg-white px-5 py-11 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#f2efe9] text-faint-3">
              <Icon name="list" size={24} />
            </div>
            <div className="mt-4 text-base font-bold">Nenhum lançamento hoje</div>
            <div className="mt-1.5 max-w-[240px] text-sm leading-[1.5] text-muted">
              Toque em “Novo lançamento” para registrar sua primeira venda do dia.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {deHoje.map((l) => (
              <LancamentoCard key={l.id} l={l} href={`/app/lancamentos/${l.id}/editar`} />
            ))}
          </div>
        )}
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
