'use client';

// Aparece se o catálogo não carregar (por exemplo, o banco fora do ar por um instante).
export default function ErroDoMontador({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none uppercase">Ops, travou aqui</h1>
      <p className="mt-6 max-w-[30ch] font-destaque text-[clamp(1.3rem,4.8vw,1.75rem)] leading-tight text-balance italic">
        Não consegui carregar as peças agora. Tenta de novo em um instante.
      </p>
      <button type="button" onClick={reset} className="ingresso mt-10">
        Tentar de novo
      </button>
    </main>
  );
}
