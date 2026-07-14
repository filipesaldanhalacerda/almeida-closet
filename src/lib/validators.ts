import { z } from "zod";

// ---- Auth ------------------------------------------------------------------
export const loginSchema = z.object({
  usuario: z.string().trim().min(1, "Informe o usuário"),
  senha: z.string().min(1, "Informe a senha"),
});

export const validarCodigoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .min(4, "Código inválido")
    .max(12, "Código inválido"),
});

export const primeiroAcessoSchema = z
  .object({
    codigo: z.string().trim().toUpperCase().min(4).max(12),
    nome: z.string().trim().min(2, "Informe seu nome").max(80),
    username: z
      .string()
      .trim()
      .toLowerCase()
      .min(3, "Usuário: mínimo 3 caracteres")
      .max(30)
      .regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou _"),
    senha: z.string().min(6, "Senha: mínimo 6 caracteres"),
    senha2: z.string().min(6, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.senha2, {
    message: "As senhas não conferem",
    path: ["senha2"],
  });

export const resetSenhaSchema = z
  .object({
    codigo: z.string().trim().toUpperCase().min(4).max(12),
    senha: z.string().min(6, "Senha: mínimo 6 caracteres"),
    senha2: z.string().min(6, "Confirme a senha"),
  })
  .refine((d) => d.senha === d.senha2, {
    message: "As senhas não conferem",
    path: ["senha2"],
  });

// ---- Enums de domínio ------------------------------------------------------
const tipoEnum = z.enum([
  "venda",
  "recebimento",
  "despesa",
  "devolucao_capital",
  "investimento",
]);
const formaEnum = z.enum([
  "cartao_credito",
  "cartao_debito",
  "crediario",
  "dinheiro",
  "pix_transferencia",
  "cheque",
]);
const meioEnum = z.enum([
  "pix",
  "cartao_credito",
  "cartao_debito",
  "dinheiro",
  "cheque",
  "picpay",
  "transferencia",
]);
const modalidadeEnum = z.enum(["presencial", "condicional", "online"]);

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use aaaa-mm-dd)");

const valorPositivo = z
  .number({ invalid_type_error: "Valor inválido" })
  .positive("O valor deve ser maior que zero");

// ---- Lançamentos (discriminado por tipo) -----------------------------------
export const vendaSchema = z.object({
  tipo: z.literal("venda"),
  valor: valorPositivo,
  data: isoDate,
  cliente: z.string().trim().min(1, "Informe a cliente").max(120),
  forma_pagamento: formaEnum,
  modalidade: modalidadeEnum,
  vendedora_id: z.string().uuid().nullable().optional(),
  // Recebimento embutido: registra venda + dinheiro que entrou num só envio
  recebimento: z
    .object({
      valor: valorPositivo,
      meio: meioEnum,
    })
    .nullable()
    .optional(),
});

export const recebimentoSchema = z.object({
  tipo: z.literal("recebimento"),
  valor: valorPositivo,
  data: isoDate,
  cliente: z.string().trim().max(120).optional().default(""),
  bandeira: z.string().trim().max(40).optional().default(""),
  meio: meioEnum,
  vendedora_id: z.string().uuid().nullable().optional(),
});

export const despesaSchema = z.object({
  tipo: z.literal("despesa"),
  valor: valorPositivo,
  data: isoDate,
  categoria_id: z.string().uuid("Selecione a categoria"),
  credor: z.string().trim().max(160).optional().default(""),
  mes_referencia: z.string().trim().max(40).optional().default(""),
  data_vencimento: isoDate.nullable().optional(),
  data_pagamento: isoDate.nullable().optional(),
});

export const capitalSchema = z.object({
  tipo: z.enum(["devolucao_capital", "investimento"]),
  valor: valorPositivo,
  data: isoDate,
  descricao: z.string().trim().min(1, "Informe a descrição").max(160),
});

const lancamentoUnion = z.discriminatedUnion("tipo", [
  vendaSchema,
  recebimentoSchema,
  despesaSchema,
  capitalSchema,
]);

// Regra do recebimento: precisa de cliente OU bandeira
export const lancamentoSchema = lancamentoUnion.superRefine((d, ctx) => {
  if (d.tipo === "recebimento" && d.cliente.trim() === "" && d.bandeira.trim() === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe a cliente ou a bandeira do cartão",
      path: ["cliente"],
    });
  }
});

export type LancamentoInput = z.infer<typeof lancamentoUnion>;

// ---- Clientes ----------------------------------------------------------------
export const clienteSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da cliente").max(80),
  telefone: z.string().trim().max(25).optional().default(""),
});

// ---- Configurações / metas / categorias / convites -------------------------
export const conviteSchema = z.object({
  tipo: z.enum(["novo_acesso", "reset_senha"]).default("novo_acesso"),
  alvo_profile_id: z.string().uuid().nullable().optional(),
});

export const configSchema = z.object({
  saldo_inicial_caixa: z.number().min(0),
  saldo_inicial_data: isoDate.nullable().optional(),
});

export const metaSchema = z.object({
  vendedora_id: z.string().uuid(),
  valor: z.number().min(0),
});

const dreGrupoEnum = z.enum([
  "deducoes",
  "custos_variaveis",
  "despesas_administrativas",
  "despesas_funcionarios",
  "despesas_financeiras",
  "investimentos",
  "dividas",
]);

export const categoriaGrupoSchema = z.object({
  id: z.string().uuid(),
  grupo_dre: dreGrupoEnum,
});

export const categoriaNovaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da categoria").max(60),
  grupo_dre: dreGrupoEnum,
});

export { tipoEnum, formaEnum, meioEnum, modalidadeEnum };
