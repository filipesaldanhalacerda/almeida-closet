// Formatação pt-BR: moeda R$, datas dd/mm/aaaa, percentuais.
import { DIAS_SEMANA, MESES_LONGOS } from "./constants";

/** Formata número como moeda brasileira: R$ 1.234,56 */
export function brl(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return (
    "R$ " +
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Moeda com sinal explícito para lançamentos (+ receita, − saída) */
export function brlSinal(n: number, saida: boolean): string {
  return (saida ? "− " : "+ ") + brl(Math.abs(n));
}

/** Inteiro com separador de milhar pt-BR */
export function fmtInt(n: number): string {
  return Math.round(n || 0).toLocaleString("pt-BR");
}

/** Percentual pt-BR: 12,3% */
export function pct(n: number, casas = 1): string {
  const v = Number.isFinite(n) ? n : 0;
  return (
    v.toLocaleString("pt-BR", {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    }) + "%"
  );
}

/** ISO (yyyy-mm-dd) -> dd/mm/aaaa */
export function isoParaBR(iso?: string | null): string {
  if (!iso) return "—";
  const p = iso.slice(0, 10).split("-");
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** dd/mm/aaaa -> ISO (yyyy-mm-dd). Retorna null se inválido. */
export function brParaIso(br?: string | null): string | null {
  if (!br) return null;
  const m = br.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Data por extenso: "sábado, 11 de julho" */
export function dataPorExtenso(iso: string): string {
  const p = iso.slice(0, 10).split("-");
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return `${DIAS_SEMANA[d.getDay()]}, ${+p[2]} de ${MESES_LONGOS[+p[1] - 1]}`;
}

/** "Julho de 2026" a partir de ano/mês (mês 1-12) */
export function periodoLabel(ano: number, mes: number): string {
  const nome = MESES_LONGOS[mes - 1] || "";
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

/** Mês de referência no formato "Julho/2026" */
export function mesRefLabel(ano: number, mes: number): string {
  const nome = MESES_LONGOS[mes - 1] || "";
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)}/${ano}`;
}

/**
 * Normaliza um texto para busca: sem acentos, minúsculo, espaços colapsados.
 * Ex.: "  Jéssica  Almeida " -> "jessica almeida". Usado para achar clientes
 * mesmo com acentuação/caixa diferentes e evitar cadastros duplicados.
 */
export function normalizarBusca(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Máscara de telefone brasileiro, formatando enquanto se digita.
 * Fixo: "(11) 1234-5678" (10 dígitos) · Celular: "(11) 91234-5678" (11).
 * Ignora tudo que não for dígito e limita a 11 dígitos.
 */
export function mascaraTelefoneBR(v: string): string {
  const d = (v || "").replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Iniciais de um nome: "Maria Clara" -> "MC" */
export function iniciais(nome: string): string {
  return (nome || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Centavos (string de dígitos) -> número. Ex: "12345" -> 123.45 */
export function centavosParaNumero(digits: string): number {
  const n = parseInt(digits || "0", 10) || 0;
  return n / 100;
}

/** Número -> string de centavos. Ex: 123.45 -> "12345" */
export function numeroParaCentavos(n: number): string {
  return String(Math.round((n || 0) * 100));
}

/** Hoje em ISO (yyyy-mm-dd), fuso local */
export function hojeIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Extrai ano/mês de uma ISO date */
export function anoMes(iso: string): { ano: number; mes: number } {
  const p = iso.slice(0, 10).split("-");
  return { ano: +p[0], mes: +p[1] };
}
