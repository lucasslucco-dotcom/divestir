// Motor do molde: desenha a arte de um design com o nome e a foto do cliente,
// na tinta da cor da peça, e aplica a arte na foto de base da peça.
// Usa só o canvas do navegador. Quem cria as telas é quem chama (criarTela), para o
// mesmo desenho poder rodar no servidor quando vier o arquivo de impressão (Etapa 7).
import { posicaoNoQuadro, type Enquadramento, type Geometria } from '@/lib/foto/enquadramento';
import {
  LARGURA_DA_ARTE,
  TINTAS,
  alturaDaArte,
  type AreaNaFoto,
  type CamadaAnel,
  type CamadaArte,
  type CamadaFoto,
  type CamadaNome,
  type CamadaTexto,
  type ConfigDoMolde,
  type FonteDoMolde,
} from './tipos';

export type Tela = HTMLCanvasElement;
export type CriarTela = (largura: number, altura: number) => Tela;

export type FotoNoMolde = {
  imagem: CanvasImageSource;
  geometria: Geometria;
  enquadramento: Enquadramento;
};

// Fonte de cada papel: a família CSS já carregada na página e o estilo.
export type Fontes = Record<FonteDoMolde, { familia: string; estilo: 'normal' | 'italic' }>;

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
};

const telaDoNavegador: CriarTela = (largura, altura) => {
  const tela = document.createElement('canvas');
  tela.width = Math.max(1, Math.round(largura));
  tela.height = Math.max(1, Math.round(altura));
  return tela;
};

function contexto(tela: Tela) {
  const ctx = tela.getContext('2d');
  if (!ctx) throw new Error('O navegador não abriu o canvas.');
  return ctx;
}

const fonteCss = (fonte: Fontes[FonteDoMolde], px: number) =>
  `${fonte.estilo === 'italic' ? 'italic ' : ''}400 ${px}px ${fonte.familia}`;

