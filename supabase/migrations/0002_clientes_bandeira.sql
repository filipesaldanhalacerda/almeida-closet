-- ============================================================================
-- Migração 0002 — Cadastro de clientes + bandeira separada no recebimento.
-- Idempotente.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CLIENTES: cadastro simples para autocomplete e identificação
-- ----------------------------------------------------------------------------
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  telefone    text,
  observacao  text,
  criado_por  uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now()
);

-- Nome único (sem diferenciar maiúsculas/minúsculas)
create unique index if not exists idx_clientes_nome_lower
  on public.clientes (lower(nome));

alter table public.clientes enable row level security;

-- Todas as usuárias autenticadas leem e cadastram; só gestor edita/exclui
drop policy if exists clientes_select on public.clientes;
create policy clientes_select on public.clientes for select
  using (auth.role() = 'authenticated');

drop policy if exists clientes_insert on public.clientes;
create policy clientes_insert on public.clientes for insert
  with check (auth.role() = 'authenticated');

drop policy if exists clientes_update on public.clientes;
create policy clientes_update on public.clientes for update
  using (public.is_gestor()) with check (public.is_gestor());

drop policy if exists clientes_delete on public.clientes;
create policy clientes_delete on public.clientes for delete
  using (public.is_gestor());

-- Backfill: aproveita nomes já usados nos lançamentos (ignorando bandeiras)
insert into public.clientes (nome, criado_por)
select distinct trim(x.nome), null::uuid
from (
  select cliente as nome from public.lancamentos where cliente is not null
  union
  select cliente_ou_bandeira from public.lancamentos where cliente_ou_bandeira is not null
) x
where trim(coalesce(x.nome, '')) <> ''
  and upper(trim(x.nome)) not in ('VISA', 'MASTER', 'MASTERCARD', 'ELO', 'HIPERCARD', 'AMEX')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- LANÇAMENTOS: bandeira do cartão separada do nome da cliente (recebimento)
-- ----------------------------------------------------------------------------
alter table public.lancamentos add column if not exists bandeira text;

-- Backfill: recebimentos antigos cujo "cliente_ou_bandeira" era uma bandeira
update public.lancamentos
set bandeira = upper(trim(cliente_ou_bandeira))
where tipo = 'recebimento'
  and bandeira is null
  and upper(trim(coalesce(cliente_ou_bandeira, ''))) in ('VISA', 'MASTER', 'MASTERCARD', 'ELO', 'HIPERCARD', 'AMEX');

-- E os que eram nome de cliente, copia para a coluna cliente
update public.lancamentos
set cliente = trim(cliente_ou_bandeira)
where tipo = 'recebimento'
  and cliente is null
  and bandeira is null
  and trim(coalesce(cliente_ou_bandeira, '')) <> '';
