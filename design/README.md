# Handoff: Almeida Closet — Gestão de Lançamentos

> Documento de especificação para implementação. Um desenvolvedor que **não** participou da conversa deve conseguir implementar o produto lendo só este README + o protótipo HTML anexado.

---

## 1. Visão geral

Sistema web **mobile-first** para uma loja de roupas femininas (Almeida Closet) que substitui o processo em papel + planilha Excel. Hoje as vendedoras anotam vendas/gastos no papel, mandam foto ao gestor no fim do dia, e o gestor digita numa planilha. O sistema faz cada **vendedora lançar pelo próprio celular**, direto no banco, e o **gestor acompanha tudo em tempo real** (dashboard, relatórios calculados automaticamente e exportação).

O produto é pensado como **piloto white-label**: visual neutro e sóbrio para poder ser vendido a outras lojas depois. Idioma 100% **pt-BR**, moeda **R$** com máscara brasileira, datas **dd/mm/aaaa**. **Nunca usar emojis** — somente ícones de traço (stroke) limpos que comuniquem a função.

### Regra de negócio central (LER COM ATENÇÃO)
O sistema registra **O QUE ENTROU** e **O QUE SAIU**. Ele **NÃO** é controle de parcelas, contas a receber, cobrança ou estoque.

Exemplo canônico: cliente compra um vestido de R$ 300 em 3× no crediário da loja.
- A vendedora registra uma **VENDA** de R$ 300 (forma: Crediário) → isso é *volume comercial*.
- E registra um **RECEBIMENTO** de R$ 100 (o que a cliente pagou hoje) → isso é *dinheiro que entrou no caixa*.
- No mês seguinte, quando a cliente paga mais R$ 100, registra-se **apenas um novo RECEBIMENTO de R$ 100**.
- **Não existe** "quanto falta pagar". Sem cobrança, sem saldo devedor.

Consequência para os cálculos:
- **Venda** = volume comercial vendido (inclui crediário ainda não recebido). Base para "nº de vendas", "ticket médio", "vendas por vendedora/forma/modalidade".
- **Recebimento** = dinheiro que efetivamente entrou no caixa. Base para "receita/entrou".
- **Despesa** = dinheiro que saiu.
- **Resultado de caixa** = Recebimentos − Despesas.

---

## 2. Sobre os arquivos de design

O arquivo `Almeida Closet.dc.html` neste pacote é uma **referência de design criada em HTML** — um protótipo interativo que mostra o **visual e o comportamento pretendidos**. **Não é código de produção para copiar/colar.**

A tarefa é **recriar estas telas no ambiente do codebase alvo** usando os padrões da stack escolhida. Alvo declarado pelo cliente: **Next.js (App Router) + Tailwind CSS + React**, componentes funcionais com dados mock realistas. Se o repositório já tiver um design system/UI kit, use-o; senão, monte um pequeno design system reutilizável (Button, Input, Chip, Card, Table, Modal, Toast, KPI, EmptyState) a partir dos tokens da seção 9.

Para abrir o protótipo: basta abrir o `.html` no navegador. No topo há um seletor **Vendedora ⇄ Gestor**; no perfil Gestor há um alternador **Desktop / Celular**; no perfil Vendedora há um menu para pular entre telas e estados.

## 3. Fidelidade

**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos, raios, sombras e interações são finais. Recrie a UI fielmente com as libs/padrões do codebase. Onde houver conflito com o design system existente do cliente, o design system existente prevalece — mas mantenha a hierarquia e a densidade destas telas.

---

## 4. Usuários e permissões

### Vendedora (100% celular, foco em velocidade — máximo 3 toques até salvar)
- Lança **vendas, recebimentos e despesas** em segundos, no balcão.
- Vê e edita **somente os próprios lançamentos**.
- **NÃO** vê dashboard, totais da loja, lançamentos de outras vendedoras, nem qualquer número consolidado (pode ver a **contagem** dos próprios lançamentos do dia, nunca somatórios de dinheiro da loja).
- **Primeiro acesso sem e-mail**: recebe um **código** do gestor → entra com o código → cria uma senha → pronto.

