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
for (const arquivo of readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort()) {
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
await confere('NÃO troca a foto de uma peça', 'anon', null, "update public.peca_imagens set url = 'x' returning id", 'negado');
await confere('NÃO lê pedidos', 'anon', null, 'select * from public.pedidos', 'negado');
await confere('NÃO lê a equipe', 'anon', null, 'select * from public.equipe', 'negado');
await confere('NÃO lê as fotos dos clientes', 'anon', null, 'select * from public.fotos', 'negado');
await confere('NÃO cria linha de foto', 'anon', null, "insert into public.fotos (sessao_id, original_url) values ('x', 'x') returning id", 'negado');
await confere('NÃO cria peças', 'anon', null, "insert into public.pecas (slug, nome, caimento) values ('x', 'x', 'x') returning id", 'negado');
await confere('o espaço das fotos é privado', 'anon', null, "select 1 from storage.buckets where id = 'fotos' and public = false", 1);
await confere('NÃO vê os arquivos do espaço das fotos', 'anon', null, "select * from storage.objects where bucket_id = 'fotos'", 0);
await confere('NÃO grava direto no espaço das fotos', 'anon', null, "insert into storage.objects (bucket_id, name) values ('fotos', 'invasor.jpg') returning id", 'negado');
await confere('NÃO apaga arquivos do espaço das fotos', 'anon', null, "delete from storage.objects where bucket_id = 'fotos' returning id", 0);

console.log('\nPessoa logada que NÃO é da equipe');
await confere('não vê nenhum pedido', 'authenticated', CLIENTE, 'select * from public.pedidos', 0);
await confere('NÃO cria pedidos', 'authenticated', CLIENTE, "insert into public.pedidos (nome, email, whatsapp, endereco, total) values ('a', 'a', 'a', '{}', 1) returning id", 'negado');
await confere('NÃO se coloca na equipe', 'authenticated', CLIENTE, `insert into public.equipe (user_id, nome, papel) values ('${CLIENTE}', 'invasor', 'admin') returning id`, 'negado');
await confere('vê só o catálogo ativo', 'authenticated', CLIENTE, 'select * from public.pecas', 1);
await confere('NÃO vê os arquivos do espaço das fotos', 'authenticated', CLIENTE, "select * from storage.objects where bucket_id = 'fotos'", 0);

console.log('\nEquipe: operação');
await confere('vê os pedidos', 'authenticated', OPERACAO, 'select * from public.pedidos', 1);
await confere('vê todas as peças, inclusive inativas', 'authenticated', OPERACAO, 'select * from public.pecas', 2);
await confere('vê só a própria linha da equipe', 'authenticated', OPERACAO, 'select * from public.equipe', 1);
await confere('NÃO adiciona gente na equipe', 'authenticated', OPERACAO, `insert into public.equipe (user_id, nome) values ('${CLIENTE}', 'novo') returning id`, 'negado');
await confere('muda o status de um pedido', 'authenticated', OPERACAO, "update public.pedidos set status = 'pago' returning id", 1);
await confere('vê os arquivos do espaço das fotos', 'authenticated', OPERACAO, "select * from storage.objects where bucket_id = 'fotos'", 1);
await confere('NÃO apaga arquivos do espaço das fotos', 'authenticated', OPERACAO, "delete from storage.objects where bucket_id = 'fotos' returning id", 0);

console.log('\nEquipe: admin');
await confere('vê a equipe toda', 'authenticated', ADMIN, 'select * from public.equipe', 2);

console.log('\nServidor do site (service_role)');
await confere('lê os pedidos', 'service_role', null, 'select * from public.pedidos', 1);
await confere(
  'guarda uma foto com nota de nitidez alta (5.600)',
  'service_role',
  null,
  "insert into public.fotos (sessao_id, original_url, nitidez) values ('sessao-teste', 'sessao-teste/f/original.jpg', 5600.4) returning id",
  1,
);

console.log(falhas === 0 ? '\nTudo certo: as regras de acesso estão funcionando.' : `\n${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
