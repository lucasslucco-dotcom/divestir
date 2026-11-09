import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { carregarDesigns } from '@/lib/designs';
import { Cabecalho } from '../cabecalho';
import { Montador } from './montador';

export const metadata: Metadata = {
  title: 'Montador | Divestir',
};

// O montador é uma tela de trabalho: papel creme no topo.
export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

// Busca o catálogo e os designs na hora da visita (e não na publicação do site),
// para a página sempre mostrar o que está ativo no banco. Os dois ficam guardados
// no servidor, então a resposta sai rápida.
async function MontadorComDados() {
  await connection();
  const [catalogo, designs] = await Promise.all([carregarCatalogo(), carregarDesigns()]);
  return <Montador catalogo={catalogo} designs={designs} />;
}

// Enquanto os dados chegam: o título e o lugar da prévia, já no lugar.
function MontadorCarregando() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando o montador"
      className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start lg:gap-x-12 xl:gap-x-16"
    >
      <div className="lg:col-start-2 lg:row-start-1">
        <p className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Monta a sua Divestir</p>
      </div>
      <div className="mt-4 flex justify-center pt-3 [--altura-da-vista:clamp(12.5rem,35svh,19rem)] sm:[--altura-da-vista:clamp(16rem,42svh,28rem)] lg:col-start-1 lg:row-start-1 lg:mt-0 lg:pt-0 lg:[--altura-da-vista:min(calc(100dvh-10rem),46rem)]">
        <div className="aspect-[4/5] w-[calc(var(--altura-da-vista)*0.8)] rounded-2xl bg-estudio" />
      </div>
    </div>
  );
}

export default function Montar() {
  return (
    <>
      <Cabecalho />
      <main className="mx-auto max-w-6xl px-4 pt-4 pb-24 lg:pt-8">
        <Suspense fallback={<MontadorCarregando />}>
          <MontadorComDados />
        </Suspense>
      </main>
    </>
  );
}
