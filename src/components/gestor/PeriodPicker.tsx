"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { MESES_ABBR } from "@/lib/constants";
import { periodoLabel } from "@/lib/format";

// Seletor de período (mês) na topbar. Grava ?ano&mes na URL.
export function PeriodPicker({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();

  function ir(deltaMes: number) {
    let m = mes + deltaMes;
    let a = ano;
    if (m < 1) {
      m = 12;
      a -= 1;
    } else if (m > 12) {
      m = 1;
      a += 1;
    }
    const p = new URLSearchParams(params.toString());
    p.set("ano", String(a));
    p.set("mes", String(m));
    // useTransition mantém isPending=true enquanto a nova página carrega:
    // feedback imediato de "carregando" mesmo sem trocar de rota.
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  return (
    <div className="flex h-[38px] items-center gap-1 rounded-[10px] border border-line bg-white px-1.5 text-[13.5px] font-semibold text-ink-2 sm:gap-2 sm:px-2">
      <button
        onClick={() => ir(-1)}
        disabled={pending}
        aria-label="Mês anterior"
        className="rounded-md px-1.5 text-ink-3 transition-colors hover:bg-panel hover:text-ink disabled:opacity-40"
      >
        ‹
      </button>
      <span className="flex items-center gap-2">
        {pending ? (
          <Spinner size={15} />
        ) : (
          <Icon name="calendar" size={16} color="#8a857c" className="hidden sm:block" />
        )}
        {/* rótulo curto no celular, completo no desktop */}
        <span className="sm:hidden">
          {MESES_ABBR[mes - 1]} {ano}
        </span>
        <span className="hidden sm:inline">{periodoLabel(ano, mes)}</span>
      </span>
      <button
        onClick={() => ir(1)}
        disabled={pending}
        aria-label="Próximo mês"
        className="rounded-md px-1.5 text-ink-3 transition-colors hover:bg-panel hover:text-ink disabled:opacity-40"
      >
        ›
      </button>
    </div>
  );
}
