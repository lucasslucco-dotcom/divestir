'use client';

// Aparece se uma página não conseguir carregar (por exemplo, o banco fora do ar por
// um instante). O montador tem a sua própria, em montar/error.tsx.
export default function ErroDoSite({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none uppercase">Ops, travou aqui</h1>
      <p className="mt-6 max-w-[30ch] font-destaque text-[clamp(1.3rem,4.8vw,1.75rem)] leading-tight text-balance italic">
        Alguma coisa não carregou agora. Tenta de novo em um instante.
      </p>
      <button type="button" onClick={reset} className="ingresso mt-10 cursor-pointer">
        Tentar de novo
      </button>
    </main>
  );
}
