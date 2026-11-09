import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { carregarDesigns } from '@/lib/designs';
import { pagamentoEmTeste } from '@/lib/mercadopago';
import { Cabecalho } from '../cabecalho';
import { Carrinho } from './carrinho';

export const metadata: Metadata = {
  title: 'Carrinho | Divestir',
  robots: { index: false },
};

// Tela de trabalho: papel creme no topo.
export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

async function CarrinhoComDados() {
  await connection();
  const [catalogo, designs] = await Promise.all([carregarCatalogo(), carregarDesigns()]);
  return <Carrinho catalogo={catalogo} designs={designs} modoDeTeste={pagamentoEmTeste()} />;
}

export default function PaginaDoCarrinho() {
  return (
    <>
      <Cabecalho semCarrinho largura="max-w-5xl" />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 lg:pt-10">
        <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Seu carrinho</h1>
        <Suspense fallback={<div aria-busy="true" aria-label="Carregando o carrinho" className="mt-10 h-40" />}>
          <CarrinhoComDados />
        </Suspense>
      </main>
    </>
  );
}