// A tinta da estampa para a cor da peça (ex.: peça preta → tinta creme).
export function tintaDaCor(config: ConfigDoMolde, corDaPeca: string) {
  const nome = config.tintas[corDaPeca] ?? Object.values(config.tintas)[0] ?? 'verde-escuro';
  return TINTAS[nome] ?? (/^#[0-9a-f]{6}$/i.test(nome) ? nome : TINTAS['verde-escuro']);
}

// O texto que vai no campo: o que a pessoa digitou ou, vazio, o rótulo do campo.
export function textoDoCampo(config: ConfigDoMolde, chave: string, valores: Record<string, string>) {
  const campo = config.campos.find((c) => c.chave === chave);
  const valor = (valores[chave] ?? '').trim().slice(0, campo?.max ?? 40);
  const texto = valor || campo?.rotulo || '';
  return campo?.caixa === 'alta' ? texto.toLocaleUpperCase('pt-BR') : texto;
}

function desenharTexto(ctx: CanvasRenderingContext2D, c: CamadaTexto, tinta: string, escala: number, fontes: Fontes) {
  const fonte = fontes[c.fonte];
  ctx.save();
  ctx.font = fonteCss(fonte, 100);
  const px = (100 * c.largura * escala) / Math.max(1, ctx.measureText(c.texto).width);
  ctx.font = fonteCss(fonte, px);
  ctx.fillStyle = tinta;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(c.texto, c.x * escala, c.base * escala);
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

// O nome: escrito numa tela à parte e redesenhado coluna a coluna. Até o topo da
// maiúscula nada muda (os acentos ficam no lugar); dali para baixo a coluna estica,
// mais nas pontas que no meio, e a base do nome vira um arco.
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
  const fonte = fontes[c.fonte];
  ctx.save();
  ctx.font = fonteCss(fonte, 100);
  const capa = ctx.measureText('H').actualBoundingBoxAscent / 100 || 0.86;
  let px = (c.altura_no_centro * escala) / capa;
  ctx.font = fonteCss(fonte, px);
  let largura = ctx.measureText(texto).width;
  const maxima = c.largura_maxima * escala;
  const estreita = Math.min(1, Math.max(c.compressao_maxima, maxima / largura));
  if (largura * estreita > maxima) {
    px *= maxima / (largura * estreita);
    ctx.font = fonteCss(fonte, px);
    largura = ctx.measureText(texto).width;
  }
  ctx.restore();

  const alturaDaCapa = px * capa;
  const acima = Math.ceil(px * 0.5);
  const abaixo = Math.ceil(px * 0.35);
  const w = Math.max(1, Math.ceil(largura * estreita) + 2);
  const h = Math.ceil(acima + alturaDaCapa + abaixo);
  const rascunho = criarTela(w, h);
  const r = contexto(rascunho);
  r.font = fonteCss(fonte, px);
  r.fillStyle = tinta;
  r.textBaseline = 'alphabetic';
  r.scale(estreita, 1);
  r.fillText(texto, 1 / estreita, acima + alturaDaCapa);

  const x0 = Math.round(c.x * escala - w / 2);
  const topo = c.topo * escala;
  for (let x = 0; x < w; x++) {
    const u = (x + 0.5 - w / 2) / (w / 2);
    const s = 1 + (c.arco - 1) * u * u;
    ctx.drawImage(rascunho, x, 0, 1, acima, x0 + x, topo - acima, 1, acima);
    ctx.drawImage(rascunho, x, acima, 1, h - acima, x0 + x, topo, 1, (h - acima) * s);
  }
}

// A foto entra numa janela de 4:5, como o quadro do enquadramento da Etapa 3, com
// a largura do diâmetro do círculo e o mesmo centro: o que está no meio do quadro
// vai para o meio do círculo.
function desenharFoto(ctx: CanvasRenderingContext2D, c: CamadaFoto, foto: FotoNoMolde, escala: number) {
  const janela = {
    x: c.x - c.raio,
    y: c.y - 1.25 * c.raio,
    largura: 2 * c.raio,
    altura: 2.5 * c.raio,
  };
  const p = posicaoNoQuadro(foto.geometria, foto.enquadramento);
  const desenhar = () =>
    ctx.drawImage(
      foto.imagem,
      (janela.x + (p.esquerda / 100) * janela.largura) * escala,
      (janela.y + (p.topo / 100) * janela.altura) * escala,
      (p.largura / 100) * janela.largura * escala,
      (p.altura / 100) * janela.altura * escala,
    );
  const cx = c.x * escala;
  const cy = c.y * escala;
  const raio = c.raio * escala;

  // Dentro do círculo.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
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
    ctx.arc(cx, cy, raio + c.vaza_acima * escala, 0, Math.PI * 2);
    ctx.arc(cx, cy, raio, 0, Math.PI * 2);
    ctx.clip('evenodd');
    desenhar();
    ctx.restore();
  }
}

async function desenharArteFixa(
  ctx: CanvasRenderingContext2D,
  c: CamadaArte,
  tinta: string,
  escala: number,
  carregar: Pedido['carregarArte'],
) {
  const imagem = await carregar(c.arquivo, tinta);
  const lw = c.largura * escala;
  const lh = lw * (imagem.height / imagem.width);
  const lx = c.x * escala - lw / 2;
  const ly = c.topo * escala;
  if (c.folga > 0) {
    // Respiro em volta da arte: a mesma forma, deslocada em volta, apaga o que está embaixo.
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    const folga = c.folga * escala;
    for (let k = 0; k < 24; k++) {
      const angulo = (k / 24) * Math.PI * 2;
      ctx.drawImage(imagem, lx + Math.cos(angulo) * folga, ly + Math.sin(angulo) * folga, lw, lh);
    }
    ctx.drawImage(imagem, lx, ly, lw, lh);
    ctx.restore();
  }
  ctx.drawImage(imagem, lx, ly, lw, lh);
}

