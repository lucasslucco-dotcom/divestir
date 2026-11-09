// Testa as migrations do Supabase num Postgres local (PGlite), sem tocar no banco de verdade.
// Roda todas as migrations de supabase/migrations e confere quem consegue ler e alterar o quê.
//
// Uso: npm run testar:banco

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();

// Simula o que o Supabase já traz pronto: os papéis anon, authenticated e
// service_role, a tabela auth.users e a função auth.uid().
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;

  -- O essencial do Storage do Supabase: espaços (buckets) e arquivos (objects),
  -- com RLS ligado nos arquivos, como no Supabase de verdade.
  create schema storage;
  create table storage.buckets (
    id text primary key, name text not null, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id), name text, owner uuid
  );
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated, service_role;
  grant select on storage.buckets to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;
`);

const pasta = join(import.meta.dirname, '..', 'supabase', 'migrations');
for (const arquivo of readdirSync(pasta)
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  await db.exec(readFileSync(join(pasta, arquivo), 'utf8'));
  console.log(`migration aplicada: ${arquivo}`);
}

// Dados de teste, inseridos como dono do banco.
const ADMIN = '00000000-0000-4000-8000-000000000001';
const OPERACAO = '00000000-0000-4000-8000-000000000002';
const CLIENTE = '00000000-0000-4000-8000-000000000003';
await db.exec(`
  insert into auth.users (id) values ('${ADMIN}'), ('${OPERACAO}'), ('${CLIENTE}');
  insert into public.equipe (user_id, nome, papel) values
    ('${ADMIN}', 'Admin de teste', 'admin'),
    ('${OPERACAO}', 'Operacao de teste', 'operacao');
  insert into public.pecas (slug, nome, caimento, ativo) values
    ('camiseta-regular', 'Camiseta', 'regular', true),
    ('peca-desativada', 'Peca antiga', 'regular', false);
  insert into public.cores (slug, nome, hex) values ('preto', 'Preto', '#121212');
  insert into public.peca_imagens (peca_id, cor_id, lado, url)
    select p.id, c.id, 'frente', '/catalogo/' || p.slug || '-preto-frente.jpg'
    from public.pecas p cross join public.cores c;
  insert into public.designs (slug, nome, status) values
    ('fa-clube', 'Fa-Clube', 'ativo'),
    ('rascunho-secreto', 'Rascunho', 'rascunho');
  insert into public.pedidos (nome, email, whatsapp, endereco, total)
    values ('Cliente Teste', 'cliente@exemplo.com', '34999999999', '{"cep": "38400-000"}', 129.90);
  insert into storage.objects (bucket_id, name) values ('fotos', 'sessao-teste/foto-teste/original.jpg');
`);

let falhas = 0;

async function como(papel, usuario, sql) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${usuario ?? ''}', false);`);
  await db.exec(`set role ${papel};`);
  try {
    const resultado = await db.query(sql);
    return { linhas: resultado.rows.length, erro: null };
  } catch (e) {
    return { linhas: 0, erro: e.message };
  } finally {
    await db.exec('reset role;');
  }
}

async function confere(descricao, papel, usuario, sql, esperado) {
  const r = await como(papel, usuario, sql);
  let ok;
  if (esperado === 'negado') ok = r.erro !== null;
  else ok = r.erro === null && r.linhas === esperado;
  if (!ok) falhas++;
  const obtido = r.erro ? `erro: ${r.erro}` : `${r.linhas} linha(s)`;
  console.log(`${ok ? '✓' : '✗'} ${descricao} → ${obtido}`);
}

