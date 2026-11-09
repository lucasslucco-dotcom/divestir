'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { acompanharCarrinho, contarCarrinho } from '@/lib/montagem/guardar';
import { IconeSacola } from './montar/icones';

// O topo do site: a marca no centro e, quando tem peça no carrinho, o carrinho à
// direita com quantas peças tem. Sobre o verde, tinta creme; sobre o creme, verde.
// "largura" acompanha a largura da página, para o carrinho ficar alinhado com o conteúdo.
export function Cabecalho({ semCarrinho = false, largura = 'max-w-6xl' }: { semCarrinho?: boolean; largura?: string }) {
  const pecas = useSyncExternalStore(acompanharCarrinho, contarCarrinho, () => 0);
  return (
    <header className={`relative mx-auto flex justify-center px-4 pt-5 ${largura}`}>
      <Link href="/" className="px-2 py-2 font-titulo text-xl uppercase tracking-[0.06em]">
        Divestir
      </Link>
      {!semCarrinho && pecas > 0 ? (
        <Link
          href="/carrinho"
          aria-label={pecas === 1 ? 'Carrinho, 1 peça' : `Carrinho, ${pecas} peças`}
          className="absolute top-5 right-2 flex h-11 min-w-11 items-center justify-center gap-1 px-2 text-[0.9375rem] leading-none font-semibold tabular-nums"
        >
          <IconeSacola tamanho={22} />
          <span aria-hidden="true">{pecas}</span>
        </Link>
      ) : null}
    </header>
  );
}
