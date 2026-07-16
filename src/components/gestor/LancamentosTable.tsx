"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon, iconeDoTipo } from "@/components/Icon";
import { tituloLancamento } from "@/components/LancamentoCard";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { corDoTipo, MODALIDADE_LABEL, TIPO_LABEL } from "@/lib/constants";
import { brl, brlSinal, isoParaBR } from "@/lib/format";
import type { LancamentoView } from "@/lib/types";

export function LancamentosTable({
  lancamentos,
  vendedoras,
}: {
  lancamentos: LancamentoView[];
  vendedoras: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [seller, setSeller] = React.useState("all");
  const [tipo, setTipo] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [excluir, setExcluir] = React.useState<LancamentoView | null>(null);
  const [excluindo, setExcluindo] = React.useState(false);

  const filtrados = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return lancamentos.filter((l) => {
      if (tipo !== "all") {
        if (tipo === "capital") {
          if (l.tipo !== "investimento" && l.tipo !== "devolucao_capital") return false;
        } else if (l.tipo !== tipo) return false;
      }
      if (seller !== "all") {
        const id = l.vendedora_id || l.criado_por;
        if (id !== seller) return false;
      }
      if (!q) return true;
      const { titulo, sub } = tituloLancamento(l);
      return (
        titulo.toLowerCase().includes(q) ||
        sub.toLowerCase().includes(q) ||
        (l.credor || "").toLowerCase().includes(q) ||
        (l.categoria_nome || "").toLowerCase().includes(q)
      );
    });
  }, [lancamentos, seller, tipo, query]);

  // Totais do conjunto filtrado (resumo no rodapé)
  const totais = React.useMemo(() => {
    let vendas = 0;
    let recebimentos = 0;
    let despesas = 0;
    for (const l of filtrados) {
      if (l.tipo === "venda") vendas += l.valor;
      else if (l.tipo === "recebimento") recebimentos += l.valor;
      else if (l.tipo === "despesa") despesas += l.valor;
    }
    return { vendas, recebimentos, despesas };
  }, [filtrados]);

  async function confirmaExcluir() {
    if (!excluir) return;
    setExcluindo(true);
    try {
      const res = await fetch(`/api/lancamentos/${excluir.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        toast(d.erro || "Erro ao excluir", "erro");
      } else {
        toast("Lançamento excluído");
        router.refresh();
      }
    } catch {
      toast("Sem conexão", "erro");
    } finally {
      setExcluindo(false);
      setExcluir(null);
    }
  }

  const selectCls =
    "select-reset h-10 rounded-[10px] border border-input-border bg-white px-3 pr-8 text-[13.5px] font-semibold text-ink-2";

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2.5">
        <select value={seller} onChange={(e) => setSeller(e.target.value)} className={selectCls}>
          <option value="all">Todas as vendedoras</option>
          {vendedoras.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
            </option>
          ))}
        </select>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={selectCls}>
          <option value="all">Todos os tipos</option>
          <option value="venda">Vendas</option>
          <option value="recebimento">Recebimentos</option>
          <option value="despesa">Despesas</option>
          <option value="capital">Capital</option>
        </select>
        <div className="flex h-10 min-w-[200px] flex-1 items-center gap-2.5 rounded-[10px] border border-input-border bg-white px-3">
          <Icon name="search" size={18} color="#8c867b" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente, categoria ou credor"
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Tabela (desktop) */}
      <div className="hidden overflow-hidden rounded-[14px] border border-line bg-white shadow-card md:block">
        <div className="grid grid-cols-[96px_130px_116px_1fr_108px_128px_76px] gap-3 border-b border-line-2 bg-panel px-5 py-3 text-[11.5px] font-bold uppercase tracking-[.05em] text-faint">
          <span>Data</span>
          <span>Vendedora</span>
          <span>Tipo</span>
          <span>Descrição</span>
          <span>Modalidade</span>
          <span className="text-right">Valor</span>
          <span className="text-right">Ações</span>
        </div>
        {filtrados.length === 0 && (
          <div className="p-11 text-center text-sm text-muted">Nenhum lançamento com esses filtros.</div>
        )}
        {filtrados.map((l) => {
          const { titulo, sub } = tituloLancamento(l);
          const cor = corDoTipo(l.tipo);
          const saida = l.tipo === "despesa" || l.tipo === "devolucao_capital";
          return (
            <div
              key={l.id}
              onClick={() => router.push(`/admin/lancamentos/${l.id}/editar`)}
              className="grid cursor-pointer grid-cols-[96px_130px_116px_1fr_108px_128px_76px] items-center gap-3 border-b border-[#f2efe9] px-5 py-3 transition-colors hover:bg-panel"
            >
              <span className="text-[13px] font-semibold text-ink-3">{isoParaBR(l.data)}</span>
              <span className="truncate text-[13px] font-semibold">{l.vendedora_nome || l.criado_por_nome || "—"}</span>
              <span>
                <span className="inline-block rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: cor.bg, color: cor.fg }}>
                  {TIPO_LABEL[l.tipo]}
                </span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-bold">{titulo}</span>
                <span className="block truncate text-xs text-muted">{sub}</span>
              </span>
              <span className="text-[12.5px] text-ink-3">{l.modalidade ? MODALIDADE_LABEL[l.modalidade] : "—"}</span>
              <span className="text-right text-[13.5px] font-extrabold tnum" style={{ color: cor.fg }}>
                {brlSinal(l.valor, saida)}
              </span>
              <span className="flex justify-end gap-1.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/lancamentos/${l.id}/editar`);
                  }}
                  aria-label="Editar"
                  title="Editar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white transition-colors hover:bg-[#f2efe9] active:bg-[#f2efe9]"
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExcluir(l);
                  }}
                  aria-label="Excluir"
                  title="Excluir"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#eccec5] bg-white transition-colors hover:bg-[#fbf1ee] active:bg-[#fbf1ee]"
                >
                  <Icon name="trash" size={15} color="#b04a34" />
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/* Cards (mobile) */}
      {filtrados.length > 0 && (
        <p className="-mt-1 flex items-center gap-1.5 px-1 text-[12px] font-medium text-faint md:hidden">
          <Icon name="edit" size={13} /> Toque em um lançamento para editar
        </p>
      )}
      <div className="flex flex-col gap-2.5 md:hidden">
        {filtrados.length === 0 && (
          <div className="rounded-[14px] border border-line bg-white p-8 text-center text-sm text-muted">
            Nenhum lançamento com esses filtros.
          </div>
        )}
        {filtrados.map((l) => {
          const { titulo, sub } = tituloLancamento(l);
          const cor = corDoTipo(l.tipo);
          const saida = l.tipo === "despesa" || l.tipo === "devolucao_capital";
          return (
            <div
              key={l.id}
              onClick={() => router.push(`/admin/lancamentos/${l.id}/editar`)}
              className="flex cursor-pointer items-center gap-3 rounded-[15px] border border-line bg-white p-3.5 shadow-card transition-colors active:bg-[#faf9f6]"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px]" style={{ background: cor.bg }}>
                <Icon name={iconeDoTipo(l.tipo)} size={18} color={cor.fg} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{titulo}</div>
                <div className="truncate text-xs text-muted">{sub} · {l.vendedora_nome || l.criado_por_nome || "—"}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold tnum" style={{ color: cor.fg }}>{brlSinal(l.valor, saida)}</div>
                <div className="text-[11px] text-faint-3">{isoParaBR(l.data)}</div>
              </div>
              {/* Seta indica que o card abre a edição ao tocar. */}
              <Icon name="chevronRight" size={17} color="#cbc6bd" className="-mx-1 flex-none" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExcluir(l);
                }}
                aria-label="Excluir"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-[#eccec5]"
              >
                <Icon name="trash" size={15} color="#b04a34" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Resumo do conjunto filtrado */}
      {filtrados.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-[12px] border border-line bg-panel px-5 py-3 text-[12.5px] font-semibold text-ink-3">
          <span>
            <b className="text-ink">{filtrados.length}</b>{" "}
            {filtrados.length === 1 ? "lançamento" : "lançamentos"}
          </span>
          {totais.vendas > 0 && (
            <span>
              Vendas <b className="text-venda-fg tnum">{brl(totais.vendas)}</b>
            </span>
          )}
          {totais.recebimentos > 0 && (
            <span>
              Recebimentos <b className="text-receb-fg tnum">{brl(totais.recebimentos)}</b>
            </span>
          )}
          {totais.despesas > 0 && (
            <span>
              Despesas <b className="text-desp-fg tnum">{brl(totais.despesas)}</b>
            </span>
          )}
        </div>
      )}

      <Modal open={Boolean(excluir)} onClose={() => setExcluir(null)}>
        <div className="text-[19px] font-extrabold">Excluir lançamento?</div>
        <div className="mt-2 text-sm leading-[1.5] text-ink-3">Essa ação não pode ser desfeita.</div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setExcluir(null)} className="h-12 flex-1 rounded-[11px] border border-input-border bg-white text-[14.5px] font-bold text-ink-2">
            Cancelar
          </button>
          <button onClick={confirmaExcluir} disabled={excluindo} className="h-12 flex-1 rounded-[11px] bg-desp-fg text-[14.5px] font-bold text-white disabled:opacity-60">
            {excluindo ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
