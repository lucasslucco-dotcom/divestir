import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { Montador } from './montador';

export const metadata: Metadata = {
  title: 'Montador | Divestir',
};

// O montador é uma tela de trabalho: papel creme no topo.
export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

// Busca o catálogo na hora da visita (e não na publicação do site), para a
// página sempre mostrar as peças e cores que estão ativas no banco.
async function MontadorComCatalogo() {
  await connection();
  const catalogo = await carregarCatalogo();
  return <Montador catalogo={catalogo} />;
}

// Enquanto o catálogo chega: o formato da prévia e das peças, já no lugar.
function MontadorCarregando() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando as peças"
      className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-x-12 xl:gap-x-16"
    >
      <div className="lg:col-start-2">
        <p className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none uppercase">Escolhe a peça</p>
      </div>
      <div className="mt-6 aspect-[4/5] rounded-2xl bg-estudio lg:col-start-1 lg:row-start-1 lg:mt-0" />
    </div>
  );
}

export default function Montar() {
  return (
    <>
      <header className="flex justify-center px-4 pt-5">
        <Link href="/" className="px-2 py-2 font-titulo text-xl uppercase tracking-[0.06em]">
          Divestir
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-36 lg:pt-10 lg:pb-24">
        <Suspense fallback={<MontadorCarregando />}>
          <MontadorComCatalogo />
        </Suspense>
      </main>
    </>
  );
}
