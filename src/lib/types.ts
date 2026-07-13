// Tipos de domínio do Almeida Closet.

export type UserRole = "gestor" | "vendedora";

export type LancamentoTipo =
  | "venda"
  | "recebimento"
  | "despesa"
  | "devolucao_capital"
  | "investimento";

export type FormaPagamento =
  | "cartao_credito"
  | "cartao_debito"
  | "crediario"
  | "dinheiro"
  | "pix_transferencia"
  | "cheque";

export type MeioRecebimento =
  | "pix"
  | "cartao_credito"
  | "cartao_debito"
  | "dinheiro"
  | "cheque"
  | "picpay"
  | "transferencia";

export type ModalidadeVenda = "presencial" | "condicional" | "online";

export type DreGrupo =
  | "deducoes"
  | "custos_variaveis"
  | "despesas_administrativas"
  | "despesas_funcionarios"
  | "despesas_financeiras"
  | "investimentos"
  | "dividas";

export type ConviteTipo = "novo_acesso" | "reset_senha";

export interface Profile {
  id: string;
  nome: string;
  username: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

export interface CategoriaDespesa {
  id: string;
  nome: string;
  grupo_dre: DreGrupo;
}

export interface Lancamento {
  id: string;
  tipo: LancamentoTipo;
  valor: number;
  data: string; // ISO date (yyyy-mm-dd)

  forma_pagamento: FormaPagamento | null;
  cliente: string | null;
  modalidade: ModalidadeVenda | null;
  vendedora_id: string | null;

  meio: MeioRecebimento | null;
  cliente_ou_bandeira: string | null;
  bandeira: string | null;

  categoria_id: string | null;
  credor: string | null;
  mes_referencia: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;

  descricao: string | null;

  criado_por: string;
  atualizado_por: string | null;
  created_at: string;
  updated_at: string;
}

// Lançamento com dados relacionados resolvidos (para exibição)
export interface LancamentoView extends Lancamento {
  vendedora_nome?: string | null;
  criado_por_nome?: string | null;
  categoria_nome?: string | null;
  categoria_grupo?: DreGrupo | null;
}

export interface Convite {
  id: string;
  codigo: string;
  tipo: ConviteTipo;
  criado_por: string | null;
  usado_por: string | null;
  alvo_profile_id: string | null;
  usado_em: string | null;
  expira_em: string;
  created_at: string;
}

export interface Configuracao {
  id: number;
  saldo_inicial_caixa: number;
  saldo_inicial_data: string | null;
  updated_at: string;
}

export interface Meta {
  id: string;
  vendedora_id: string;
  valor: number;
  updated_at: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  observacao?: string | null;
}
