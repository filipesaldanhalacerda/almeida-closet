import type { LancamentoView } from "../types";

let n = 0;

/** Fábrica de LancamentoView para testes (preenche defaults). */
export function lanc(partial: Partial<LancamentoView> & Pick<LancamentoView, "tipo" | "valor" | "data">): LancamentoView {
  n += 1;
  return {
    id: partial.id ?? `t${n}`,
    tipo: partial.tipo,
    valor: partial.valor,
    data: partial.data,
    forma_pagamento: partial.forma_pagamento ?? null,
    cliente: partial.cliente ?? null,
    modalidade: partial.modalidade ?? null,
    vendedora_id: partial.vendedora_id ?? null,
    meio: partial.meio ?? null,
    cliente_ou_bandeira: partial.cliente_ou_bandeira ?? null,
    bandeira: partial.bandeira ?? null,
    categoria_id: partial.categoria_id ?? null,
    credor: partial.credor ?? null,
    mes_referencia: partial.mes_referencia ?? null,
    data_vencimento: partial.data_vencimento ?? null,
    data_pagamento: partial.data_pagamento ?? null,
    descricao: partial.descricao ?? null,
    criado_por: partial.criado_por ?? "u0",
    atualizado_por: partial.atualizado_por ?? null,
    created_at: partial.created_at ?? `${partial.data}T12:00:00Z`,
    updated_at: partial.updated_at ?? `${partial.data}T12:00:00Z`,
    vendedora_nome: partial.vendedora_nome ?? null,
    criado_por_nome: partial.criado_por_nome ?? null,
    categoria_nome: partial.categoria_nome ?? null,
    categoria_grupo: partial.categoria_grupo ?? null,
  };
}
