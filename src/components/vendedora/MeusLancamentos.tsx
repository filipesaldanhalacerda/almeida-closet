"use client";

import Link from "next/link";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { LancamentoCard, tituloLancamento } from "@/components/LancamentoCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Spinner } from "@/components/ui/Spinner";
import { isoParaBR } from "@/lib/format";
import type { LancamentoView } from "@/lib/types";
import { BottomNav } from "./BottomNav";

const FILTROS = [
  { key: "todos", label: "Tudo" },
  { key: "venda", label: "Vendas" },
  { key: "recebimento", label: "Recebimentos" },
  { key: "despesa", label: "Despesas" },
];

export function MeusLancamentos({
  iniciais,
  pagina,
  temMaisInicial,
  hoje,
}: {
  iniciais: LancamentoView[];
  pagina: number;
  temMaisInicial: boolean;
  hoje: string;
}) {
  const [itens, setItens] = React.useState(iniciais);
  const [temMais, setTemMais] = React.useState(temMaisInicial);
  const [carregando, setCarregando] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [filtro, setFiltro] = React.useState("todos");

  // Ao recarregar do servidor (nova lista), volta para a primeira página.
  React.useEffect(() => {
    setItens(iniciais);
    setTemMais(temMaisInicial);
  }, [iniciais, temMaisInicial]);

  async function carregarMais() {
    if (carregando || !temMais) return;
    setCarregando(true);
    try {
      const res = await fetch(`/api/lancamentos?offset=${itens.length}&limite=${pagina}`);
      if (!res.ok) throw new Error();
      const d = await res.json();
      const novos: LancamentoView[] = d.lancamentos ?? [];
      setItens((atuais) => [...atuais, ...novos]);
      if (novos.length < pagina) setTemMais(false);
    } catch {
      // mantém o botão para o usuário tentar de novo
    } finally {
      setCarregando(false);
    }
  }

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return itens.filter((l) => {
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
  }, [itens, query, filtro]);

  const grupos = React.useMemo(() => {
    const mapa = new Map<string, LancamentoView[]>();
    for (const l of filtrados) {
      const dia = l.data.slice(0, 10);
      if (!mapa.has(dia)) mapa.set(dia, []);
      mapa.get(dia)!.push(l);
    }
    return [...mapa.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtrados]);

  const buscando = query.trim() !== "" || filtro !== "todos";

  return (
    <div className="animate-page-fade flex min-h-dvh flex-col">
      {/* Cabeçalho fixo: voltar + título + busca + filtros */}
      <div className="flex-none border-b border-line-2 bg-app px-5 pb-3 pt-[calc(env(safe-area-inset-top)+0.375rem)]">
        <div className="mb-3.5 flex items-center gap-2.5">
          <Link
            href="/app"
            aria-label="Voltar"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-line bg-white active:scale-95"
          >
            <Icon name="back" size={18} />
          </Link>
          <div className="min-w-0">
            <div className="truncate text-xl font-extrabold tracking-[-.01em]">Meus lançamentos</div>
            <div className="text-[12.5px] font-semibold text-muted">
              {itens.length}
              {temMais ? "+" : ""} {itens.length === 1 ? "lançamento" : "lançamentos"}
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center gap-2.5 rounded-[13px] border border-line bg-white px-3.5 focus-within:border-ink">
          <Icon name="search" size={20} color="#a09a90" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente ou categoria"
            className="flex-1 bg-transparent text-[15px] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpar busca"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-faint active:bg-app"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {FILTROS.map((f) => {
            const ativo = f.key === filtro;
            return (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className="h-9 flex-none rounded-full px-[15px] text-[13px] font-bold transition-colors active:scale-95"
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

      {/* Lista agrupada por dia, com cabeçalho de dia fixo ao rolar */}
      <PullToRefresh className="flex-1 overflow-y-auto px-5 pb-[calc(8rem+env(safe-area-inset-bottom))] pt-2">
        {grupos.length > 0 && (
          <p className="mb-2 flex items-center gap-1.5 px-0.5 text-[12px] font-medium text-faint">
            <Icon name="edit" size={13} /> Toque em um lançamento para editar
          </p>
        )}
        {grupos.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-[18px] border border-dashed border-[#ddd8cf] bg-white px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#f2efe9] text-faint-3">
              <Icon name={buscando ? "search" : "list"} size={24} />
            </div>
            <div className="mt-4 text-base font-bold">
              {buscando ? "Nada encontrado" : "Nenhum lançamento ainda"}
            </div>
            <div className="mt-1.5 max-w-[240px] text-sm leading-[1.5] text-muted">
              {buscando
                ? temMais
                  ? "Nada nos itens carregados. Carregue mais para buscar nos mais antigos."
                  : "Tente outro filtro ou termo de busca."
                : "Seus lançamentos vão aparecer aqui conforme você registra."}
            </div>
          </div>
        ) : (
          grupos.map(([dia, itensDia]) => {
            const ehHoje = dia === hoje.slice(0, 10);
            return (
              <div key={dia} className="mb-1">
                <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-app/90 px-5 py-2 backdrop-blur">
                  <span className="text-[12.5px] font-bold uppercase tracking-[.06em] text-faint">
                    {ehHoje && <span className="text-ink">Hoje · </span>}
                    {isoParaBR(dia)}
                  </span>
                  <span className="text-[12px] font-semibold text-faint-2">
                    {itensDia.length} {itensDia.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5 pb-4 pt-1">
                  {itensDia.map((l) => (
                    <LancamentoCard key={l.id} l={l} href={`/app/lancamentos/${l.id}/editar`} />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {temMais && (
          <button
            type="button"
            onClick={carregarMais}
            disabled={carregando}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-line bg-white text-[14px] font-bold text-ink-2 transition-colors active:bg-app disabled:opacity-60"
          >
            {carregando && <Spinner size={16} />}
            {carregando ? "Carregando…" : "Carregar mais"}
          </button>
        )}
      </PullToRefresh>

      <BottomNav />
    </div>
  );
}
