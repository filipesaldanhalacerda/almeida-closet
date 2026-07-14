"use client";

// Fila offline simples para NOVOS lançamentos que falharam por falta de rede.
// Guarda em localStorage e reenvia quando a conexão volta.
const KEY = "ac_offline_queue";

export interface FilaItem {
  id: string;
  body: unknown;
  criadoEm: number;
}

function ler(): FilaItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function gravar(itens: FilaItem[]) {
  localStorage.setItem(KEY, JSON.stringify(itens));
}

export function enfileirar(body: unknown): void {
  const itens = ler();
  itens.push({ id: `off_${Date.now()}_${Math.floor(Math.random() * 1000)}`, body, criadoEm: Date.now() });
  gravar(itens);
}

export function quantidadeNaFila(): number {
  return ler().length;
}

function removerDaFila(id: string) {
  gravar(ler().filter((x) => x.id !== id));
}

// Trava para não rodar dois esvaziamentos em paralelo (evita reenvio duplicado
// quando flush() é chamado no mount e no evento "online" ao mesmo tempo).
let emAndamento: Promise<number> | null = null;

/** Reenvia os itens da fila (um por vez, em ordem). Retorna quantos foram enviados. */
export function esvaziarFila(): Promise<number> {
  if (emAndamento) return emAndamento;
  const run = (async () => {
    let enviados = 0;
    // Re-lê a fila a cada iteração: assim itens enfileirados durante o envio
    // não são sobrescritos, e a remoção é feita item a item (idempotente).
    while (true) {
      const fila = ler();
      if (!fila.length) break;
      const item = fila[0];
      try {
        const res = await fetch("/api/lancamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });
        if (res.ok) {
          removerDaFila(item.id);
          enviados++;
        } else if (
          res.status >= 500 ||
          res.status === 401 ||
          res.status === 403 ||
          res.status === 408 ||
          res.status === 429
        ) {
          // Sessão expirada / servidor indisponível: mantém e tenta mais tarde.
          break;
        } else {
          // 4xx real de validação: o payload nunca vai passar, descarta para
          // não travar a fila (o item era válido quando salvo; caso raro).
          removerDaFila(item.id);
        }
      } catch {
        break; // ainda sem rede: mantém a fila e tenta depois
      }
    }
    return enviados;
  })();
  emAndamento = run;
  // Libera a trava quando terminar (mantém se outra execução já assumiu).
  run.finally(() => {
    if (emAndamento === run) emAndamento = null;
  });
  return run;
}
