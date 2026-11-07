import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Montador | Divestir',
};

export default function Montar() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Link href="/" className="font-titulo text-xl uppercase tracking-[0.06em]">
        Divestir
      </Link>
      <h1 className="mt-14 font-titulo text-[clamp(4.25rem,19vw,9.5rem)] leading-[0.9] uppercase">Em breve</h1>
      <p className="mt-6 max-w-[24ch] font-destaque text-[clamp(1.45rem,5.2vw,2.1rem)] leading-tight text-balance text-creme/85 italic">
        O montador está sendo costurado. Daqui a pouco você monta a sua Divestir aqui.
      </p>
      <Link
        href="/"
        className="mt-10 text-[0.9375rem] underline decoration-creme/40 underline-offset-4 transition-colors hover:decoration-creme"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
