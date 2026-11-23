// Gera o arquivo de impressão de uma estampa: a arte do design no tamanho real, em PNG de
// fundo transparente, a 300 pontos por polegada, desenhada pelo mesmo motor da prévia do
// site (src/lib/molde). Nasceu para os arquivos de teste da confecção (23/11/2026) e é o
// ponto de partida da Etapa 7 (o arquivo de cada pedido, direto do painel).
//
// O tamanho: o maior que cabe em 36 cm de largura por 46 cm de altura (o limite do DTF
// da confecção), na proporção do design. "largura_cm" no caso troca a largura.
//
// Uso (precisa do Playwright, que o ambiente de trabalho do Claude já tem; o esbuild vem
// pelo npx, sem entrar no projeto):
//   node scripts/arquivo-de-impressao.mjs casos.json pasta-de-saida
//
// casos.json é uma lista. Cada caso é uma estampa:
//   {"arquivo": "teste-1", "design": "feita-a-mao", "cor": "preto",
//    "valores": {"nome": "Vó Lurdes"}, "foto": "/caminho/do/recorte.png", "ano": 2026}
// ou a marca no peito:
//   {"arquivo": "peito", "marca": true, "tinta": "creme-quente", "largura_cm": 10}
// "cor" é a cor da peça (preto, branco, creme): é ela que escolhe a tinta. "foto" é o
// recorte (PNG ou WebP sem fundo); sem ela, a arte sai sem a foto. As configurações dos
// designs são lidas do supabase/seed.sql.
import { execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const [, , arquivoDosCasos, saida] = process.argv;
if (!arquivoDosCasos || !saida) {
  console.error('Uso: node scripts/arquivo-de-impressao.mjs casos.json pasta-de-saida');
  process.exit(1);
}
const casos = JSON.parse(readFileSync(arquivoDosCasos, 'utf8'));
const PONTOS_POR_POLEGADA = 300;
const LARGURA_MAXIMA_CM = 36;
const ALTURA_MAXIMA_CM = 46;

// As configurações dos designs, como estão no seed.
const designs = {};
const seed = readFileSync(join(raiz, 'supabase', 'seed.sql'), 'utf8');
for (const m of seed.matchAll(/\('([a-z0-9-]+)', '[^']+', '\w+', \d+,(?: [^,]+,)? '(\{[\s\S]*?\})'::jsonb\)/g)) {
  designs[m[1]] = JSON.parse(m[2].replaceAll("''", "'"));
}

// O motor do site, empacotado para rodar numa página em branco.
const pasta = mkdtempSync(join(tmpdir(), 'divestir-impressao-'));
writeFileSync(
  join(pasta, 'entrada.ts'),
  `import { prepararArte, desenharMarca } from '@/lib/molde/desenhar';
import { medirRecorte, ENQUADRAMENTO_INICIAL } from '@/lib/foto/enquadramento';
import { LARGURA_DA_ARTE, TINTAS } from '@/lib/molde/tipos';
(window as any).M = { prepararArte, desenharMarca, medirRecorte, ENQUADRAMENTO_INICIAL, LARGURA_DA_ARTE, TINTAS };`,
);
execSync(
  `npx --yes esbuild@0.25.12 ${join(pasta, 'entrada.ts')} --bundle --format=iife --alias:@=${join(raiz, 'src')} --outfile=${join(pasta, 'motor.js')} --log-level=error`,
  { cwd: raiz, stdio: 'inherit' },
);

const dado = (caminho, tipo) => `data:${tipo};base64,${readFileSync(caminho).toString('base64')}`;
const TIPOS = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
// As fontes de cada papel do molde: arquivo, peso e estilo (as mesmas de src/lib/molde/recursos.ts).
const FONTES = {
  titulo: ['anton-400.woff2', 400, 'normal'],
  destaque: ['instrument-serif-400.woff2', 400, 'normal'],
  'destaque-italico': ['instrument-serif-400-italic.woff2', 400, 'italic'],
  cinema: ['bodoni-moda-500.woff2', 500, 'normal'],
  'cinema-forte': ['bodoni-moda-700.woff2', 700, 'normal'],
  'cinema-preta': ['bodoni-moda-900.woff2', 900, 'normal'],
  vintage: ['shrikhand-400.woff2', 400, 'normal'],
  show: ['passion-one-900.woff2', 900, 'normal'],
  bloco: ['alfa-slab-one-400.woff2', 400, 'normal'],
  colegial: ['graduate-400.woff2', 400, 'normal'],
  realeza: ['cinzel-900.woff2', 900, 'normal'],
  astral: ['cinzel-decorative-900.woff2', 900, 'normal'],
  gotica: ['grenze-gotisch-900.woff2', 900, 'normal'],
  texto: ['inter-variavel.woff2', 700, 'normal'],
  geometrica: ['poppins-900.woff2', 900, 'normal'],
  redonda: ['lilita-one-400.woff2', 400, 'normal'],
  pixel: ['handjet-900.woff2', 900, 'normal'],
  doce: ['bagel-fat-one-400.woff2', 400, 'normal'],
};
const familia = (papel) => `F${papel.replaceAll('-', '')}`;
const css = Object.entries(FONTES)
  .map(
    ([papel, [arquivo, peso, estilo]]) =>
      `@font-face { font-family: ${familia(papel)}; font-weight: ${peso}; font-style: ${estilo}; src: url(${dado(join(raiz, 'src', 'app', 'fontes', arquivo), 'font/woff2')}); }`,
  )
  .join('\n');

// As artes fixas (SVG) de que os casos precisam.
const artes = {};
for (const caso of casos) {
  if (!caso.design) continue;
  const config = designs[caso.design];
  if (!config) throw new Error(`Design desconhecido: ${caso.design}`);
  for (const camada of config.camadas) {
    const arquivos =
      camada.tipo === 'arte' ? [camada.arquivo, camada.base] : camada.tipo === 'nome' ? [camada.rastro?.arquivo] : [];
    for (const arquivo of arquivos.filter(Boolean))
      artes[arquivo] = readFileSync(join(raiz, 'public', arquivo), 'utf8');
  }
}

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const navegador = await chromium.launch();
const pagina = await navegador.newPage();
pagina.on('pageerror', (erro) => console.error('Erro na página:', erro));
await pagina.setContent(
  `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body><script>${readFileSync(join(pasta, 'motor.js'), 'utf8')}</script></body></html>`,
);
mkdirSync(saida, { recursive: true });
for (const caso of casos) {
  const config = caso.design ? designs[caso.design] : null;
  const larguraCm = caso.largura_cm ?? Math.min(LARGURA_MAXIMA_CM, ALTURA_MAXIMA_CM * config.proporcao);
  const larguraPx = Math.round((larguraCm / 2.54) * PONTOS_POR_POLEGADA);
  const recorte = caso.foto ? dado(caso.foto, TIPOS[extname(caso.foto).toLowerCase()] ?? 'image/png') : null;
  const resultado = await pagina.evaluate(
    async ({ caso, config, larguraPx, recorte, artes, fontesDoMolde }) => {
      const M = window.M;
      const fontes = {};
      for (const [papel, [, peso, estilo]] of Object.entries(fontesDoMolde)) {
        const nome = `F${papel.replaceAll('-', '')}`;
        await document.fonts.load(`${estilo} ${peso} 100px ${nome}`);
        fontes[papel] = { familia: nome, estilo, peso };
      }
      const abrir = async (src) => {
        const imagem = new Image();
        imagem.src = src;
        await imagem.decode();
        return imagem;
      };
      let tela;
      if (caso.marca) {
        // A marca no peito: DIVESTIR em Anton, na largura pedida.
        const prova = M.desenharMarca(fontes, M.TINTAS[caso.tinta], 200);
        tela = M.desenharMarca(fontes, M.TINTAS[caso.tinta], (200 * larguraPx) / prova.width);
      } else {
        const carregarArte = (arquivo, tinta) =>
          abrir(
            URL.createObjectURL(
              new Blob([artes[arquivo].replaceAll('currentColor', tinta)], { type: 'image/svg+xml' }),
            ),
          );
        const arte = await M.prepararArte(
          { config, corDaPeca: caso.cor, valores: caso.valores ?? {}, fontes, carregarArte, ano: caso.ano },
          larguraPx / M.LARGURA_DA_ARTE,
        );
        const foto = recorte
          ? {
              imagem: await abrir(recorte),
              geometria: await M.medirRecorte(recorte),
              enquadramento: caso.enquadramento ?? M.ENQUADRAMENTO_INICIAL,
              inteira: null,
            }
          : null;
        tela = arte.desenhar(foto);
      }
      const blob = await new Promise((pronto) => tela.toBlob(pronto, 'image/png'));
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let texto = '';
      for (let i = 0; i < bytes.length; i += 0x8000)
        texto += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return { png: btoa(texto), largura: tela.width, altura: tela.height };
    },
    { caso, config, larguraPx, recorte, artes, fontesDoMolde: FONTES },
  );
  writeFileSync(join(saida, `${caso.arquivo}.png`), comResolucao(Buffer.from(resultado.png, 'base64')));
  const cm = (px) => ((px / PONTOS_POR_POLEGADA) * 2.54).toFixed(1).replace('.', ',');
  console.log(
    `${caso.arquivo}.png: ${cm(resultado.largura)} × ${cm(resultado.altura)} cm (${resultado.largura} × ${resultado.altura} px)`,
  );
}
await navegador.close();

// Grava no PNG a resolução (o bloco pHYs, logo depois do cabeçalho): é o que faz o
// programa de impressão abrir o arquivo já no tamanho certo em centímetros.
function comResolucao(png) {
  const porMetro = Math.round(PONTOS_POR_POLEGADA / 0.0254);
  const dados = Buffer.alloc(9);
  dados.writeUInt32BE(porMetro, 0);
  dados.writeUInt32BE(porMetro, 4);
  dados.writeUInt8(1, 8);
  const tipoEDados = Buffer.concat([Buffer.from('pHYs'), dados]);
  const bloco = Buffer.alloc(4 + tipoEDados.length + 4);
  bloco.writeUInt32BE(dados.length, 0);
  tipoEDados.copy(bloco, 4);
  bloco.writeUInt32BE(crc32(tipoEDados), 4 + tipoEDados.length);
  // Cabeçalho (8) + bloco IHDR (4 + 4 + 13 + 4 = 25): o pHYs entra logo depois.
  return Buffer.concat([png.subarray(0, 33), bloco, png.subarray(33)]);
}

function crc32(bytes) {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
