import Link from "next/link";
import { Icon, iconeDoTipo } from "@/components/Icon";
import { corDoTipo, FORMA_LABEL, MEIO_LABEL, MODALIDADE_LABEL } from "@/lib/constants";
import { brlSinal, isoParaBR } from "@/lib/format";
import type { LancamentoView } from "@/lib/types";

/** Título e subtítulo de exibição de um lançamento. */
export function tituloLancamento(l: LancamentoView): { titulo: string; sub: string } {
  if (l.tipo === "venda") {
    return {
      titulo: l.cliente || "Cliente",
      sub: `${l.forma_pagamento ? FORMA_LABEL[l.forma_pagamento] : "Venda"} · ${l.modalidade ? MODALIDADE_LABEL[l.modalidade] : ""}`,
    };
  }
  if (l.tipo === "recebimento") {
    const quem = l.cliente || l.bandeira || l.cliente_ou_bandeira || "Recebimento";
    const extra = l.cliente && l.bandeira ? ` · ${l.bandeira}` : "";
    return {
      titulo: quem,
      sub: `Recebimento · ${l.meio ? MEIO_LABEL[l.meio] : ""}${extra}`,
    };
  }
  if (l.tipo === "despesa") {
    return { titulo: l.categoria_nome || "Despesa", sub: l.credor || "Despesa" };
  }
  if (l.tipo === "investimento") {
    return { titulo: l.descricao || "Aporte", sub: "Capital · Aporte" };
  }
  return { titulo: l.descricao || "Devolução de capital", sub: "Capital · Devolução" };
}

export function LancamentoCard({ l, href }: { l: LancamentoView; href: string }) {
  const { titulo, sub } = tituloLancamento(l);
  const cor = corDoTipo(l.tipo);
  const saida = l.tipo === "despesa" || l.tipo === "devolucao_capital";
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-card border border-line bg-white px-[15px] py-3.5 text-left shadow-card active:bg-[#faf9f6]"
    >
      <span
        className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[11px]"
        style={{ background: cor.bg }}
      >
        <Icon name={iconeDoTipo(l.tipo)} size={18} color={cor.fg} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-bold text-ink">{titulo}</span>
        <span className="truncate text-[12.5px] font-medium text-muted">{sub}</span>
      </span>
      <span className="flex flex-none flex-col items-end gap-0.5">
        <span className="text-[15px] font-bold tnum" style={{ color: cor.fg }}>
          {brlSinal(l.valor, saida)}
        </span>
        <span className="text-[11.5px] font-semibold text-faint-3">{isoParaBR(l.data)}</span>
      </span>
      {/* Seta indica que o card é tocável (abre a edição). */}
      <Icon name="chevronRight" size={18} color="#cbc6bd" className="-ml-1 flex-none" />
    </Link>
  );
}
