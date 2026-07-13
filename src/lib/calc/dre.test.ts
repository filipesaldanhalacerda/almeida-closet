import { describe, expect, it } from "vitest";
import { calcularDre } from "./dre";
import { lanc } from "./test-utils";

// DRE de janeiro/2025 com valores conhecidos para validar todos os subtotais.
const dados = [
  // Receita Bruta = 1500
  lanc({ tipo: "venda", valor: 1000, data: "2025-01-05", forma_pagamento: "cartao_credito" }),
  lanc({ tipo: "venda", valor: 500, data: "2025-01-06", forma_pagamento: "dinheiro" }),
  // Deduções = 100
  lanc({ tipo: "despesa", valor: 100, data: "2025-01-07", categoria_nome: "Simples Nacional", categoria_grupo: "deducoes" }),
  // Custos Variáveis = 200
  lanc({ tipo: "despesa", valor: 200, data: "2025-01-08", categoria_nome: "Comissão de Vendas", categoria_grupo: "custos_variaveis" }),
  // Administrativas = 300
  lanc({ tipo: "despesa", valor: 300, data: "2025-01-09", categoria_nome: "Aluguel", categoria_grupo: "despesas_administrativas" }),
  // Funcionários = 400
  lanc({ tipo: "despesa", valor: 400, data: "2025-01-10", categoria_nome: "Folha de Pagamento", categoria_grupo: "despesas_funcionarios" }),
  // Financeiras = 50
  lanc({ tipo: "despesa", valor: 50, data: "2025-01-11", categoria_nome: "Taxas Bancárias", categoria_grupo: "despesas_financeiras" }),
  // Investimentos = 1000
  lanc({ tipo: "despesa", valor: 1000, data: "2025-01-12", categoria_nome: "Máquinas e Equipamentos", categoria_grupo: "investimentos" }),
  // Dívidas = 100
  lanc({ tipo: "despesa", valor: 100, data: "2025-01-13", categoria_nome: "Empréstimos", categoria_grupo: "dividas" }),
  // Capital NÃO deve entrar no DRE
  lanc({ tipo: "investimento", valor: 9999, data: "2025-01-14", descricao: "aporte" }),
];

describe("calcularDre", () => {
  const dre = calcularDre(dados, 2025);
  const jan = (arr: number[]) => arr[0];

  it("soma a Receita Bruta por forma de pagamento", () => {
    expect(jan(dre.receitaBruta.meses)).toBe(1500);
    expect(dre.receitaBruta.total).toBe(1500);
  });

  it("calcula Receita Líquida = Receita Bruta − Deduções", () => {
    expect(jan(dre.receitaLiquida.meses)).toBe(1400);
  });

  it("calcula Margem de Contribuição = Receita Líquida − Custos Variáveis", () => {
    expect(jan(dre.margemContribuicao.meses)).toBe(1200);
  });

  it("calcula Resultado Operacional = MC − Adm − Func − Fin", () => {
    expect(jan(dre.resultadoOperacional.meses)).toBe(1200 - 300 - 400 - 50);
  });

  it("calcula Resultado Final = RO − Investimentos − Dívidas", () => {
    expect(jan(dre.resultadoFinal.meses)).toBe(450 - 1000 - 100);
    expect(dre.resumo.resultadoFinal).toBe(-650);
  });

  it("soma a Despesa Total de todos os grupos de saída", () => {
    expect(dre.resumo.despesaTotal).toBe(100 + 200 + 300 + 400 + 50 + 1000 + 100);
  });

  it("calcula a Margem de Lucro Líquida (%)", () => {
    expect(dre.resumo.margemPct).toBeCloseTo((-650 / 1500) * 100, 4);
  });

  it("não inclui movimentações de capital", () => {
    // Receita bruta permanece 1500 mesmo com o aporte de 9999 presente
    expect(dre.receitaBruta.total).toBe(1500);
  });
});
