import localFont from 'next/font/local';

// Fontes oficiais da Divestir (decisão do Lucas, 07/11/2026).
// Para trocar: substitua os arquivos desta pasta e ajuste os nomes abaixo.
// As cores e o papel de cada fonte ficam em src/app/globals.css.

// Títulos e estampas.
export const anton = localFont({
  src: './anton-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-anton',
  display: 'swap',
});

// Frases de destaque.
export const instrumentSerif = localFont({
  src: [
    { path: './instrument-serif-400.woff2', weight: '400', style: 'normal' },
    { path: './instrument-serif-400-italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-instrument-serif',
  display: 'swap',
});

// Só nas estampas de cinema (Em Cartaz e Melhor Mãe): Bodoni Moda, de licença aberta
// (OFL). Não é fonte do site: o navegador só baixa quando um design usa (decisão a
// confirmar com o Lucas, 10/11/2026). O peso 900 é o do nome do Melhor Mãe.
export const bodoniModa = localFont({
  src: [
    { path: './bodoni-moda-500.woff2', weight: '500', style: 'normal' },
    { path: './bodoni-moda-700.woff2', weight: '700', style: 'normal' },
    { path: './bodoni-moda-900.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-bodoni-moda',
  display: 'swap',
  preload: false,
});

// Só nas estampas de turnê, de licença aberta (OFL). Não são fontes do site (decisão a
// confirmar com o Lucas, 10/11/2026). Shrikhand: a letra gorda e inclinada de camiseta
// de turnê antiga (Turnê Mundial). Passion One: a letra de pôster de show, bem grossa
// (Ao Vivo).
export const shrikhand = localFont({
  src: './shrikhand-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-shrikhand',
  display: 'swap',
  preload: false,
});

// Graduate: a letra de camisa de time e de faculdade, com os cantos cortados (Torcida
// Organizada).
export const graduate = localFont({
  src: './graduate-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-graduate',
  display: 'swap',
  preload: false,
});

// Alfa Slab One: a letra de bloco com serifa, de placa de bar (Bar do).
export const alfaSlabOne = localFont({
  src: './alfa-slab-one-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-alfa-slab-one',
  display: 'swap',
  preload: false,
});

// Cinzel: a letra de inscrição romana, de brasão (o nome do Sua Majestade).
export const cinzel = localFont({
  src: './cinzel-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-cinzel',
  display: 'swap',
  preload: false,
});

// Cinzel Decorative: a mesma letra com floreios, de carta de tarô (o nome do Mapa Astral).
export const cinzelDecorative = localFont({
  src: './cinzel-decorative-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-cinzel-decorative',
  display: 'swap',
  preload: false,
});

// Grenze Gotisch: a letra gótica de camiseta de rua, que ainda se lê bem em maiúsculas
// (o nome do O Brabo).
export const grenzeGotisch = localFont({
  src: './grenze-gotisch-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-grenze-gotisch',
  display: 'swap',
  preload: false,
});

export const passionOne = localFont({
  src: './passion-one-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-passion-one',
  display: 'swap',
  preload: false,
});

// Poppins Black: a letra geométrica bem grossa, de embalagem (o nome do Alto Em). Só de
// estampa, de licença aberta (OFL).
export const poppins = localFont({
  src: './poppins-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-poppins',
  display: 'swap',
  preload: false,
});

// Lilita One: a letra gorda de cantos redondos, de aplicativo simpático (o nome do
// Previsão do Tempo). Só de estampa, de licença aberta (OFL).
export const lilitaOne = localFont({
  src: './lilita-one-400.woff2',
  weight: '400',
  style: 'normal',
  variable: '--font-lilita-one',
  display: 'swap',
  preload: false,
});

// Handjet Black: a letra de pixel, alta e grossa, de fliperama (o Modo Casal). Só de
// estampa, de licença aberta (OFL).
export const handjet = localFont({
  src: './handjet-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-handjet',
  display: 'swap',
  preload: false,
});

// Textos e botões.
export const inter = localFont({
  src: './inter-variavel.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
  display: 'swap',
});

export const variaveisDeFonte = `${anton.variable} ${instrumentSerif.variable} ${inter.variable} ${bodoniModa.variable} ${shrikhand.variable} ${passionOne.variable} ${alfaSlabOne.variable} ${graduate.variable} ${cinzel.variable} ${cinzelDecorative.variable} ${grenzeGotisch.variable} ${poppins.variable} ${lilitaOne.variable} ${handjet.variable}`;
