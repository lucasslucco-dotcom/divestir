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
  liberarTelas(rascunho);
}

// A janela de 4:5 onde a foto entra, em unidades da arte. É o quadro do
// enquadramento da Etapa 3, com a largura do diâmetro do círculo e o mesmo centro:
// o que está no meio do quadro vai para o meio do círculo.
export function janelaDaFoto(c: CamadaFoto) {
  return { x: c.x - c.raio, y: c.y - 1.25 * c.raio, largura: 2 * c.raio, altura: 2.5 * c.raio };
}

function desenharFoto(ctx: CanvasRenderingContext2D, c: CamadaFoto, foto: FotoNoMolde, escala: number) {
  const janela = janelaDaFoto(c);
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

  for (const camada of config.camadas) {
    if (camada.tipo === 'foto') {
      passos.push({ tipo: 'foto', camada });
      fixa = null;
    } else if (camada.tipo === 'texto') desenharTexto(telaFixa(), camada, tinta, escala, pedido.fontes);
    else if (camada.tipo === 'anel') desenharAnel(telaFixa(), camada, tinta, escala);
    else if (camada.tipo === 'nome') {
      const texto = textoDoCampo(config, camada.campo, pedido.valores);
      desenharNome(telaFixa(), camada, texto, tinta, escala, pedido.fontes, criarTela);
    } else if (camada.tipo === 'arte') {
      const { tela, x, y } = rasterizarArte(
        await pedido.carregarArte(camada.arquivo, tinta),
        camada,
        escala,
        criarTela,
      );
      if (camada.folga > 0) {
        // Respiro em volta da arte: a mesma forma, deslocada em volta, apaga o que
        // estiver embaixo (foto, anel, nome).
        const mascara = criarTela(W, H);
        const m = contexto(mascara);
        const folga = camada.folga * escala;
        for (let k = 0; k < 24; k++) {
          const angulo = (k / 24) * Math.PI * 2;
          m.drawImage(tela, x + Math.cos(angulo) * folga, y + Math.sin(angulo) * folga);
        }
        m.drawImage(tela, x, y);
        passos.push({ tipo: 'folga', mascara });
        fixa = null;
      }
      telaFixa().drawImage(tela, x, y);
      liberarTelas(tela);
    }
  }

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
