// Motor do molde: desenha a arte de um design com o nome e a foto do cliente,
// na tinta da cor da peça, e aplica a arte na foto de base da peça.
// Usa só o canvas do navegador. Quem cria as telas é quem chama (criarTela), para o
// mesmo desenho poder rodar no servidor quando vier o arquivo de impressão (Etapa 7).
//
// O desenho é feito em duas partes, para o enquadramento em cima do design ser
// fluido: o que não muda enquanto a pessoa arrasta a foto (as camadas fixas, a foto
// de base e a sombra do tecido) é preparado uma vez; a cada movimento, só a foto
// é redesenhada.
import { posicaoNoQuadro, type Enquadramento, type Geometria } from '@/lib/foto/enquadramento';
import {
  LARGURA_DA_ARTE,
  TINTAS,
  alturaDaArte,
  limparTextoDaEstampa,
  valorDoCampo,
  type AreaNaFoto,
  type CamadaAnel,
  type CamadaArte,
  type CamadaForma,
  type CamadaFoto,
  type CamadaFotoCirculo,
  type CamadaFotoQuadro,
  type CamadaNome,
  type CamadaTexto,
  type ConfigDoMolde,
  type FonteDoMolde,
  type Giro,
} from './tipos';

export type Tela = HTMLCanvasElement;
export type CriarTela = (largura: number, altura: number) => Tela;

export type FotoNoMolde = {
  imagem: CanvasImageSource;
  geometria: Geometria;
  enquadramento: Enquadramento;
  // A mesma foto com o fundo original, no mesmo quadro do recorte (para os designs
  // que usam a foto inteira). Sem ela, esses designs mostram só o recorte.
  inteira?: CanvasImageSource | null;
};

// Fonte de cada papel: a família CSS já carregada na página e o estilo.
export type Fontes = Record<FonteDoMolde, { familia: string; estilo: 'normal' | 'italic'; peso?: number }>;

export type ImagemDaArte = CanvasImageSource & { width: number; height: number };

export type Pedido = {
  config: ConfigDoMolde;
  corDaPeca: string;
  // Valores dos campos (o nome). Campo vazio mostra o rótulo, para o lugar aparecer.
  valores: Record<string, string>;
  foto: FotoNoMolde | null;
  fontes: Fontes;
  carregarArte: (arquivo: string, tinta: string) => Promise<ImagemDaArte>;
  criarTela?: CriarTela;
  // O ano que entra nos textos com {ano} (Turnê 2026). Sem ele, o ano de hoje; o
  // arquivo de impressão (Etapa 7) passa o ano em que o pedido foi feito.
  ano?: number;
};

const telaDoNavegador: CriarTela = (largura, altura) => {
  const tela = document.createElement('canvas');
  tela.width = Math.max(1, Math.round(largura));
  tela.height = Math.max(1, Math.round(altura));
  return tela;
};

// Telas que não servem mais são zeradas na hora: o Safari do iPhone tem um limite
// de memória para telas e demora a devolver a de uma tela esquecida.
export function liberarTelas(...telas: (Tela | null | undefined)[]) {
  for (const tela of telas) {
    if (!tela) continue;
    tela.width = 0;
    tela.height = 0;
  }
}

function contexto(tela: Tela, opcoes?: CanvasRenderingContext2DSettings) {
  const ctx = tela.getContext('2d', opcoes);
  if (!ctx) throw new Error('O navegador não abriu o canvas.');
  return ctx;
}

const fonteCss = (fonte: Fontes[FonteDoMolde], px: number) =>
  `${fonte.estilo === 'italic' ? 'italic ' : ''}${fonte.peso ?? 400} ${px}px ${fonte.familia}`;

