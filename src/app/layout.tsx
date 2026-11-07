import type { Metadata, Viewport } from 'next';
import { variaveisDeFonte } from './fontes';
import './globals.css';

const TITULO = 'Divestir | Merch oficial de quem você ama';
const DESCRICAO =
  'Manda a foto de quem você ama e a gente transforma em merch: camiseta, moletom ou jaqueta college com design exclusivo da Divestir.';

export const metadata: Metadata = {
  // Endereço do site no ar. Trocar quando a Divestir ganhar domínio próprio.
  metadataBase: new URL('https://divestir.vercel.app'),
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
};

export const viewport: Viewport = {
  themeColor: '#faf5eb',
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
