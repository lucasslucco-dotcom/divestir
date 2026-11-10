// Gera a imagem que aparece quando o link do site é compartilhado (WhatsApp,
// Instagram, iMessage): 1200 × 630, com as peças da vitrine sobre o verde da marca,
// nas fontes da marca. Salva em src/app/opengraph-image.jpg, que o Next publica
// sozinho como a imagem do link.
//
// Uso (precisa do Playwright, que o ambiente de trabalho do Claude já tem):
//   node scripts/gerar-imagem-do-link.mjs
// Para trocar a frase ou as peças, mude TITULO, LINHA e PECAS e rode de novo.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const TITULO = process.env.TITULO ?? 'Crie sua Divestir';
const LINHA = process.env.LINHA ?? 'Com a foto de quem você ama.';
const PECAS = ['exemplo-vo-cida', 'exemplo-thor', 'exemplo-duda'];
const SAIDA = process.env.SAIDA ?? join(raiz, 'src', 'app', 'opengraph-image.jpg');

const dados = (caminho, tipo) => `data:${tipo};base64,${readFileSync(join(raiz, caminho)).toString('base64')}`;
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  @font-face { font-family: Anton; src: url(${dados('src/app/fontes/anton-400.woff2', 'font/woff2')}); }
  @font-face { font-family: Serifa; font-style: italic; src: url(${dados('src/app/fontes/instrument-serif-400-italic.woff2', 'font/woff2')}); }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; overflow: hidden; background: #0d2b17; color: #faf5eb; position: relative; }
  h1 { position: absolute; top: 44px; left: 0; right: 0; text-align: center; font: 400 96px/1 Anton, sans-serif; text-transform: uppercase; }
  p { position: absolute; top: 152px; left: 0; right: 0; text-align: center; font: italic 400 38px/1.1 Serifa, serif; }
  .pecas { position: absolute; top: 196px; left: 50%; display: flex; transform: translateX(-50%); }
  .pecas img { display: block; width: 404px; height: 505px; margin: 0 -8px;
    -webkit-mask-image: linear-gradient(to bottom, transparent, #000 9%), linear-gradient(to right, transparent, #000 4%, #000 96%, transparent);
    -webkit-mask-composite: source-in; mask-composite: intersect; }
  .pecas img:nth-child(2) { width: 452px; height: 565px; margin-top: -34px; z-index: 1; }
</style></head><body>
  <h1>${TITULO}</h1>
  <p>${LINHA}</p>
  <div class="pecas">${PECAS.map((peca) => `<img src="${dados(`public/exemplos/${peca}.jpg`, 'image/jpeg')}" alt="">`).join('')}</div>
</body></html>`;

const { chromium } = createRequire(import.meta.url)('playwright');
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await pagina.setContent(html, { waitUntil: 'load' });
await pagina.evaluate(() => document.fonts.ready);
writeFileSync(SAIDA, await pagina.screenshot({ type: 'jpeg', quality: 88 }));
await navegador.close();
console.log('imagem do link salva em', SAIDA);
