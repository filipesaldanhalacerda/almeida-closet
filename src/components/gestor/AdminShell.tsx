"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { LogoutButton } from "@/components/LogoutButton";
import { iniciais, hojeIso } from "@/lib/format";
import { itemAtivo, NAV_GROUPS, tituloDaRota } from "./nav";
import { PeriodPicker } from "./PeriodPicker";

// Páginas que exibem o seletor de período (mês) na topbar.
const COM_PERIODO = ["/admin", "/admin/lancamentos", "/admin/fluxo-de-caixa", "/admin/equipe"];

export function AdminShell({
  nome,
  children,
}: {
  nome: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [drawer, setDrawer] = React.useState(false);

  const titulo = tituloDaRota(pathname);
  const hoje = hojeIso().split("-");
  const ano = Number(params.get("ano")) || Number(hoje[0]);
  const mes = Number(params.get("mes")) || Number(hoje[1]);
  const mostraPeriodo = COM_PERIODO.includes(pathname);

  React.useEffect(() => setDrawer(false), [pathname]);

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {NAV_GROUPS.map((grupo) => (
        <div key={grupo.titulo} className="flex flex-col gap-[3px]">
          <div className="px-3 pb-1 text-[10.5px] font-bold uppercase tracking-[.14em] text-faint">
            {grupo.titulo}
          </div>
          {grupo.itens.map((n) => {
            const ativo = itemAtivo(n, pathname);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={onNavigate}
                aria-current={ativo ? "page" : undefined}
                className={
                  "flex h-11 items-center gap-3 rounded-[10px] px-3 text-sm font-semibold transition-colors " +
                  (ativo
                    ? "bg-[#efece5] text-ink"
                    : "text-ink-3 hover:bg-[#f2efe9] hover:text-ink")
                }
              >
                <Icon name={n.icon} size={19} color={ativo ? "#1c1a17" : "#8a857c"} />
                <span>{n.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const Rodape = () => (
    <div className="mt-auto flex-none border-t border-line-2 pt-3">
      <div className="flex items-center gap-2.5 rounded-[12px] bg-[#f2efe9] px-2.5 py-2">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">
          {iniciais(nome)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-ink">{nome}</span>
          <span className="block text-[11.5px] font-semibold text-muted">Gestor</span>
        </span>
      </div>
      <LogoutButton
        iconOnly={false}
        className="mt-2 h-11 w-full justify-center rounded-[11px] border border-line bg-white text-[13.5px] font-bold transition-colors hover:border-[#eccec5] hover:bg-desp-bg hover:text-desp-fg active:scale-[.99]"
      />
    </div>
  );

  return (
    <div className="flex h-dvh bg-app">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 flex-none flex-col border-r border-line-2 bg-panel p-[22px_14px] px-3.5 py-5 md:flex">
        <div className="px-2.5 pb-5">
          <div className="text-[17px] font-extrabold tracking-[-.01em]">Almeida Closet</div>
          <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-faint">
            Gestão
          </div>
        </div>
        <NavList />
        <Rodape />
      </aside>

      {/* Drawer mobile */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-[rgba(20,18,15,.4)] animate-fadein" />
          <aside
            className="relative flex w-64 flex-col border-r border-line-2 bg-panel px-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 pb-5">
              <div className="text-[17px] font-extrabold tracking-[-.01em]">Almeida Closet</div>
              <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-[.14em] text-faint">
                Gestão
              </div>
            </div>
            <NavList onNavigate={() => setDrawer(false)} />
            <Rodape />
          </aside>
        </div>
      )}

      {/* Área principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[66px] flex-none items-center justify-between border-b border-line-2 bg-[#fbfaf8] px-4 pt-[env(safe-area-inset-top)] md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setDrawer(true)}
              aria-label="Abrir menu"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] border border-line bg-white transition-colors hover:bg-panel md:hidden"
            >
              <Icon name="list" size={20} />
            </button>
            <div className="truncate text-[18px] font-extrabold tracking-[-.01em] md:text-[20px]">{titulo}</div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {mostraPeriodo && <PeriodPicker ano={ano} mes={mes} />}
            <button
              onClick={() => router.push("/admin/lancamentos/novo")}
              className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-ink px-3 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[.98] md:px-4"
            >
              <Icon name="plus" size={16} color="#fff" strokeWidth={2.2} />
              <span className="hidden sm:inline">Novo lançamento</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-7 md:pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </div>
  );
}
