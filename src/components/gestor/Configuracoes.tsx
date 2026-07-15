"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon, type IconName } from "@/components/Icon";
import { useToast } from "@/components/ui/Toast";
import { DRE_GRUPOS } from "@/lib/constants";
import {
  centavosParaExibicao,
  centavosParaNumero,
  hojeIso,
  iniciais,
  numeroParaCentavos,
  soDigitos,
} from "@/lib/format";
import type { CategoriaDespesa, DreGrupo } from "@/lib/types";

interface Props {
  saldoInicial: number;
  saldoData: string | null;
  vendedoras: { id: string; nome: string; meta: number }[];
  categorias: CategoriaDespesa[];
}

export function Configuracoes({ saldoInicial, saldoData, vendedoras, categorias }: Props) {
  const router = useRouter();
  const toast = useToast();
  // Valores monetários são guardados como "centavos" (dígitos) e exibidos
  // formatados em R$ pt-BR (pontos de milhar e vírgula decimal).
  const [saldo, setSaldo] = React.useState(saldoInicial ? numeroParaCentavos(saldoInicial) : "");
  const [data, setData] = React.useState(saldoData ?? hojeIso());
  const [metas, setMetas] = React.useState<Record<string, string>>(
    Object.fromEntries(vendedoras.map((v) => [v.id, v.meta ? numeroParaCentavos(v.meta) : ""])),
  );
  const [salvandoSaldo, setSalvandoSaldo] = React.useState(false);
  const [novaCat, setNovaCat] = React.useState("");
  const [novoGrupo, setNovoGrupo] = React.useState<DreGrupo>("despesas_administrativas");
  const [criandoCat, setCriandoCat] = React.useState(false);

  async function salvarSaldo() {
    setSalvandoSaldo(true);
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saldo_inicial_caixa: centavosParaNumero(saldo),
          saldo_inicial_data: data || null,
        }),
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
        body: JSON.stringify({ vendedora_id: id, valor: centavosParaNumero(metas[id] || "0") }),
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

  async function criarCategoria() {
    const nome = novaCat.trim();
    if (nome.length < 2) return;
    setCriandoCat(true);
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, grupo_dre: novoGrupo }),
      });
      const d = await res.json();
      if (!res.ok) {
        toast(d.erro || "Não foi possível criar a categoria", "erro");
        return;
      }
      toast("Categoria criada");
      setNovaCat("");
      router.refresh();
    } catch {
      toast("Sem conexão", "erro");
    } finally {
      setCriandoCat(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-[760px] flex-col gap-4">
      {/* Saldo inicial */}
      <Secao
        icon="wallet"
        cor="#2b6f74"
        bg="#e2eff0"
        titulo="Saldo inicial do caixa"
        desc="Base para o cálculo do Fluxo de Caixa. Defina uma vez, ao começar a usar o sistema."
      >
        {/* No mobile empilha (campos e Salvar em largura cheia); no desktop em linha. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="w-full sm:min-w-[160px] sm:max-w-[300px] sm:flex-1">
            <label className="mb-1.5 block text-[12px] font-bold text-ink-3">Valor</label>
            <div className="flex h-[52px] items-center gap-2.5 rounded-[12px] border border-input-border bg-white px-4 focus-within:border-ink">
              <span className="text-[15px] font-bold text-muted">R$</span>
              <input
                value={centavosParaExibicao(saldo)}
                onChange={(e) => setSaldo(soDigitos(e.target.value))}
                inputMode="numeric"
                placeholder="0,00"
                className="w-full bg-transparent text-right text-[17px] font-bold tnum outline-none"
              />
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <label className="mb-1.5 block text-[12px] font-bold text-ink-3">A partir de</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="focus-ring h-[52px] w-full rounded-[12px] border border-input-border bg-white px-3 text-[14px] sm:w-auto"
            />
          </div>
          <button
            onClick={salvarSaldo}
            disabled={salvandoSaldo}
            className="h-[52px] w-full rounded-[12px] bg-ink px-6 text-[15px] font-bold text-white transition-transform active:scale-[.98] disabled:opacity-60 sm:w-auto"
          >
            {salvandoSaldo ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </Secao>

      {/* Metas */}
      <Secao
        icon="target"
        cor="#2f7d5b"
        bg="#e7f1ec"
        titulo="Metas mensais por vendedora"
        desc="Acompanhadas no Dashboard. O valor é salvo ao sair do campo."
      >
        <div className="flex flex-col gap-2.5">
          {vendedoras.length === 0 && (
            <p className="rounded-[12px] border border-dashed border-line bg-panel px-4 py-6 text-center text-sm text-muted">
              Nenhuma vendedora cadastrada ainda.
            </p>
          )}
          {vendedoras.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-[12px] border border-line-2 bg-panel px-3 py-2.5"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-ink-2 shadow-card">
                {iniciais(v.nome)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{v.nome}</span>
              <div className="flex h-[46px] w-[136px] flex-none items-center gap-1.5 rounded-[11px] border border-input-border bg-white px-3 focus-within:border-ink xs:w-[168px] sm:w-[190px]">
                <span className="text-[13px] font-bold text-muted">R$</span>
                <input
                  value={centavosParaExibicao(metas[v.id] ?? "")}
                  onChange={(e) => setMetas((m) => ({ ...m, [v.id]: soDigitos(e.target.value) }))}
                  onBlur={() => salvarMeta(v.id)}
                  inputMode="numeric"
                  placeholder="0,00"
                  className="w-full bg-transparent text-right text-[15px] font-bold tnum outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </Secao>

      {/* Categorias */}
      <Secao
        icon="tag"
        cor="#8c6f52"
        bg="#f2ece2"
        titulo="Categorias de despesa e grupo no DRE"
        desc="Cada categoria é somada no grupo escolhido dentro do DRE anual."
      >
        {/* Criar nova categoria, rápido e simples */}
        <div className="rounded-[12px] border border-dashed border-[#d8d3ca] bg-panel p-3">
          <div className="mb-2 text-[12.5px] font-bold text-ink-2">Nova categoria</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={novaCat}
              onChange={(e) => setNovaCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && criarCategoria()}
              placeholder="ex.: Aluguel"
              maxLength={60}
              className="focus-ring h-11 min-w-0 flex-1 rounded-[10px] border border-input-border bg-white px-3.5 text-[14px]"
            />
            <div className="flex gap-2">
              <select
                value={novoGrupo}
                onChange={(e) => setNovoGrupo(e.target.value as DreGrupo)}
                className="select-reset focus-ring h-11 min-w-0 flex-1 rounded-[10px] border border-input-border bg-white px-3 pr-8 text-[13px] font-semibold text-ink-2 sm:w-[188px] sm:flex-none"
              >
                {DRE_GRUPOS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={criarCategoria}
                disabled={criandoCat || novaCat.trim().length < 2}
                className="flex h-11 flex-none items-center gap-1.5 rounded-[10px] bg-ink px-4 text-[13.5px] font-bold text-white transition-transform active:scale-[.98] disabled:opacity-50"
              >
                <Icon name="plus" size={16} color="#fff" strokeWidth={2.2} />
                {criandoCat ? "…" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 max-h-[420px] overflow-y-auto rounded-[12px] border border-[#f0eee9]">
          {categorias.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">Nenhuma categoria ainda.</div>
          )}
          {categorias.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-3 border-b border-[#f4f1ec] px-4 py-2.5 last:border-0"
            >
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
      </Secao>
    </div>
  );
}

// Card de seção com cabeçalho (ícone + título + descrição).
function Secao({
  icon,
  cor,
  bg,
  titulo,
  desc,
  children,
}: {
  icon: IconName;
  cor: string;
  bg: string;
  titulo: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-line bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px]"
          style={{ background: bg }}
        >
          <Icon name={icon} size={19} color={cor} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold leading-tight">{titulo}</div>
          <div className="mt-0.5 text-[12.5px] leading-[1.5] text-muted">{desc}</div>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
