import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Montador | Divestir',
};

export default function Montar() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" className="px-2 py-2 font-titulo text-xl uppercase tracking-[0.06em]">
        Divestir
      </Link>
      <h1 className="mt-12 font-titulo text-[clamp(4.25rem,19vw,6rem)] leading-[0.9] uppercase">Em breve</h1>
      <p className="mt-6 max-w-[24ch] font-destaque text-[clamp(1.45rem,5.2vw,2.1rem)] leading-tight text-balance italic">
        O montador está sendo costurado. Daqui a pouco você monta a sua Divestir aqui.
      </p>
      <Link
        href="/"
        className="mt-7 py-3 text-[0.9375rem] underline decoration-1 underline-offset-[0.3em] hover:decoration-2"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
