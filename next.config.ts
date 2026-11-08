import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // A tela da foto virou um passo do montador (Etapa 5): o endereço antigo leva para lá.
  async redirects() {
    return [{ source: '/montar/foto', destination: '/montar', permanent: false }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
