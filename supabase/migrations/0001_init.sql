-- ============================================================================
-- Almeida Closet — Gestão de Lançamentos
-- Migração inicial: enums, tabelas, índices, RLS, views e dados de referência.
-- Executar no SQL Editor do Supabase (ou via CLI). Idempotente onde possível.
-- ============================================================================

-- Extensões (gen_random_uuid vem do pgcrypto, já disponível no Supabase)
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('gestor', 'vendedora');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lancamento_tipo as enum ('venda', 'recebimento', 'despesa', 'devolucao_capital', 'investimento');
exception when duplicate_object then null; end $$;

do $$ begin
  create type forma_pagamento as enum ('cartao_credito', 'cartao_debito', 'crediario', 'dinheiro', 'pix_transferencia', 'cheque');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meio_recebimento as enum ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'cheque', 'picpay', 'transferencia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type modalidade_venda as enum ('presencial', 'condicional', 'online');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dre_grupo as enum ('deducoes', 'custos_variaveis', 'despesas_administrativas', 'despesas_funcionarios', 'despesas_financeiras', 'investimentos', 'dividas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type convite_tipo as enum ('novo_acesso', 'reset_senha');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- TABELAS
-- ----------------------------------------------------------------------------

-- Perfis (1:1 com auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  username    text not null unique,
  role        user_role not null default 'vendedora',
  ativo       boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Convites de acesso (código gerado pelo gestor)
create table if not exists public.convites (
  id                uuid primary key default gen_random_uuid(),
  codigo            text not null unique,
  tipo              convite_tipo not null default 'novo_acesso',
  criado_por        uuid references public.profiles(id) on delete set null,
  usado_por         uuid references public.profiles(id) on delete set null,
  alvo_profile_id   uuid references public.profiles(id) on delete cascade, -- para reset_senha
  usado_em          timestamptz,
  expira_em         timestamptz not null,
  created_at        timestamptz not null default now()
);

-- Categorias de despesa mapeadas a um grupo do DRE
create table if not exists public.categorias_despesa (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null unique,
  grupo_dre   dre_grupo not null,
  created_at  timestamptz not null default now()
);

-- Lançamentos (entrou / saiu). Coluna única com campos por tipo.
create table if not exists public.lancamentos (
  id                uuid primary key default gen_random_uuid(),
  tipo              lancamento_tipo not null,
  valor             numeric(12,2) not null check (valor >= 0),
  data              date not null,

  -- venda
  forma_pagamento   forma_pagamento,
  cliente           text,
  modalidade        modalidade_venda,
  vendedora_id      uuid references public.profiles(id) on delete set null,

  -- recebimento
  meio              meio_recebimento,
  cliente_ou_bandeira text,

  -- despesa
  categoria_id      uuid references public.categorias_despesa(id) on delete set null,
  credor            text,
  mes_referencia    text,
  data_vencimento   date,
  data_pagamento    date,

  -- capital (devolucao_capital / investimento)
  descricao         text,

  -- auditoria
  criado_por        uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  atualizado_por    uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_lancamentos_data on public.lancamentos (data);
create index if not exists idx_lancamentos_tipo on public.lancamentos (tipo);
create index if not exists idx_lancamentos_criado_por on public.lancamentos (criado_por);
create index if not exists idx_lancamentos_vendedora on public.lancamentos (vendedora_id);
create index if not exists idx_lancamentos_data_pagamento on public.lancamentos (data_pagamento);

-- Configuração única (saldo inicial do caixa)
create table if not exists public.configuracoes (
  id                    int primary key default 1 check (id = 1),
  saldo_inicial_caixa   numeric(12,2) not null default 0,
  saldo_inicial_data    date,
  updated_at            timestamptz not null default now()
);

insert into public.configuracoes (id, saldo_inicial_caixa, saldo_inicial_data)
values (1, 0, null)
on conflict (id) do nothing;

-- Metas mensais por vendedora
create table if not exists public.metas (
  id             uuid primary key default gen_random_uuid(),
  vendedora_id   uuid not null references public.profiles(id) on delete cascade unique,
  valor          numeric(12,2) not null default 0,
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TRIGGERS (updated_at)
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_lancamentos_updated on public.lancamentos;
create trigger trg_lancamentos_updated before update on public.lancamentos
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- HELPER: is_gestor() — evita recursão de RLS usando SECURITY DEFINER
-- ----------------------------------------------------------------------------
create or replace function public.is_gestor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'gestor' and ativo = true
  );
$$;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.convites          enable row level security;
alter table public.categorias_despesa enable row level security;
alter table public.lancamentos       enable row level security;
alter table public.configuracoes     enable row level security;
alter table public.metas             enable row level security;

-- profiles: usuário vê o próprio; gestor vê todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_gestor());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (public.is_gestor()) with check (public.is_gestor());

-- lançamentos: gestor total; vendedora só os que criou
drop policy if exists lancamentos_select on public.lancamentos;
create policy lancamentos_select on public.lancamentos for select
  using (public.is_gestor() or criado_por = auth.uid());

drop policy if exists lancamentos_insert on public.lancamentos;
create policy lancamentos_insert on public.lancamentos for insert
  with check (criado_por = auth.uid());

drop policy if exists lancamentos_update on public.lancamentos;
create policy lancamentos_update on public.lancamentos for update
  using (public.is_gestor() or criado_por = auth.uid())
  with check (public.is_gestor() or criado_por = auth.uid());

drop policy if exists lancamentos_delete on public.lancamentos;
create policy lancamentos_delete on public.lancamentos for delete
  using (public.is_gestor() or criado_por = auth.uid());

-- categorias: qualquer autenticado lê; só gestor gerencia
drop policy if exists categorias_select on public.categorias_despesa;
create policy categorias_select on public.categorias_despesa for select
  using (auth.role() = 'authenticated');

drop policy if exists categorias_all on public.categorias_despesa;
create policy categorias_all on public.categorias_despesa for all
  using (public.is_gestor()) with check (public.is_gestor());

-- configurações / metas / convites: apenas gestor
drop policy if exists config_all on public.configuracoes;
create policy config_all on public.configuracoes for all
  using (public.is_gestor()) with check (public.is_gestor());

drop policy if exists metas_all on public.metas;
create policy metas_all on public.metas for all
  using (public.is_gestor()) with check (public.is_gestor());

drop policy if exists convites_all on public.convites;
create policy convites_all on public.convites for all
  using (public.is_gestor()) with check (public.is_gestor());

-- ----------------------------------------------------------------------------
-- REALTIME (últimos lançamentos em tempo real no dashboard)
-- ----------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.lancamentos;
exception when duplicate_object then null; when others then null; end $$;

-- ----------------------------------------------------------------------------
-- VIEWS de agregação (security_invoker => aplica a RLS de quem consulta).
-- Usadas por relatórios/analytics; os cálculos principais também são feitos
-- na camada da aplicação (src/lib/calc) e cobertos por testes.
-- ----------------------------------------------------------------------------

-- Vendas por ano/mês/forma de pagamento (base da Receita Bruta do DRE)
create or replace view public.vw_receita_por_forma_mes
with (security_invoker = true) as
select
  extract(year from data)::int  as ano,
  extract(month from data)::int as mes,
  forma_pagamento,
  sum(valor) as total
from public.lancamentos
where tipo = 'venda'
group by 1, 2, 3;

-- Despesas por ano/mês/grupo do DRE
create or replace view public.vw_despesa_por_grupo_mes
with (security_invoker = true) as
select
  extract(year from l.data)::int  as ano,
  extract(month from l.data)::int as mes,
  c.grupo_dre,
  sum(l.valor) as total
from public.lancamentos l
join public.categorias_despesa c on c.id = l.categoria_id
where l.tipo = 'despesa'
group by 1, 2, 3;

-- Fluxo diário: entradas (recebimentos por data) e saídas (despesas pagas por
-- data_pagamento + devoluções de capital por data)
create or replace view public.vw_fluxo_diario
with (security_invoker = true) as
select dia, sum(entrada) as entradas, sum(saida) as saidas
from (
  select data as dia, valor as entrada, 0::numeric as saida
    from public.lancamentos where tipo = 'recebimento'
  union all
  select coalesce(data_pagamento, data) as dia, 0::numeric, valor
    from public.lancamentos where tipo = 'despesa'
  union all
  select data as dia, 0::numeric, valor
    from public.lancamentos where tipo = 'devolucao_capital'
) t
group by dia;

-- Vendas por vendedora / mês (Resultado de Vendas)
create or replace view public.vw_vendas_por_vendedora_mes
with (security_invoker = true) as
select
  extract(year from l.data)::int  as ano,
  extract(month from l.data)::int as mes,
  l.vendedora_id,
  p.nome as vendedora_nome,
  sum(l.valor) as total,
  count(*) as qtd
from public.lancamentos l
left join public.profiles p on p.id = l.vendedora_id
where l.tipo = 'venda'
group by 1, 2, 3, 4;

-- ----------------------------------------------------------------------------
-- DADOS DE REFERÊNCIA: categorias de despesa mapeadas ao grupo do DRE
-- (lista real do gestor — ver design/README.md e enunciado)
-- ----------------------------------------------------------------------------
insert into public.categorias_despesa (nome, grupo_dre) values
  ('Simples Nacional', 'deducoes'),
  ('Comissão de Vendas', 'custos_variaveis'),
  ('Embalagens', 'custos_variaveis'),
  ('Fornecedor', 'custos_variaveis'),
  ('Taxas de Cartão', 'custos_variaveis'),
  ('Água', 'despesas_administrativas'),
  ('Aluguel', 'despesas_administrativas'),
  ('Contabilidade', 'despesas_administrativas'),
  ('Energia', 'despesas_administrativas'),
  ('Internet', 'despesas_administrativas'),
  ('IPTU', 'despesas_administrativas'),
  ('Manutenção e Conservação', 'despesas_administrativas'),
  ('Manutenção de Sistema', 'despesas_administrativas'),
  ('Outras despesas', 'despesas_administrativas'),
  ('Propaganda e Marketing', 'despesas_administrativas'),
  ('Pró-labore', 'despesas_administrativas'),
  ('Serviço de Terceiro', 'despesas_administrativas'),
  ('Supermercado/Padaria', 'despesas_administrativas'),
  ('Telefonia', 'despesas_administrativas'),
  ('Folha de Pagamento', 'despesas_funcionarios'),
  ('FGTS', 'despesas_funcionarios'),
  ('INSS', 'despesas_funcionarios'),
  ('Plano de Saúde', 'despesas_funcionarios'),
  ('Premiação', 'despesas_funcionarios'),
  ('Rescisão', 'despesas_funcionarios'),
  ('Provisionamento de férias', 'despesas_funcionarios'),
  ('Provisionamento de 13º', 'despesas_funcionarios'),
  ('Vale Transporte', 'despesas_funcionarios'),
  ('Juros/Multa por atraso', 'despesas_financeiras'),
  ('Taxas Bancárias', 'despesas_financeiras'),
  ('Máquinas e Equipamentos', 'investimentos'),
  ('Obras', 'investimentos'),
  ('Empréstimos', 'dividas')
on conflict (nome) do nothing;
