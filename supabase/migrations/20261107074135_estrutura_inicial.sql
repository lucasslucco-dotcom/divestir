-- =====================================================================
-- Divestir · Estrutura inicial do banco (etapa 1)
--
-- Quem pode o quê:
--   * Visitante (anon) e qualquer pessoa logada: só LÊ o catálogo ativo
--     (peças, cores, fotos de base e designs com status 'ativo').
--   * Equipe (quem está cadastrado na tabela equipe): lê e altera tudo.
--   * O servidor do site usa a chave secreta (service_role), que passa
--     por cima do RLS. Ela nunca vai para o navegador.
--
-- RLS (Row Level Security) fica ligado em TODAS as tabelas.
-- =====================================================================


-- Schema privado: guarda as funções de checagem de acesso.
-- Ele não é exposto pela API do Supabase.
create schema if not exists privado;


-- =====================================================================
-- Catálogo
-- =====================================================================

create table public.pecas (
  id bigint generated always as identity primary key,
  slug text not null unique,
  nome text not null,
  caimento text not null,
  -- Área de impressão nas costas, em centímetros. Ex.: {"largura": 30, "altura": 40}.
  -- Fica vazia até ser definida com a estamparia.
  area_impressao_cm jsonb,
  tamanhos text[] not null default array['PP', 'P', 'M', 'G', 'GG', 'GGG'],
  preco numeric(10, 2) check (preco >= 0),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
comment on table public.pecas is 'Modelos de peça vendidos no site (camiseta, moletom, jaqueta...).';

create table public.cores (
  id bigint generated always as identity primary key,
  slug text not null unique,
  nome text not null,
  hex text not null check (hex ~ '^#[0-9A-Fa-f]{6}$'),
  ativo boolean not null default true,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
comment on table public.cores is 'Cores de peça disponíveis (preto, branco, creme...).';

create table public.peca_imagens (
  id bigint generated always as identity primary key,
  peca_id bigint not null references public.pecas (id) on delete cascade,
  cor_id bigint not null references public.cores (id) on delete cascade,
  lado text not null check (lado in ('frente', 'costas')),
  url text not null,
  criado_em timestamptz not null default now(),
  unique (peca_id, cor_id, lado)
);
comment on table public.peca_imagens is 'Fotos de base usadas na prévia do montador: uma por peça, cor e lado.';
create index peca_imagens_cor_id_idx on public.peca_imagens (cor_id);

create table public.designs (
  id bigint generated always as identity primary key,
  slug text not null unique,
  nome text not null,
  status text not null default 'rascunho' check (status in ('rascunho', 'ativo', 'encerrado')),
  -- Configuração do template: área da foto, campos de texto, tintas por cor de peça.
  config jsonb not null default '{}'::jsonb,
  svg_tinta_clara text,
  svg_tinta_escura text,
  miniatura_url text,
  drop_entrada date,
  drop_saida date,
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  constraint designs_datas_do_drop check (drop_saida is null or drop_entrada is null or drop_saida >= drop_entrada)
);
comment on table public.designs is 'Designs (templates de estampa) da Divestir.';
create index designs_status_idx on public.designs (status);


-- =====================================================================
-- Fotos enviadas pelos clientes
-- =====================================================================

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  sessao_id text not null,
  original_url text not null,
  recorte_url text,
  largura integer check (largura > 0),
  altura integer check (altura > 0),
  nitidez numeric(6, 3),
  criado_em timestamptz not null default now(),
  apagar_em timestamptz
);
comment on table public.fotos is 'Fotos enviadas no montador. Apagadas automaticamente depois do prazo dos termos.';
create index fotos_sessao_id_idx on public.fotos (sessao_id);
create index fotos_apagar_em_idx on public.fotos (apagar_em) where apagar_em is not null;


-- =====================================================================
-- Equipe (quem acessa o painel)
-- =====================================================================

create table public.equipe (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nome text not null,
  papel text not null default 'operacao' check (papel in ('admin', 'operacao')),
  criado_em timestamptz not null default now()
);
comment on table public.equipe is 'Pessoas da equipe com acesso ao painel. admin: tudo; operacao: pedidos e lotes.';


-- =====================================================================
-- Pedidos
-- =====================================================================

create table public.pedidos (
  id bigint generated always as identity primary key,
  -- Número que o cliente vê. Começa em 1001.
  numero bigint generated always as identity (start with 1001) unique,
  nome text not null,
  email text not null,
  whatsapp text not null,
  endereco jsonb not null,
  -- Preenchido quando é presente: embalagem, mensagem do cartão, quem recebe.
  presente jsonb,
  frete numeric(10, 2) not null default 0 check (frete >= 0),
  total numeric(10, 2) not null check (total >= 0),
  status text not null default 'aguardando_pagamento' check (status in (
    'aguardando_pagamento',
    'pago',
    'revisao_arte',
    'ajuste_foto',
    'em_producao',
    'enviado',
    'entregue',
    'cancelado'
  )),
  pagamento_id text,
  rastreio text,
  -- Código do link de acompanhamento que o cliente recebe (sem login).
  token_acompanhamento uuid not null unique default gen_random_uuid(),
  criado_em timestamptz not null default now()
);
comment on table public.pedidos is 'Pedidos dos clientes.';
create index pedidos_status_criado_em_idx on public.pedidos (status, criado_em desc);

create table public.itens_pedido (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  peca_id bigint not null references public.pecas (id),
  cor_id bigint not null references public.cores (id),
  tamanho text not null check (tamanho in ('PP', 'P', 'M', 'G', 'GG', 'GGG')),
  design_id bigint not null references public.designs (id),
  foto_id uuid references public.fotos (id) on delete set null,
  -- Textos que o cliente preencheu no design. Ex.: {"nome": "THOR"}.
  campos jsonb not null default '{}'::jsonb,
  preview_url text,
  arquivo_impressao_url text,
  preco numeric(10, 2) not null check (preco >= 0),
  criado_em timestamptz not null default now()
);
comment on table public.itens_pedido is 'Cada peça montada dentro de um pedido.';
create index itens_pedido_pedido_id_idx on public.itens_pedido (pedido_id);
create index itens_pedido_peca_id_idx on public.itens_pedido (peca_id);
create index itens_pedido_cor_id_idx on public.itens_pedido (cor_id);
create index itens_pedido_design_id_idx on public.itens_pedido (design_id);
create index itens_pedido_foto_id_idx on public.itens_pedido (foto_id);

create table public.status_historico (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  de text,
  para text not null,
  por_usuario uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);
comment on table public.status_historico is 'Linha do tempo de cada pedido: quem mudou o status e quando.';
create index status_historico_pedido_id_idx on public.status_historico (pedido_id);
create index status_historico_por_usuario_idx on public.status_historico (por_usuario);

create table public.notificacoes (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos (id) on delete cascade,
  canal text not null check (canal in ('email', 'whatsapp')),
  tipo text not null,
  enviado_em timestamptz,
  erro text,
  criado_em timestamptz not null default now()
);
comment on table public.notificacoes is 'Avisos enviados ao cliente por e-mail e WhatsApp.';
create index notificacoes_pedido_id_idx on public.notificacoes (pedido_id);


-- =====================================================================
-- Funções de checagem de acesso
-- (security definer para poderem olhar a tabela equipe sem cair no
--  próprio RLS; ficam no schema privado e só usuários logados executam)
-- =====================================================================

create or replace function privado.e_equipe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.equipe
    where user_id = (select auth.uid())
  );
