// O arquivo de impressão de uma estampa (Etapa 7 do briefing): a arte do design no
// tamanho real, em PNG de fundo transparente, a 300 pontos por polegada, desenhada pelo
// mesmo motor da prévia. É gerado no navegador de quem abre o pedido no painel, com as
// fontes e as artes que a página já tem: no servidor não existe a tela de desenho.
//
// O que a confecção fechou (23/11/2026): impressão em DTF, de no máximo 36 cm de largura
// por 46 cm de altura; a marca no peito, com até 10 cm de largura; arquivo em PNG.
import type { Enquadramento, Geometria } from '@/lib/foto/enquadramento';
import { desenharMarca, liberarTelas, prepararArte, tintaDaCor, type Tela } from './desenhar';
import { carregarArte, carregarImagem, fontesDaPagina } from './recursos';
import { alturaDaArte, areaDoDesign, LARGURA_DA_ARTE, type AreasDaPeca, type ConfigDoMolde, type Lado } from './tipos';

export const PONTOS_POR_POLEGADA = 300;
export const ESTAMPA_MAXIMA_CM = { largura: 36, altura: 46 };
export const MARCA_NO_PEITO_CM = 10;

const emPixels = (cm: number) => Math.round((cm / 2.54) * PONTOS_POR_POLEGADA);

// O tamanho com que a estampa sai impressa, em centímetros.
//
// A maior estampa de uma peça (a "estampa grande" das costas) sai no máximo que a
// confecção imprime, na proporção do design. As outras (a estampa normal, a da frente)
// saem menores na mesma medida em que aparecem menores na prévia, para a peça pronta
// ter a cara do que o cliente viu. É a regra até a tabela de medidas de cada peça
// chegar, quando a prévia e os centímetros são acertados juntos.
export function tamanhoDaEstampaCm(areas: AreasDaPeca | null, lado: Lado, config: ConfigDoMolde) {
  const proporcao = LARGURA_DA_ARTE / alturaDaArte(config);
  const maxima = Math.min(ESTAMPA_MAXIMA_CM.largura, ESTAMPA_MAXIMA_CM.altura * proporcao);
  const naFoto = areaDoDesign(areas?.[lado]?.previa ?? null, config)?.largura ?? null;
  const maiorNaFoto = Math.max(
    0,
    ...(['frente', 'costas'] as const).map((l) => {
      const previa = areas?.[l]?.previa;
      return previa ? Math.max(previa.largura, previa.grande?.largura ?? 0) : 0;
    }),
  );
  const fracao = naFoto && maiorNaFoto ? Math.min(1, naFoto / maiorNaFoto) : 1;
  // O que cabe naquele lado da peça, se ele tiver um limite próprio (a frente do moletom
  // com capuz, entre os cordões e o bolso; a baby look, que é uma peça pequena): na
  // largura e, pela proporção do design, na altura.
  const doLado = areas?.[lado]?.largura_cm ?? ESTAMPA_MAXIMA_CM.largura;
  const naAltura = (areas?.[lado]?.altura_cm ?? ESTAMPA_MAXIMA_CM.altura) * proporcao;
  const largura = Math.min(maxima * fracao, doLado, naAltura);
  return { largura, altura: largura / proporcao };
}

// Grava no PNG a resolução (o bloco pHYs, logo depois do cabeçalho): é o que faz o
// programa de impressão abrir o arquivo já no tamanho certo em centímetros.
function comResolucao(png: Uint8Array) {
  const porMetro = Math.round(PONTOS_POR_POLEGADA / 0.0254);
  const tipoEDados = new Uint8Array(13);
  tipoEDados.set([0x70, 0x48, 0x59, 0x73]); // "pHYs"
  const dados = new DataView(tipoEDados.buffer);
  dados.setUint32(4, porMetro);
  dados.setUint32(8, porMetro);
  dados.setUint8(12, 1);
  let crc = ~0;
  for (const byte of tipoEDados) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  const bloco = new Uint8Array(4 + 13 + 4);
  const vista = new DataView(bloco.buffer);
  vista.setUint32(0, 9);
  bloco.set(tipoEDados, 4);
  vista.setUint32(17, ~crc >>> 0);
  // Cabeçalho (8) + bloco IHDR (4 + 4 + 13 + 4 = 25): o pHYs entra logo depois.
  const saida = new Uint8Array(png.length + bloco.length);
  saida.set(png.subarray(0, 33));
  saida.set(bloco, 33);
  saida.set(png.subarray(33), 33 + bloco.length);
  return saida;
}

async function emPng(tela: Tela) {
  const arquivo = await new Promise<Blob | null>((pronto) => tela.toBlob(pronto, 'image/png'));
  if (!arquivo) throw new Error('O navegador não conseguiu gerar a imagem nesse tamanho.');
  const png = comResolucao(new Uint8Array(await arquivo.arrayBuffer()));
  return new Blob([png], { type: 'image/png' });
}

export type EstampaParaImprimir = {
  config: ConfigDoMolde;
  corDaPeca: string;
  valores: Record<string, string>;
  // O recorte da foto (endereço que o navegador consegue abrir) e onde está quem aparece.
  recorte: { url: string; geometria: Geometria; enquadramento: Enquadramento };
  larguraCm: number;
  // O ano em que o pedido foi feito, para os textos com {ano}.
  ano?: number;
};

// A estampa pronta para imprimir: a arte com a foto e o nome, sem a peça por baixo.
export async function gerarEstampa(estampa: EstampaParaImprimir) {
  const [fontes, imagem] = await Promise.all([fontesDaPagina(), carregarImagem(estampa.recorte.url)]);
  const arte = await prepararArte(
    {
      config: estampa.config,
      corDaPeca: estampa.corDaPeca,
      valores: estampa.valores,
      fontes,
      carregarArte,
      ano: estampa.ano,
    },
    emPixels(estampa.larguraCm) / LARGURA_DA_ARTE,
  );
  let tela: Tela | null = null;
  try {
    tela = arte.desenhar({
      imagem,
      geometria: estampa.recorte.geometria,
      enquadramento: estampa.recorte.enquadramento,
      inteira: null,
    });
    return await emPng(tela);
  } finally {
    arte.liberar();
    liberarTelas(tela);
  }
}

// A marca no peito (DIVESTIR, até o logo ficar pronto), na tinta do design.
export async function gerarMarcaNoPeito(config: ConfigDoMolde, corDaPeca: string, larguraCm = MARCA_NO_PEITO_CM) {
  const fontes = await fontesDaPagina();
  const tinta = tintaDaCor(config, corDaPeca);
  const prova = desenharMarca(fontes, tinta, 200);
  const tela = desenharMarca(fontes, tinta, (200 * emPixels(larguraCm)) / prova.width);
  try {
    return await emPng(tela);
  } finally {
    liberarTelas(prova, tela);
  }
}

// Entrega um arquivo gerado no navegador como um download.
export function baixar(arquivo: Blob, nome: string) {
  const url = URL.createObjectURL(arquivo);
  const atalho = document.createElement('a');
  atalho.href = url;
  atalho.download = nome;
  document.body.appendChild(atalho);
  atalho.click();
  atalho.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
