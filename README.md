# Almeida Closet — Gestão de Lançamentos

Sistema web **mobile-first** para uma loja de roupas registrar o que **entrou** e o que
**saiu**: as vendedoras lançam vendas, recebimentos e despesas pelo próprio celular, e o
gestor acompanha tudo em tempo real por um painel completo (dashboard, DRE, fluxo de caixa,
resultado de vendas, capital) — todos os relatórios são **calculados automaticamente** dos
lançamentos. Custo de operação **zero** (Supabase + Vercel nos planos gratuitos).

- **Stack:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL, Auth, RLS, Realtime).
- **PWA:** dá para "instalar" no celular; funciona parcialmente offline (lançamentos ficam salvos no aparelho e são reenviados quando a internet volta).
- **Idioma:** 100% pt-BR, moeda R$, datas dd/mm/aaaa.

---

## Como funciona (regra de negócio)

O sistema **não** controla estoque, parcelas ou cobrança. Ele registra volume comercial e caixa:

- **Venda** = volume vendido (inclui crediário ainda não recebido). Base de "nº de vendas", "ticket médio", ranking.
- **Recebimento** = dinheiro que entrou no caixa.
- **Despesa** = dinheiro que saiu.
- **Capital** = aportes e retiradas dos sócios (não entram no resultado operacional do DRE).

Exemplo: cliente compra R$ 300 em 3× no crediário → registra-se uma **venda de R$ 300** (forma
Crediário) **e** um **recebimento de R$ 100** (o que ela pagou hoje). No mês seguinte, quando ela
paga mais, registra-se **apenas um novo recebimento**. Não existe "quanto falta pagar".

---

## Autenticação (sem e-mail) — decisão de arquitetura

Escolhemos **Supabase Auth com e-mail sintético interno**: cada usuário tem um e-mail fictício
`usuario@almeidacloset.local` (a confirmação de e-mail fica desativada). É a opção mais simples e
segura, porque a segurança de dados (RLS) usa o `auth.uid()` nativo do Supabase.

- **Primeiro acesso:** o gestor gera um **código** na tela Equipe e entrega à vendedora. Ela abre
  "Primeiro acesso com código", digita o código, escolhe nome/usuário/senha → conta criada e ativa.
  O código expira após o uso ou em **7 dias**.
- **Login:** usuário + senha.
- **Recuperação de senha:** sem e-mail. O gestor gera um **código de redefinição** para a vendedora,
  que cria uma nova senha na mesma tela de primeiro acesso.
- **Papéis:** `gestor` e `vendedora`. O papel fica no `app_metadata` do usuário (guarda de rotas) e
  também na tabela `profiles` (fonte de verdade da RLS).

**Segurança (RLS aplicada no banco, não só no front):** a vendedora só faz SELECT/UPDATE/DELETE
nos lançamentos onde `criado_por = auth.uid()`; não acessa agregados nem lançamentos alheios. O
gestor tem acesso total. As telas `/admin/*` e `/app/*` também são protegidas por middleware.

---

## Passo a passo de publicação (para leigos)

> Você vai precisar de: uma conta gratuita no **Supabase** (supabase.com) e uma no **Vercel**
> (vercel.com). Ambas aceitam login com GitHub/Google. Nada é pago.

### 1) Criar o projeto no Supabase (grátis)

1. Entre em https://supabase.com → **New project**.
2. Dê um nome (ex.: `almeida-closet`), crie uma **senha do banco** (guarde-a) e escolha a região
   mais próxima (ex.: São Paulo). Clique em **Create new project** e aguarde ~1 minuto.

### 2) Rodar a migração (criar as tabelas)

1. No painel do Supabase, abra **SQL Editor** (menu lateral) → **New query**.
2. Abra o arquivo [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) deste
   projeto, **copie todo o conteúdo**, cole no editor e clique em **Run**.
   Isso cria as tabelas, os enums, as views, a **segurança (RLS)** e as **categorias de despesa**.

### 3) Pegar as chaves de acesso

No Supabase: **Project Settings** (engrenagem) → **API**. Anote:

- **Project URL** (algo como `https://xxxx.supabase.co`)
- **anon public** (chave pública)
- **service_role** (chave secreta — nunca exponha no navegador)

### 4) Configurar o projeto localmente e criar o primeiro gestor

