import { describe, expect, it } from "vitest";
import { brl, brParaIso, centavosParaNumero, isoParaBR, numeroParaCentavos } from "./format";

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
});
