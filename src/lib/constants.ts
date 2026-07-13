// Taxonomia de domínio: rótulos pt-BR, cores semânticas e mapeamentos.
// Ver design/README.md seções 5, 8 e 9.

import type {
  DreGrupo,
  FormaPagamento,
  LancamentoTipo,
  MeioRecebimento,
  ModalidadeVenda,
} from "./types";

// ---- Cores semânticas por tipo (design tokens) ----------------------------
export const TIPO_CORES: Record<
  "venda" | "recebimento" | "despesa" | "capital",
  { fg: string; bg: string }
> = {
  venda: { fg: "#2f7d5b", bg: "#e7f1ec" },
  recebimento: { fg: "#2b6f74", bg: "#e2eff0" },
  despesa: { fg: "#b04a34", bg: "#f7e8e2" },
  capital: { fg: "#8c6f52", bg: "#f2ece2" },
};

export function corDoTipo(tipo: LancamentoTipo) {
  if (tipo === "venda") return TIPO_CORES.venda;
  if (tipo === "recebimento") return TIPO_CORES.recebimento;
  if (tipo === "despesa") return TIPO_CORES.despesa;
  return TIPO_CORES.capital; // devolucao_capital / investimento
}

// ---- Formas de pagamento (venda) ------------------------------------------
export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: "cartao_credito", label: "Cartão de Crédito" },
  { value: "cartao_debito", label: "Cartão de Débito" },
  { value: "crediario", label: "Crediário" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix_transferencia", label: "Pix/Transferência" },
  { value: "cheque", label: "Cheque" },
];

export const FORMA_LABEL: Record<FormaPagamento, string> = Object.fromEntries(
  FORMAS_PAGAMENTO.map((f) => [f.value, f.label]),
) as Record<FormaPagamento, string>;

// ---- Meios de recebimento --------------------------------------------------
export const MEIOS_RECEBIMENTO: { value: MeioRecebimento; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "cartao_credito", label: "SIPAG Crédito" },
  { value: "cartao_debito", label: "SIPAG Débito" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cheque", label: "Cheque" },
  { value: "picpay", label: "PicPay" },
  { value: "transferencia", label: "Transferência" },
];

export const MEIO_LABEL: Record<MeioRecebimento, string> = Object.fromEntries(
  MEIOS_RECEBIMENTO.map((m) => [m.value, m.label]),
) as Record<MeioRecebimento, string>;

// ---- Modalidades de venda --------------------------------------------------
export const MODALIDADES: { value: ModalidadeVenda; label: string }[] = [
  { value: "presencial", label: "Presencial" },
  { value: "condicional", label: "Condicional" },
  { value: "online", label: "Online" },
];

export const MODALIDADE_LABEL: Record<ModalidadeVenda, string> =
  Object.fromEntries(MODALIDADES.map((m) => [m.value, m.label])) as Record<
    ModalidadeVenda,
    string
  >;

// ---- Grupos do DRE ---------------------------------------------------------
export const DRE_GRUPO_LABEL: Record<DreGrupo, string> = {
  deducoes: "Deduções",
  custos_variaveis: "Custos Variáveis",
  despesas_administrativas: "Despesas Administrativas",
  despesas_funcionarios: "Despesas com Funcionários",
  despesas_financeiras: "Despesas Financeiras",
  investimentos: "Investimentos",
  dividas: "Dívidas",
};

// Opções do select de grupo (Configurações)
export const DRE_GRUPOS: { value: DreGrupo; label: string }[] = (
  Object.keys(DRE_GRUPO_LABEL) as DreGrupo[]
).map((g) => ({ value: g, label: DRE_GRUPO_LABEL[g] }));

// Formas de pagamento na ordem da Receita Bruta do DRE (linhas)
export const RECEITA_BRUTA_FORMAS: FormaPagamento[] = [
  "cartao_credito",
  "cartao_debito",
  "cheque",
  "crediario",
  "dinheiro",
  "pix_transferencia",
];

export const TIPO_LABEL: Record<LancamentoTipo, string> = {
  venda: "Venda",
  recebimento: "Recebimento",
  despesa: "Despesa",
  devolucao_capital: "Devolução de Capital",
  investimento: "Aporte",
};

// Meses
export const MESES_ABBR = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const MESES_LONGOS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export const DIAS_SEMANA = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// Clientes/vendedoras de exemplo (autocomplete e seed)
export const CLIENTES_EXEMPLO = [
  "Amanda Jabor",
  "Luciana Dutra",
  "Joyce Rangel",
  "Marina Alves",
  "Patrícia Nunes",
  "Bruna Sales",
  "Camila Rocha",
  "Fernanda Lima",
];
