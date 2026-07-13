import { describe, expect, it } from "vitest";
import { calcularFluxo } from "./fluxo";
import { lanc } from "./test-utils";

describe("calcularFluxo", () => {
  const dados = [
    // Antes de março: entra no saldo inicial do mês
    lanc({ tipo: "recebimento", valor: 300, data: "2025-02-20" }),
    // Março
    lanc({ tipo: "recebimento", valor: 500, data: "2025-03-05" }),
    lanc({ tipo: "despesa", valor: 200, data: "2025-03-10", data_pagamento: "2025-03-10" }),
    lanc({ tipo: "devolucao_capital", valor: 100, data: "2025-03-15" }),
    // Aporte NÃO afeta o caixa (regra do projeto)
    lanc({ tipo: "investimento", valor: 5000, data: "2025-03-16" }),
  ];

  const f = calcularFluxo(dados, 2025, 3, 1000, "2025-01-01");

  it("acumula o saldo inicial do mês com movimentos anteriores", () => {
    expect(f.saldoInicialMes).toBe(1300); // 1000 + 300
  });

  it("soma entradas (recebimentos) e saídas (despesas pagas + devoluções)", () => {
    expect(f.entradas).toBe(500);
    expect(f.saidas).toBe(300); // 200 despesa + 100 devolução
  });

  it("calcula o saldo final acumulado", () => {
    expect(f.saldoFinal).toBe(1500); // 1300 + 500 - 300
  });

  it("gera as linhas diárias em ordem com saldo corrente", () => {
    expect(f.dias.map((d) => d.dia)).toEqual(["05/03", "10/03", "15/03"]);
    expect(f.dias[0].saldoFinal).toBe(1800);
    expect(f.dias[1].saldoFinal).toBe(1600);
    expect(f.dias[2].saldoFinal).toBe(1500);
  });

  it("ignora aportes de capital no caixa", () => {
    // se aporte contasse, entradas seriam 5500
    expect(f.entradas).toBe(500);
  });
});