### Gestor (responsivo: desktop com sidebar, celular com bottom nav)
- Dashboard completo com todos os números da loja.
- Vê, edita e exclui **qualquer** lançamento de qualquer vendedora.
- Lança receitas, despesas (aluguel, folha, impostos…) e **movimentações de capital** (aportes e retiradas dos sócios).
- Gera **códigos de acesso** para novas vendedoras e desativa acessos.
- **Exporta** para Excel.
- **Todos os relatórios (DRE, Fluxo de Caixa, Resultado de Vendas) são CALCULADOS automaticamente** a partir dos lançamentos — o gestor nunca digita esses números.

---

## 5. Taxonomia de dados (usar exatamente)

### Lançamento de RECEITA
**Venda** — formas: `Cartão de Crédito`, `Cartão de Débito`, `Crediário`, `Dinheiro`, `Pix/Transferência`, `Cheque`.
Campos: data da venda, cliente, valor, forma, vendedora, **modalidade**.

**Recebimento** — meios: `PIX`, `SIPAG Crédito`, `SIPAG Débito`, `Dinheiro`, `Cheque`, `PicPay`, `Transferência`.
Campos: data do recebimento, cliente **ou bandeira** (ex. `MASTER`/`VISA`), valor, meio.

**Modalidade de venda**: `Presencial`, `Condicional`, `Online`.

### Lançamento de DESPESA
Campos: categoria, credor/detalhamento, valor, mês de referência, data de vencimento, data de pagamento.

**Categorias (lista real do gestor):** Aluguel, Água, Comissão de Vendas, Contabilidade, Devolução de Capital, Embalagens, Energia, FGTS, Folha de Pagamento, Fornecedor, INSS, Internet, IPTU, Juros/Multa por atraso, Manutenção e Conservação, Manutenção de Sistema, Máquinas e Equipamentos, Obras, Outras despesas, Plano de Saúde, Premiação, Propaganda e Marketing, Provisionamento de 13º, Provisionamento de férias, Pró-labore, Rescisão, Serviço de Terceiro, Simples Nacional, Supermercado/Padaria, Taxas Bancárias, Telefonia, Vale Transporte.

### Movimentação de CAPITAL (somente o gestor lança)
`Aporte` (entrada de capital dos sócios) e `Devolução de Capital` (retirada do sócio).
Campos: tipo, descrição, data, valor. As telas exibem também o **valor acumulado**. Capital **não** entra no resultado operacional do DRE.

### Mocks realistas
Clientes: Amanda Jabor, Luciana Dutra, Joyce Rangel, Marina Alves, Patrícia Nunes, Bruna Sales, Camila Rocha, Fernanda Lima. Vendedoras: Thainá, Maria Clara, Lucyelli (podem entrar/sair outras). Valores entre **R$ 79 e R$ 750** nas vendas de balcão. Gestor: Rafael Almeida.

---

## 6. Telas

Convenção comum: fundo do app `#f7f6f3`, superfícies de card `#fff`, sombra sutil (ver tokens). Todo input tem `<label>`; foco visível; alvos de toque ≥ 48px no mobile.

### Autenticação (mobile)

**6.1 Login** — Marca "Almeida Closet" em wordmark grande (empilhado em 2 linhas), eyebrow "GESTÃO DE LANÇAMENTOS". Campos: *Usuário ou código* e *Senha* (56px alt, raio 14, anel de foco `0 0 0 3px rgba(28,26,23,.07)`). Botão primário "Entrar" (58px, preto, seta →, sombra). Divisor "ou". Botão secundário delineado "Primeiro acesso com código". Rodapé: "Esqueceu a senha? Fale com a gerência."

**6.2 Primeiro acesso** — Fluxo em 2 passos na mesma tela. Passo 1: input de **código de 6 dígitos** (grande, letter-spacing largo, centralizado) + "Validar código". Passo 2: "Nova senha" + "Confirmar senha" + "Criar senha e entrar". Botão "Voltar" no topo.

**6.3 Boas-vindas** — Ícone de check em círculo (animação de "pop"), "Bem-vinda, Thainá!", subtítulo, botão "Começar" → Home.

### App da vendedora (mobile)

**6.4 Home** — Cabeçalho: avatar circular com inicial + eyebrow "VENDEDORA" + "Olá, {nome}"; botão de logout; pílula de data por extenso ("sábado, 11 de julho"). CTA gigante preto "**+ Novo lançamento**" (76px alt). Seção "Seus lançamentos de hoje" com **contagem** (nunca soma em R$). Lista de cards dos lançamentos DELA de hoje (ícone por tipo, título, subtítulo, valor colorido, hora). **Bottom nav**: Início · botão central + (FAB) · Lançamentos. Empty state quando não há lançamentos.

