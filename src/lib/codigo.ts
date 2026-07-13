// Geração de códigos de convite. 6 caracteres alfanuméricos, sem ambíguos
// (0/O, 1/I/L). Exibidos em maiúsculas.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function gerarCodigo(tamanho = 6): string {
  let out = "";
  const bytes = new Uint8Array(tamanho);
  // crypto disponível no Node 20 (globalThis.crypto) e no Edge.
  globalThis.crypto.getRandomValues(bytes);
  for (let i = 0; i < tamanho; i++) {
    out += ALFABETO[bytes[i] % ALFABETO.length];
  }
  return out;
}

/** Normaliza um código digitado pelo usuário (maiúsculo, sem espaços/hífens). */
export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/[\s-]/g, "");
}
