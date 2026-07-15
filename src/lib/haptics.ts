// Feedback tátil leve via Vibration API. Progressive enhancement: onde não
// houver suporte (ex.: iOS Safari) vira no-op. Respeita quem prefere menos
// movimento/estímulo. Usar em ações relevantes: salvar, erro, trocar de aba,
// tocar o botão principal. Nada de vibrar a cada tecla.

function permitido(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  }
  return true;
}

function vibrar(padrao: number | number[]) {
  if (!permitido()) return;
  try {
    navigator.vibrate(padrao);
  } catch {
    // alguns navegadores lançam se chamado fora de um gesto do usuário
  }
}

export const haptics = {
  /** Toque sutil: seleção, troca de aba, chip. */
  leve() {
    vibrar(8);
  },
  /** Toque médio: ação primária (botão principal, FAB). */
  toque() {
    vibrar(12);
  },
  /** Sucesso: confirmação de algo salvo. */
  sucesso() {
    vibrar([10, 40, 18]);
  },
  /** Erro: validação falhou. */
  erro() {
    vibrar([22, 50, 22]);
  },
};
