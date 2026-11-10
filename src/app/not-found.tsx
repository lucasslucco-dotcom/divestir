import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from './cabecalho';

// Endereço que não existe (link antigo, digitado errado): a pessoa cai aqui e
// encontra o caminho de volta, em vez da página de erro padrão em inglês.
export const metadata: Metadata = {
  title: 'Página não encontrada | Divestir',
  robots: { index: false },
};

export default function NaoEncontrada() {
  return (
    <>
      <Cabecalho />
      <main className="flex min-h-[72svh] flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none text-balance uppercase">
          Essa página saiu de cena
        </h1>
        <p className="mt-6 max-w-[28ch] font-destaque text-[clamp(1.3rem,4.8vw,1.75rem)] leading-tight text-balance italic">
          O endereço mudou ou nunca existiu. A sua Divestir continua esperando por você.
        </p>
        <Link href="/montar" className="ingresso mt-10">
          Criar minha Divestir
        </Link>
        <Link
          href="/"
          className="mt-3 inline-block py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2"
        >
          Voltar ao início
        </Link>
      </main>
    </>
  );
}
