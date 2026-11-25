// Telas a mais para o guia: a peça com os arquivos, e o cliente e a entrega.
const { chromium } = require('playwright');
const fs = require('fs');
const SITE = 'http://localhost:3100';
const fora = __dirname + '/telas';
const caixas = JSON.parse(fs.readFileSync(`${fora}/caixas.json`, 'utf8'));
(async () => {
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 1100, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const caixa = async (nome, loc) => { const b = await loc.first().boundingBox().catch(() => null); caixas[nome] = b; if (!b) console.log('sem caixa:', nome); };
  await p.goto(`${SITE}/painel/entrar`); await p.fill('#email', 'confeccao@teste.com'); await p.fill('#senha', process.env.SENHA_DE_TESTE);
  await p.click('button[type=submit]'); await p.waitForURL(`${SITE}/painel`);
  await p.goto(`${SITE}/painel/pedidos/1003`); await p.waitForSelector('h4:has-text("Arquivos para a confecção")', { timeout: 60000 }); await p.waitForTimeout(3000);
  // Esconde o aviso do modo de teste do recorte (no site de verdade ele some quando o recorte pago for ligado).
  await p.evaluate(() => { for (const e of document.querySelectorAll('p')) if (e.textContent.includes('modo de teste')) e.style.display = 'none'; });
  const titulo = p.locator('#pecas');
  await titulo.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24)); await p.waitForTimeout(600);
  await caixa('peca-titulo', titulo);
  await caixa('peca-linha', p.locator('text=estampa nas costas'));
  const bloco = p.locator('div', { has: p.locator('h4:has-text("Arquivos para a confecção")') }).last();
  await caixa('peca-arquivos', bloco.locator('h4'));
  for (const [k, t] of [['peca-estampa', 'Baixar a estampa pronta'], ['peca-peito', 'Baixar a marca do peito'], ['peca-recorte', 'Baixar só o recorte']]) await caixa(k, bloco.locator(`button:has-text("${t}")`));
  await p.screenshot({ path: `${fora}/8-peca.png` });
  const entrega = p.locator('h2:has-text("Cliente e entrega")').first();
  await entrega.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 24)); await p.waitForTimeout(600);
  await caixa('ent-titulo', entrega); await caixa('ent-endereco', p.locator('text=Entregar em')); await caixa('ent-nome', p.locator('dt:has-text("Nome"), span:has-text("Nome")'));
  await p.screenshot({ path: `${fora}/9-entrega.png` });
  fs.writeFileSync(`${fora}/caixas.json`, JSON.stringify(caixas, null, 1));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(caixas).filter(([k]) => /^(peca|ent)-/.test(k)).map(([k, v]) => [k, v && [Math.round(v.x), Math.round(v.y), Math.round(v.width), Math.round(v.height)]]))));
  await navegador.close();
})().catch((e) => { console.log('FALHOU', e.message.slice(0, 600)); process.exit(1); });