Com o [Node.js 20+](https://nodejs.org) instalado, no terminal, dentro da pasta do projeto:

```bash
npm install
cp .env.local.example .env.local     # no Windows (PowerShell): copy .env.local.example .env.local
```

Abra o `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=...          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...     # anon public
SUPABASE_SERVICE_ROLE_KEY=...         # service_role (secreta)
AUTH_EMAIL_DOMAIN=almeidacloset.local
SEED_GESTOR_NOME=Rafael Almeida
SEED_GESTOR_USUARIO=rafael
SEED_GESTOR_SENHA=troque-esta-senha
```

Depois rode o **seed**, que cria o gestor, 3 vendedoras de exemplo, o saldo inicial, as metas e
~60 lançamentos variados para você ver o sistema funcionando:

```bash
npm run seed
```

Ao final ele imprime os usuários criados:

- **Gestor:** usuário `rafael` / senha definida em `SEED_GESTOR_SENHA`.
- **Vendedoras:** `thaina`, `mariaclara`, `lucyelli` — senha `vendedora123`.

> Para começar **sem dados de exemplo**, edite o `scripts/seed.ts` e remova as seções de
> lançamentos, ou simplesmente exclua os lançamentos depois pela tela Lançamentos do gestor.

Para rodar localmente: `npm run dev` e abra http://localhost:3000.

### 5) Publicar na Vercel (grátis)

1. Suba este projeto para um repositório no GitHub (ou use o `vercel` CLI).
2. Em https://vercel.com → **Add New… → Project** → importe o repositório.
3. Em **Environment Variables**, adicione as mesmas 4 variáveis do `.env.local`
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `AUTH_EMAIL_DOMAIN`). **Deploy**.
4. Pronto: a Vercel te dá um endereço `https://seu-projeto.vercel.app`.

> As variáveis `SEED_GESTOR_*` só são usadas pelo script de seed (rodado por você), não precisam
> ir para a Vercel.

### 6) Como a vendedora "instala" o app no celular

1. Abra o endereço do sistema no **Chrome** (Android) ou **Safari** (iPhone).
2. **Android/Chrome:** menu (⋮) → **Adicionar à tela inicial**.
   **iPhone/Safari:** botão Compartilhar → **Adicionar à Tela de Início**.
3. O ícone "Almeida Closet" aparece como um app. Ela abre, toca em **Primeiro acesso com código**,
   digita o código que você gerou na tela Equipe e cria a própria senha.

---

## Uso rápido

**Vendedora (celular):** login → **+ Novo lançamento** → escolhe Venda/Recebimento/Despesa →
digita o valor no teclado → salva (até 3 toques). Vê e edita só os próprios lançamentos.

**Gestor (desktop ou celular):**
- **Dashboard:** resultado do mês, KPIs, gráficos, ranking, resumo do dia, metas, top clientes, comparativo com o ano anterior e últimos lançamentos em tempo real.
- **Lançamentos:** filtra por vendedora/tipo/busca e edita ou exclui qualquer um.
- **DRE anual, Fluxo de Caixa, Capital, Resultado de Vendas:** relatórios calculados automaticamente.
- **Equipe:** gera códigos de acesso/redefinição e ativa/desativa vendedoras.
- **Configurações:** saldo inicial do caixa, metas por vendedora e grupo do DRE de cada categoria.
- **Exportar:** baixa um Excel (.xlsx) com as abas Receita, Despesa, DRE, Fluxo de Caixa,
  Resultado de Vendas e Investimento e Devolução.

---

## Desenvolvimento

```bash
npm run dev      # ambiente local (http://localhost:3000)
npm run build    # build de produção
npm run seed     # popula o banco com dados de exemplo
npm test         # testes das regras críticas (DRE, fluxo, dashboard, capital, etc.)
```

### Estrutura

```
src/
  app/                  Rotas (App Router): /login, /primeiro-acesso, /app/* (vendedora), /admin/* (gestor), /api/*
  components/           UI compartilhada (design system, formulário, telas do gestor)
  lib/
    calc/               Cálculo dos relatórios (DRE, fluxo, dashboard, capital, resultado) — testado
    supabase/           Clientes browser/server/admin + middleware de sessão
    data.ts             Acesso a dados (server)
    validators.ts       Validação com Zod
    export/excel.ts     Geração do Excel
supabase/migrations/    Schema SQL (tabelas, enums, RLS, views, categorias)
scripts/                seed.ts (dados de exemplo) e gen-icons.mjs (ícones do PWA)
design/                 Protótipo de referência (HTML) e handoff de design
```

### Definições de cálculo (documentadas)

- **DRE — Receita Bruta** = soma das **vendas** do mês por forma de pagamento. Deduções, Custos
  Variáveis e Despesas = soma das **despesas** do mês agrupadas pelo `grupo_dre` da categoria.
  Receita Líquida = Receita Bruta − Deduções; Margem de Contribuição = Receita Líquida − Custos
  Variáveis; Resultado Operacional = Margem − (Adm + Funcionários + Financeiras); Resultado Final =
  Resultado Operacional − Investimentos − Dívidas.
- **Fluxo de Caixa** — Entradas = recebimentos do dia; Saídas = despesas pagas (`data_pagamento`)
  + devoluções de capital. Recebimentos representam o dinheiro que entrou (sem dupla contagem com
  as vendas). Saldo Final = acumulado a partir do saldo inicial de Configurações.
- **Saldo de caixa** = saldo inicial + recebimentos − despesas pagas − devoluções de capital.

> Observação sobre aportes: por consistência com a definição de Fluxo de Caixa acima, aportes de
> capital aparecem apenas na tela **Capital** e não são somados ao caixa.
