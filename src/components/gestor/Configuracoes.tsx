"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { DRE_GRUPOS } from "@/lib/constants";
import { hojeIso, iniciais } from "@/lib/format";
import type { CategoriaDespesa, DreGrupo } from "@/lib/types";

interface Props {
  saldoInicial: number;
  saldoData: string | null;
  vendedoras: { id: string; nome: string; meta: number }[];
  categorias: CategoriaDespesa[];
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function Configuracoes({ saldoInicial, saldoData, vendedoras, categorias }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [saldo, setSaldo] = React.useState(String(saldoInicial).replace(".", ","));
  const [data, setData] = React.useState(saldoData ?? hojeIso());
  const [metas, setMetas] = React.useState<Record<string, string>>(
    Object.fromEntries(vendedoras.map((v) => [v.id, String(v.meta || 0).replace(".", ",")])),
  );
  const [salvandoSaldo, setSalvandoSaldo] = React.useState(false);

  async function salvarSaldo() {
    setSalvandoSaldo(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saldo_inicial_caixa: parseNum(saldo), saldo_inicial_data: data || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.erro || "Erro", "erro");
      } else {
        toast("Saldo inicial salvo");
        router.refresh();
      }
    } catch {
      toast("Sem conexão", "erro");
    } finally {
      setSalvandoSaldo(false);
    }
  }

  async function salvarMeta(id: string) {
    try {
      const res = await fetch("/api/metas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendedora_id: id, valor: parseNum(metas[id] || "0") }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.erro || "Erro", "erro");
      } else {
        toast("Meta salva");
      }
    } catch {
      toast("Sem conexão", "erro");
    }
  }

  async function salvarGrupo(cat: CategoriaDespesa, grupo: DreGrupo) {
    try {
      const res = await fetch(`/api/categorias/${cat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grupo_dre: grupo }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.erro || "Erro", "erro");
      } else {
        toast("Categoria atualizada");
        router.refresh();
      }
    } catch {
      toast("Sem conexão", "erro");
    }
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      {/* Saldo inicial */}
      <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
        <div className="text-[15px] font-extrabold">Saldo inicial do caixa</div>
        <div className="mt-1 text-[13px] leading-[1.5] text-muted">
          Base para o cálculo do Fluxo de Caixa. Defina uma vez, ao começar a usar o sistema.
        </div>
        <div className="mt-3.5 flex flex-wrap items-end gap-3">
          <div className="flex h-[52px] max-w-[280px] flex-1 items-center gap-2.5 rounded-[12px] border border-input-border bg-white px-4">
            <span className="text-[15px] font-bold text-muted">R$</span>
            <input value={saldo} onChange={(e) => setSaldo(e.target.value)} inputMode="decimal" className="flex-1 bg-transparent text-[17px] font-bold outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-semibold text-muted">A partir de</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-[52px] rounded-[12px] border border-input-border bg-white px-3 text-[14px]" />
          </div>
          <button onClick={salvarSaldo} disabled={salvandoSaldo} className="h-[52px] rounded-[12px] bg-ink px-6 text-[15px] font-bold text-white disabled:opacity-60">
            {salvandoSaldo ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>

      {/* Metas */}
      <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
        <div className="text-[15px] font-extrabold">Metas mensais por vendedora</div>
        <div className="mt-1 text-[13px] text-muted">Usadas para acompanhar o desempenho no Dashboard e no Resultado de Vendas.</div>
        <div className="mt-4 flex flex-col gap-3">
          {vendedoras.length === 0 && <p className="text-sm text-muted">Nenhuma vendedora cadastrada.</p>}
          {vendedoras.map((v) => (
            <div key={v.id} className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#efece5] text-[13px] font-extrabold text-ink-2">
                {iniciais(v.nome)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{v.nome}</span>
              <div className="flex h-[46px] w-[150px] flex-none items-center gap-2 rounded-[11px] border border-input-border bg-white px-3.5 xs:w-[180px] sm:w-[200px]">
                <span className="text-[13px] font-bold text-muted">R$</span>
                <input
                  value={metas[v.id] ?? ""}
                  onChange={(e) => setMetas((m) => ({ ...m, [v.id]: e.target.value }))}
                  onBlur={() => salvarMeta(v.id)}
                  inputMode="decimal"
                  className="w-full bg-transparent text-[15px] font-bold outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div className="rounded-[14px] border border-line bg-white p-5 shadow-card">
        <div className="text-[15px] font-extrabold">Categorias de despesa e grupo no DRE</div>
        <div className="mt-1 text-[13px] text-muted">Cada categoria é somada no grupo escolhido dentro do DRE anual.</div>
        <div className="mt-3.5 max-h-[420px] overflow-y-auto rounded-[12px] border border-[#f0eee9]">
          {categorias.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 border-b border-[#f4f1ec] px-4 py-2.5 last:border-0">
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{c.nome}</span>
              <select
                value={c.grupo_dre}
                onChange={(e) => salvarGrupo(c, e.target.value as DreGrupo)}
                className="select-reset h-[38px] max-w-[52%] flex-none rounded-[9px] border border-input-border bg-white px-3 pr-8 text-[12.5px] font-semibold text-ink-2"
              >
                {DRE_GRUPOS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
