import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { carregarDesigns } from '@/lib/designs';
import { pagamentoEmTeste } from '@/lib/mercadopago';
import { Cabecalho } from '../cabecalho';
import { Checkout } from './checkout';

export const metadata: Metadata = {
  title: 'Finalizar compra | Divestir',
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

async function CheckoutComDados() {
  await connection();
  const [catalogo, designs] = await Promise.all([carregarCatalogo(), carregarDesigns()]);
  return <Checkout catalogo={catalogo} designs={designs} modoDeTeste={pagamentoEmTeste()} />;
}

export default function PaginaDoCheckout() {
  return (
    <>
      <Cabecalho largura="max-w-5xl" />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 lg:pt-10">
        <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Finalizar compra</h1>
        <Suspense fallback={<div aria-busy="true" aria-label="Carregando o checkout" className="mt-10 h-40" />}>
          <CheckoutComDados />
        </Suspense>
      </main>
    </>
  );
}