**6.5 Novo lançamento** — Cabeçalho com voltar + título. **Seletor de tipo** segmentado: Venda / Recebimento / Despesa. **Valor** grande + **teclado numérico** na tela (dígitos constroem centavos; tecla C limpa; ⌫ apaga). Campos **adaptativos por tipo**:
- Venda: cliente (input com **autocomplete** de clientes conhecidos), forma (chips), modalidade (chips), data.
- Recebimento: cliente/bandeira (input), meio (chips), data.
- Despesa: categoria (select), credor/detalhamento, vencimento, mês de referência, valor, data.
Campo de data padrão = hoje. Botão fixo no rodapé "Salvar lançamento" (desabilitado se valor = 0). Meta de velocidade: **≤ 3 toques até salvar**.

**6.6 Meus lançamentos** — Voltar + título + busca (por cliente/categoria). Chips de filtro por tipo (Tudo / Vendas / Recebimentos / Despesas). Lista **agrupada por dia** (grupo "Hoje · 11/07/2026", depois datas). Cada card abre a edição. Empty state de busca.

**6.7 Editar lançamento** — Mesmo formulário do 6.5, pré-preenchido; botão "Salvar alterações"; botão "Excluir lançamento" que abre **confirmação** (bottom sheet) "Excluir lançamento?" com Sim/Cancelar.

**6.8 Estados** — **Sucesso**: overlay com círculo de check animado ("Lançamento salvo") + toast; auto-volta para a Home. **Lista vazia**: ilustração/placeholder + texto. **Erro de conexão**: ícone de alerta, "Sem conexão", mensagem de que o lançamento **ficou salvo no aparelho e será enviado automaticamente** quando a internet voltar, botão "Tentar novamente".

### App do gestor (desktop com sidebar; celular com bottom nav)

Layout desktop: janela com barra, **sidebar 240px** (marca "Almeida Closet / GESTÃO" + navegação com ícones + rodapé com usuário/logout) e área principal com **topbar** (título + filtro de período "Julho de 2026" + botão "Novo lançamento"). Sidebar navega entre as telas abaixo.

**6.9 Dashboard** — Ordem de hierarquia: **primeiro o resultado do mês** (banner preto com "Resultado do mês", valor grande, "Entrou X · Saiu Y" e um **mini-gráfico de tendência** dos recebimentos dos últimos 6 meses), depois **KPIs** (cards com ícone + **selo de variação %** + valor tabular): *Recebido no mês, Despesas, Vendas (volume), Ticket médio, Saldo de caixa*. Depois: **gráfico Recebido × Despesa (6 meses)** em barras, **ranking de vendas por vendedora** (barras horizontais), **receita por forma de pagamento**, **despesas por categoria**, e **últimos lançamentos em tempo real** (com nome da vendedora). Filtro de período no topo.

**6.10 Lançamentos (todos)** — Filtros: vendedora (select), tipo (select), busca (cliente/categoria/credor). **Tabela** com colunas: Data, Vendedora, Tipo (badge colorido), Descrição (título + detalhe), Modalidade, Valor, Ações (editar/excluir). Excluir abre modal de confirmação centralizado. Empty state.

**6.11 Novo lançamento do gestor** — Igual ao da vendedora + campo **"Registrado por"** (select: Gestor ou uma vendedora) + 4º tipo **Capital**. Em desktop o valor é digitado (input) em vez de teclado numérico. Aba **Capital**: tipo (Aporte/Devolução em chips), descrição, valor, data. Despesa inclui categoria/credor/vencimento/mês ref.

**6.12 DRE anual** — Réplica da aba "DRE": **matriz com meses nas colunas (Jan…Dez + Total)** e contas agrupadas nas linhas, **grupos expansíveis/recolhíveis** (chevron), subtotais destacados, **valores negativos em vermelho**. Seletor de ano (2023/2024/2025) e comparativo entre anos. Cards-resumo no topo: Receita Bruta, Despesa Total, Margem de Lucro Líquida (%), Resultado Final. Coluna de conta fixa (sticky) e rolagem horizontal. Estrutura exata na seção 8. Em mobile: versão condensada por mês *(a fazer — o protótipo entrega o mobile do gestor com abas operacionais; ver seção 12)*.

