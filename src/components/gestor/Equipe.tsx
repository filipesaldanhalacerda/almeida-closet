"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { brl, iniciais, isoParaBR } from "@/lib/format";

export interface TeamRow {
  id: string;
  nome: string;
  ativo: boolean;
  qtd: number;
  volume: number;
}

export function Equipe({ time, periodo }: { time: TeamRow[]; periodo: string }) {
  const router = useRouter();
  const toast = useToast();
  const [codigo, setCodigo] = React.useState<string | null>(null);
  const [expira, setExpira] = React.useState<string | null>(null);
  const [gerando, setGerando] = React.useState(false);
  const [modal, setModal] = React.useState(false);

  async function gerar(tipo: "novo_acesso" | "reset_senha", alvo?: string) {
    setGerando(true);
    setCodigo(null);
    setExpira(null);
    setModal(true);
    try {
      const res = await fetch("/api/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, alvo_profile_id: alvo ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.erro || "Erro ao gerar código", "erro");
        setModal(false);
        return;
      }
      setCodigo(data.codigo);
      setExpira(data.expira_em);
    } catch {
      toast("Sem conexão", "erro");
      setModal(false);
    } finally {
      setGerando(false);
    }
  }

  async function copiar() {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      toast("Código copiado");
    } catch {
      toast("Não foi possível copiar", "erro");
    }
  }

  function whatsapp() {
    if (!codigo) return;
    const texto = `Olá! Seu código de acesso ao Almeida Closet é ${codigo}. Abra o app, toque em "Primeiro acesso com código" e crie sua senha. Válido por 7 dias.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  }

  async function alternarAtivo(row: TeamRow) {
    try {
      const res = await fetch(`/api/profiles/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !row.ativo }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast(d.erro || "Erro", "erro");
      } else {
        toast(row.ativo ? "Acesso desativado" : "Acesso reativado");
        router.refresh();
      }
    } catch {
      toast("Sem conexão", "erro");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink-3">
          Quem tem acesso ao sistema e quanto vendeu em {periodo}.
        </div>
        <button
          onClick={() => gerar("novo_acesso")}
          className="flex h-[42px] items-center gap-2 rounded-[11px] bg-ink px-[18px] text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[.98]"
        >
          <Icon name="plus" size={16} color="#fff" strokeWidth={2.2} />
          Gerar código de acesso
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        {time.map((t) => (
          <div key={t.id} className="flex items-center gap-4 rounded-[14px] border border-line bg-white p-4 shadow-card">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-[#efece5] text-[15px] font-extrabold text-ink-2">
              {iniciais(t.nome)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="min-w-0 truncate text-[15px] font-bold">{t.nome}</span>
                <span
                  className="flex-none rounded-full px-2.5 py-[3px] text-[11.5px] font-bold"
                  style={{
                    background: t.ativo ? "#edf3ee" : "#f2efe9",
                    color: t.ativo ? "#2f7d5b" : "#a09a90",
                  }}
                >
                  {t.ativo ? "Ativa" : "Inativa"}
                </span>
              </div>
              <div className="mt-0.5 text-[12.5px] text-muted">
                {t.qtd} {t.qtd === 1 ? "lançamento" : "lançamentos"} · {brl(t.volume)} em vendas
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => gerar("reset_senha", t.id)}
                className="rounded-[9px] border border-line bg-white px-3 py-1.5 text-[12px] font-bold text-ink-3 transition-colors hover:bg-panel hover:text-ink"
              >
                Redefinir senha
              </button>
              <button
                onClick={() => alternarAtivo(t)}
                className="rounded-[9px] border bg-white px-3 py-1.5 text-[12px] font-bold transition-opacity hover:opacity-80"
                style={{
                  borderColor: t.ativo ? "#eccec5" : "#dfe9df",
                  color: t.ativo ? "#b04a34" : "#2f7d5b",
                }}
              >
                {t.ativo ? "Desativar" : "Reativar"}
              </button>
            </div>
          </div>
        ))}
        {time.length === 0 && (
          <div className="rounded-[14px] border border-dashed border-line bg-white p-8 text-center text-sm text-muted">
            Nenhuma vendedora ainda. Gere um código de acesso para começar.
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} width={440}>
        <div className="text-[19px] font-extrabold">Código de acesso</div>
        <div className="mt-2 text-sm leading-[1.5] text-ink-3">
          Envie este código para a vendedora. Ela usa em “Primeiro acesso com código” e cria a própria senha.
          {expira && ` Válido até ${isoParaBR(expira)}.`}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-[12px] border border-dashed border-[#d4d0c8] bg-panel px-5 py-4">
          <span className="text-[30px] font-extrabold tracking-[.14em]">{gerando ? "…" : codigo}</span>
          <button onClick={copiar} disabled={!codigo} className="flex h-10 items-center gap-2 rounded-[10px] border border-input-border bg-white px-3.5 text-[13px] font-bold text-ink-2 disabled:opacity-50">
            <Icon name="copy" size={16} /> Copiar
          </button>
        </div>
        <div className="mt-5 flex gap-3">
          <button onClick={() => setModal(false)} className="h-12 rounded-[11px] border border-input-border bg-white px-5 text-[14.5px] font-bold text-ink-2">
            Fechar
          </button>
          <button onClick={whatsapp} disabled={!codigo} className="h-12 flex-1 rounded-[11px] bg-venda-fg text-[14.5px] font-bold text-white disabled:opacity-50">
            Enviar por WhatsApp
          </button>
        </div>
      </Modal>
    </div>
  );
}
