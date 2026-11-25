// Monta as imagens do guia da confecção (1080 × 1350), com as telas do painel anotadas.
const { chromium } = require('playwright');
const fs = require('fs');
const F = '/home/claude/divestir/src/app/fontes/';
const d64 = (a, t) => `data:${t};base64,${fs.readFileSync(a).toString('base64')}`;
const C = JSON.parse(fs.readFileSync(__dirname + '/telas/caixas.json', 'utf8'));
const uniao = (...ks) => { const b = ks.map((k) => C[k]); const x = Math.min(...b.map((v) => v.x)), y = Math.min(...b.map((v) => v.y)); return { x, y, width: Math.max(...b.map((v) => v.x + v.width)) - x, height: Math.max(...b.map((v) => v.y + v.height)) - y }; };
// Um recorte de tela: arquivo, a região (em pontos da tela) e a largura com que aparece.
function recorte({ tela, regiao: [x, y, w, h], largura = 960, marcas = [] }) {
  const k = largura / w;
  const m = marcas.map(({ caixa, n, lado = 'esq', folga = 6 }) => {
    const b = typeof caixa === 'string' ? C[caixa] : caixa;
    const bx = (b.x - x) * k - folga, by = (b.y - y) * k - folga, bw = b.width * k + 2 * folga, bh = b.height * k + 2 * folga;
    const meioX = bx + bw / 2, meioY = by + bh / 2;
    const [px, py] = { esq: [bx, meioY], dir: [bx + bw, meioY], topo: [meioX, by], base: [meioX, by + bh], acima: [meioX, by - 30], abaixo: [meioX, by + bh + 30], fora: [bx - 30, meioY] }[lado];
    return `<div class="alvo" style="left:${bx}px;top:${by}px;width:${bw}px;height:${bh}px"></div><div class="marca" style="left:${px - 23}px;top:${py - 23}px">${n}</div>`;
  }).join('');
  return `<div class="tela" style="width:${largura}px;height:${h * k}px"><div class="img" style="background-image:url(${d64(`${__dirname}/telas/${tela}.png`, 'image/png')});background-size:${(tela.startsWith('8') || tela.startsWith('9') ? 1100 : 1280) * k}px auto;background-position:${-x * k}px ${-y * k}px"></div>${m}</div>`;
}
const passos = (lista) => `<ol class="passos">${lista.map(([n, t]) => `<li><span class="num">${n}</span><p>${t}</p></li>`).join('')}</ol>`;
const topo = (n, titulo) => `<header><p class="etapa">${n}</p><h1>${titulo}</h1></header>`;
const rodape = (n) => `<footer><span>DIVESTIR · guia da confecção</span><span>${n} de 6</span></footer>`;
const paginas = [
  `<main class="capa"><p class="marca-d">DIVESTIR</p><div><h1>Painel<br>da equipe</h1><p class="sub">Guia rápido da confecção</p></div>
   <ol class="resumo"><li><b>1</b>Entrar no painel</li><li><b>2</b>Ver o que está em produção</li><li><b>3</b>Baixar a estampa de cada peça</li><li><b>4</b>Postar e informar o rastreio</li></ol>
   <p class="link">divestirbr.com.br/painel</p></main>`,
  `<main>${topo('1', 'Entrar')}
   ${recorte({ tela: '1-entrar', regiao: [424, 160, 432, 500], largura: 560, marcas: [{ caixa: uniao('entrar-email', 'entrar-senha'), n: 1, lado: 'dir' }, { caixa: 'entrar-botao', n: 2, lado: 'dir' }] })}
   ${passos([[1, 'Abra <b>divestirbr.com.br/painel</b> no computador e use o <b class="junto">e-mail</b> e a <b>senha provisória</b> que o Lucas te passou.'], [2, 'Clique em <b>Entrar</b>.'], [3, 'No primeiro acesso, clique no <b>seu nome</b>, no alto à direita, e crie a sua própria senha.']])}
   ${rodape(2)}</main>`,
  `<main>${topo('2', 'Os pedidos')}
   ${recorte({ tela: '2-quadro', regiao: [0, 150, 860, 300], marcas: [{ caixa: 'quadro-producao', n: 1, lado: 'acima', folga: 4 }, { caixa: 'quadro-cartao', n: 2, lado: 'base' }] })}
   ${passos([[1, 'O que estiver em <b>Em produção</b> é pra fazer: a arte já foi conferida e aprovada pela Divestir.'], [2, 'Cada cartão é um pedido, com o design, a peça, a cor e o tamanho. <b>Clique nele pra abrir.</b>']])}
   <div class="nota"><p class="t">O que é cada coluna</p>
   <dl><dt>Revisão de arte · Ajuste de foto</dt><dd>A Divestir ainda está conferindo a foto e a arte. Não é pra produzir.</dd>
   <dt>Em produção</dt><dd>Aprovado. É com você.</dd>
   <dt>Enviado · Entregue</dt><dd>Já saiu da confecção.</dd></dl></div>
   ${rodape(3)}</main>`,
  `<main>${topo('3', 'A peça e os arquivos')}
   ${recorte({ tela: '8-peca', regiao: [0, 12, 1100, 716], largura: 900, marcas: [{ caixa: { ...C['peca-linha'], width: 610 }, n: 1, lado: 'dir' }, { caixa: 'peca-estampa', n: 2, lado: 'abaixo' }, { caixa: 'peca-peito', n: 3, lado: 'abaixo' }] })}
   ${passos([[1, 'Confira a <b>peça, a cor, o tamanho</b> e onde vai a estampa (costas ou frente, com ou sem a marca no peito).'], [2, '<b>Baixar a estampa pronta</b>: PNG sem fundo, a 300 dpi, já no tamanho de impressão. A medida em centímetros vai no nome do arquivo. Baixe pelo computador: o arquivo é grande.'], [3, '<b>Baixar a marca do peito (10 cm)</b>: aparece quando a peça leva DIVESTIR no peito.']])}
   ${rodape(4)}</main>`,
  `<main>${topo('4', 'Para onde vai')}
   ${recorte({ tela: '9-entrega', regiao: [0, 396, 560, 290], marcas: [{ caixa: { x: 10, y: 452, width: 520, height: 104 }, n: 1, lado: 'dir' }, { caixa: { x: 10, y: 566, width: 340, height: 108 }, n: 2, lado: 'dir' }] })}
   ${passos([[1, 'O <b>nome</b> e o <b>contato</b> de quem comprou.'], [2, '<b>Entregar em</b>: é este endereço que vai na etiqueta.']])}
   <div class="nota"><p>Pedido de presente aparece marcado na peça, com a mensagem do cartão, e aqui com o nome de quem vai receber.</p></div>
   ${rodape(5)}</main>`,
  `<main>${topo('5', 'Postou? Avisa aqui')}
   ${recorte({ tela: '3-pedido-topo', regiao: [24, 262, 740, 186], largura: 900, marcas: [{ caixa: 'pedido-botao', n: 1, lado: 'fora' }] })}
   <div style="height:26px"></div>
   ${recorte({ tela: '6-rastreio', regiao: [385, 364, 512, 204], largura: 680, marcas: [{ caixa: 'rastreio-campo', n: 2, lado: 'fora', folga: 2 }, { caixa: 'rastreio-confirmar', n: 3, lado: 'fora', folga: 2 }] })}
   ${passos([[1, 'Com a peça postada, abra o pedido e clique em <b>Informar o rastreio</b>.'], [2, 'Cole o <b>código de rastreio</b> da transportadora.'], [3, 'Clique em <b>Marcar como enviado</b>. O pedido vai pra coluna Enviado e o cliente recebe o <span class="junto">e-mail</span> com o rastreio na hora.']])}
   ${rodape(6)}</main>`,
];
const css = `
@font-face{font-family:Anton;src:url(${d64(F + 'anton-400.woff2', 'font/woff2')})}
@font-face{font-family:Serifa;font-style:italic;src:url(${d64(F + 'instrument-serif-400-italic.woff2', 'font/woff2')})}
@font-face{font-family:Inter;font-weight:100 900;src:url(${d64(F + 'inter-variavel.woff2', 'font/woff2')})}
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;font-family:Inter,sans-serif;color:#0D2B17;background:#FAF5EB}
main{width:1080px;height:1350px;padding:64px 60px 56px;display:flex;flex-direction:column;position:relative}
header{display:flex;align-items:flex-end;gap:26px;margin-bottom:38px}
.etapa{font-family:Anton;font-size:150px;line-height:.82;-webkit-text-stroke:3px #0D2B17;color:transparent}
h1{font-family:Anton;font-weight:400;font-size:84px;line-height:.95;text-transform:uppercase;letter-spacing:.005em}
.tela{position:relative;border:3px solid #0D2B17;border-radius:18px;align-self:center;flex:none}
.img{position:absolute;inset:0;border-radius:15px;background-repeat:no-repeat;background-color:#FAF5EB}
.alvo{position:absolute;border:4px solid #0D2B17;border-radius:12px}
.marca,.num{width:46px;height:46px;border-radius:50%;background:#0D2B17;color:#FAF5EB;font-weight:700;font-size:25px;display:flex;align-items:center;justify-content:center;flex:none}
.marca{position:absolute;box-shadow:0 0 0 4px #FAF5EB}
.passos{list-style:none;margin-top:38px;display:grid;gap:20px}
.passos li{display:flex;gap:20px;align-items:flex-start}
.passos p{font-size:31px;line-height:1.3;padding-top:3px}
.nota{margin-top:30px;font-size:27px;line-height:1.32;border-top:3px solid #0D2B17;padding-top:24px}
.nota .t{font-family:Anton;font-size:34px;text-transform:uppercase;margin-bottom:14px}
.nota dl{display:grid;grid-template-columns:auto 1fr;gap:12px 26px}
.nota dt{font-weight:700}
.junto{white-space:nowrap}
footer{margin-top:auto;display:flex;justify-content:space-between;font-size:21px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.capa{background:#0D2B17;color:#FAF5EB;padding:72px 64px 64px;justify-content:space-between}
.capa .marca-d{font-family:Anton;font-size:40px;letter-spacing:.06em}
.capa h1{font-size:196px;line-height:.9}
.capa .sub{font-family:Serifa;font-style:italic;font-size:78px;line-height:1;margin-top:26px;color:#FF4FA8}
.resumo{list-style:none;display:grid;gap:20px}
.resumo li{display:flex;align-items:center;gap:24px;font-size:38px;font-weight:600}
.resumo b{width:60px;height:60px;border-radius:50%;background:#FF4FA8;color:#0D2B17;display:flex;align-items:center;justify-content:center;font-size:32px;flex:none}
.capa .link{font-size:36px;font-weight:700;border-top:3px solid #FAF5EB;padding-top:26px}
`;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (let i = 0; i < paginas.length; i++) {
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${paginas[i]}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const sobra = await p.evaluate(() => { const m = document.querySelector('main'); return m.scrollHeight - m.clientHeight; });
    if (sobra > 0) console.log('página', i + 1, 'passa', sobra, 'px');
    await p.screenshot({ path: `${__dirname}/divestir-guia-confeccao-${i + 1}.png` });
  }
  await b.close();
})();