**6.13 Fluxo de Caixa** — Réplica da aba "Fluxo de Caixa": **saldo inicial** (configurável uma única vez em Configurações) e, por dia: **Entradas** (recebimentos), **Saídas** (despesas pagas), **Saldo do Dia** e **Saldo Final acumulado**. **Gráfico de linha** da evolução do saldo. Navegação por mês. **Dias negativos em destaque** (linha em vermelho/fundo tint). Cards-resumo: Saldo inicial, Entradas, Saídas, Saldo final.

**6.14 Capital (Investimentos e Devoluções)** — Réplica da aba "Investimento e Devolução": **duas listas lado a lado** — Investimento (aportes) e Devolução de Capital (retiradas) — cada uma com descrição, data, valor e **valor acumulado**. Cards-resumo: Total de aportes, Total de devoluções, Capital líquido investido.

**6.15 Resultado de Vendas** — Réplica da aba "Resultado de Vendas": **vendas mensais por vendedora** com **% de participação** de cada uma no total (gráfico de **barras empilhadas** por mês + tabela de participação), e **vendas por modalidade** (Presencial/Condicional/Online). Seletor de ano + legenda por vendedora.

**6.16 Equipe** — Lista de vendedoras (ativa/inativa, total lançado no mês em nº e R$). Botão "**Gerar código de acesso**" abre modal com o código (ex.: `AC-7K2M`) para **copiar** ou **enviar por WhatsApp**, com validade. Ação de desativar/reativar acesso.

**6.17 Exportar** — Escolher período e baixar **Excel** no formato da planilha atual, com uma aba por relatório: **Receita, Despesa, DRE, Fluxo de Caixa, Resultado de Vendas, Investimento e Devolução**. Mostra prévia da contagem de linhas por aba. Botão "Baixar planilha (.xlsx)".

**6.18 Configurações** — **Saldo inicial do caixa** (base do Fluxo de Caixa, definido uma vez). **Metas mensais por vendedora** (input por vendedora). **Categorias de despesa e seu grupo no DRE** (cada categoria com um select que define em qual grupo do DRE ela é somada).

### App do gestor (celular, bottom nav)
Bottom nav com 3 abas operacionais: **Início** (dashboard condensado: resultado + KPIs em grade 2 col + ranking), **Lançamentos** (lista) e **Equipe** (cards + gerar código em bottom sheet). As telas analíticas (DRE, Fluxo, Capital, Resultado, Config) são desktop-first (ver seção 12).

---

## 7. Interações e comportamento

- **Navegação vendedora**: Login → (ou Primeiro acesso → Boas-vindas) → Home → Novo/Lista/Editar. Bottom nav persistente na Home e na Lista.
- **Salvar (vendedora)**: valida valor > 0 → grava → tela de **Sucesso** (~1,2s) → volta à Home + **toast** "Lançamento salvo".
- **Salvar (gestor)**: grava → volta a Lançamentos (ou Capital, se movimentação de capital) + toast.
- **Excluir**: abre confirmação (bottom sheet no mobile, modal centralizado no desktop) → remove → toast.
- **Autocomplete de cliente**: sugere clientes cujo nome contém o texto digitado (dropdown, máx. ~4).
- **Teclado numérico**: cada dígito acrescenta aos centavos; exibe formatado em R$ ao vivo; C limpa; ⌫ apaga.
- **DRE**: clicar no cabeçalho de um grupo expande/recolhe suas contas-filhas; trocar o ano recalcula toda a matriz.
- **Filtros (Lançamentos)**: vendedora + tipo + busca combinam (AND) e refiltram a tabela ao vivo.
- **Gerar código**: mostra código; "Copiar" usa `navigator.clipboard` + toast "Código copiado".
- **Animações**: check de sucesso (`pop`, ~.55s cubic-bezier), toast (slide-up ~.3s), bottom sheet (slide-up ~.26s), overlays com fade (~.16s). Botões: `active` faz `scale(.99)`.
- **Responsivo**: gestor = sidebar no desktop, bottom nav no celular. Vendedora = sempre mobile.
- **Estados**: loading (skeleton opcional), vazio, erro de conexão (com aviso de gravação local/offline-first).

---

## 8. Lógica dos relatórios (calculados, não digitados)

