// O que o motor do molde precisa no navegador: as fontes da página, as artes em
// SVG pintadas na tinta certa e as fotos. Tudo fica guardado depois da primeira vez.
import { abrir } from '@/lib/foto/checar';
import type { Fontes, ImagemDaArte } from './desenhar';

const imagens = new Map<string, Promise<HTMLImageElement>>();
const textos = new Map<string, Promise<string>>();
const artes = new Map<string, Promise<ImagemDaArte>>();
let fontes: Promise<Fontes> | null = null;

export function carregarImagem(url: string) {
  let imagem = imagens.get(url);
  if (!imagem) {
    imagem = abrir(url);
    imagens.set(url, imagem);
    imagem.catch(() => imagens.delete(url));
  }
  return imagem;
}

// Quando a foto sai da tela (a pessoa trocou de foto), a cópia guardada sai junto.
export function esquecerImagem(url: string) {
  imagens.delete(url);
}

// A arte vem em SVG com uma tinta só (currentColor); aqui ela ganha a cor da tinta.
export function carregarArte(arquivo: string, tinta: string): Promise<ImagemDaArte> {
  const chave = `${arquivo}|${tinta}`;
  let arte = artes.get(chave);
  if (!arte) {
    let texto = textos.get(arquivo);
    if (!texto) {
      texto = fetch(arquivo).then((resposta) => {
        if (!resposta.ok) throw new Error(`A arte ${arquivo} não carregou.`);
        return resposta.text();
      });
      textos.set(arquivo, texto);
      texto.catch(() => textos.delete(arquivo));
    }
    arte = texto.then((svg) => {
      const pintado = svg.replaceAll('currentColor', tinta);
      const url = URL.createObjectURL(new Blob([pintado], { type: 'image/svg+xml' }));
      return abrir(url);
    });
    artes.set(chave, arte);
    arte.catch(() => artes.delete(chave));
  }
  return arte;
}

// As fontes da marca já carregadas pela página (next/font), pelo nome que o CSS usa.
export function fontesDaPagina(): Promise<Fontes> {
  fontes ??= (async () => {
    const estilo = getComputedStyle(document.body);
    const titulo = estilo.getPropertyValue('--font-anton').trim() || 'Anton, sans-serif';
    const destaque = estilo.getPropertyValue('--font-instrument-serif').trim() || 'Georgia, serif';
    await Promise.all([
      document.fonts.load(`400 100px ${titulo}`),
      document.fonts.load(`400 100px ${destaque}`),
      document.fonts.load(`italic 400 100px ${destaque}`),
    ]).catch(() => undefined);
    return {
      titulo: { familia: titulo, estilo: 'normal' },
      destaque: { familia: destaque, estilo: 'normal' },
      'destaque-italico': { familia: destaque, estilo: 'italic' },
    } satisfies Fontes;
  })();
  return fontes;
}
