// A definição da estampa: quantos pontos da foto original cabem em cada centímetro
// impresso, contando só quem aparece (o protagonista) e o zoom do enquadramento.
// Uma foto grande em que o cachorro está pequeno, lá no fundo, tem poucos pontos
// para a estampa: a checagem da foto inteira (checar.ts) não vê isso.
import { posicaoNoQuadro, type Enquadramento, type Geometria } from './enquadramento';

// Largura da estampa quando a peça ainda não tem os centímetros cadastrados (a
// estamparia confirma antes do arquivo de impressão, na Etapa 7). É a largura de
// uma estampa grande de costas.
export const LARGURA_PADRAO_DA_ESTAMPA_CM = 30;

// Pontos por polegada na peça impressa. Abaixo de 150 a estampa começa a perder
// definição; abaixo de 100 o serrilhado aparece a olho nu.
const DPI_BOM = 150;
const DPI_MINIMO = 100;

export type Definicao = { dpi: number; nivel: 'boa' | 'media' | 'baixa' };

// Quantos pixels da foto original cada pixel do recorte representa. O celular reduz
// a foto para 2.048 px no lado maior antes do recorte, e o Photoroom devolve até
// 4 megapixels.
export function escalaDaOriginal(largura: number | undefined, altura: number | undefined, ladoDoEnvio = 2048) {
  if (!largura || !altura) return null;
  const envio = Math.min(1, ladoDoEnvio / Math.max(largura, altura));
  const pixels = largura * envio * altura * envio;
  const recorte = Math.min(1, Math.sqrt(4_000_000 / pixels));
  return 1 / (envio * recorte);
}

export function definicaoDaEstampa(
  foto: { geometria: Geometria; enquadramento: Enquadramento; escalaDaOriginal: number | null },
  // Largura do quadro da foto dentro da arte, em fração da largura da arte.
  quadroNaArte: number,
  larguraDaEstampaCm: number = LARGURA_PADRAO_DA_ESTAMPA_CM,
): Definicao | null {
  if (!foto.escalaDaOriginal || quadroNaArte <= 0 || larguraDaEstampaCm <= 0) return null;
  // Largura do recorte inteiro, em frações do quadro; daí, em centímetros impressos.
  const larguraNoQuadro = posicaoNoQuadro(foto.geometria, foto.enquadramento).largura / 100;
  const centimetros = larguraNoQuadro * quadroNaArte * larguraDaEstampaCm;
  if (centimetros <= 0) return null;
  const dpi = (foto.geometria.largura * foto.escalaDaOriginal) / (centimetros / 2.54);
  return { dpi, nivel: dpi >= DPI_BOM ? 'boa' : dpi >= DPI_MINIMO ? 'media' : 'baixa' };
}
