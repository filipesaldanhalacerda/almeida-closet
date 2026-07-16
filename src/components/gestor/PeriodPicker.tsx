"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { MESES_ABBR } from "@/lib/constants";
import { anoMes, hojeIso, periodoLabel } from "@/lib/format";

// Seletor de período (mês/ano) na topbar. Grava ?ano&mes na URL.
// Setas para passos rápidos + popover com grade de meses e navegação de ano.
export function PeriodPicker({ ano, mes }: { ano: number; mes: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = React.useTransition();
  const [aberto, setAberto] = React.useState(false);
  const [anoVista, setAnoVista] = React.useState(ano);

  const hoje = anoMes(hojeIso());

  function irPara(a: number, m: number) {
    setAberto(false);
    const p = new URLSearchParams(params.toString());
    p.set("ano", String(a));
    p.set("mes", String(m));
    // useTransition mantém isPending=true enquanto a nova página carrega.
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }

  function passo(delta: number) {
    let m = mes + delta;
    let a = ano;
    if (m < 1) {
      m = 12;
      a -= 1;
    } else if (m > 12) {
      m = 1;
      a += 1;
    }
    irPara(a, m);
  }

  function abrir() {
    setAnoVista(ano);
    setAberto((v) => !v);
  }

  return (
    <div className="relative">
      <div className="flex h-[38px] items-center rounded-[10px] border border-line bg-white text-[13.5px] font-semibold text-ink-2">
        <button
          onClick={() => passo(-1)}
          disabled={pending}
          aria-label="Mês anterior"
          className="flex h-full items-center rounded-l-[10px] px-2 text-ink-3 transition-colors hover:bg-panel hover:text-ink disabled:opacity-40"
        >
          <Icon name="chevronRight" size={16} className="rotate-180" />
        </button>
        <button
          onClick={abrir}
          aria-label="Escolher mês e ano"
          className="flex h-full items-center gap-1.5 border-x border-line px-2.5 transition-colors hover:bg-panel sm:px-3"
        >
          {pending ? (
            <Spinner size={14} />
          ) : (
            <Icon name="calendar" size={15} color="#727a88" className="hidden sm:block" />
          )}
          <span className="sm:hidden">
            {MESES_ABBR[mes - 1]} {ano}
          </span>
          <span className="hidden sm:inline">{periodoLabel(ano, mes)}</span>
          <Icon name="chevronDown" size={15} color="#727a88" />
        </button>
        <button
          onClick={() => passo(1)}
          disabled={pending}
          aria-label="Próximo mês"
          className="flex h-full items-center rounded-r-[10px] px-2 text-ink-3 transition-colors hover:bg-panel hover:text-ink disabled:opacity-40"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>

      {aberto && (
        <>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 top-[46px] z-50 w-[268px] rounded-[14px] border border-line bg-white p-3 shadow-[0_18px_40px_-14px_rgba(28,26,23,.3)]">
            {/* Navegação de ano */}
            <div className="mb-2.5 flex items-center justify-between">
              <button
                onClick={() => setAnoVista((y) => y - 1)}
                aria-label="Ano anterior"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-ink-3 transition-colors hover:bg-panel hover:text-ink"
              >
                <Icon name="chevronRight" size={16} className="rotate-180" />
              </button>
              <span className="text-[15px] font-extrabold tnum">{anoVista}</span>
              <button
                onClick={() => setAnoVista((y) => y + 1)}
                aria-label="Próximo ano"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-ink-3 transition-colors hover:bg-panel hover:text-ink"
              >
                <Icon name="chevronRight" size={16} />
              </button>
            </div>

            {/* Grade de meses */}
            <div className="grid grid-cols-3 gap-1.5">
              {MESES_ABBR.map((label, i) => {
                const m = i + 1;
                const selecionado = anoVista === ano && m === mes;
                const ehHoje = anoVista === hoje.ano && m === hoje.mes;
                return (
                  <button
                    key={label}
                    onClick={() => irPara(anoVista, m)}
                    className="h-9 rounded-[9px] text-[13px] font-bold transition-colors"
                    style={{
                      background: selecionado ? "#1a2130" : ehHoje ? "#efece5" : "transparent",
                      color: selecionado ? "#fff" : "#3a4354",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Atalho para o mês atual */}
            <button
              onClick={() => irPara(hoje.ano, hoje.mes)}
              className="mt-2.5 h-9 w-full rounded-[9px] border border-line bg-panel text-[12.5px] font-bold text-ink-2 transition-colors hover:bg-[#f0ede6]"
            >
              Ir para o mês atual
            </button>
          </div>
        </>
      )}
    </div>
  );
}