// A tinta da estampa para a cor da peça (ex.: peça preta → tinta creme).
export function tintaDaCor(config: ConfigDoMolde, corDaPeca: string) {
  const nome = config.tintas[corDaPeca] ?? Object.values(config.tintas)[0] ?? 'verde-escuro';
  return TINTAS[nome] ?? (/^#[0-9a-f]{6}$/i.test(nome) ? nome : TINTAS['verde-escuro']);
}

// O texto que vai no campo: o que a pessoa digitou ou, vazio, o rótulo do campo.
export function textoDoCampo(config: ConfigDoMolde, chave: string, valores: Record<string, string>) {
  const campo = config.campos.find((c) => c.chave === chave);
  const valor = campo
    ? valorDoCampo(campo, valores)
    : limparTextoDaEstampa(valores[chave] ?? '')
        .slice(0, 40)
        .trim();
  const texto = valor || campo?.exemplo || campo?.rotulo || '';
  return campo?.caixa === 'alta' ? texto.toLocaleUpperCase('pt-BR') : texto;
}

// Texto fixo com o que muda dentro dele: {ano} e o valor dos campos ({nome}, {desde}).
export function preencherTexto(texto: string, config: ConfigDoMolde, valores: Record<string, string>, ano: number) {
  return texto.replace(/\{([a-z_]+)\}/g, (_, chave: string) =>
    chave === 'ano' ? String(ano) : textoDoCampo(config, chave, valores),
  );
}

function girar(ctx: CanvasRenderingContext2D, giro: Giro | undefined, escala: number) {
  if (!giro?.graus) return;
  ctx.translate(giro.x * escala, giro.y * escala);
  ctx.rotate((giro.graus * Math.PI) / 180);
  ctx.translate(-giro.x * escala, -giro.y * escala);
}

// Estrela de cinco pontas (o ★ dos textos): desenhada, porque as fontes da estampa
// não têm esse sinal e cada aparelho poria uma estrela diferente no lugar.
function desenharEstrela(ctx: CanvasRenderingContext2D, cx: number, cy: number, raio: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? raio * 0.42 : raio;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    if (i) ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
}

// Texto mais largo que o espaço dele primeiro estreita as letras (até aqui) e só
// depois diminui.
const TEXTO_ESTREITA_ATE = 0.72;

function desenharTexto(
  ctx: CanvasRenderingContext2D,
  c: CamadaTexto,
  texto: string,
  tinta: string,
  escala: number,
  fontes: Fontes,
) {
  if (!texto) return;
  const fonte = fontes[c.fonte] ?? fontes.titulo;
  ctx.save();
  girar(ctx, c.giro, escala);
  ctx.fillStyle = tinta;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = fonteCss(fonte, 100);
  const capa = ctx.measureText('H').actualBoundingBoxAscent / 100 || 0.7;
  // Sem espaço entre as letras nem estrela, o texto vai inteiro (as letras ficam com
  // o encaixe da fonte); senão, letra por letra.
  const pedacos = !c.espaco && !texto.includes('★') ? [texto] : [...texto];
  const medir = (px: number) => {
    ctx.font = fonteCss(fonte, px);
    const larguras = pedacos.map((pedaco) => (pedaco === '★' ? px * capa : ctx.measureText(pedaco).width));
    const espaco = (c.espaco ?? 0) * px;
    return { larguras, espaco, total: larguras.reduce((soma, l) => soma + l, 0) + espaco * (pedacos.length - 1) };
  };
  const maxima = c.largura * escala;
  let px: number;
  let estreita = 1;
  let medida: ReturnType<typeof medir>;
  if (c.altura) {
    px = (c.altura * escala) / capa;
    medida = medir(px);
    if (medida.total > maxima) {
      estreita = Math.max(TEXTO_ESTREITA_ATE, maxima / medida.total);
      if (medida.total * estreita > maxima) {
        px *= maxima / (medida.total * estreita);
        medida = medir(px);
      }
    }
  } else {
    px = (100 * maxima) / Math.max(1, medir(100).total);
    medida = medir(px);
  }
  const total = medida.total * estreita;
  const alinhar = c.alinhar ?? 'centro';
  ctx.translate(c.x * escala - (alinhar === 'centro' ? total / 2 : alinhar === 'direita' ? total : 0), 0);
  ctx.scale(estreita, 1);
  const base = c.base * escala;
  let x = 0;
  pedacos.forEach((pedaco, i) => {
    if (pedaco === '★') desenharEstrela(ctx, x + medida.larguras[i] / 2, base - (px * capa) / 2, px * capa * 0.56);
    else ctx.fillText(pedaco, x, base);
    x += medida.larguras[i] + medida.espaco;
  });
  ctx.restore();
}

function desenharForma(ctx: CanvasRenderingContext2D, c: CamadaForma, tinta: string, escala: number) {
  ctx.save();
  girar(ctx, c.giro, escala);
  // O contorno fica por dentro da medida da forma.
  const borda = Math.max(0, c.contorno ?? 0) * escala;
  const w = c.largura * escala - borda;
  const h = c.altura * escala - borda;
  const x = c.x * escala - w / 2;
  const y = c.y * escala - h / 2;
  const r = Math.max(0, Math.min((c.raio ?? 0) * escala - borda / 2, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  if (borda > 0) {
    ctx.strokeStyle = tinta;
    ctx.lineWidth = borda;
    ctx.stroke();
  } else {
    ctx.fillStyle = tinta;
    ctx.fill();
  }
  ctx.restore();
}

function desenharAnel(ctx: CanvasRenderingContext2D, c: CamadaAnel, tinta: string, escala: number) {
  ctx.save();
  ctx.strokeStyle = tinta;
  ctx.lineWidth = c.espessura * escala;
  ctx.beginPath();
  ctx.arc(c.x * escala, c.y * escala, c.raio * escala, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// O nome é escrito numa tela à parte (o rascunho), já com o tamanho e a largura
// finais: nomes longos primeiro estreitam as letras e só depois diminuem.
function rascunharNome(
  medida: CanvasRenderingContext2D,
  c: CamadaNome,
  texto: string,
  tinta: string,
  escala: number,
  fontes: Fontes,
  criarTela: CriarTela,
) {
  const fonte = fontes[c.fonte];
  medida.save();
  medida.font = fonteCss(fonte, 100);
  const capa = medida.measureText('H').actualBoundingBoxAscent / 100 || 0.86;
  // "acento_dentro": o acento de cima (Â, É, Ã) cabe dentro da altura do nome. A letra
  // fica um pouco menor e desce, e nada acima do nome (a etiqueta, a borda da arte) é
  // atropelado.
  const comAcento = c.acento_dentro && ACENTO_DE_CIMA.test(texto.normalize('NFD'));
  const subida = comAcento ? Math.max(capa, medida.measureText(texto).actualBoundingBoxAscent / 100) : capa;
  const altura = (c.altura_no_centro * capa) / subida;
  let px = (altura * escala) / capa;
  const pxCheio = (c.altura_no_centro * escala) / capa;
  medida.font = fonteCss(fonte, px);
  let largura = medida.measureText(texto).width;
  const maxima = c.largura_maxima * escala;
  const estreita = Math.min(Math.max(1, c.expansao_maxima ?? 1), Math.max(c.compressao_maxima, maxima / largura));
  if (largura * estreita > maxima) {
    px *= maxima / (largura * estreita);
    medida.font = fonteCss(fonte, px);
    largura = medida.measureText(texto).width;
  }
  medida.restore();

  const alturaDaCapa = px * capa;
  const acima = Math.ceil(px * 0.5);
  const abaixo = Math.ceil(px * 0.35);
  // "engrossa": a letra é pintada de novo um pouco para cada lado (e um quinto disso
  // para cima e para baixo), e as hastes ficam mais grossas sem a letra crescer.
  // A medida vale para o nome no tamanho cheio e sem estreitar; nome longo, que sai
  // menor e mais estreito, engrossa na mesma proporção (senão as letras se fecham).
  const grossura = Math.max(0, (c.engrossa ?? 0) * escala * (px / pxCheio) * Math.min(1, estreita));
  const margem = Math.ceil(grossura);
  const w = Math.max(1, Math.ceil(largura * estreita) + 2 + 2 * margem);
  const h = Math.ceil(acima + alturaDaCapa + abaixo);
  const tela = criarTela(w, h);
  const r = contexto(tela, { willReadFrequently: true });
  r.font = fonteCss(fonte, px);
  r.fillStyle = tinta;
  r.textBaseline = 'alphabetic';
  r.scale(estreita, 1);
  const passos = Math.max(1, Math.ceil(grossura));
  for (let i = -passos; i <= passos; i++) {
    const dx = grossura > 0 ? (i / passos) * grossura : 0;
    for (const dy of grossura > 0 ? [-grossura / 5, 0, grossura / 5] : [0]) {
      r.fillText(texto, (1 + margem + dx) / estreita, acima + alturaDaCapa + dy);
    }
    if (grossura === 0) break;
  }
  // Com o acento dentro, o topo da maiúscula desce o tamanho do acento.
  const topo = c.topo * escala + px * (subida - capa);
  return { tela, w, h, acima, alturaDaCapa, x0: Math.round(c.x * escala - w / 2), topo };
}

// Quanto a coluna do nome estica do topo da maiúscula para baixo: nada no meio da
// arte e cada vez mais perto das pontas, e a base do nome vira um arco. O arco é o
// da arte (a largura máxima do nome), não o de cada nome: assim a base acompanha o
// círculo da foto, e um nome curto (ZÉ, LU, THOR) fica no meio, quase reto, em vez
// de descer para dentro do círculo, onde a cabeça de quem está na foto o cobriria.
// "x" é a coluna dentro do rascunho, que começa em x0 na tela.
const esticar = (c: CamadaNome, x: number, x0: number, escala: number) => {
  const u = Math.min(1, Math.abs(x0 + x + 0.5 - c.x * escala) / Math.max(1, (c.largura_maxima * escala) / 2));
  return 1 + (c.arco - 1) * u * u;
};

// Quanto a coluna do nome desce inteira ("curva"): nada no meio da arte e cada vez
// mais perto das pontas, e o nome todo vira um arco, como em camiseta de turnê.
const descer = (c: CamadaNome, x: number, x0: number, escala: number) => {
  if (!c.curva) return 0;
  const u = Math.min(1.2, Math.abs(x0 + x + 0.5 - c.x * escala) / Math.max(1, (c.largura_maxima * escala) / 2));
  return c.curva * escala * u * u;
};

// O nome: redesenhado coluna a coluna a partir do rascunho. Até o topo da maiúscula
// nada muda (os acentos ficam no lugar); dali para baixo a coluna estica.
function desenharNome(
  ctx: CanvasRenderingContext2D,
  c: CamadaNome,
  texto: string,
  tinta: string,
  escala: number,
  fontes: Fontes,
  criarTela: CriarTela,
) {
  if (!texto) return;
  const { tela: rascunho, w, h, acima, x0, topo } = rascunharNome(ctx, c, texto, tinta, escala, fontes, criarTela);
  for (let x = 0; x < w; x++) {
    const s = esticar(c, x, x0, escala);
    const d = descer(c, x, x0, escala);
    ctx.drawImage(rascunho, x, 0, 1, acima, x0 + x, topo - acima + d, 1, acima);
    ctx.drawImage(rascunho, x, acima, 1, h - acima, x0 + x, topo + d, 1, (h - acima) * s);
  }
  liberarTelas(rascunho);
}

// Acentos que ficam em cima da letra (agudo, grave, circunflexo, til, trema...).
const ACENTO_DE_CIMA = /[\u0300-\u030c]/;

// Letras com um pedaço abaixo da linha de base (a cedilha do Ç, a perna do Q e, com
// minúsculas, g j p q y). Esse pedaço cai dentro do círculo da foto, e a cabeça de
// quem está na foto pode passar por cima: PAÇOCA viraria PACOCA.
const DESCE_DA_LINHA = /[ÇçQqgjpy]/;

// O que do nome desce da linha de base, para pintar de novo por cima da foto, com um
// respiro em volta. Só entram as colunas que têm tinta bem abaixo da linha: as
// curvas do O, do C e do S passam um fio dela e ficam de fora. Devolve a forma e a
// máscara do respiro (que não toca nas letras, só no que está abaixo delas).
function descidasDoNome(
  c: CamadaNome,
  texto: string,
  tinta: string,
  escala: number,
  fontes: Fontes,
  criarTela: CriarTela,
  W: number,
  H: number,
): { forma: Tela; mascara: Tela } | null {
  if (!DESCE_DA_LINHA.test(texto)) return null;
  const forma = criarTela(W, H);
  const f = contexto(forma);
  const {
    tela: rascunho,
    w,
    h,
    acima,
    alturaDaCapa,
    x0,
    topo,
  } = rascunharNome(f, c, texto, tinta, escala, fontes, criarTela);
  const base = Math.round(acima + alturaDaCapa);
  const limite = Math.min(h - 1, base + Math.max(2, Math.round(alturaDaCapa * 0.045)));
  let colunas: number[] = [];
  try {
    const { data } = contexto(rascunho).getImageData(0, limite, w, h - limite);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h - limite; y++) {
        if (data[(y * w + x) * 4 + 3] > 96) {
          colunas.push(x);
          break;
        }
      }
    }
  } catch {
    colunas = [];
  }
  if (!colunas.length) {
    liberarTelas(rascunho, forma);
    return null;
  }
  for (const x of colunas) {
    const s = esticar(c, x, x0, escala);
    const d = descer(c, x, x0, escala);
    f.drawImage(rascunho, x, base, 1, h - base, x0 + x, topo + d + alturaDaCapa * s, 1, (h - base) * s);
  }
  const mascara = mascaraComFolga(forma, 0, 0, 9 * escala, W, H, criarTela);
  // O respiro vale só abaixo da linha de base: as letras do nome ficam inteiras.
  const m = contexto(mascara);
  for (let x = -Math.ceil(10 * escala); x < w + Math.ceil(10 * escala); x++) {
    const s = esticar(c, x, x0, escala);
    m.clearRect(x0 + x, 0, 1, topo + descer(c, x, x0, escala) + alturaDaCapa * s);
  }
  liberarTelas(rascunho);
  return { forma, mascara };
}

// Apaga o que estiver embaixo de uma forma, com um respiro em volta dela: a mesma
// forma, deslocada em volta, vira a máscara.
function mascaraComFolga(forma: Tela, x: number, y: number, folga: number, W: number, H: number, criarTela: CriarTela) {
  const mascara = criarTela(W, H);
  const m = contexto(mascara);
  for (let k = 0; k < 24; k++) {
    const angulo = (k / 24) * Math.PI * 2;
    m.drawImage(forma, x + Math.cos(angulo) * folga, y + Math.sin(angulo) * folga);
  }
  m.drawImage(forma, x, y);
  return mascara;
}

// A janela onde a foto entra, em unidades da arte. É o quadro do enquadramento da
// Etapa 3: o que está no meio do quadro vai para o meio da janela.
// No círculo, ela é de 4:5, com a largura do diâmetro e o mesmo centro, e o molde
// pode encolher e baixar esse quadro ("janela"), para a cabeça chegar encostando na
// base do nome em vez de passar por cima das letras. Na foto solta, a largura, a
// altura e o centro vêm do molde.
export function janelaDaFoto(c: CamadaFoto) {
  if (c.formato === 'quadro') {
    const largura = Math.max(1, c.janela?.largura ?? c.largura);
    const altura = Math.max(1, c.janela?.altura ?? c.altura);
    const y = c.janela?.y ?? c.topo + c.altura / 2;
    return { x: c.x - largura / 2, y: y - altura / 2, largura, altura };
  }
  const escala = Math.min(1.5, Math.max(0.5, c.janela?.escala ?? 1));
  const raio = c.raio * escala;
  const y = c.y + (c.janela?.desce ?? 0);
  return { x: c.x - raio, y: y - 1.25 * raio, largura: 2 * raio, altura: 2.5 * raio };
}

// Onde o recorte cai dentro da arte, em unidades da arte.
function lugarDaFoto(c: CamadaFoto, foto: FotoNoMolde) {
  const janela = janelaDaFoto(c);
  const p = posicaoNoQuadro(foto.geometria, foto.enquadramento, janela.largura / janela.altura);
  return {
    janela,
    x: janela.x + (p.esquerda / 100) * janela.largura,
    y: janela.y + (p.topo / 100) * janela.altura,
    w: (p.largura / 100) * janela.largura,
    h: (p.altura / 100) * janela.altura,
  };
}

function desenharFotoNoCirculo(ctx: CanvasRenderingContext2D, c: CamadaFotoCirculo, foto: FotoNoMolde, escala: number) {
  const { x, y, w, h } = lugarDaFoto(c, foto);
  const desenhar = () => ctx.drawImage(foto.imagem, x * escala, y * escala, w * escala, h * escala);
  const cx = c.x * escala;
  const cy = c.y * escala;
  const raio = c.raio * escala;
  // Com "raio_y", um oval.
  const raioY = (c.raio_y ?? c.raio) * escala;
  const oval = (folga: number) => ctx.ellipse(cx, cy, raio + folga, raioY + folga, 0, 0, Math.PI * 2);

  // Dentro do círculo.
  ctx.save();
  ctx.beginPath();
  oval(0);
  ctx.clip();
  desenhar();
  ctx.restore();

  // A faixa de cima onde a foto pode vazar: entre o círculo e um círculo maior, só
  // acima do centro. Sem sobrepor a parte de dentro, a borda macia não dobra.
  if (c.vaza_acima > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, LARGURA_DA_ARTE * escala, cy);
    ctx.clip();
    ctx.beginPath();
    oval(c.vaza_acima * escala);
    oval(0);
    ctx.clip('evenodd');
    desenhar();
    ctx.restore();
  }
}

// A foto solta: o recorte inteiro, cortado só pelo retângulo do molde. Com "fundo",
// entra a foto com o fundo original no mesmo lugar do recorte (as duas têm o mesmo
// quadro), aumentada e encostada o quanto for preciso para cobrir o retângulo todo.
const FUNDO_DO_POSTER = '#141414';

function desenharFotoNoQuadro(ctx: CanvasRenderingContext2D, c: CamadaFotoQuadro, foto: FotoNoMolde, escala: number) {
  const lugar = lugarDaFoto(c, foto);
  const { janela } = lugar;
  let { x, y, w, h } = lugar;
  const corte = { x: c.x - c.largura / 2, y: c.topo, w: c.largura, h: c.altura };
  ctx.save();
  ctx.beginPath();
  ctx.rect(corte.x * escala, corte.y * escala, corte.w * escala, corte.h * escala);
  ctx.clip();
  if (c.fundo && foto.inteira) {
    const aumento = Math.max(1, corte.w / w, corte.h / h);
    if (aumento > 1) {
      // Aumenta em volta de quem está na foto, que não sai do lugar.
      const cx = janela.x + (0.5 + foto.enquadramento.x) * janela.largura;
      const cy = janela.y + (0.5 + foto.enquadramento.y) * janela.altura;
      x = cx - (cx - x) * aumento;
      y = cy - (cy - y) * aumento;
      w *= aumento;
      h *= aumento;
    }
    x = Math.min(corte.x, Math.max(x, corte.x + corte.w - w));
    y = Math.min(corte.y, Math.max(y, corte.y + corte.h - h));
    ctx.drawImage(foto.inteira, x * escala, y * escala, w * escala, h * escala);
  } else {
    // Sem a foto com fundo (foto antiga, HEIC), o pôster ganha um fundo escuro de
    // estúdio atrás do recorte.
    if (c.fundo) {
      ctx.fillStyle = FUNDO_DO_POSTER;
      ctx.fillRect(corte.x * escala, corte.y * escala, corte.w * escala, corte.h * escala);
    }
    ctx.drawImage(foto.imagem, x * escala, y * escala, w * escala, h * escala);
  }
  if (c.fundo && (c.sombra ?? 0) > 0) {
    // A base da foto escurece, como em pôster de cinema: o nome é lido por cima.
    const base = (corte.y + corte.h) * escala;
    const topo = base - Math.min(1, c.sombra ?? 0) * corte.h * escala;
    const degrade = ctx.createLinearGradient(0, topo, 0, base);
    degrade.addColorStop(0, 'rgba(0, 0, 0, 0)');
    degrade.addColorStop(0.55, 'rgba(0, 0, 0, 0.62)');
    degrade.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    ctx.fillStyle = degrade;
    ctx.fillRect(corte.x * escala, topo, corte.w * escala, base - topo + 1);
  }
  ctx.restore();
}

function desenharFoto(ctx: CanvasRenderingContext2D, c: CamadaFoto, foto: FotoNoMolde, escala: number) {
  if (c.formato === 'quadro') desenharFotoNoQuadro(ctx, c, foto, escala);
  else desenharFotoNoCirculo(ctx, c, foto, escala);
}

// A arte fixa (SVG) vira uma imagem pronta, no tamanho final, uma vez só:
// redesenhar uma imagem pronta é muito mais rápido que redesenhar um SVG.
function rasterizarArte(imagem: ImagemDaArte, c: CamadaArte, escala: number, criarTela: CriarTela) {
  const lw = c.largura * escala;
  const lh = lw * (imagem.height / imagem.width);
  const lx = c.x * escala - lw / 2;
  const ly = c.topo * escala;
  const x = Math.floor(lx);
  const y = Math.floor(ly);
  const tela = criarTela(Math.ceil(lw + (lx - x)) + 1, Math.ceil(lh + (ly - y)) + 1);
  const ctx = contexto(tela);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imagem, lx - x, ly - y, lw, lh);
  return { tela, x, y };
}

type Passo = { tipo: 'tela'; tela: Tela } | { tipo: 'foto'; camada: CamadaFoto } | { tipo: 'folga'; mascara: Tela };

export type ArtePreparada = {
  largura: number;
  altura: number;
  // Desenha a arte com a foto (ou sem ela). Reaproveita "destino" se o tamanho bater.
  desenhar: (foto: FotoNoMolde | null, destino?: Tela) => Tela;
  // Devolve a memória das camadas guardadas.
  liberar: () => void;
};

// Prepara a arte de um design com "escala" pixels por unidade do molde: as camadas
// fixas ficam prontas, e a foto entra na hora de desenhar.
export async function prepararArte(pedido: Omit<Pedido, 'foto'>, escala: number): Promise<ArtePreparada> {
  const { config } = pedido;
  const criarTela = pedido.criarTela ?? telaDoNavegador;
  const W = Math.max(1, Math.round(LARGURA_DA_ARTE * escala));
  const H = Math.max(1, Math.round(alturaDaArte(config) * escala));
  const tinta = tintaDaCor(config, pedido.corDaPeca);
  const passos: Passo[] = [];
  // As camadas fixas seguidas são pintadas juntas numa tela só.
  let fixa: CanvasRenderingContext2D | null = null;
  const telaFixa = () => {
    if (!fixa) {
      const tela = criarTela(W, H);
      passos.push({ tipo: 'tela', tela });
      fixa = contexto(tela);
    }
    return fixa;
  };

  // Desgaste de estampa antiga: a textura fura a tinta das camadas marcadas (o nome, a
  // fita), sempre no mesmo lugar da arte. "x" e "y" dizem onde a tela está na arte.
  const textura = config.desgaste?.arquivo ? await pedido.carregarArte(config.desgaste.arquivo, '#000000') : null;
  const desgastar = (tela: Tela, x = 0, y = 0) => {
    if (!textura) return;
    const proporcao = textura.height / textura.width;
    const largura = Math.max(W, H / proporcao);
    const ctx = contexto(tela);
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(textura, (W - largura) / 2 - x, -y, largura, largura * proporcao);
    ctx.restore();
  };

  // Textos seguidos com respiro (os blocos do O Lendário) dividem uma máscara só: o
  // respiro de todos apaga o que está embaixo de uma vez, e uma tela a menos por
  // texto pesa menos na memória do celular.
  let grupo: { tela: Tela; folga: number } | null = null;
  const fecharGrupo = () => {
    if (!grupo) return;
    passos.push({ tipo: 'folga', mascara: mascaraComFolga(grupo.tela, 0, 0, grupo.folga * escala, W, H, criarTela) });
    fixa = null;
    telaFixa().drawImage(grupo.tela, 0, 0);
    liberarTelas(grupo.tela);
    grupo = null;
  };

  const ano = pedido.ano ?? new Date().getFullYear();
  for (const [indice, camada] of config.camadas.entries()) {
    if (!(camada.tipo === 'texto' && !camada.vazado && (camada.folga ?? 0) > 0)) fecharGrupo();
    if (camada.tipo === 'foto') {
      passos.push({ tipo: 'foto', camada });
      fixa = null;
      // A cedilha (e o que mais descer da linha de base de um nome pintado antes da
      // foto) volta por cima da foto.
      for (const nome of config.camadas.slice(0, indice)) {
        if (nome.tipo !== 'nome') continue;
        const texto = textoDoCampo(config, nome.campo, pedido.valores);
        const descidas = descidasDoNome(nome, texto, tinta, escala, pedido.fontes, criarTela, W, H);
        if (!descidas) continue;
        passos.push({ tipo: 'folga', mascara: descidas.mascara });
        fixa = null;
        telaFixa().drawImage(descidas.forma, 0, 0);
        liberarTelas(descidas.forma);
      }
    } else if (camada.tipo === 'texto') {
      const texto = preencherTexto(camada.texto, config, pedido.valores, ano);
      if (camada.vazado) {
        // O texto fura o que está embaixo (a faixa, a foto): aparece o tecido.
        const mascara = criarTela(W, H);
        desenharTexto(contexto(mascara), camada, texto, '#000', escala, pedido.fontes);
        passos.push({ tipo: 'folga', mascara });
        fixa = null;
      } else if ((camada.folga ?? 0) > 0) {
        // Respiro em volta das letras: o texto passa por cima da foto sem se misturar.
        grupo ??= { tela: criarTela(W, H), folga: 0 };
        grupo.folga = Math.max(grupo.folga, camada.folga ?? 0);
        desenharTexto(contexto(grupo.tela), camada, texto, tinta, escala, pedido.fontes);
      } else desenharTexto(telaFixa(), camada, texto, tinta, escala, pedido.fontes);
    } else if (camada.tipo === 'forma') desenharForma(telaFixa(), camada, tinta, escala);
    else if (camada.tipo === 'anel') desenharAnel(telaFixa(), camada, tinta, escala);
    else if (camada.tipo === 'nome') {
      const texto = textoDoCampo(config, camada.campo, pedido.valores);
      const tintaDoNome = (camada.tinta && TINTAS[camada.tinta]) || tinta;
      if (camada.vazado) {
        // O nome fura o que está embaixo (a faixa do letreiro): aparece o tecido.
        const mascara = criarTela(W, H);
        desenharNome(contexto(mascara), camada, texto, '#000', escala, pedido.fontes, criarTela);
        passos.push({ tipo: 'folga', mascara });
        fixa = null;
      } else if ((camada.folga ?? 0) > 0 || camada.desgaste) {
        const tela = criarTela(W, H);
        desenharNome(contexto(tela), camada, texto, tintaDoNome, escala, pedido.fontes, criarTela);
        if ((camada.folga ?? 0) > 0) {
          // Respiro em volta das letras: o nome passa por cima do que está embaixo sem
          // se misturar.
          const mascara = mascaraComFolga(tela, 0, 0, (camada.folga ?? 0) * escala, W, H, criarTela);
          passos.push({ tipo: 'folga', mascara });
          fixa = null;
        }
        if (camada.desgaste) desgastar(tela);
        telaFixa().drawImage(tela, 0, 0);
        liberarTelas(tela);
      } else desenharNome(telaFixa(), camada, texto, tintaDoNome, escala, pedido.fontes, criarTela);
    } else if (camada.tipo === 'arte') {
      const { tela, x, y } = rasterizarArte(
        await pedido.carregarArte(camada.arquivo, tinta),
        camada,
        escala,
        criarTela,
      );
      if (camada.base) {
        // A arte tem letras vazadas (a faixa): o que estiver embaixo da faixa inteira
        // é apagado antes, e pelas letras aparece o tecido, não a foto.
        const base = rasterizarArte(await pedido.carregarArte(camada.base, '#000000'), camada, escala, criarTela);
        let mascara: Tela;
        if (camada.folga > 0)
          mascara = mascaraComFolga(base.tela, base.x, base.y, camada.folga * escala, W, H, criarTela);
        else {
          mascara = criarTela(W, H);
          contexto(mascara).drawImage(base.tela, base.x, base.y);
        }
        liberarTelas(base.tela);
        passos.push({ tipo: 'folga', mascara });
        fixa = null;
      } else if (camada.folga > 0) {
        // Respiro em volta da arte: apaga o que estiver embaixo (foto, anel, nome).
        passos.push({ tipo: 'folga', mascara: mascaraComFolga(tela, x, y, camada.folga * escala, W, H, criarTela) });
        fixa = null;
      }
      if (camada.desgaste) desgastar(tela, x, y);
      telaFixa().drawImage(tela, x, y);
      liberarTelas(tela);
    }
  }
  fecharGrupo();

  return {
    largura: W,
    altura: H,
    desenhar(foto, destino) {
      const tela = destino && destino.width === W && destino.height === H ? destino : criarTela(W, H);
      const ctx = contexto(tela);
      ctx.clearRect(0, 0, W, H);
      for (const passo of passos) {
        if (passo.tipo === 'tela') ctx.drawImage(passo.tela, 0, 0);
        else if (passo.tipo === 'foto') {
          if (foto) desenharFoto(ctx, passo.camada, foto, escala);
        } else {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.drawImage(passo.mascara, 0, 0);
          ctx.restore();
        }
      }
      return tela;
    },
    liberar() {
      liberarTelas(
        ...passos.map((passo) => (passo.tipo === 'tela' ? passo.tela : passo.tipo === 'folga' ? passo.mascara : null)),
      );
    },
  };
}

// Desenha a arte inteira numa tela nova, com "escala" pixels por unidade do molde.
export async function desenharArte(pedido: Pedido, escala: number): Promise<Tela> {
  const arte = await prepararArte(pedido, escala);
  const tela = arte.desenhar(pedido.foto);
  arte.liberar();
  return tela;
}

// A marca no peito: DIVESTIR em Anton, caixa-alta, com 0,06em entre as letras, como
// no topo do site. Fica no lugar do logo até ele ficar pronto (decisão do Lucas,
// 08/11/2026). A tela sai justa em volta das letras; a proporção dela é a da marca.
export const MARCA = 'DIVESTIR';

export function desenharMarca(fontes: Fontes, tinta: string, alturaDaLetra: number, criarTela = telaDoNavegador) {
  const fonte = fontes.titulo;
  const medida = contexto(criarTela(1, 1));
  medida.font = fonteCss(fonte, 100);
  const capa = medida.measureText('H').actualBoundingBoxAscent / 100 || 0.86;
  const px = alturaDaLetra / capa;
  medida.font = fonteCss(fonte, px);
  const espaco = 0.06 * px;
  const letras = [...MARCA];
  const larguras = letras.map((letra) => medida.measureText(letra).width);
  const total = larguras.reduce((soma, l) => soma + l, 0) + espaco * (letras.length - 1);
  // Uma sobra em cima e embaixo para as curvas que passam um pouco da linha (o S).
  const sobra = Math.ceil(alturaDaLetra * 0.04);
  const tela = criarTela(Math.ceil(total), Math.ceil(alturaDaLetra) + 2 * sobra);
  const ctx = contexto(tela);
  ctx.font = fonteCss(fonte, px);
  ctx.fillStyle = tinta;
  ctx.textBaseline = 'alphabetic';
  let x = 0;
  letras.forEach((letra, i) => {
    ctx.fillText(letra, x, sobra + alturaDaLetra);
    x += larguras[i] + espaco;
  });
  return tela;
}

// Pedaço da foto de base que aparece na tela, em pixels da foto.
export type Janela = { x: number; y: number; largura: number; altura: number };

// Janela de 4:5 em volta da estampa, para ver a arte de perto sem perder o tecido.
export function janelaDePerto(area: AreaNaFoto, foto: { largura: number; altura: number }, proporcao: number): Janela {
  const w = area.largura * foto.largura;
  const h = w / proporcao;
  let largura = Math.min(foto.largura, w * 1.5);
  let altura = largura * 1.25;
  if (altura > foto.altura) {
    altura = foto.altura;
    largura = altura / 1.25;
  }
  const centroX = area.x * foto.largura;
  const centroY = area.topo * foto.altura + h / 2;
  return {
    x: Math.min(foto.largura - largura, Math.max(0, centroX - largura / 2)),
    y: Math.min(foto.altura - altura, Math.max(0, centroY - altura / 2)),
    largura,
    altura,
  };
}

// Onde fica a janela da foto (o quadro do enquadramento) dentro da tela da prévia,
// em frações da tela. É por ela que arrastar e dar zoom em cima do design viram
// mudanças no enquadramento.
export function janelaDaFotoNaTela(
  config: ConfigDoMolde,
  area: AreaNaFoto,
  tamanhoDaFoto: { largura: number; altura: number },
  janela: Janela,
) {
  const camada = config.camadas.find((c): c is CamadaFoto => c.tipo === 'foto');
  if (!camada) return null;
  const j = janelaDaFoto(camada);
  const larguraNaFoto = area.largura * tamanhoDaFoto.largura;
  const unidade = larguraNaFoto / LARGURA_DA_ARTE;
  const x0 = area.x * tamanhoDaFoto.largura - larguraNaFoto / 2;
  const y0 = area.topo * tamanhoDaFoto.altura;
  return {
    x: (x0 + j.x * unidade - janela.x) / janela.largura,
    y: (y0 + j.y * unidade - janela.y) / janela.altura,
    largura: (j.largura * unidade) / janela.largura,
    altura: (j.altura * unidade) / janela.altura,
  };
}

// Suaviza a sombra do tecido (média dos vizinhos, na horizontal e na vertical, duas
// vezes). As dobras são largas e continuam lá; o que sai são os quadradinhos da
// compressão da foto de base, que apareciam na tinta quando a prévia é ampliada.
function suavizar(mapa: Float32Array, w: number, h: number, raio: number) {
  if (raio < 1 || w < 3 || h < 3) return;
  const apoio = new Float32Array(Math.max(w, h));
  const passar = (inicio: number, passo: number, n: number) => {
    for (let i = 0; i < n; i++) apoio[i] = mapa[inicio + i * passo];
    let soma = 0;
    let conta = 0;
    for (let i = 0; i <= Math.min(raio, n - 1); i++) {
      soma += apoio[i];
      conta++;
    }
    for (let i = 0; i < n; i++) {
      mapa[inicio + i * passo] = soma / conta;
      const sai = i - raio;
      const entra = i + raio + 1;
      if (sai >= 0) {
        soma -= apoio[sai];
        conta--;
      }
      if (entra < n) {
        soma += apoio[entra];
        conta++;
      }
    }
  };
  for (let vez = 0; vez < 2; vez++) {
    for (let y = 0; y < h; y++) passar(y * w, 1, w);
    for (let x = 0; x < w; x++) passar(x, w, h);
  }
}

export type PecaPreparada = {
  largura: number;
  altura: number;
  // Desenha a foto de base e, por cima, a arte (se houver) com a luz e a sombra do tecido.
  aplicar: (destino: Tela, arte: Tela | null) => void;
  // Devolve a memória da foto de base preparada.
  liberar: () => void;
};

// Prepara a foto de base da peça (ou o pedaço dela dado pela janela) numa tela de
// largura × altura, com a área da estampa. A luz e a sombra do tecido passam por cima
// da tinta, para a estampa acompanhar as dobras. "proporcao" é largura ÷ altura da arte.
export function prepararPeca(
  base: CanvasImageSource,
  tamanhoDaFoto: { largura: number; altura: number },
  area: AreaNaFoto | null,
  proporcao: number,
  largura: number,
  altura: number,
  janela: Janela = { x: 0, y: 0, largura: tamanhoDaFoto.largura, altura: tamanhoDaFoto.altura },
  criarTela: CriarTela = telaDoNavegador,
): PecaPreparada {
  const W = Math.max(1, Math.round(largura));
  const H = Math.max(1, Math.round(altura));
  const fundoDaPeca = criarTela(W, H);
  const f = contexto(fundoDaPeca, { willReadFrequently: true });
  f.drawImage(base, janela.x, janela.y, janela.largura, janela.altura, 0, 0, W, H);

  let caixa: {
    x0: number;
    y0: number;
    w: number;
    h: number;
    xs: number;
    ys: number;
    bw: number;
    bh: number;
    camada: Tela;
    fundo: ImageData | null;
    sombra: Float32Array | null;
  } | null = null;

  if (area) {
    const s = W / janela.largura;
    const larguraNaFoto = area.largura * tamanhoDaFoto.largura;
    const w = Math.max(1, Math.round(larguraNaFoto * s));
    const h = Math.max(1, Math.round(w / proporcao));
    const x0 = Math.round((area.x * tamanhoDaFoto.largura - larguraNaFoto / 2 - janela.x) * s);
    const y0 = Math.round((area.topo * tamanhoDaFoto.altura - janela.y) * s);
    const xs = Math.max(0, x0);
    const ys = Math.max(0, y0);
    const bw = Math.min(W, x0 + w) - xs;
    const bh = Math.min(H, y0 + h) - ys;
    if (bw > 0 && bh > 0) {
      let fundo: ImageData | null = null;
      let sombra: Float32Array | null = null;
      try {
        fundo = f.getImageData(xs, ys, bw, bh);
        const d = fundo.data;
        let soma = 0;
        let n = 0;
        for (let i = 0; i < d.length; i += 16) {
          soma += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          n++;
        }
        const media = n ? soma / n : 128;
        sombra = new Float32Array(bw * bh);
        for (let p = 0, i = 0; p < sombra.length; p++, i += 4) {
          const luz = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          sombra[p] = Math.max(0.78, Math.min(1.1, (luz + 24) / (media + 24)));
        }
        // Quanto mais ampliada a foto de base, mais larga a suavização.
        suavizar(sombra, bw, bh, Math.min(12, Math.max(1, Math.round(3 * s))));
      } catch {
        // Navegador que não deixa ler a tela: a estampa entra sem a sombra do tecido.
        fundo = null;
        sombra = null;
      }
      caixa = { x0, y0, w, h, xs, ys, bw, bh, camada: criarTela(w, h), fundo, sombra };
    }
  }

  return {
    largura: W,
    altura: H,
    aplicar(destino, arte) {
      // O destino tem o mesmo tamanho da preparação (largura × altura).
      const ctx = contexto(destino);
      ctx.drawImage(fundoDaPeca, 0, 0);
      if (!arte || !caixa) return;
      const { x0, y0, w, h, xs, ys, bw, bh, camada, fundo, sombra } = caixa;
      const c = contexto(camada, { willReadFrequently: true });
      c.clearRect(0, 0, w, h);
      c.imageSmoothingQuality = 'high';
      c.drawImage(arte, 0, 0, w, h);
      if (!fundo || !sombra) {
        ctx.drawImage(camada, x0, y0);
        return;
      }
      let tinta: ImageData;
      try {
        tinta = c.getImageData(xs - x0, ys - y0, bw, bh);
      } catch {
        ctx.drawImage(camada, x0, y0);
        return;
      }
      // A tela guarda a cor sem multiplicar pela transparência: a mistura é direta.
      const t = tinta.data;
      const saida = new ImageData(bw, bh);
      const o = saida.data;
      o.set(fundo.data);
      for (let p = 0, i = 0; p < sombra.length; p++, i += 4) {
        const a = t[i + 3] / 255;
        if (a === 0) continue;
        const k = sombra[p] * a;
        o[i] = o[i] * (1 - a) + t[i] * k;
        o[i + 1] = o[i + 1] * (1 - a) + t[i + 1] * k;
        o[i + 2] = o[i + 2] * (1 - a) + t[i + 2] * k;
      }
      ctx.putImageData(saida, xs, ys);
    },
    liberar() {
      liberarTelas(fundoDaPeca, caixa?.camada);
    },
  };
}

// Aplica a arte na foto de base da peça, de uma vez (sem guardar o preparo).
// A arte já deve vir na escala da tela: largura da estampa na tela ÷ 1000 por unidade.
export function aplicarNaPeca(
  destino: Tela,
  base: CanvasImageSource,
  tamanhoDaFoto: { largura: number; altura: number },
  area: AreaNaFoto,
  arte: Tela,
  proporcao: number,
  janela?: Janela,
  criarTela?: CriarTela,
) {
  const peca = prepararPeca(base, tamanhoDaFoto, area, proporcao, destino.width, destino.height, janela, criarTela);
  peca.aplicar(destino, arte);
  peca.liberar();
}
