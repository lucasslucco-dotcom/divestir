import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // A tela da foto virou um passo do montador (Etapa 5): o endereço antigo leva para lá.
  async redirects() {
    return [{ source: '/montar/foto', destination: '/montar', permanent: false }];
  },
  // Proteções do navegador em todas as páginas: nenhum outro site pode embutir a
  // loja numa moldura (para enganar o clique de quem está pagando), o navegador não
  // adivinha o tipo dos arquivos e o endereço do pedido não vaza para outros sites.
  async headers() {
    return [
      {
        source: '/:caminho*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
