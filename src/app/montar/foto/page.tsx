import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { EnviarFoto } from './enviar-foto';
import { Guia } from './guia';
import { IconeVoltar } from './icones';

export const metadata: Metadata = {
  title: 'Sua foto | Divestir',
};

// Tela de trabalho: papel creme no topo, como o resto do montador.
export const viewport: Viewport = {
  themeColor: '#faf5eb',
};

export default function Foto() {
  return (
    <>
      <header className="relative flex justify-center px-4 pt-5">
        <Link
          href="/montar"
          aria-label="Voltar para a escolha da peça"
          className="absolute top-5 left-2 inline-flex size-11 items-center justify-center rounded-full"
        >
          <IconeVoltar tamanho={22} />
        </Link>
        <Link href="/" className="px-2 py-2 font-titulo text-xl uppercase tracking-[0.06em]">
          Divestir
        </Link>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-36 lg:pt-10 lg:pb-24">
        <EnviarFoto guia={<Guia />} />
      </main>
    </>
  );
}
