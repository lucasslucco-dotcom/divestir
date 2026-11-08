// Checagem da foto no próprio aparelho do cliente, antes de qualquer envio.
// Regras do briefing (seção "Guia da foto perfeita", especificações técnicas):
// formato, tamanho do arquivo, resolução pelo lado menor e nitidez.

export type Nivel = 'perfeita' | 'aviso' | 'bloqueio' | 'recebida';

export type Checagem = {
  nivel: Nivel;
  titulo: string;
  mensagens: string[];
  largura?: number;
  altura?: number;
  nitidez?: number;
};

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const EXTENSOES = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

export const LIMITE_MB = 20;
export const LADO_IDEAL = 2000;
export const LADO_MINIMO = 1000;

// Abaixo deste valor a foto é considerada tremida ou desfocada. Calibrado em
// 08/11/2026 com 72 fotos no Chromium: as nítidas ficaram de 199 a 5.600, e as
// bem desfocadas, abaixo de 30. Em 80 nenhuma nítida recebe aviso, e as muito
// tremidas recebem. É só um aviso: a equipe ainda revisa cada arte.
export const NITIDEZ_MINIMA = 80;

export function abrir(url: string): Promise<HTMLImageElement> {
  const imagem = new Image();
  imagem.decoding = 'async';
  const carregou = new Promise<void>((ok, erro) => {
    imagem.onload = () => ok();
    imagem.onerror = () => erro(new Error('A imagem não abriu.'));
  });
  imagem.src = url;
  // decode() prepara a imagem sem travar a tela, mas não termina enquanto a página
  // está escondida (aplicativo em segundo plano, navegador embutido). Nesse caso,
  // segue com a imagem já carregada depois de um tempo.
  const decodificada = imagem.decode().catch(() => carregou);
  const reserva = carregou.then(() => new Promise<void>((ok) => setTimeout(ok, 1500)));
  return Promise.race([decodificada, reserva]).then(() => imagem);
}

// Nitidez: a foto é reduzida para 1024 px, dividida em 8 × 8 partes, e em cada
// parte mede-se quanto os contornos variam (filtro laplaciano). Vale a parte
// mais nítida entre as 10% melhores: num retrato, o fundo liso pode ser suave,
// mas os olhos, o pelo e o cabelo precisam ter contorno.
export function medirNitidez(imagem: HTMLImageElement): number {
  const escala = Math.min(1, 1024 / Math.max(imagem.naturalWidth, imagem.naturalHeight));
  const w = Math.max(16, Math.round(imagem.naturalWidth * escala));
  const h = Math.max(16, Math.round(imagem.naturalHeight * escala));
  const tela = document.createElement('canvas');
  tela.width = w;
  tela.height = h;
  const contexto = tela.getContext('2d', { willReadFrequently: true });
  if (!contexto) return Number.POSITIVE_INFINITY;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(imagem, 0, 0, w, h);
  const { data } = contexto.getImageData(0, 0, w, h);

  const luz = new Float32Array(w * h);
  for (let i = 0, p = 0; i < luz.length; i++, p += 4) {
    luz[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  const partes = 8;
  const pw = Math.floor((w - 2) / partes);
  const ph = Math.floor((h - 2) / partes);
  const variacoes: number[] = [];
  for (let py = 0; py < partes; py++) {
    for (let px = 0; px < partes; px++) {
      let soma = 0;
      let soma2 = 0;
      let n = 0;
      for (let y = 1 + py * ph; y < 1 + (py + 1) * ph; y++) {
        for (let x = 1 + px * pw; x < 1 + (px + 1) * pw; x++) {
          const i = y * w + x;
          const l = luz[i - 1] + luz[i + 1] + luz[i - w] + luz[i + w] - 4 * luz[i];
          soma += l;
          soma2 += l * l;
          n++;
        }
      }
      if (n > 0) variacoes.push(soma2 / n - (soma / n) ** 2);
    }
  }
  variacoes.sort((a, b) => a - b);
  return variacoes[Math.floor(variacoes.length * 0.9)] ?? Number.POSITIVE_INFINITY;
}

export async function checarFoto(arquivo: File, url: string): Promise<Checagem> {
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
  if (!TIPOS.includes(arquivo.type) && !EXTENSOES.includes(extensao)) {
    return { nivel: 'bloqueio', titulo: 'Esse formato não dá', mensagens: ['Manda em JPG, PNG, HEIC ou WEBP.'] };
  }
  const heic = /hei[cf]/i.test(arquivo.type) || extensao === 'heic' || extensao === 'heif';

  const avisos: { titulo: string; mensagem: string }[] = [];
  if (arquivo.size > LIMITE_MB * 1024 * 1024) {
    avisos.push({ titulo: 'Essa foto passou de 20 MB', mensagem: 'Se der, manda uma versão menor.' });
  }

  let imagem: HTMLImageElement;
  try {
    imagem = await abrir(url);
  } catch {
    // Alguns navegadores não abrem HEIC (o formato do iPhone). A foto vale e
    // segue direto para o recorte, porque o Photoroom lê HEIC.
    if (heic) {
      return {
        nivel: 'recebida',
        titulo: 'Foto recebida',
        mensagens: [
          'Neste navegador não dá para medir esse formato, mas a foto segue para o recorte.',
          ...avisos.map((a) => a.mensagem),
        ],
      };
    }
    return { nivel: 'bloqueio', titulo: 'Não consegui abrir essa foto', mensagens: ['Tenta outra?'] };
  }

  const largura = imagem.naturalWidth;
  const altura = imagem.naturalHeight;
  const menor = Math.min(largura, altura);
  if (menor < LADO_MINIMO) {
    return {
      nivel: 'bloqueio',
      titulo: 'Essa foto vai ficar pixelada. Tenta outra?',
      mensagens: ['Ela é pequena demais para a estampa ficar bonita.'],
      largura,
      altura,
    };
  }
  if (menor < LADO_IDEAL) {
    avisos.push({
      titulo: 'Pode perder um pouco de definição',
      mensagem: 'Ela serve, mas uma foto maior fica mais nítida na peça.',
    });
  }
  const nitidez = medirNitidez(imagem);
  if (nitidez < NITIDEZ_MINIMA) {
    avisos.push({
      titulo: 'Parece que ficou tremida',
      mensagem: 'Se tiver outra mais nítida, ela vai ficar melhor na peça.',
    });
  }

  if (avisos.length > 0) {
    return {
      nivel: 'aviso',
      titulo: avisos[0].titulo,
      mensagens: avisos.map((a) => a.mensagem),
      largura,
      altura,
      nitidez,
    };
  }
  return {
    nivel: 'perfeita',
    titulo: 'Foto perfeita',
    mensagens: ['Tem resolução de sobra para a estampa ficar nítida.'],
    largura,
    altura,
    nitidez,
  };
}
