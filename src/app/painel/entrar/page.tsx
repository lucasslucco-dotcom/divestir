import type { Metadata, Viewport } from 'next';
import { Entrada } from './entrada';

export const metadata: Metadata = {
  title: 'Painel | Divestir',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

export default function PaginaDeEntrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-16">
      <p className="font-titulo text-xl tracking-[0.06em] uppercase">Divestir</p>
      <h1 className="mt-6 font-titulo text-[clamp(2.25rem,9vw,3.5rem)] leading-none uppercase">Painel da equipe</h1>
      <Entrada />
    </main>
  );
}
