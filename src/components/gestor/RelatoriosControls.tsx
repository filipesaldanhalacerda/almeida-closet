"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/ui/Toast";
import type { AbaKey } from "@/lib/export/tipos";
import { hojeIso } from "@/lib/format";

interface Opcao {
  label: string;
  escopo: "mes" | "ano";
  ano: number;
  mes: number;
}

interface AbaCard {
  key: AbaKey;
  nome: string;
  cor: string;
  descricao: string;
  detalhe: string; // "82 linhas" etc.
}

export function RelatoriosControls({
  opcoes,
  selecionada,
  abas,
  desdeInicial,
  ateInicial,
}: {
  opcoes: Opcao[];
  selecionada: string;
  abas: AbaCard[];
  desdeInicial?: string;
  ateInicial?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [baixando, setBaixando] = React.useState<"pdf" | "xlsx" | null>(null);
  const [formato, setFormato] = React.useState<"pdf" | "xlsx">("pdf");
  const custom = selecionada === "custom";
  const [desde, setDesde] = React.useState(desdeInicial || hojeIso().slice(0, 8) + "01");
  const [ate, setAte] = React.useState(ateInicial || hojeIso());
  const [marcadas, setMarcadas] = React.useState<Set<AbaKey>>(
    new Set(abas.map((a) => a.key)),
  );

  function trocarPeriodo(valor: string) {
    if (valor === "custom") {
      router.push(`/admin/relatorios?escopo=custom&desde=${desde}&ate=${ate}`);
      return;
    }
    const o = opcoes.find((x) => `${x.escopo}-${x.ano}-${x.mes}` === valor);
    if (!o) return;
    router.push(`/admin/relatorios?escopo=${o.escopo}&ano=${o.ano}&mes=${o.mes}`);
  }

  function aplicarCustom(novoDesde: string, novoAte: string) {
    setDesde(novoDesde);
    setAte(novoAte);
    if (novoDesde && novoAte && novoDesde <= novoAte) {
      router.push(`/admin/relatorios?escopo=custom&desde=${novoDesde}&ate=${novoAte}`);
    }
  }

  function alternar(key: AbaKey) {
    setMarcadas((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  const atual = opcoes.find((x) => `${x.escopo}-${x.ano}-${x.mes}` === selecionada) ?? opcoes[0];
  const nenhuma = marcadas.size === 0;

  async function baixar() {
    if (nenhuma) return;
    setBaixando(formato);
    try {
      const abasParam = [...marcadas].join(",");
      const periodo = custom
        ? `escopo=custom&desde=${desde}&ate=${ate}`
        : `escopo=${atual.escopo}&ano=${atual.ano}&mes=${atual.mes}`;
      const res = await fetch(`/api/export?${periodo}&formato=${formato}&abas=${abasParam}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      const objectUrl = URL.createObjectURL(blob);
      const baseNome = custom
        ? `${desde}-a-${ate}`
        : atual.escopo === "ano"
          ? `${atual.ano}`
          : `${atual.ano}-${String(atual.mes).padStart(2, "0")}`;
      a.href = objectUrl;
      a.download =
        formato === "pdf"
          ? `relatorio-almeida-closet-${baseNome}.pdf`
          : `almeida-closet-${baseNome}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast(formato === "pdf" ? "Relatório PDF gerado" : "Planilha Excel gerada");
    } catch {
      toast("Não foi possível gerar o relatório. Tente novamente.", "erro");
    } finally {
      setBaixando(null);
    }
  }

  return (
    <>
      {/* Período */}
      <label className="mb-2 mt-6 block text-[13px] font-bold text-ink-2">Período</label>
      <select
        value={custom ? "custom" : selecionada}
        onChange={(e) => trocarPeriodo(e.target.value)}
        className="select-reset focus-ring h-[50px] w-full rounded-[12px] border border-input-border bg-white px-4 text-[15px] font-semibold"
      >
        {opcoes.map((o) => (
          <option key={`${o.escopo}-${o.ano}-${o.mes}`} value={`${o.escopo}-${o.ano}-${o.mes}`}>
            {o.label}
          </option>
        ))}
        <option value="custom">Período personalizado…</option>
      </select>

      {custom && (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-semibold text-muted">De</label>
            <input
              type="date"
              value={desde}
              max={ate}
              onChange={(e) => aplicarCustom(e.target.value, ate)}
              className="focus-ring h-[46px] w-full rounded-[11px] border border-input-border bg-white px-3 text-[14px]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-[12px] font-semibold text-muted">Até</label>
            <input
              type="date"
              value={ate}
              min={desde}
              onChange={(e) => aplicarCustom(desde, e.target.value)}
              className="focus-ring h-[46px] w-full rounded-[11px] border border-input-border bg-white px-3 text-[14px]"
            />
          </div>
        </div>
      )}

      {/* Seções */}
      <div className="mb-2.5 mt-6 flex items-baseline justify-between">
        <span className="text-[13px] font-bold text-ink-2">O que incluir no relatório</span>
        <span className="flex gap-3 text-[12px] font-semibold">
          <button
            onClick={() => setMarcadas(new Set(abas.map((a) => a.key)))}
            className="text-[#4a6b8a] hover:underline"
          >
            marcar tudo
          </button>
          <button onClick={() => setMarcadas(new Set())} className="text-faint hover:underline">
            limpar
          </button>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
        {abas.map((a) => {
          const on = marcadas.has(a.key);
          return (
            <button
              key={a.key}
              onClick={() => alternar(a.key)}
              aria-pressed={on}
              className="rounded-[12px] border p-3.5 text-left transition-all"
              style={{
                borderColor: on ? "#1a2130" : "#ece7df",
                background: on ? "#fff" : "#faf9f6",
                opacity: on ? 1 : 0.62,
                boxShadow: on ? "0 1px 2px rgba(40,36,30,.05), 0 10px 22px -18px rgba(40,36,30,.28)" : "none",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: a.cor }} />
                  <span className="text-[13px] font-bold">{a.nome}</span>
                </span>
                <span
                  className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border"
                  style={{
                    background: on ? "#1a2130" : "#fff",
                    borderColor: on ? "#1a2130" : "#d8d3ca",
                  }}
                >
                  {on && <Icon name="check" size={11} color="#fff" strokeWidth={3} />}
                </span>
              </div>
              <div className="mt-1.5 text-[11.5px] leading-[1.45] text-muted">{a.descricao}</div>
              <div className="mt-1 text-[11px] font-bold text-faint">{a.detalhe}</div>
            </button>
          );
        })}
      </div>

      {/* Formato */}
      <label className="mb-2.5 mt-6 block text-[13px] font-bold text-ink-2">Formato</label>
      <div className="flex gap-2">
        <FormatoBtn
          ativo={formato === "pdf"}
          onClick={() => setFormato("pdf")}
          titulo="PDF"
          sub="Apresentação pronta para imprimir ou enviar"
        />
        <FormatoBtn
          ativo={formato === "xlsx"}
          onClick={() => setFormato("xlsx")}
          titulo="Excel (.xlsx)"
          sub="Planilha editável, uma aba por seção"
        />
      </div>

      <button
        onClick={baixar}
        disabled={Boolean(baixando) || nenhuma}
        className="mt-6 flex h-[54px] w-full items-center justify-center gap-2.5 rounded-[12px] bg-ink text-[15.5px] font-bold text-white transition-opacity hover:opacity-90 active:scale-[.99] disabled:opacity-50"
      >
        <Icon name="download" size={20} color="#fff" strokeWidth={2.2} />
        {baixando
          ? baixando === "pdf"
            ? "Gerando PDF…"
            : "Gerando planilha…"
          : nenhuma
            ? "Selecione ao menos uma seção"
            : formato === "pdf"
              ? "Baixar relatório (PDF)"
              : "Baixar planilha (.xlsx)"}
      </button>
    </>
  );
}

function FormatoBtn({
  ativo,
  onClick,
  titulo,
  sub,
}: {
  ativo: boolean;
  onClick: () => void;
  titulo: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className="flex-1 rounded-[12px] border px-4 py-3 text-left transition-all"
      style={{
        borderColor: ativo ? "#1a2130" : "#e0ddd5",
        background: ativo ? "#1a2130" : "#fff",
      }}
    >
      <div className="text-[14px] font-bold" style={{ color: ativo ? "#fff" : "#1a2130" }}>
        {titulo}
      </div>
      <div
        className="mt-0.5 text-[11.5px] leading-[1.4]"
        style={{ color: ativo ? "rgba(255,255,255,.65)" : "#727a88" }}
      >
        {sub}
      </div>
    </button>
  );
}
