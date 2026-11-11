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
// Textura de desgaste vem em PNG (só a transparência conta) e entra como está.
export function carregarArte(arquivo: string, tinta: string): Promise<ImagemDaArte> {
  if (!/\.svg$/i.test(arquivo)) return carregarImagem(arquivo);
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
    const texto = estilo.getPropertyValue('--font-inter').trim() || 'Inter, sans-serif';
    const destaque = estilo.getPropertyValue('--font-instrument-serif').trim() || 'Georgia, serif';
    const cinema = estilo.getPropertyValue('--font-bodoni-moda').trim() || 'Georgia, serif';
    const vintage = estilo.getPropertyValue('--font-shrikhand').trim() || 'Georgia, serif';
    const show = estilo.getPropertyValue('--font-passion-one').trim() || 'Impact, sans-serif';
    const bloco = estilo.getPropertyValue('--font-alfa-slab-one').trim() || 'Georgia, serif';
    const colegial = estilo.getPropertyValue('--font-graduate').trim() || 'Georgia, serif';
    const realeza = estilo.getPropertyValue('--font-cinzel').trim() || 'Georgia, serif';
    const astral = estilo.getPropertyValue('--font-cinzel-decorative').trim() || 'Georgia, serif';
    const gotica = estilo.getPropertyValue('--font-grenze-gotisch').trim() || 'Georgia, serif';
    const geometrica = estilo.getPropertyValue('--font-poppins').trim() || 'Arial Black, sans-serif';
    const redonda = estilo.getPropertyValue('--font-lilita-one').trim() || 'Arial Black, sans-serif';
    const pixel = estilo.getPropertyValue('--font-handjet').trim() || 'monospace';
    await Promise.all([
      document.fonts.load(`400 100px ${titulo}`),
      document.fonts.load(`700 100px ${texto}`),
      document.fonts.load(`400 100px ${destaque}`),
      document.fonts.load(`italic 400 100px ${destaque}`),
      document.fonts.load(`500 100px ${cinema}`),
      document.fonts.load(`700 100px ${cinema}`),
      document.fonts.load(`900 100px ${cinema}`),
      document.fonts.load(`400 100px ${vintage}`),
      document.fonts.load(`900 100px ${show}`),
      document.fonts.load(`400 100px ${bloco}`),
      document.fonts.load(`400 100px ${colegial}`),
      document.fonts.load(`900 100px ${realeza}`),
      document.fonts.load(`900 100px ${astral}`),
      document.fonts.load(`900 100px ${gotica}`),
      document.fonts.load(`900 100px ${geometrica}`),
      document.fonts.load(`400 100px ${redonda}`),
      document.fonts.load(`900 100px ${pixel}`),
    ]).catch(() => undefined);
    return {
      titulo: { familia: titulo, estilo: 'normal' },
      texto: { familia: texto, estilo: 'normal', peso: 700 },
      destaque: { familia: destaque, estilo: 'normal' },
      'destaque-italico': { familia: destaque, estilo: 'italic' },
      cinema: { familia: cinema, estilo: 'normal', peso: 500 },
      'cinema-forte': { familia: cinema, estilo: 'normal', peso: 700 },
      'cinema-preta': { familia: cinema, estilo: 'normal', peso: 900 },
      vintage: { familia: vintage, estilo: 'normal' },
      show: { familia: show, estilo: 'normal', peso: 900 },
      bloco: { familia: bloco, estilo: 'normal' },
      colegial: { familia: colegial, estilo: 'normal' },
      realeza: { familia: realeza, estilo: 'normal', peso: 900 },
      astral: { familia: astral, estilo: 'normal', peso: 900 },
      gotica: { familia: gotica, estilo: 'normal', peso: 900 },
      geometrica: { familia: geometrica, estilo: 'normal', peso: 900 },
      redonda: { familia: redonda, estilo: 'normal' },
      pixel: { familia: pixel, estilo: 'normal', peso: 900 },
    } satisfies Fontes;
  })();
  return fontes;
}
