// Supabase de mentira para testar o site num computador sem acesso ao Supabase de
// verdade (como o ambiente de trabalho do Claude): aplica as migrations e o seed num
// Postgres local (PGlite) e responde pela mesma URL do Supabase ao que o site usa:
//   * leituras e gravações nas tabelas (só colunas simples, com os filtros eq, in e
//     is, order e limit), com as regras de acesso (RLS) do papel de quem chama;
//   * as rotinas do banco (/rest/v1/rpc/...), como criar_pedido;
//   * o espaço das fotos: vaga assinada, envio pela vaga e lista de arquivos.
// Chave que começa com "sb_secret" vale como a chave secreta (service_role); as
// outras valem como visitante (anon). O recorte (/api/recorte) ainda precisa ser
// simulado no teste, porque chama o Photoroom.
//
// Uso: node scripts/supabase-falso.mjs . [porta]
// e depois: NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=teste \
//   SUPABASE_SECRET_KEY=sb_secret_teste npx next dev
// MEDIDAS_DE_TESTE=1 põe medidas inventadas na camiseta regular, só para ver a tabela;
// PRECO_DE_TESTE=1 põe um preço inventado nas camisetas.
// GET /teste/sql?q=... (só neste servidor de mentira) roda uma consulta como dono do
// banco, para o teste conferir o que ficou gravado.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';

const raiz = resolve(process.argv[2] ?? '.');
const porta = Number(process.argv[3] ?? 54321);
const requerer = createRequire(join(raiz, 'package.json'));
const { PGlite } = await import(requerer.resolve('@electric-sql/pglite'));

const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
  grant usage on schema auth to anon, authenticated, service_role;
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

const NOME = /^[a-z_][a-z0-9_]*$/;
const TIPO_DATA = 1082;
const TIPO_NUMERICO = 1700;

// Valores como o PostgREST manda: data como AAAA-MM-DD, hora em ISO, número como número.
function comoJson(resultado) {
  const tipos = new Map(resultado.fields.map((f) => [f.name, f.dataTypeID]));
  return resultado.rows.map((linha) =>
    Object.fromEntries(
      Object.entries(linha).map(([coluna, valor]) => {
        if (typeof valor === 'bigint') return [coluna, Number(valor)];
        if (valor instanceof Date) {
          return [coluna, tipos.get(coluna) === TIPO_DATA ? valor.toISOString().slice(0, 10) : valor.toISOString()];
        }
        if (tipos.get(coluna) === TIPO_NUMERICO && typeof valor === 'string') return [coluna, Number(valor)];
        return [coluna, valor];
      }),
    ),
  );
}

async function comoPapel(papel, consulta, parametros = []) {
  await db.exec(`set role ${papel};`);
  try {
    return await db.query(consulta, parametros);
  } finally {
    await db.exec('reset role;');
  }
}

// Filtros do PostgREST na URL: coluna=eq.valor, coluna=in.(a,b), coluna=is.null.
function filtros(busca, parametros) {
  const condicoes = [];
  for (const [coluna, valor] of busca) {
    if (['select', 'order', 'limit', 'offset', 'columns'].includes(coluna)) continue;
    if (!NOME.test(coluna)) throw new Error(`coluna inválida: ${coluna}`);
    const [operador, ...resto] = valor.split('.');
    const alvo = resto.join('.');
    if (operador === 'eq') {
      parametros.push(alvo);
      condicoes.push(`${coluna}::text = $${parametros.length}`);
    } else if (operador === 'in') {
      const itens = alvo
        .replace(/^\(|\)$/g, '')
        .split(',')
        .map((v) => v.replace(/^"|"$/g, ''));
      parametros.push(itens);
      condicoes.push(`${coluna}::text = any($${parametros.length}::text[])`);
    } else if (operador === 'is') {
      condicoes.push(`${coluna} is ${alvo === 'null' ? 'null' : alvo === 'true' ? 'true' : 'false'}`);
    } else {
      throw new Error(`filtro não suportado: ${valor}`);
    }
  }
  return condicoes.length ? ` where ${condicoes.join(' and ')}` : '';
}

function colunas(select) {
  if (!select || select === '*') return '*';
  const lista = select.split(',').map((c) => c.trim());
  if (!lista.every((c) => NOME.test(c))) throw new Error(`seleção não suportada: ${select}`);
  return lista.join(', ');
}