### DRE anual — estrutura de linhas (nesta ordem)
1. **Receita Bruta** *(grupo, abre por forma de venda)*: Cartão de Crédito, Cartão de Débito, Cheque, Crediário, Dinheiro, PicPay, Pix/Transferência.
2. **Deduções**: Simples Nacional.
3. **= Receita Líquida** = Receita Bruta − Deduções *(subtotal)*.
4. **Custos Variáveis**: Comissão de Vendas, Embalagens, Fornecedor, Taxas de Cartão.
5. **= Margem de Contribuição** = Receita Líquida − Custos Variáveis *(subtotal)*.
6. **Despesas Administrativas**: Água, Aluguel, Contabilidade, Energia, Internet, IPTU, Manutenção e Conservação, Manutenção de Sistema, Outras Despesas, Propaganda e Marketing, Pró-labore, Serviço de Terceiro, Supermercado/Padaria, Telefonia.
7. **Despesas com Funcionários**: Folha de Pagamento, FGTS, INSS, Plano de Saúde, Premiação, Rescisão, Provisionamento de férias, Provisionamento de 13º, Vale Transporte.
8. **Despesas Financeiras**: Juros/Multa por atraso, Taxas Bancárias.
9. **= Resultado Operacional** = Margem de Contribuição − Adm − Funcionários − Financeiras *(subtotal)*.
10. **Investimentos**: Máquinas e Equipamentos, Obras.
11. **Dívidas**: Empréstimos.
12. **= Resultado Final** = Resultado Operacional − Investimentos − Dívidas *(subtotal)*.

**Resumo final**: Receita Bruta (Σ ano), Despesa Total (Σ de todos os grupos de saída), Margem de Lucro Líquida = Resultado Final ÷ Receita Bruta (%), Resultado Final. Negativos em vermelho. Coluna "Total" = soma dos 12 meses. No produto real, cada célula é a soma dos lançamentos daquele mês mapeados à conta (mapeamento categoria→grupo vem de Configurações).

### Fluxo de Caixa
Por dia do mês: `Entradas` = Σ recebimentos do dia; `Saídas` = Σ despesas pagas no dia; `Saldo do Dia` = Entradas − Saídas; `Saldo Final` = Saldo Final anterior + Saldo do Dia (acumulado a partir do **saldo inicial** de Configurações). Gráfico de linha = série do Saldo Final. Dias com Saldo Final < 0 destacados.

### Resultado de Vendas
Vendas por vendedora por mês; `% participação` = vendas da vendedora ÷ total do mês (ou do ano). Barras empilhadas por mês (um segmento por vendedora). Vendas por modalidade = Σ vendas agrupadas por Presencial/Condicional/Online.

---

## 9. Design tokens

### Tipografia
- Família única: **Public Sans** (Google Fonts), pesos 400/500/600/700/800. Fallback `system-ui, sans-serif`.
- Números em cards/tabelas: `font-variant-numeric: tabular-nums`.
- Escala aprox.: valor hero 40–46px/800; título de tela 20–34px/800; título de card 15px/700; label 12,5–13px/700; corpo 14–16px; auxiliar 12px; eyebrow 11px/700 `letter-spacing:.14–.24em` `text-transform:uppercase`.
- Tracking de títulos: `letter-spacing:-.01 a -.03em`.

### Cores
| Papel | Hex |
|---|---|
| Tinta principal (texto/botão primário) | `#1c1a17` |
| Texto médio | `#42403b` / `#6f6a63` |
| Texto fraco / placeholder | `#a09a90` / `#b0a99e` / `#b4afa6` |
| Superfície (card) | `#ffffff` |
| Fundo do app (mobile) | `#f7f6f3` |
| Canvas (fora do frame) | gradiente radial `#efece5 → #e6e2da → #ded9d0` |
| Linha / borda de card | `#ece7df` |
| Borda de input | `#e3dfd8` / `#e0ddd5` |
| **Receita/Venda** (verde) | texto `#2f7d5b` · fundo `#e7f1ec` |
| **Recebimento** (teal, distinto da venda) | texto `#2b6f74` · fundo `#e2eff0` |
| **Despesa** (terracota) | texto `#b04a34` · fundo `#f7e8e2` |
| Capital (âmbar neutro) | `#8c6f52` |
| Selo de variação (+) | texto `#2f7d5b` · fundo `#edf3ee` |
| Cores do gráfico empilhado (vendedoras) | `#2b6f74`, `#8c6f52`, `#b04a34` |

> Semântica: receita = verde; despesa = vermelho/terracota; **recebimento diferenciado da venda** (teal + ícone próprio). Contraste mínimo AA.

