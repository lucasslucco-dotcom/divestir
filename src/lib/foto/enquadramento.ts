// Ajuste de enquadramento do recorte (briefing, passo 2: "O cliente pode ajustar o
// enquadramento, arrastar e dar zoom"). Tudo é medido em frações do quadro, então o
// mesmo enquadramento vale em qualquer tamanho de tela e, depois, no motor de templates.
import { abrir } from './checar';

// Onde o protagonista está dentro do recorte, em pixels do recorte.
export type Caixa = { x: number; y: number; largura: number; altura: number };
export type Geometria = { largura: number; altura: number; caixa: Caixa };

// x e y: quanto o centro do protagonista saiu do centro do quadro, em frações da
// largura e da altura do quadro. zoom: 1 é o protagonista inteiro, ocupando 90%.
export type Enquadramento = { x: number; y: number; zoom: number };

export const ENQUADRAMENTO_INICIAL: Enquadramento = { x: 0, y: 0, zoom: 1 };
export const ZOOM_MINIMO = 0.5;
export const ZOOM_MAXIMO = 4;
export const PASSO_DO_ZOOM = 1.25;

const PROPORCAO_DO_QUADRO = 4 / 5; // largura ÷ altura
const OCUPACAO = 0.9;

const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, valor));

// O protagonista nunca sai do quadro: o centro dele fica sempre dentro.
function dentroDoQuadro(e: Enquadramento): Enquadramento {
  return { zoom: e.zoom, x: limitar(e.x, -0.5, 0.5), y: limitar(e.y, -0.5, 0.5) };
}

export function mover(e: Enquadramento, dx: number, dy: number): Enquadramento {
  return dentroDoQuadro({ ...e, x: e.x + dx, y: e.y + dy });
}

// Zoom em volta de um ponto do quadro (em frações): o que está debaixo dos dedos
// ou do cursor fica no lugar. Sem ponto, o zoom é em volta do centro.
export function zoomEm(e: Enquadramento, fator: number, px = 0.5, py = 0.5): Enquadramento {
  const zoom = limitar(e.zoom * fator, ZOOM_MINIMO, ZOOM_MAXIMO);
  const k = zoom / e.zoom;
  return dentroDoQuadro({
    zoom,
    x: px - 0.5 + (e.x + 0.5 - px) * k,
    y: py - 0.5 + (e.y + 0.5 - py) * k,
  });
}

export function ehInicial(e: Enquadramento) {
  return Math.abs(e.x) < 0.001 && Math.abs(e.y) < 0.001 && Math.abs(e.zoom - 1) < 0.001;
}

// Posição do recorte dentro do quadro, em % do quadro (para o CSS).
export function posicaoNoQuadro(g: Geometria, e: Enquadramento) {
  const alturaDoQuadro = 1 / PROPORCAO_DO_QUADRO; // em larguras do quadro
  const base = Math.min(OCUPACAO / g.caixa.largura, (OCUPACAO * alturaDoQuadro) / g.caixa.altura);
  const escala = base * e.zoom;
  const centroX = g.caixa.x + g.caixa.largura / 2;
  const centroY = g.caixa.y + g.caixa.altura / 2;
  return {
    esquerda: (0.5 + e.x - centroX * escala) * 100,
    topo: ((alturaDoQuadro * (0.5 + e.y) - centroY * escala) / alturaDoQuadro) * 100,
    largura: g.largura * escala * 100,
    altura: ((g.altura * escala) / alturaDoQuadro) * 100,
  };
}

// Mede o recorte e acha o protagonista pelos pixels opacos. Os translúcidos ficam de
// fora: a marca d'água do modo de teste do Photoroom cobre a imagem inteira, mas é
// translúcida, e a borda macia do pelo e do cabelo continua aparecendo no quadro.
export async function medirRecorte(url: string): Promise<Geometria> {
  const imagem = await abrir(url);
  const largura = imagem.naturalWidth;
  const altura = imagem.naturalHeight;
  const inteira: Geometria = { largura, altura, caixa: { x: 0, y: 0, largura, altura } };

  const escala = Math.min(1, 400 / Math.max(largura, altura));
  const w = Math.max(1, Math.round(largura * escala));
  const h = Math.max(1, Math.round(altura * escala));
  const tela = document.createElement('canvas');
  tela.width = w;
  tela.height = h;
  const contexto = tela.getContext('2d', { willReadFrequently: true });
  if (!contexto) return inteira;
  contexto.drawImage(imagem, 0, 0, w, h);
  const { data } = contexto.getImageData(0, 0, w, h);

  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] >= 240) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return inteira;
  return {
    largura,
    altura,
    caixa: {
      x: x0 / escala,
      y: y0 / escala,
      largura: Math.min(largura, (x1 - x0 + 1) / escala),
      altura: Math.min(altura, (y1 - y0 + 1) / escala),
    },
  };
}
