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

/** Reenvia todos os itens da fila. Retorna quantos foram enviados. */
export async function esvaziarFila(): Promise<number> {
  const itens = ler();
  if (!itens.length) return 0;
  const restantes: FilaItem[] = [];
  let enviados = 0;
  for (const item of itens) {
    try {
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.body),
      });
      if (res.ok) enviados++;
      else if (res.status >= 500) restantes.push(item); // erro do servidor: tenta depois
      // erros 4xx (validação) são descartados para não travar a fila
    } catch {
      restantes.push(item); // ainda sem rede
    }
  }
  gravar(restantes);
  return enviados;
}
