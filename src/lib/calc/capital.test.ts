import { describe, expect, it } from "vitest";
import { calcularCapital } from "./capital";
import { lanc } from "./test-utils";

describe("calcularCapital", () => {
  const dados = [
    lanc({ tipo: "investimento", valor: 20000, data: "2025-01-10", descricao: "Aporte inicial" }),
    lanc({ tipo: "investimento", valor: 12000, data: "2025-05-05", descricao: "Reforma" }),
    lanc({ tipo: "devolucao_capital", valor: 5000, data: "2025-03-12", descricao: "Pró-labore" }),
  ];
  const c = calcularCapital(dados);

  it("calcula o acumulado (running total) dos aportes", () => {
    expect(c.aportes.map((a) => a.acumulado)).toEqual([20000, 32000]);
  });

  it("totaliza aportes, devoluções e capital líquido", () => {
    expect(c.totalAportes).toBe(32000);
    expect(c.totalDevolucoes).toBe(5000);
    expect(c.liquido).toBe(27000);
  });
});