console.log('\nVisitante sem login (anon)');
await confere('vê só as peças ativas', 'anon', null, 'select * from public.pecas', 1);
await confere('vê só os designs ativos', 'anon', null, 'select * from public.designs', 1);
await confere('vê as fotos de base só das peças ativas', 'anon', null, 'select * from public.peca_imagens', 1);
await confere(
  'NÃO troca a foto de uma peça',
  'anon',
  null,
  "update public.peca_imagens set url = 'x' returning id",
  'negado',
);
await confere('NÃO lê pedidos', 'anon', null, 'select * from public.pedidos', 'negado');
await confere('NÃO lê a equipe', 'anon', null, 'select * from public.equipe', 'negado');
await confere('NÃO lê as fotos dos clientes', 'anon', null, 'select * from public.fotos', 'negado');
await confere(
  'NÃO cria linha de foto',
  'anon',
  null,
  "insert into public.fotos (sessao_id, original_url) values ('x', 'x') returning id",
  'negado',
);
await confere(
  'NÃO cria peças',
  'anon',
  null,
  "insert into public.pecas (slug, nome, caimento) values ('x', 'x', 'x') returning id",
  'negado',
);
await confere('lê a tabela de medidas das peças ativas', 'anon', null, 'select medidas from public.pecas', 1);
await confere(
  'NÃO muda a tabela de medidas',
  'anon',
  null,
  "update public.pecas set medidas = '{}' returning id",
  'negado',
);
await confere(
  'o espaço das fotos é privado',
  'anon',
  null,
  "select 1 from storage.buckets where id = 'fotos' and public = false",
  1,
);
await confere(
  'NÃO vê os arquivos do espaço das fotos',
  'anon',
  null,
  "select * from storage.objects where bucket_id = 'fotos'",
  0,
);
await confere(
  'NÃO grava direto no espaço das fotos',
  'anon',
  null,
  "insert into storage.objects (bucket_id, name) values ('fotos', 'invasor.jpg') returning id",
  'negado',
);
await confere(
  'NÃO apaga arquivos do espaço das fotos',
  'anon',
  null,
  "delete from storage.objects where bucket_id = 'fotos' returning id",
  0,
);

console.log('\nPessoa logada que NÃO é da equipe');
await confere('não vê nenhum pedido', 'authenticated', CLIENTE, 'select * from public.pedidos', 0);
await confere(
  'NÃO cria pedidos',
  'authenticated',
  CLIENTE,
  "insert into public.pedidos (nome, email, whatsapp, endereco, total) values ('a', 'a', 'a', '{}', 1) returning id",
  'negado',
);
await confere(
  'NÃO se coloca na equipe',
  'authenticated',
  CLIENTE,
  `insert into public.equipe (user_id, nome, papel) values ('${CLIENTE}', 'invasor', 'admin') returning id`,
  'negado',
);
await confere('vê só o catálogo ativo', 'authenticated', CLIENTE, 'select * from public.pecas', 1);
await confere(
  'NÃO vê os arquivos do espaço das fotos',
  'authenticated',
  CLIENTE,
  "select * from storage.objects where bucket_id = 'fotos'",
  0,
);

console.log('\nEquipe: operação');
await confere('vê os pedidos', 'authenticated', OPERACAO, 'select * from public.pedidos', 1);
await confere('vê todas as peças, inclusive inativas', 'authenticated', OPERACAO, 'select * from public.pecas', 2);
await confere('vê só a própria linha da equipe', 'authenticated', OPERACAO, 'select * from public.equipe', 1);
await confere(
  'NÃO adiciona gente na equipe',
  'authenticated',
  OPERACAO,
  `insert into public.equipe (user_id, nome) values ('${CLIENTE}', 'novo') returning id`,
  'negado',
);
await confere(
  'muda o status de um pedido',
  'authenticated',
  OPERACAO,
  "update public.pedidos set status = 'pago' returning id",
  1,
);
await confere(
  'vê os arquivos do espaço das fotos',
  'authenticated',
  OPERACAO,
  "select * from storage.objects where bucket_id = 'fotos'",
  1,
);
await confere(
  'NÃO apaga arquivos do espaço das fotos',
  'authenticated',
  OPERACAO,
  "delete from storage.objects where bucket_id = 'fotos' returning id",
  0,
);

console.log('\nEquipe: admin');
await confere('vê a equipe toda', 'authenticated', ADMIN, 'select * from public.equipe', 2);

