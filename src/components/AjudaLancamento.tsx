"use client";

import * as React from "react";
import { Icon } from "@/components/Icon";
import { BottomSheet } from "@/components/ui/Modal";

/**
 * Guia "Venda ou Recebimento?", explica em linguagem simples o que é cada
 * tipo, quando usar e qual o impacto nos números da loja.
 * Bottom sheet padrão para vendedora e gestor (centralizado no desktop).
 */
export function AjudaLancamento() {
  const [aberto, setAberto] = React.useState(false);

  const conteudo = (
    <div>
      <div className="text-center text-xl font-extrabold tracking-[-.01em]">
        Venda ou Recebimento?
      </div>
      <div className="mx-auto mt-1.5 max-w-[340px] text-center text-[13px] leading-[1.5] text-ink-3">
        O sistema separa <b>o que foi vendido</b> <b>do dinheiro que entrou</b>. É isso que
        deixa os números da loja certos.
      </div>

      {/* Os dois conceitos */}
      <div className="mt-5 flex flex-col gap-2.5">
        <div className="rounded-[14px] border border-[#d9e6de] bg-venda-bg/40 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-venda-bg">
              <Icon name="tag" size={18} color="#1f875c" />
            </span>
            <div>
              <div className="text-[14.5px] font-extrabold text-venda-fg">VENDA</div>
              <div className="text-[12px] font-semibold text-ink-3">“o que a cliente levou”</div>
            </div>
          </div>
          <ul className="mt-2.5 flex flex-col gap-1 text-[13px] leading-[1.5] text-ink-2">
            <li>• Registre <b>na hora da venda</b>, pelo <b>valor cheio</b>, mesmo que ela vá pagar depois (crediário).</li>
            <li>
              • <b>Impacto:</b> conta nas <b>suas metas</b>, no ranking das vendedoras, no número de
              vendas e no ticket médio.
            </li>
          </ul>
        </div>

        <div className="rounded-[14px] border border-[#d5e0e1] bg-receb-bg/40 p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-receb-bg">
              <Icon name="banknote" size={18} color="#127c84" />
            </span>
            <div>
              <div className="text-[14.5px] font-extrabold text-receb-fg">RECEBIMENTO</div>
              <div className="text-[12px] font-semibold text-ink-3">“o dinheiro que entrou no caixa”</div>
            </div>
          </div>
          <ul className="mt-2.5 flex flex-col gap-1 text-[13px] leading-[1.5] text-ink-2">
            <li>• Registre <b>toda vez que entrar dinheiro</b>: parcela do crediário, pagamento à vista, repasse da maquininha (com a bandeira).</li>
            <li>
              • <b>Impacto:</b> conta no <b>caixa da loja</b>, no fluxo de caixa e no resultado do
              mês.
            </li>
          </ul>
        </div>
      </div>

      {/* Exemplo prático */}
      <div className="mt-4 rounded-[14px] border border-line bg-panel p-4">
        <div className="text-[12px] font-bold uppercase tracking-[.08em] text-faint">
          Exemplo prático
        </div>
        <div className="mt-1.5 text-[13.5px] font-bold text-ink">
          Vestido de R$ 300 em 3x no crediário
        </div>
        <div className="mt-2 flex flex-col gap-1.5 text-[13px] leading-[1.55] text-ink-2">
          <div>
            <b className="text-venda-fg">Hoje:</b> venda de <b>R$ 300</b> + recebimento de{" "}
            <b>R$ 100</b> (a entrada). O sistema já registra os dois juntos no bloco{" "}
            <i>“Já entrou dinheiro?”</i>.
          </div>
          <div>
            <b className="text-receb-fg">Mês que vem:</b> quando ela pagar a 2ª parcela, lance{" "}
            <b>só um recebimento</b> de R$ 100. A venda já foi registrada, não registre de novo!
          </div>
        </div>
      </div>

      {/* Regra de bolso */}
      <div className="mt-4">
        <div className="mb-2 text-[12px] font-bold uppercase tracking-[.08em] text-faint">
          Regra de bolso
        </div>
        <div className="flex flex-col gap-1.5 text-[13px] leading-[1.5]">
          <div className="flex items-baseline gap-2">
            <span className="flex-none font-extrabold text-venda-fg">Vendeu agora?</span>
            <span className="text-ink-2">→ <b>Venda</b> (e diga se já entrou dinheiro)</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="flex-none font-extrabold text-receb-fg">Cliente veio pagar parcela?</span>
            <span className="text-ink-2">→ só <b>Recebimento</b></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="flex-none font-extrabold text-receb-fg">Caiu o repasse da maquininha?</span>
            <span className="text-ink-2">→ <b>Recebimento</b> com a bandeira</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[10px] bg-app px-3.5 py-2.5 text-[12px] leading-[1.5] text-muted">
        O sistema não controla “quanto falta pagar”: ele registra o que foi vendido, o que entrou
        e o que saiu. Sem registrar a venda, o seu desempenho fica errado; sem o recebimento, o
        caixa fica errado.
      </div>

      <button
        onClick={() => setAberto(false)}
        className="mt-5 h-[50px] w-full rounded-[13px] bg-ink text-[15px] font-bold text-white active:scale-[.99]"
      >
        Entendi
      </button>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex flex-none items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-[#4a6b8a] transition-colors hover:bg-panel"
      >
        <Icon name="help" size={14} color="#4a6b8a" />
        Entenda a diferença
      </button>

      <BottomSheet open={aberto} onClose={() => setAberto(false)}>
        {conteudo}
      </BottomSheet>
    </>
  );
}