### Raio de borda
Inputs/botões 12–14px · cards 14–16px · chips/pílulas 999px · avatar 50% · frame de telefone 38–48px.

### Sombra (profundidade sutil dos cards)
`0 1px 2px rgba(40,36,30,.03), 0 14px 30px -22px rgba(40,36,30,.16)`
Botão primário: `0 10–12px 26px -12px rgba(28,26,23,.6)`.

### Espaçamento
Escala base 4px (usados: 6/8/10/12/14/16/18/20/22/24/28/40). Gutter de conteúdo desktop 24–28px; padding de card 16–22px; padding de tela mobile 20–30px.

### Ícones
Somente **stroke** (traço), `viewBox 0 0 24 24`, `stroke-width ~1.9`, `stroke-linecap/linejoin: round`, `currentColor`. Conjunto usado: plus, home, list, search, chevron, back, logout, trash, edit, calendar, tag (venda), banknote (recebimento), arrow-out (despesa), wallet (saldo), users, download, chart/bars, sliders (configurações), alert, check, copy. **Nunca emojis.** Recomenda-se **Lucide** (ou equivalente da stack) no produto real.

---

## 10. Estado (state) sugerido

- **Auth**: usuário logado, papel (`vendedora` | `gestor`), sessão. Primeiro acesso: passo (código → senha).
- **Lançamentos**: coleção de entries `{ id, tipo: 'venda'|'recebimento'|'despesa', valor, data, hora, sellerName, ...campos por tipo }`. Vendedora vê só os seus; gestor vê todos.
- **Formulário**: tipo atual, valor (em centavos durante digitação), campos por tipo, `editingId`.
- **Filtros**: vendedora/tipo/busca (lançamentos gestor); tipo/período/busca (lista vendedora).
- **DRE**: ano selecionado, grupos expandidos.
- **Fluxo**: mês selecionado; `saldoInicial` (config).
- **Config**: `saldoInicial`, `metas` por vendedora, mapa `categoria → grupo DRE`.
- **UI**: toast (mensagem + timeout), modais/sheets (excluir, código), estado offline/erro.
- **Capital**: listas de aportes e devoluções.
- **Dados**: no produto real, tudo isso vem do backend (Supabase/Postgres/etc.). Recomendado offline-first para a vendedora (fila local + sync), pois o erro de conexão faz parte do fluxo.

---

## 11. Rotas sugeridas

```
/login
/primeiro-acesso

# Vendedora
/app                          → Home
/app/lancamentos              → Meus lançamentos
/app/lancamentos/novo         → Novo lançamento
/app/lancamentos/[id]/editar  → Editar

# Gestor
/admin                              → Dashboard
/admin/lancamentos                  → Todos os lançamentos
/admin/lancamentos/novo             → Novo lançamento (gestor)
/admin/lancamentos/[id]/editar      → Editar
/admin/relatorio                    → Relatório mensal
/admin/dre                          → DRE anual
/admin/fluxo-de-caixa               → Fluxo de Caixa
/admin/capital                      → Capital (aportes/devoluções)
/admin/resultado-de-vendas          → Resultado de Vendas
/admin/equipe                       → Equipe / códigos de acesso
/admin/exportar                     → Exportar Excel
/admin/configuracoes                → Configurações
```
Proteger `/app/*` (papel vendedora) e `/admin/*` (papel gestor) por middleware/guarda de rota.

---

## 12. Pendências / observações de fidelidade

- As telas analíticas do gestor (DRE, Fluxo, Capital, Resultado, Configurações) foram desenhadas **desktop-first**. No celular, o protótipo entrega o gestor com abas operacionais (Início/Lançamentos/Equipe). A **versão mobile condensada por mês do DRE** (e das demais analíticas) ainda precisa ser desenhada/implementada.
- O quadro desktop do protótipo tem largura fixa de ~1180px (fidelidade de app real); tabelas largas (DRE, Capital) rolam horizontalmente dentro do card. No produto, tornar responsivo/fluido.
- Valores, deltas (%), séries mensais e mocks no protótipo são **ilustrativos**; no produto vêm do cálculo real sobre os lançamentos.
- Exportação Excel: implementar geração real das abas (ex.: SheetJS/`xlsx`) respeitando o formato da planilha atual.

---

## 13. Arquivos deste pacote

- `Almeida Closet.dc.html` — protótipo interativo de referência (todas as telas). Abrir no navegador; alternar perfis/telas pelos controles do topo.
- `README.md` — este documento.
