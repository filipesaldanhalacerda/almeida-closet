import type { LancamentoInput } from "./validators";

/**
 * Converte a entrada validada (por tipo) numa linha da tabela `lancamentos`.
 * Campos não pertinentes ao tipo ficam null (limpeza ao editar entre tipos).
 */
export function montarRowLancamento(
  input: LancamentoInput,
  opts: { criadoPor: string; roleCriador: "gestor" | "vendedora" },
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    tipo: input.tipo,
    valor: input.valor,
    data: input.data,
    // limpa todos os campos específicos por padrão
    forma_pagamento: null,
    cliente: null,
    modalidade: null,
    vendedora_id: null,
    meio: null,
    cliente_ou_bandeira: null,
    bandeira: null,
    categoria_id: null,
    credor: null,
    mes_referencia: null,
    data_vencimento: null,
    data_pagamento: null,
    descricao: null,
  };

  if (input.tipo === "venda") {
    base.cliente = input.cliente;
    base.forma_pagamento = input.forma_pagamento;
    base.modalidade = input.modalidade;
    base.vendedora_id =
      input.vendedora_id ?? (opts.roleCriador === "vendedora" ? opts.criadoPor : null);
  } else if (input.tipo === "recebimento") {
    base.cliente = input.cliente.trim() || null;
    base.bandeira = input.bandeira.trim() || null;
    // compatibilidade com a planilha original: coluna combinada
    base.cliente_ou_bandeira = input.cliente.trim() || input.bandeira.trim() || null;
    base.meio = input.meio;
    base.vendedora_id =
      input.vendedora_id ?? (opts.roleCriador === "vendedora" ? opts.criadoPor : null);
  } else if (input.tipo === "despesa") {
    base.categoria_id = input.categoria_id;
    base.credor = input.credor || null;
    base.mes_referencia = input.mes_referencia || null;
    base.data_vencimento = input.data_vencimento ?? null;
    // Uma despesa lançada representa dinheiro que saiu: pagamento = data informada
    base.data_pagamento = input.data_pagamento ?? input.data;
  } else {
    // devolucao_capital / investimento
    base.descricao = input.descricao;
  }

  return base;
}
