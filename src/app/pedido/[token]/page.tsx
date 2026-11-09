import type { Metadata, Viewport } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { carregarCatalogo } from '@/lib/catalogo';
import { carregarDesigns } from '@/lib/designs';
import { chavePublica } from '@/lib/mercadopago';
import { Cabecalho } from '../../cabecalho';
import { Pedido } from './pedido';

// O link do pedido é pessoal: não entra em buscador.
export const metadata: Metadata = {
  title: 'Seu pedido | Divestir',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

async function PedidoComDados({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connection();
  const [catalogo, designs] = await Promise.all([carregarCatalogo(), carregarDesigns()]);
  return <Pedido token={token} catalogo={catalogo} designs={designs} chavePublica={chavePublica()} />;
}

export default function PaginaDoPedido({ params }: { params: Promise<{ token: string }> }) {
  return (
    <>
      <Cabecalho largura="max-w-5xl" />
      <main className="mx-auto max-w-5xl px-4 pt-6 pb-24 lg:pt-10">
        <Suspense
          fallback={
            <p aria-busy="true" className="mt-10 text-[0.9375rem]">
              Abrindo o seu pedido…
            </p>
          }
        >
          <PedidoComDados params={params} />
        </Suspense>
      </main>
    </>
  );
}