console.log('\nServidor do site (service_role)');
await confere('lê os pedidos', 'service_role', null, 'select * from public.pedidos', 1);
await confere(
  'NÃO aceita tabela de medidas fora do formato',
  'service_role',
  null,
  "update public.pecas set medidas = '[]' returning id",
  'negado',
);
await confere(
  'guarda a tabela de medidas de uma peça',
  'service_role',
  null,
  `update public.pecas set medidas = '{"unidade": "cm", "linhas": []}' where slug = 'camiseta-regular' returning id`,
  1,
);
await confere(
  'guarda uma foto com nota de nitidez alta (5.600)',
  'service_role',
  null,
  "insert into public.fotos (sessao_id, original_url, nitidez) values ('sessao-teste', 'sessao-teste/f/original.jpg', 5600.4) returning id",
  1,
);

const PEDIDO_DE_TESTE = `jsonb_build_object(
  'chave_do_checkout', '11111111-1111-4111-8111-111111111111',
  'nome', 'Cliente Checkout', 'email', 'checkout@exemplo.com', 'whatsapp', '34999999999', 'cpf', '12345678909',
  'endereco', '{"cep": "38400000"}'::jsonb, 'subtotal', 100, 'frete', 25, 'total', 125,
  'termos_aceitos_em', now(), 'teste', true,
  'itens', jsonb_build_array(jsonb_build_object(
    'peca_id', (select id from public.pecas where slug = 'camiseta-regular'),
    'cor_id', (select id from public.cores where slug = 'preto'),
    'design_id', (select id from public.designs where slug = 'fa-clube'),
    'tamanho', 'M', 'lado', 'costas', 'campos', '{"nome": "THOR"}'::jsonb, 'preco', 100,
    'foto_id', '22222222-2222-4222-8222-222222222222')))`;
const ID_DO_PEDIDO = "(select id from public.pedidos where chave_do_checkout = '11111111-1111-4111-8111-111111111111')";
// A foto da peça do pedido de teste, que vence em 30 dias até o pedido ser pago.
await db.exec(`
  insert into public.fotos (id, sessao_id, original_url, apagar_em) values
    ('22222222-2222-4222-8222-222222222222', 'sessao-teste', 'sessao-teste/foto-do-pedido/original.jpg', now() + interval '30 days');
`);
const pagar = (pagamento) =>
  `select public.registrar_pagamento(${ID_DO_PEDIDO}, '${JSON.stringify(pagamento)}') as status`;
const pedidoCom = (condicao) => `select * from public.pedidos where id = ${ID_DO_PEDIDO} and ${condicao}`;

