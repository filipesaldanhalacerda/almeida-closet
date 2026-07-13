import { describe, expect, it } from "vitest";
import { calcularResultadoVendas } from "./resultado";
import { lanc } from "./test-utils";

describe("calcularResultadoVendas", () => {
  const dados = [
    lanc({ tipo: "venda", valor: 6000, data: "2025-04-10", vendedora_id: "a", vendedora_nome: "Ana", modalidade: "presencial" }),
    lanc({ tipo: "venda", valor: 4000, data: "2025-04-11", vendedora_id: "b", vendedora_nome: "Bia", modalidade: "online" }),
  ];
  const r = calcularResultadoVendas(dados, 2025);

  it("calcula participação por vendedora", () => {
    expect(r.totalAno).toBe(10000);
    const ana = r.vendedoras.find((v) => v.id === "a")!;
    const bia = r.vendedoras.find((v) => v.id === "b")!;
    expect(ana.pct).toBeCloseTo(60, 4);
    expect(bia.pct).toBeCloseTo(40, 4);
  });

  it("agrupa vendas por modalidade com percentual", () => {
    const presencial = r.modalidades.find((m) => m.modalidade === "presencial")!;
    const online = r.modalidades.find((m) => m.modalidade === "online")!;
    expect(presencial.valor).toBe(6000);
    expect(presencial.pct).toBeCloseTo(60, 4);
    expect(online.valor).toBe(4000);
  });

  it("distribui as vendas nos meses corretos (abril)", () => {
    const ana = r.vendedoras.find((v) => v.id === "a")!;
    expect(ana.meses[3]).toBe(6000); // índice 3 = abril
  });
});
