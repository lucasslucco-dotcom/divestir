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

// Só nas estampas de cinema (Em Cartaz): Bodoni Moda, de licença aberta (OFL). Não é
// fonte do site: o navegador só baixa quando um design usa (decisão a confirmar com o
// Lucas, 10/11/2026).
export const bodoniModa = localFont({
  src: [
    { path: './bodoni-moda-500.woff2', weight: '500', style: 'normal' },
    { path: './bodoni-moda-700.woff2', weight: '700', style: 'normal' },
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

export const passionOne = localFont({
  src: './passion-one-900.woff2',
  weight: '900',
  style: 'normal',
  variable: '--font-passion-one',
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

export const variaveisDeFonte = `${anton.variable} ${instrumentSerif.variable} ${inter.variable} ${bodoniModa.variable} ${shrikhand.variable} ${passionOne.variable}`;
