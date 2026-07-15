"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { StatCard, StatDelta } from "@/components/gestor/charts";
import { Spinner } from "@/components/ui/Spinner";
import type { DreGrupoAgg, DreModel, DreSubtotal } from "@/lib/calc/dre";
import { MESES_ABBR } from "@/lib/constants";
import { brl, fmtInt, pct } from "@/lib/format";

type LinhaTipo = "grupo" | "filho" | "subtotal";

interface Linha {
  tipo: LinhaTipo;
  key: string;
  label: string;
  meses: number[];
  total: number;
  grupoKey?: string;
  destaque?: boolean;
}

function grupoParaLinhas(g: DreGrupoAgg, key: string, expandido: boolean): Linha[] {
  const out: Linha[] = [{ tipo: "grupo", key, label: g.label, meses: g.meses, total: g.total, grupoKey: key }];
  if (expandido) {
    for (const c of g.children) {
      out.push({ tipo: "filho", key: `${key}-${c.nome}`, label: c.nome, meses: c.meses, total: c.total });
    }
  }
  return out;
}

function sub(s: DreSubtotal, key: string): Linha {
  return { tipo: "subtotal", key, label: s.label, meses: s.meses, total: s.total, destaque: true };
}

export function DreTable({
  model,
  ano,
  anos,
  resumoAnterior,
}: {
  model: DreModel;
  ano: number;
  anos: number[];
  resumoAnterior?: DreModel["resumo"];
}) {
  const router = useRouter();
  const [exp, setExp] = React.useState<Record<string, boolean>>({ rb: true });
  const [pending, startTransition] = React.useTransition();
  const toggle = (k: string) => setExp((s) => ({ ...s, [k]: !s[k] }));

  const linhas: Linha[] = [
    ...grupoParaLinhas(model.receitaBruta, "rb", exp.rb),
    ...grupoParaLinhas(model.deducoes, "ded", exp.ded),
    sub(model.receitaLiquida, "rl"),
    ...grupoParaLinhas(model.custosVariaveis, "cv", exp.cv),
    sub(model.margemContribuicao, "mc"),
    ...grupoParaLinhas(model.despesasAdministrativas, "adm", exp.adm),
    ...grupoParaLinhas(model.despesasFuncionarios, "func", exp.func),
    ...grupoParaLinhas(model.despesasFinanceiras, "fin", exp.fin),
    sub(model.resultadoOperacional, "ro"),
    ...grupoParaLinhas(model.investimentos, "inv", exp.inv),
    ...grupoParaLinhas(model.dividas, "div", exp.div),
    sub(model.resultadoFinal, "rf"),
  ];

  function celula(v: number) {
    if (v === 0) return <span className="text-faint">—</span>;
    const neg = v < 0;
    return (
      <span className={neg ? "text-desp-fg" : ""} style={{ fontVariantNumeric: "tabular-nums" }}>
        {neg ? "−" : ""}
        {fmtInt(Math.abs(v))}
      </span>
    );
  }

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
                  onClick={() => startTransition(() => router.push(`/admin/dre?ano=${y}`))}
                  className="h-[34px] rounded-[7px] px-4 text-[13px] font-bold"
                  style={{ background: ativo ? "#1c1a17" : "transparent", color: ativo ? "#fff" : "#6f6a63" }}
                >
                  {y}
                </button>
              );
            })}
          </div>
          {pending && <Spinner size={16} />}
        </div>
        <div className="text-[12.5px] font-semibold text-muted">
          Calculado automaticamente a partir dos lançamentos · negativos em vermelho
        </div>
      </div>

      {/* Cards resumo, com comparativo vs ano anterior */}
      <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Receita Bruta"
          valor={brl(model.resumo.receitaBruta)}
          cor="#2f7d5b"
          sub={
            resumoAnterior && (
              <StatDelta atual={model.resumo.receitaBruta} anterior={resumoAnterior.receitaBruta} rotulo={`vs ${ano - 1}`} />
            )
          }
        />
        <StatCard
          titulo="Despesa Total"
          valor={brl(model.resumo.despesaTotal)}
          cor="#b04a34"
          sub={
            resumoAnterior && (
              <StatDelta atual={model.resumo.despesaTotal} anterior={resumoAnterior.despesaTotal} rotulo={`vs ${ano - 1}`} bomSeMaior={false} />
            )
          }
        />
        <StatCard
          titulo="Margem de Lucro Líquida"
          valor={pct(model.resumo.margemPct, 1)}
          sub={
            resumoAnterior && resumoAnterior.receitaBruta > 0 ? (
              <span className="text-faint-3">
                {ano - 1}: {pct(resumoAnterior.margemPct, 1)}
              </span>
            ) : undefined
          }
        />
        <StatCard
          titulo="Resultado Final"
          valor={brl(model.resumo.resultadoFinal)}
          dark
          sub={
            resumoAnterior && (
              <StatDelta atual={model.resumo.resultadoFinal} anterior={resumoAnterior.resultadoFinal} rotulo={`vs ${ano - 1}`} dark />
            )
          }
        />
      </div>

      {/* Matriz */}
      <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-card">
        <div className="overflow-x-auto">
          <div className="min-w-[1060px]">
            <div className="grid grid-cols-[230px_repeat(13,1fr)]">
              <div className="sticky left-0 z-[2] border-b border-line-2 bg-panel px-4 py-3 text-[11px] font-bold uppercase tracking-[.05em] text-faint">
                Conta
              </div>
              {[...MESES_ABBR, "Total"].map((m) => (
                <div key={m} className="border-b border-line-2 bg-panel px-1.5 py-3 text-right text-[11px] font-bold uppercase text-faint">
                  {m}
                </div>
              ))}
            </div>

            {linhas.map((l) => {
              const bg = l.tipo === "subtotal" ? "#faf9f6" : l.tipo === "grupo" ? "#fff" : "#fff";
              const fw = l.tipo === "filho" ? 500 : 700;
              const indent = l.tipo === "filho" ? "34px" : "16px";
              const podeExpandir = l.tipo === "grupo";
              return (
                <div key={l.key} className="grid grid-cols-[230px_repeat(13,1fr)] items-center border-b border-[#f4f1ec]" style={{ background: bg }}>
                  <button
                    onClick={() => l.grupoKey && toggle(l.grupoKey)}
                    className="sticky left-0 z-[1] flex items-center gap-1.5 py-2.5 pr-2 text-left text-[13px]"
                    style={{ paddingLeft: indent, fontWeight: fw, background: bg, cursor: podeExpandir ? "pointer" : "default", color: l.destaque ? "#1c1a17" : "#42403b" }}
                  >
                    {podeExpandir ? (
                      <Icon name={exp[l.grupoKey!] ? "chevronDown" : "chevronRight"} size={12} color="#8c867b" />
                    ) : (
                      <span className="w-3" />
                    )}
                    {l.label}
                  </button>
                  {l.meses.map((v, i) => (
                    <div key={i} className="px-1.5 py-2.5 text-right text-[12px]" style={{ fontWeight: fw }}>
                      {celula(v)}
                    </div>
                  ))}
                  <div className="px-1.5 py-2.5 text-right text-[12px] font-extrabold">{celula(l.total)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