function ordem(busca) {
  const pedido = busca.get('order');
  if (!pedido) return '';
  const partes = pedido.split(',').map((p) => {
    const [coluna, sentido] = p.split('.');
    if (!NOME.test(coluna)) throw new Error(`ordem inválida: ${p}`);
    return `${coluna} ${sentido === 'desc' ? 'desc' : 'asc'}`;
  });
  return ` order by ${partes.join(', ')}`;
}

async function lerCorpo(pedido) {
  const partes = [];
  for await (const parte of pedido) partes.push(parte);
  return Buffer.concat(partes);
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'access-control-allow-headers': '*',
};

function responder(resposta, status, corpo, extras = {}) {
  resposta.writeHead(status, { 'content-type': 'application/json', ...CORS, ...extras });
  resposta.end(corpo === undefined ? '' : JSON.stringify(corpo));
}

const tabelaPublica = (nome) => (NOME.test(nome) ? `public.${nome}` : null);

createServer(async (pedido, resposta) => {
  const url = new URL(pedido.url, 'http://localhost');
  const chave = String(pedido.headers.apikey ?? '');
  const papel = chave.startsWith('sb_secret') ? 'service_role' : 'anon';
  try {
    if (pedido.method === 'OPTIONS') return responder(resposta, 204);

    // Só para o teste: uma consulta como dono do banco.
    if (url.pathname === '/teste/sql') {
      return responder(resposta, 200, comoJson(await db.query(url.searchParams.get('q'))));
    }

    // Rotinas do banco.
    const rotina = url.pathname.match(/^\/rest\/v1\/rpc\/([a-z_]+)$/)?.[1];
    if (rotina && pedido.method === 'POST') {
      const argumentos = JSON.parse((await lerCorpo(pedido)).toString() || '{}');
      const nomes = Object.keys(argumentos);
      if (!nomes.every((n) => NOME.test(n))) return responder(resposta, 400, { message: 'argumento inválido' });
      const valores = nomes.map((n) =>
        typeof argumentos[n] === 'object' ? JSON.stringify(argumentos[n]) : String(argumentos[n]),
      );
      const chamada = `public.${rotina}(${nomes.map((n, i) => `${n} => $${i + 1}`).join(', ')})`;
      const tipo = await db.query(
        'select proretset, prorettype::regtype::text as tipo from pg_proc where proname = $1',
        [rotina],
      );
      const tabela = tipo.rows[0]?.proretset || tipo.rows[0]?.tipo === 'record';
      const resultado = await comoPapel(papel, `select * from ${chamada}`, valores);
      const linhas = comoJson(resultado);
      return responder(resposta, 200, tabela ? linhas : (Object.values(linhas[0] ?? {})[0] ?? null));
    }

    // Tabelas.
    const nomeDaTabela = url.pathname.match(/^\/rest\/v1\/([a-z_]+)$/)?.[1];
    if (nomeDaTabela) {
      const tabela = tabelaPublica(nomeDaTabela);
      const parametros = [];
      if (pedido.method === 'GET') {
        const consulta = `select ${colunas(url.searchParams.get('select'))} from ${tabela}${filtros(url.searchParams, parametros)}${ordem(url.searchParams)}${url.searchParams.get('limit') ? ` limit ${Number(url.searchParams.get('limit'))}` : ''}`;
        const linhas = comoJson(await comoPapel(papel, consulta, parametros));
        const umSo = String(pedido.headers.accept ?? '').includes('vnd.pgrst.object');
        if (umSo && linhas.length !== 1)
          return responder(resposta, 406, { message: 'JSON object requested, multiple (or no) rows returned' });
        return responder(resposta, 200, umSo ? linhas[0] : linhas);
      }
      if (pedido.method === 'POST') {
        const corpo = JSON.parse((await lerCorpo(pedido)).toString());
        const linhas = Array.isArray(corpo) ? corpo : [corpo];
        const nomes = Object.keys(linhas[0]).filter((c) => NOME.test(c));
        const valores = [];
        const grupos = linhas.map(
          (linha) =>
            `(${nomes
              .map((n) => {
                valores.push(linha[n] !== null && typeof linha[n] === 'object' ? JSON.stringify(linha[n]) : linha[n]);
                return `$${valores.length}`;
              })
              .join(', ')})`,
        );
        const resultado = await comoPapel(
          papel,
          `insert into ${tabela} (${nomes.join(', ')}) values ${grupos.join(', ')} returning *`,
          valores,
        );
        const minimo = String(pedido.headers.prefer ?? '').includes('return=minimal');
        return responder(resposta, 201, minimo ? undefined : comoJson(resultado));
      }
      if (pedido.method === 'PATCH') {
        const corpo = JSON.parse((await lerCorpo(pedido)).toString());
        const nomes = Object.keys(corpo).filter((c) => NOME.test(c));
        nomes.forEach((n) =>
          parametros.push(corpo[n] !== null && typeof corpo[n] === 'object' ? JSON.stringify(corpo[n]) : corpo[n]),
        );
        const conjunto = nomes.map((n, i) => `${n} = $${i + 1}`).join(', ');
        const resultado = await comoPapel(
          papel,
          `update ${tabela} set ${conjunto}${filtros(url.searchParams, parametros)} returning *`,
          parametros,
        );
        return responder(resposta, 200, comoJson(resultado));
      }
    }

    // Espaço das fotos: abrir a vaga assinada.
    const vaga = url.pathname.match(/^\/storage\/v1\/object\/upload\/sign\/([a-z_]+)\/(.+)$/);
    if (vaga && pedido.method === 'POST') {
      if (papel !== 'service_role') return responder(resposta, 403, { message: 'sem permissão' });
      return responder(resposta, 200, { url: `/object/upload/sign/${vaga[1]}/${vaga[2]}?token=${randomUUID()}` });
    }
    // ...enviar a foto pela vaga (o arquivo em si não é guardado, só o nome).
    if (vaga && pedido.method === 'PUT') {
      await lerCorpo(pedido);
      const nome = decodeURIComponent(vaga[2]);
      const ja = await db.query('select 1 from storage.objects where bucket_id = $1 and name = $2', [vaga[1], nome]);
      if (ja.rows.length) return responder(resposta, 409, { message: 'já existe' });
      await db.query('insert into storage.objects (bucket_id, name) values ($1, $2)', [vaga[1], nome]);
      return responder(resposta, 200, { Key: `${vaga[1]}/${nome}` });
    }
    // ...enviar um arquivo direto (o recorte guardado pelo servidor).
    const envio = url.pathname.match(/^\/storage\/v1\/object\/([a-z_]+)\/(.+)$/);
    if (envio && (pedido.method === 'POST' || pedido.method === 'PUT') && !envio[1].startsWith('list')) {
      if (papel !== 'service_role') return responder(resposta, 403, { message: 'sem permissão' });
      await lerCorpo(pedido);
      const nome = decodeURIComponent(envio[2]);
      await db.query('delete from storage.objects where bucket_id = $1 and name = $2', [envio[1], nome]);
      await db.query('insert into storage.objects (bucket_id, name) values ($1, $2)', [envio[1], nome]);
      return responder(resposta, 200, { Key: `${envio[1]}/${nome}` });
    }
    // ...listar os arquivos de uma pasta.
    const lista = url.pathname.match(/^\/storage\/v1\/object\/list\/([a-z_]+)$/);
    if (lista && pedido.method === 'POST') {
      if (papel !== 'service_role') return responder(resposta, 403, { message: 'sem permissão' });
      const { prefix = '' } = JSON.parse((await lerCorpo(pedido)).toString() || '{}');
      const inicio = prefix ? `${prefix.replace(/\/$/, '')}/` : '';
      const achados = await db.query('select id, name from storage.objects where bucket_id = $1 and name like $2', [
        lista[1],
        `${inicio}%`,
      ]);
      const filhos = achados.rows
        .map((linha) => ({ id: linha.id, name: linha.name.slice(inicio.length) }))
        .filter((linha) => linha.name && !linha.name.includes('/'));
      return responder(
        resposta,
        200,
        filhos.map((f) => ({ ...f, metadata: {} })),
      );
    }

    return responder(resposta, 404, { message: 'não existe' });
  } catch (motivo) {
    console.error('supabase falso:', motivo.message);
    return responder(resposta, 400, { message: motivo.message, code: motivo.code ?? '' });
  }
}).listen(porta, () => console.log(`supabase falso em http://localhost:${porta}`));
