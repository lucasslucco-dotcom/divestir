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

// Textos e botões.
export const inter = localFont({
  src: './inter-variavel.woff2',
  weight: '100 900',
  style: 'normal',
  variable: '--font-inter',
  display: 'swap',
});

export const variaveisDeFonte = `${anton.variable} ${instrumentSerif.variable} ${inter.variable}`;
