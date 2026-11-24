import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { ESPACO_DAS_FOTOS } from '@/lib/foto/espaco';
import { exigirEquipe } from '@/lib/painel/sessao';
import type { FotosDoItem, PedidoInteiro } from '@/lib/painel/tipos';
import { link } from '../../../estilo';
import { PedidoDoPainel } from './pedido';

// A tela de um pedido (briefing, "Telas do painel"): a prévia montada, a foto original,
// o recorte, os dados do cliente e do presente, o histórico e os botões de cada etapa.

// Os endereços das fotos valem uma hora: só a equipe logada consegue criá-los.
const VALIDADE_DAS_FOTOS = 60 * 60;

async function Pedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero: texto } = await params;
  await connection();
  const { supabase, eu } = await exigirEquipe();
  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero < 1) notFound();

  const { data, error } = await supabase.rpc('painel_pedido', { p_numero: numero });
  if (error) throw new Error(`Não consegui abrir o pedido: ${error.message}`);
  if (!data) notFound();
  const pedido = data as PedidoInteiro;

  const caminhos = [...new Set(pedido.itens.flatMap((i) => [i.foto?.original, i.foto?.recorte]).filter(Boolean))];
  const enderecos = new Map<string, string>();
  if (caminhos.length) {
    const { data: assinados, error: erroDasFotos } = await supabase.storage
      .from(ESPACO_DAS_FOTOS)
      .createSignedUrls(caminhos as string[], VALIDADE_DAS_FOTOS);
    if (erroDasFotos) console.error('painel: não consegui abrir as fotos do pedido', erroDasFotos.message);
    for (const assinado of assinados ?? []) {
      if (assinado.path && assinado.signedUrl) enderecos.set(assinado.path, assinado.signedUrl);
    }
  }
  const fotos: Record<number, FotosDoItem> = Object.fromEntries(
    pedido.itens.map((i) => [
      i.id,
      {
        original: (i.foto?.original && enderecos.get(i.foto.original)) || null,
        recorte: (i.foto?.recorte && enderecos.get(i.foto.recorte)) || null,
      },
    ]),
  );

  return (
    <PedidoDoPainel
      pedido={pedido}
      fotos={fotos}
      admin={eu.papel === 'admin'}
      recorteDeTeste={process.env.PHOTOROOM_MODO !== 'producao'}
    />
  );
}

export default function PaginaDoPedido({ params }: { params: Promise<{ numero: string }> }) {
  return (
    <>
      <Link href="/painel" className={link}>
        ← Pedidos
      </Link>
      <Suspense
        fallback={
          <p aria-busy="true" className="mt-6 text-[0.9375rem]">
            Abrindo o pedido…
          </p>
        }
      >
        <Pedido params={params} />
      </Suspense>
    </>
  );
}
