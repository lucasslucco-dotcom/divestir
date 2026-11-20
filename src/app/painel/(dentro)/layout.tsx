import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { exigirEquipe } from '@/lib/painel/sessao';
import { sair } from '../acoes';
import { link } from '../estilo';
import { Navegacao } from './navegacao';

export const metadata: Metadata = {
  title: 'Painel | Divestir',
  robots: { index: false, follow: false },
};

// Tela de trabalho: papel creme no topo.
export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

// O topo do painel: a marca, as telas e quem está logado.
async function Topo() {
  await connection();
  const { eu } = await exigirEquipe();
  return (
    <>
      <Navegacao admin={eu.papel === 'admin'} />
      <div className="ml-auto flex items-center gap-x-5">
        <Link href="/painel/senha" className={`${link} hidden sm:inline-block`}>
          {eu.nome.split(' ')[0]}
        </Link>
        <form action={sair}>
          <button type="submit" className={link}>
            Sair
          </button>
        </form>
      </div>
    </>
  );
}

export default function LayoutDoPainel({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-verde">
        <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center gap-x-6 px-4">
          <Link href="/painel" className="py-2 font-titulo text-xl tracking-[0.06em] uppercase">
            Divestir
          </Link>
          <Suspense fallback={null}>
            <Topo />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pt-8 pb-24">{children}</main>
    </>
  );
}
