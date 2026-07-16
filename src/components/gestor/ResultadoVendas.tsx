"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { HBar } from "@/components/gestor/charts";
import { Spinner } from "@/components/ui/Spinner";
import type { ResultadoVendasModel } from "@/lib/calc/resultado";
import { MESES_ABBR } from "@/lib/constants";
import { brl, pct } from "@/lib/format";

export function ResultadoVendas({ model, ano, anos }: { model: ResultadoVendasModel; ano: number; anos: number[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const maxBar = Math.max(1, ...model.barras.map((b) => b.total));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex gap-1.5 rounded-[10px] bg-[#efece5] p-1 transition-opacity"
            style={{ opacity: pending ? 0.55 : 1 }}
          >
            {anos.map((y) => {
              const ativo = y === ano;
              return (
                <button
                  key={y}
                  disabled={pending}
                  onClick={() => startTransition(() => router.push(`/admin/resultado-de-vendas?ano=${y}`))}
                  className="h-[34px] rounded-[7px] px-4 text-[13px] font-bold"
                  style={{ background: ativo ? "#1a2130" : "transparent", color: ativo ? "#fff" : "#5a6273" }}
                >
                  {y}
                </button>
              );
            })}
          </div>
          {pending && <Spinner size={16} />}
        </div>
        <div className="flex flex-wrap gap-4">
          {model.vendedoras.map((v) => (
            <span key={v.id} className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-3">
              <span className="h-[11px] w-[11px] rounded-[3px]" style={{ background: v.cor }} />
              {v.nome}
            </span>
          ))}
        </div>
      </div>

      {/* Barras empilhadas por mês */}
      <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
        <span className="text-[15px] font-bold">Vendas mensais por vendedora</span>
        <div className="mt-4 overflow-x-auto">
        <div className="flex h-[190px] min-w-[480px] items-end justify-between gap-1.5">
          {model.barras.map((b) => (
            <div key={b.mes} className="flex flex-1 flex-col items-center gap-2.5">
              <div className="flex h-[150px] w-full max-w-[30px] flex-col-reverse overflow-hidden rounded-[5px]" title={brl(b.total)}>
                {b.segmentos.map((s) => (
                  <div key={s.id} style={{ background: s.cor, height: `${(s.valor / maxBar) * 150}px` }} />
                ))}
              </div>
              <span className="text-[11.5px] font-semibold text-muted">{MESES_ABBR[b.mes - 1]}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <span className="text-[15px] font-bold">Participação por vendedora</span>
          <div className="mt-4 flex flex-col gap-3.5">
            {model.vendedoras.length === 0 && <p className="text-sm text-muted">Sem vendas no ano.</p>}
            {model.vendedoras.map((v) => (
              <div key={v.id}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-bold">{v.nome}</span>
                  <span className="text-[13px] font-bold">
                    <b className="text-sm">{pct(v.pct, 0)}</b> · {brl(v.total)}
                  </span>
                </div>
                <HBar largura={v.pct} cor={v.cor} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
          <span className="text-[15px] font-bold">Vendas por modalidade</span>
          <div className="mt-4 flex flex-col gap-3.5">
            {model.modalidades.map((m) => (
              <div key={m.modalidade}>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[13px] font-bold">{m.label}</span>
                  <span className="text-[13px] font-bold">
                    <b className="text-sm">{pct(m.pct, 0)}</b> · {brl(m.valor)}
                  </span>
                </div>
                <HBar largura={m.pct} cor="#127c84" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
