// Supabase de mentira para testar o site num computador sem acesso ao Supabase de
// verdade (como o ambiente de trabalho do Claude): aplica as migrations e o seed num
// Postgres local (PGlite) e responde às leituras públicas do catálogo e dos designs
// pela mesma URL REST. Não guarda fotos: /api/fotos e /api/recorte precisam ser
// simulados no teste.
//
// Uso: node scripts/supabase-falso.mjs . [porta]
// e depois: NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=teste npx next dev
// MEDIDAS_DE_TESTE=1 põe medidas inventadas na camiseta regular, só para ver a tabela;
// PRECO_DE_TESTE=1 põe um preço inventado nas camisetas.
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';

const raiz = process.argv[2];
const porta = Number(process.argv[3] ?? 54321);
const requerer = createRequire(join(raiz, 'package.json'));
const { PGlite } = await import(requerer.resolve('@electric-sql/pglite'));

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets (id), name text, owner uuid);
  alter table storage.objects enable row level security;
`);
const pasta = join(raiz, 'supabase', 'migrations');
for (const arquivo of readdirSync(pasta)
  .filter((f) => f.endsWith('.sql'))
  .sort()) {
  await db.exec(readFileSync(join(pasta, arquivo), 'utf8'));
}
await db.exec(readFileSync(join(raiz, 'supabase', 'seed.sql'), 'utf8'));

// Medidas de teste (inventadas, só para ver a tabela na tela), quando pedido.
if (process.env.MEDIDAS_DE_TESTE) {
  await db.exec(`update public.pecas set medidas = '{"unidade": "cm", "linhas": [
    {"nome": "Largura", "como_medir": "de uma axila à outra, com a peça esticada", "valores": {"PP": 46, "P": 49, "M": 52, "G": 55, "GG": 58, "GGG": 61}},
    {"nome": "Comprimento", "como_medir": "do ombro à barra", "valores": {"PP": 66, "P": 69, "M": 72, "G": 75, "GG": 77, "GGG": 79}}
  ]}' where slug = 'camiseta-regular'`);
}
if (process.env.PRECO_DE_TESTE) {
  await db.exec(`update public.pecas set preco = 129.9 where slug like 'camiseta%'`);
}

async function linhas(tabela) {
  await db.exec('set role anon;');
  try {
    switch (tabela) {
      case 'pecas':
        return (await db.query('select * from public.pecas where ativo order by ordem')).rows;
      case 'cores':
        return (await db.query('select * from public.cores where ativo order by ordem')).rows;
      case 'peca_imagens':
        return (await db.query('select * from public.peca_imagens')).rows;
      case 'designs':
        return (await db.query("select * from public.designs where status = 'ativo' order by ordem")).rows;
      default:
        return null;
    }
  } finally {
    await db.exec('reset role;');
  }
}

createServer(async (pedido, resposta) => {
  const url = new URL(pedido.url, 'http://localhost');
  const tabela = url.pathname.match(/^\/rest\/v1\/([a-z_]+)/)?.[1];
  const dados = tabela ? await linhas(tabela) : null;
  if (!dados) {
    resposta.writeHead(404, { 'content-type': 'application/json' });
    resposta.end('{"message":"não existe"}');
    return;
  }
  // Datas e números como o PostgREST manda (preço numérico vem como número).
  const corpo = JSON.stringify(dados, (_, v) =>
    typeof v === 'bigint' ? Number(v) : v instanceof Date ? v.toISOString().slice(0, 10) : v,
  );
  resposta.writeHead(200, { 'content-type': 'application/json' });
  resposta.end(corpo);
}).listen(porta, () => console.log(`supabase falso em http://localhost:${porta}`));
