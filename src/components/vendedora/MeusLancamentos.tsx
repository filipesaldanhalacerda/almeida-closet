"use client";

import Link from "next/link";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { LancamentoCard, tituloLancamento } from "@/components/LancamentoCard";
import { isoParaBR } from "@/lib/format";
import type { LancamentoView } from "@/lib/types";
import { BottomNav } from "./BottomNav";

const FILTROS = [
  { key: "todos", label: "Tudo" },
  { key: "venda", label: "Vendas" },
  { key: "recebimento", label: "Recebimentos" },
  { key: "despesa", label: "Despesas" },
];

export function MeusLancamentos({ lancamentos, hoje }: { lancamentos: LancamentoView[]; hoje: string }) {
  const [query, setQuery] = React.useState("");
  const [filtro, setFiltro] = React.useState("todos");

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return lancamentos.filter((l) => {
      if (filtro !== "todos" && l.tipo !== filtro) return false;
      if (!q) return true;
      const { titulo, sub } = tituloLancamento(l);
      return (
        titulo.toLowerCase().includes(q) ||
        sub.toLowerCase().includes(q) ||
        (l.credor || "").toLowerCase().includes(q) ||
        (l.categoria_nome || "").toLowerCase().includes(q)
      );
    });
  }, [lancamentos, query, filtro]);

  const grupos = React.useMemo(() => {
    const mapa = new Map<string, LancamentoView[]>();
    for (const l of filtrados) {
      const dia = l.data.slice(0, 10);
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(l);
    }
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtrados]);

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-none px-6 pb-2.5 pt-[calc(env(safe-area-inset-top)+0.375rem)]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <Link
            href="/app"
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white"
          >
            <Icon name="back" size={18} />
          </Link>
          <span className="text-xl font-extrabold tracking-[-.01em]">Meus lançamentos</span>
        </div>

        <div className="flex h-12 items-center gap-2.5 rounded-[12px] border border-line bg-white px-3.5">
          <Icon name="search" size={20} color="#a09a90" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente ou categoria"
            className="flex-1 bg-transparent text-[15px] outline-none"
          />
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {FILTROS.map((f) => {
            const ativo = f.key === filtro;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className="h-9 flex-none rounded-full px-[15px] text-[13px] font-bold transition-colors"
                style={{
                  border: `1px solid ${ativo ? "#1c1a17" : "#e3dfd8"}`,
                  background: ativo ? "#1c1a17" : "#fff",
                  color: ativo ? "#fff" : "#42403b",
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-2">
        {grupos.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#f2efe9] text-faint-3">
              <Icon name="search" size={24} />
            </div>
            <div className="mt-4 text-base font-bold">Nada encontrado</div>
            <div className="mt-1.5 text-sm text-muted">Tente outro filtro ou busca.</div>
          </div>
        ) : (
          grupos.map(([dia, itens]) => (
            <div key={dia} className="mb-5">
              <div className="mx-0.5 mb-2.5 text-[12.5px] font-bold uppercase tracking-[.06em] text-faint">
                {dia === hoje.slice(0, 10) ? "Hoje · " : ""}
                {isoParaBR(dia)}
              </div>
              <div className="flex flex-col gap-2.5">
                {itens.map((l) => (
                  <LancamentoCard key={l.id} l={l} href={`/app/lancamentos/${l.id}/editar`} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
