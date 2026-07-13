import { describe, expect, it } from "vitest";
import { gerarCodigo, normalizarCodigo } from "./codigo";

describe("gerarCodigo", () => {
  it("gera 6 caracteres alfanuméricos maiúsculos", () => {
    const c = gerarCodigo(6);
    expect(c).toHaveLength(6);
    expect(c).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("não usa caracteres ambíguos (0,O,1,I,L)", () => {
    for (let i = 0; i < 200; i++) {
      expect(gerarCodigo(6)).not.toMatch(/[0O1IL]/);
    }
  });

  it("normaliza o código digitado (maiúsculo, sem espaços/hífens)", () => {
    expect(normalizarCodigo(" ac-7k2m ")).toBe("AC7K2M");
  });
});