$$;

create or replace function privado.e_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.equipe
    where user_id = (select auth.uid())
      and papel = 'admin'
  );
$$;

revoke all on function privado.e_equipe() from public;
revoke all on function privado.e_admin() from public;
grant usage on schema privado to authenticated;
grant execute on function privado.e_equipe() to authenticated;
grant execute on function privado.e_admin() to authenticated;


-- =====================================================================
-- Permissões por papel
-- Começa fechado e libera só o necessário. O RLS abaixo filtra as linhas.
-- =====================================================================

grant usage on schema public to anon, authenticated, service_role;

revoke all on all tables in schema public from anon, authenticated;

-- Catálogo: visitante só lê.
grant select on public.pecas, public.cores, public.peca_imagens, public.designs to anon, authenticated;

-- Usuários logados (equipe) podem alterar; o RLS confere se é da equipe.
grant insert, update, delete on public.pecas, public.cores, public.peca_imagens, public.designs to authenticated;
grant select, insert, update, delete on
  public.fotos,
  public.equipe,
  public.pedidos,
  public.itens_pedido,
  public.status_historico,
  public.notificacoes
to authenticated;

-- Servidor do site.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;


-- =====================================================================
-- RLS ligado em todas as tabelas
-- =====================================================================

alter table public.pecas enable row level security;
alter table public.cores enable row level security;
alter table public.peca_imagens enable row level security;
alter table public.designs enable row level security;
alter table public.fotos enable row level security;
alter table public.equipe enable row level security;
alter table public.pedidos enable row level security;
alter table public.itens_pedido enable row level security;
alter table public.status_historico enable row level security;
alter table public.notificacoes enable row level security;


-- =====================================================================
-- Regras (policies)
-- =====================================================================

-- Catálogo: todo mundo vê o que está ativo...
create policy "catalogo: ver pecas ativas"
  on public.pecas for select
  to anon, authenticated
  using (ativo);

create policy "catalogo: ver cores ativas"
  on public.cores for select
  to anon, authenticated
  using (ativo);

create policy "catalogo: ver fotos de base das pecas e cores ativas"
  on public.peca_imagens for select
  to anon, authenticated
  using (
    exists (select 1 from public.pecas p where p.id = peca_imagens.peca_id and p.ativo)
    and exists (select 1 from public.cores c where c.id = peca_imagens.cor_id and c.ativo)
  );

create policy "catalogo: ver designs ativos"
  on public.designs for select
  to anon, authenticated
  using (status = 'ativo');

-- ...e a equipe vê e altera tudo, inclusive o que está inativo.
create policy "equipe: acesso total as pecas"
  on public.pecas for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total as cores"
  on public.cores for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total as fotos de base"
  on public.peca_imagens for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total aos designs"
  on public.designs for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

-- Dados de clientes e pedidos: só a equipe.
create policy "equipe: acesso total as fotos dos clientes"
  on public.fotos for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total aos pedidos"
  on public.pedidos for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total aos itens dos pedidos"
  on public.itens_pedido for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total ao historico de status"
  on public.status_historico for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

create policy "equipe: acesso total as notificacoes"
  on public.notificacoes for all
  to authenticated
  using ((select privado.e_equipe()))
  with check ((select privado.e_equipe()));

-- Tabela equipe: cada pessoa vê a própria linha; o admin vê e gerencia todos.
create policy "equipe: ver a propria linha"
  on public.equipe for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "admin: gerenciar a equipe"
  on public.equipe for all
  to authenticated
  using ((select privado.e_admin()))
  with check ((select privado.e_admin()));
