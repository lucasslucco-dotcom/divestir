import type { Metadata, Viewport } from 'next';
import { variaveisDeFonte } from './fontes';
import './globals.css';

const TITULO = 'Divestir | Aquela foto merece virar roupa';
const DESCRICAO =
  'Manda a foto de quem você ama e a gente transforma em roupa: camiseta, moletom ou jaqueta bomber com design exclusivo da Divestir.';

export const metadata: Metadata = {
  // Endereço do site no ar. Trocar quando a Divestir ganhar domínio próprio.
  // O endereço principal do site: o domínio próprio, assim que ele estiver ligado na
  // Vercel (a Vercel informa qual é); até lá, o endereço da Vercel.
  metadataBase: new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || 'divestir.vercel.app'}`),
  title: TITULO,
  description: DESCRICAO,
  // Como o link aparece quando é compartilhado no WhatsApp e nas redes.
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Divestir',
    title: TITULO,
    description: DESCRICAO,
  },
  // A imagem do link é o arquivo opengraph-image.jpg desta pasta (feito pelo
  // scripts/gerar-imagem-do-link.mjs); aqui só se pede o cartão grande.
  twitter: { card: 'summary_large_image' },
};

// Cor da barra do navegador no celular: o verde do topo da home.
export const viewport: Viewport = {
  themeColor: '#0d2b17',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={variaveisDeFonte}>
      <body>{children}</body>
    </html>
  );
}
