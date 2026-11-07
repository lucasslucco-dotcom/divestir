import type { Metadata, Viewport } from 'next';
import { variaveisDeFonte } from './fontes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Divestir | Merch oficial de quem você ama',
  description:
    'Manda a foto de quem você ama e a gente transforma em merch: camiseta, moletom ou jaqueta college com design exclusivo da Divestir.',
};

export const viewport: Viewport = {
  themeColor: '#f3ede0',
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
