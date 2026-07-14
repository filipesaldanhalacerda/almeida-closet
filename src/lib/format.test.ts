import { describe, expect, it } from "vitest";
import {
  anoMesParaMesRef,
  brl,
  brParaIso,
  centavosParaNumero,
  isoParaBR,
  mascaraTelefoneBR,
  mesRefParaAnoMes,
  normalizarBusca,
  numeroParaCentavos,
} from "./format";

describe("format pt-BR", () => {
  it("formata moeda brasileira", () => {
    expect(brl(1234.5)).toBe("R$ 1.234,50");
    expect(brl(0)).toBe("R$ 0,00");
  });

  it("converte ISO ↔ dd/mm/aaaa", () => {
    expect(isoParaBR("2026-07-11")).toBe("11/07/2026");
    expect(brParaIso("11/07/2026")).toBe("2026-07-11");
    expect(brParaIso("data inválida")).toBeNull();
  });

  it("converte centavos digitados", () => {
    expect(centavosParaNumero("12345")).toBe(123.45);
    expect(numeroParaCentavos(123.45)).toBe("12345");
  });

  it("normaliza texto para busca (sem acento, minúsculo, espaços)", () => {
    expect(normalizarBusca("Jéssica")).toBe("jessica");
    expect(normalizarBusca("  Márcia   Almeida ")).toBe("marcia almeida");
    expect(normalizarBusca("THAINÁ")).toBe("thaina");
    expect(normalizarBusca("")).toBe("");
    // mesma cliente escrita de formas diferentes normaliza igual
    expect(normalizarBusca("Ana Paula")).toBe(normalizarBusca("ana  paula"));
  });

  it("aplica máscara de telefone brasileiro", () => {
    expect(mascaraTelefoneBR("")).toBe("");
    expect(mascaraTelefoneBR("11")).toBe("(11");
    expect(mascaraTelefoneBR("1199")).toBe("(11) 99");
    // fixo: 10 dígitos
    expect(mascaraTelefoneBR("1132654789")).toBe("(11) 3265-4789");
    // celular: 11 dígitos
    expect(mascaraTelefoneBR("11991234567")).toBe("(11) 99123-4567");
    // ignora não-dígitos e limita a 11
    expect(mascaraTelefoneBR("(11) 99123-45678")).toBe("(11) 99123-4567");
  });

  it("converte mês de referência entre 'YYYY-MM' e rótulo", () => {
    expect(anoMesParaMesRef("2026-07")).toBe("Julho/2026");
    expect(anoMesParaMesRef("2026-03")).toBe("Março/2026");
    expect(anoMesParaMesRef("")).toBe("");
    expect(mesRefParaAnoMes("Julho/2026")).toBe("2026-07");
    expect(mesRefParaAnoMes("Março/2026")).toBe("2026-03");
    expect(mesRefParaAnoMes(null)).toBe("");
    expect(mesRefParaAnoMes("texto qualquer")).toBe("");
    // round-trip
    expect(mesRefParaAnoMes(anoMesParaMesRef("2025-12"))).toBe("2025-12");
  });
});
