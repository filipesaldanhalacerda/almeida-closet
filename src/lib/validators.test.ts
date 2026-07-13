import { describe, expect, it } from "vitest";
import { lancamentoSchema, primeiroAcessoSchema } from "./validators";

describe("primeiroAcessoSchema (criação por código)", () => {
  const base = { codigo: "AC12BC", nome: "Thainá", username: "thaina", senha: "123456", senha2: "123456" };

  it("aceita dados válidos e normaliza código/usuário", () => {
    const r = primeiroAcessoSchema.parse({ ...base, codigo: "ac12bc", username: "Thaina" });
    expect(r.codigo).toBe("AC12BC");
    expect(r.username).toBe("thaina");
  });

  it("rejeita senhas diferentes", () => {
    const r = primeiroAcessoSchema.safeParse({ ...base, senha2: "999999" });
    expect(r.success).toBe(false);
  });

  it("rejeita senha curta", () => {
    const r = primeiroAcessoSchema.safeParse({ ...base, senha: "123", senha2: "123" });
    expect(r.success).toBe(false);
  });

  it("rejeita usuário com caracteres inválidos", () => {
    const r = primeiroAcessoSchema.safeParse({ ...base, username: "thaina alves!" });
    expect(r.success).toBe(false);
  });
});

describe("lancamentoSchema", () => {
  it("rejeita venda com valor zero", () => {
    const r = lancamentoSchema.safeParse({
      tipo: "venda", valor: 0, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "dinheiro", modalidade: "presencial",
    });
    expect(r.success).toBe(false);
  });

  it("aceita venda válida", () => {
    const r = lancamentoSchema.safeParse({
      tipo: "venda", valor: 100, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "dinheiro", modalidade: "presencial",
    });
    expect(r.success).toBe(true);
  });

  it("exige categoria na despesa", () => {
    const r = lancamentoSchema.safeParse({
      tipo: "despesa", valor: 100, data: "2026-07-11", credor: "Loja",
    });
    expect(r.success).toBe(false);
  });

  it("recebimento exige cliente OU bandeira", () => {
    const semNada = lancamentoSchema.safeParse({
      tipo: "recebimento", valor: 50, data: "2026-07-11", meio: "pix",
    });
    expect(semNada.success).toBe(false);

    const soBandeira = lancamentoSchema.safeParse({
      tipo: "recebimento", valor: 50, data: "2026-07-11", meio: "cartao_credito", bandeira: "VISA",
    });
    expect(soBandeira.success).toBe(true);

    const soCliente = lancamentoSchema.safeParse({
      tipo: "recebimento", valor: 50, data: "2026-07-11", meio: "pix", cliente: "Ana",
    });
    expect(soCliente.success).toBe(true);
  });

  it("venda aceita recebimento embutido (e valida o valor dele)", () => {
    const ok = lancamentoSchema.safeParse({
      tipo: "venda", valor: 300, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "crediario", modalidade: "presencial",
      recebimento: { valor: 100, meio: "dinheiro" },
    });
    expect(ok.success).toBe(true);

    const invalido = lancamentoSchema.safeParse({
      tipo: "venda", valor: 300, data: "2026-07-11", cliente: "Ana",
      forma_pagamento: "crediario", modalidade: "presencial",
      recebimento: { valor: 0, meio: "dinheiro" },
    });
    expect(invalido.success).toBe(false);
  });
});