console.log('\nCheckout (rotinas do pedido)');
await confere(
  'visitante NÃO cria pedido pela rotina',
  'anon',
  null,
  `select * from public.criar_pedido(${PEDIDO_DE_TESTE})`,
  'negado',
);
await confere(
  'cliente logado NÃO cria pedido pela rotina',
  'authenticated',
  CLIENTE,
  `select * from public.criar_pedido(${PEDIDO_DE_TESTE})`,
  'negado',
);
await confere(
  'visitante NÃO registra pagamento',
  'anon',
  null,
  'select public.registrar_pagamento(1, \'{"situacao": "approved"}\')',
  'negado',
);
await confere(
  'servidor cria o pedido com a peça',
  'service_role',
  null,
  `select * from public.criar_pedido(${PEDIDO_DE_TESTE})`,
  1,
);
await confere(
  'o mesmo checkout de novo NÃO duplica o pedido',
  'service_role',
  null,
  `select * from public.criar_pedido(${PEDIDO_DE_TESTE})`,
  1,
);
await confere(
  'existe um pedido só para aquele checkout',
  'service_role',
  null,
  "select * from public.pedidos where chave_do_checkout = '11111111-1111-4111-8111-111111111111'",
  1,
);
await confere(
  'o pedido nasce com a peça e o primeiro status',
  'service_role',
  null,
  `select * from public.status_historico where pedido_id = ${ID_DO_PEDIDO} and para = 'aguardando_pagamento'`,
  1,
);
await confere(
  'NÃO aceita peça com lado inválido',
  'service_role',
  null,
  `update public.itens_pedido set lado = 'manga' where pedido_id = ${ID_DO_PEDIDO} returning id`,
  'negado',
);
await confere(
  'o site registra uma tentativa nova (Pix aguardando)',
  'service_role',
  null,
  pagar({ id: 'pix-1', situacao: 'pending', metodo: 'pix', novo: true }),
  1,
);
await confere(
  '...que vira a tentativa atual do pedido',
  'service_role',
  null,
  pedidoCom("pagamento_id = 'pix-1' and pagamento_situacao = 'pending'"),
  1,
);
await confere(
  'aviso atrasado de uma tentativa antiga NÃO apaga a atual',
  'service_role',
  null,
  pagar({ id: 'cartao-0', situacao: 'rejected', metodo: 'cartao' }),
  1,
);
await confere(
  '...a tentativa atual continua a do Pix',
  'service_role',
  null,
  pedidoCom("pagamento_id = 'pix-1' and pagamento_situacao = 'pending'"),
  1,
);
await confere(
  'registra um pagamento aprovado com valor diferente do pedido',
  'service_role',
  null,
  pagar({ id: '1', situacao: 'approved', valor: 1 }),
  1,
);
await confere(
  '...que NÃO confirma: o pedido continua aguardando o pagamento',
  'service_role',
  null,
  pedidoCom("status = 'aguardando_pagamento' and pagamento_situacao = 'valor_divergente' and pago_em is null"),
  1,
);
await confere(
  'a foto ainda vence em 30 dias',
  'service_role',
  null,
  "select * from public.fotos where id = '22222222-2222-4222-8222-222222222222' and apagar_em is not null",
  1,
);
await confere(
  'pagamento aprovado leva o pedido a revisão de arte',
  'service_role',
  null,
  `select * from (${pagar({ id: '2', situacao: 'approved', valor: 125, metodo: 'cartao', parcelas: 3 })}) r where r.status = 'revisao_arte'`,
  1,
);
await confere(
  '...e guarda o pagamento, o método, as parcelas e a hora',
  'service_role',
  null,
  pedidoCom(
    "status = 'revisao_arte' and pagamento_id = '2' and pagamento_metodo = 'cartao' and pagamento_parcelas = 3 and pago_em is not null",
  ),
  1,
);
await confere(
  'o histórico guarda aguardando, pago e revisão de arte',
  'service_role',
  null,
  `select * from public.status_historico where pedido_id = ${ID_DO_PEDIDO}`,
  3,
);
await confere(
  'a foto do pedido pago deixa de vencer em 30 dias',
  'service_role',
  null,
  "select * from public.fotos where id = '22222222-2222-4222-8222-222222222222' and apagar_em is null",
  1,
);
await confere(
  'o mesmo aviso de novo NÃO muda nada',
  'service_role',
  null,
  `select * from (${pagar({ id: '2', situacao: 'approved', valor: 125 })}) r where r.status = 'revisao_arte'`,
  1,
);
await confere(
  '...nem o histórico',
  'service_role',
  null,
  `select * from public.status_historico where pedido_id = ${ID_DO_PEDIDO}`,
  3,
);
await confere(
  'outro pagamento aprovado para o pedido pago avisa a cobrança em dobro',
  'service_role',
  null,
  `select * from (${pagar({ id: 'pix-1', situacao: 'approved', valor: 125, metodo: 'pix' })}) r where r.status = 'pago_em_dobro'`,
  1,
);
await confere(
  '...sem trocar o pagamento do pedido',
  'service_role',
  null,
  pedidoCom("pagamento_id = '2' and pagamento_situacao = 'approved' and pagamento_metodo = 'cartao'"),
  1,
);
await confere(
  'o estorno do próprio pagamento muda a situação',
  'service_role',
  null,
  pagar({ id: '2', situacao: 'refunded' }),
  1,
);
await confere(
  '...sem mudar o status do pedido',
  'service_role',
  null,
  pedidoCom("pagamento_situacao = 'refunded' and status = 'revisao_arte'"),
  1,
);

console.log(falhas === 0 ? '\nTudo certo: as regras de acesso estão funcionando.' : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
