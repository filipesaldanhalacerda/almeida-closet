import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { LancamentoCard } from "@/components/LancamentoCard";
import { LogoutButton } from "@/components/LogoutButton";
import { BottomNav } from "@/components/vendedora/BottomNav";
import { getLancamentos, getSessionProfile } from "@/lib/data";
import { dataPorExtenso, hojeIso, iniciais } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Início — Almeida Closet" };

export default async function HomeVendedora() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const hoje = hojeIso();
  const todos = await getLancamentos({ desde: hoje, ate: hoje });
  // RLS já restringe aos próprios; reforço defensivo:
  const meus = todos.filter((l) => l.criado_por === profile.id);
  const qtd = meus.length;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-y-auto px-6 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="flex items-center justify-between pt-2.5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-ink text-[17px] font-extrabold text-white">
              {iniciais(profile.nome)[0]}
            </span>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[.14em] text-faint-2">
                Vendedora
              </div>
              <div className="mt-px text-[23px] font-extrabold tracking-[-.015em]">
                Olá, {profile.nome.split(" ")[0]}
              </div>
            </div>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white">
            <LogoutButton />
          </div>
        </div>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#e9e5dd] bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-3">
          <Icon name="calendar" size={16} color="#8a857c" />
          {dataPorExtenso(hoje)}
        </div>

        <Link
          href="/app/lancamentos/novo"
          className="mt-5 flex h-[76px] w-full items-center gap-3.5 rounded-[18px] bg-ink px-[22px] text-left text-white active:scale-[.99]"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-white/[.14]">
            <Icon name="plus" size={22} color="#fff" strokeWidth={2.2} />
          </span>
          <span className="flex flex-col">
            <span className="text-[18px] font-bold">Novo lançamento</span>
            <span className="text-[13px] font-medium text-white/60">
              Venda · Recebimento · Despesa
            </span>
          </span>
        </Link>

        <div className="mx-0.5 mb-3.5 mt-7 flex items-baseline justify-between">
          <span className="text-base font-bold">Seus lançamentos de hoje</span>
          <span className="text-[13px] font-semibold text-muted">
            {qtd === 0 ? "nenhum" : qtd === 1 ? "1 lançamento" : `${qtd} lançamentos`}
          </span>
        </div>

        {qtd === 0 ? (
          <div className="flex flex-col items-center rounded-[18px] border border-dashed border-[#ddd8cf] bg-white px-5 py-11 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#f2efe9] text-faint-3">
              <Icon name="list" size={24} />
            </div>
            <div className="mt-4 text-base font-bold">Nenhum lançamento hoje</div>
            <div className="mt-1.5 max-w-[220px] text-sm leading-[1.5] text-muted">
              Assim que você registrar uma venda, ela aparece aqui.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {meus.map((l) => (
              <LancamentoCard key={l.id} l={l} href={`/app/lancamentos/${l.id}/editar`} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
