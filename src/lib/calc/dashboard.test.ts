import { describe, expect, it } from "vitest";
import { calcularDashboard } from "./dashboard";
import { lanc } from "./test-utils";

describe("calcularDashboard", () => {
  const dados = [
    lanc({ tipo: "venda", valor: 100, data: "2025-06-10", forma_pagamento: "dinheiro", vendedora_id: "v1", vendedora_nome: "Ana", cliente: "Cliente A" }),
    lanc({ tipo: "venda", valor: 200, data: "2025-06-11", forma_pagamento: "pix_transferencia", vendedora_id: "v1", vendedora_nome: "Ana", cliente: "Cliente A" }),
    lanc({ tipo: "recebimento", valor: 250, data: "2025-06-10", meio: "dinheiro" }),
    lanc({ tipo: "despesa", valor: 80, data: "2025-06-12", data_pagamento: "2025-06-12", categoria_nome: "Aluguel" }),
  ];

  const d = calcularDashboard(dados, 2025, 6, {
    saldoInicialCaixa: 1000,
    saldoInicialData: "2025-01-01",
    metas: [{ vendedora_id: "v1", valor: 500 }],
    vendedoras: [{ id: "v1", nome: "Ana" }],
    hoje: "2025-06-10",
  });

  it("recebido do mês = soma dos recebimentos", () => {
    expect(d.recebido).toBe(250);
  });

  it("despesas do mês = soma das despesas", () => {
    expect(d.despesas).toBe(80);
  });

  it("resultado do mês = recebido − despesas", () => {
    expect(d.resultado).toBe(170);
  });

  it("volume de vendas, contagem e ticket médio", () => {
    expect(d.vendasVolume).toBe(300);
    expect(d.vendasCount).toBe(2);
    expect(d.ticketMedio).toBe(150);
  });

  it("saldo de caixa = saldo inicial + recebimentos − despesas pagas", () => {
    expect(d.saldoCaixa).toBe(1000 + 250 - 80);
  });

  it("resumo do dia considera apenas o dia de hoje", () => {
    expect(d.resumoDia.vendas).toBe(1); // só a venda de 10/06
    expect(d.resumoDia.recebido).toBe(250);
    expect(d.resumoDia.despesas).toBe(0);
    expect(d.semLancamentosHoje).toBe(false);
  });

  it("meta com progresso: 300 de 500 = 60%", () => {
    const meta = d.metas.find((m) => m.id === "v1")!;
    expect(meta.vendas).toBe(300);
    expect(meta.pctReal).toBeCloseTo(60, 4);
  });

  it("top clientes agrega por cliente", () => {
    expect(d.topClientes[0]).toMatchObject({ nome: "Cliente A", valor: 300, qtd: 2 });
  });
});
