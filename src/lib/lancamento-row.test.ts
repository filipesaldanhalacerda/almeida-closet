import { describe, expect, it } from "vitest";
import { montarRowLancamento } from "./lancamento-row";
import type { LancamentoInput } from "./validators";

describe("montarRowLancamento", () => {
  it("venda de vendedora atribui vendedora_id ao próprio criador", () => {
    const input: LancamentoInput = {
      tipo: "venda", valor: 100, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "dinheiro", modalidade: "presencial",
    };
    const row = montarRowLancamento(input, { criadoPor: "u1", roleCriador: "vendedora" });
    expect(row.vendedora_id).toBe("u1");
    expect(row.forma_pagamento).toBe("dinheiro");
  });

  it("venda do gestor usa a vendedora selecionada", () => {
    const input: LancamentoInput = {
      tipo: "venda", valor: 100, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "dinheiro", modalidade: "presencial", vendedora_id: "vX" as string,
    };
    const row = montarRowLancamento(input, { criadoPor: "gestor", roleCriador: "gestor" });
    expect(row.vendedora_id).toBe("vX");
  });

  it("recebimento mapeia cliente e bandeira separados + coluna combinada", () => {
    const input: LancamentoInput = {
      tipo: "recebimento", valor: 80, data: "2026-07-11",
      cliente: "Amanda Jabor", bandeira: "VISA", meio: "cartao_credito",
    };
    const row = montarRowLancamento(input, { criadoPor: "u1", roleCriador: "vendedora" });
    expect(row.cliente).toBe("Amanda Jabor");
    expect(row.bandeira).toBe("VISA");
    expect(row.cliente_ou_bandeira).toBe("Amanda Jabor"); // combinada prioriza a cliente
    expect(row.vendedora_id).toBe("u1");
  });

  it("recebimento só com bandeira preenche a combinada com a bandeira", () => {
    const input: LancamentoInput = {
      tipo: "recebimento", valor: 80, data: "2026-07-11",
      cliente: "", bandeira: "MASTER", meio: "cartao_debito",
    };
    const row = montarRowLancamento(input, { criadoPor: "u1", roleCriador: "vendedora" });
    expect(row.cliente).toBeNull();
    expect(row.bandeira).toBe("MASTER");
    expect(row.cliente_ou_bandeira).toBe("MASTER");
  });

  it("despesa define data_pagamento igual à data quando não informada", () => {
    const input: LancamentoInput = {
      tipo: "despesa", valor: 50, data: "2026-07-11", categoria_id: "11111111-1111-1111-1111-111111111111",
      credor: "Loja", mes_referencia: "Julho/2026",
    };
    const row = montarRowLancamento(input, { criadoPor: "g", roleCriador: "gestor" });
    expect(row.data_pagamento).toBe("2026-07-11");
    expect(row.forma_pagamento).toBeNull();
    expect(row.cliente).toBeNull();
  });

  it("capital (aporte) preenche descrição e limpa campos de venda", () => {
    const input: LancamentoInput = {
      tipo: "investimento", valor: 1000, data: "2026-07-11", descricao: "Aporte",
    };
    const row = montarRowLancamento(input, { criadoPor: "g", roleCriador: "gestor" });
    expect(row.tipo).toBe("investimento");
    expect(row.descricao).toBe("Aporte");
    expect(row.categoria_id).toBeNull();
  });
});