// Desenha a arte inteira numa tela nova, com "escala" pixels por unidade do molde.
export async function desenharArte(pedido: Pedido, escala: number): Promise<Tela> {
  const { config } = pedido;
  const criarTela = pedido.criarTela ?? telaDoNavegador;
  const tela = criarTela(LARGURA_DA_ARTE * escala, alturaDaArte(config) * escala);
  const ctx = contexto(tela);
  const tinta = tintaDaCor(config, pedido.corDaPeca);
  for (const camada of config.camadas) {
    if (camada.tipo === 'texto') desenharTexto(ctx, camada, tinta, escala, pedido.fontes);
    else if (camada.tipo === 'anel') desenharAnel(ctx, camada, tinta, escala);
    else if (camada.tipo === 'nome') {
      const texto = textoDoCampo(config, camada.campo, pedido.valores);
      desenharNome(ctx, camada, texto, tinta, escala, pedido.fontes, criarTela);
    } else if (camada.tipo === 'foto') {
      if (pedido.foto) desenharFoto(ctx, camada, pedido.foto, escala);
    } else if (camada.tipo === 'arte') await desenharArteFixa(ctx, camada, tinta, escala, pedido.carregarArte);
  }
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

// Aplica a arte na foto de base da peça (ou no pedaço dela dado pela janela). A luz
// e a sombra do tecido passam por cima da tinta, para a estampa acompanhar as dobras.
// A arte já deve vir na escala da tela: largura da estampa na tela ÷ 1000 por unidade.
export function aplicarNaPeca(
  destino: Tela,
  base: CanvasImageSource,
  tamanhoDaFoto: { largura: number; altura: number },
  area: AreaNaFoto,
  arte: Tela,
  proporcao: number,
  janela: Janela = { x: 0, y: 0, largura: tamanhoDaFoto.largura, altura: tamanhoDaFoto.altura },
  criarTela: CriarTela = telaDoNavegador,
) {
  const W = destino.width;
  const H = destino.height;
  const ctx = destino.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(base, janela.x, janela.y, janela.largura, janela.altura, 0, 0, W, H);

  const s = W / janela.largura;
  const larguraNaFoto = area.largura * tamanhoDaFoto.largura;
  const w = Math.round(larguraNaFoto * s);
  const h = Math.round(w / proporcao);
  const x0 = Math.round((area.x * tamanhoDaFoto.largura - larguraNaFoto / 2 - janela.x) * s);
  const y0 = Math.round((area.topo * tamanhoDaFoto.altura - janela.y) * s);
  const camada = criarTela(w, h);
  const c = contexto(camada);
  c.imageSmoothingQuality = 'high';
  c.drawImage(arte, 0, 0, w, h);

  const xs = Math.max(0, x0);
  const ys = Math.max(0, y0);
  const bw = Math.min(W, x0 + w) - xs;
  const bh = Math.min(H, y0 + h) - ys;
  if (bw <= 0 || bh <= 0) return;

  let fundo: ImageData;
  let tinta: ImageData;
  try {
    fundo = ctx.getImageData(xs, ys, bw, bh);
    tinta = c.getImageData(xs - x0, ys - y0, bw, bh);
  } catch {
    // Navegador que não deixa ler a tela: a estampa entra sem a sombra do tecido.
    ctx.drawImage(camada, x0, y0);
    return;
  }

  const f = fundo.data;
  const t = tinta.data;
  let soma = 0;
  let n = 0;
  for (let i = 0; i < f.length; i += 16) {
    soma += 0.299 * f[i] + 0.587 * f[i + 1] + 0.114 * f[i + 2];
    n++;
  }
  const media = n ? soma / n : 128;
  for (let i = 0; i < f.length; i += 4) {
    const a = t[i + 3] / 255;
    if (a === 0) continue;
    const luz = 0.299 * f[i] + 0.587 * f[i + 1] + 0.114 * f[i + 2];
    const sombra = Math.max(0.78, Math.min(1.1, (luz + 24) / (media + 24)));
    f[i] = f[i] * (1 - a) + t[i] * sombra * a;
    f[i + 1] = f[i + 1] * (1 - a) + t[i + 1] * sombra * a;
    f[i + 2] = f[i + 2] * (1 - a) + t[i + 2] * sombra * a;
  }
  ctx.putImageData(fundo, xs, ys);
}
