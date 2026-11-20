'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// As telas do painel. "Equipe" só aparece para o administrador.
export function Navegacao({ admin }: { admin: boolean }) {
  const caminho = usePathname();
  const telas = [
    { href: '/painel', nome: 'Pedidos', ativa: caminho === '/painel' || caminho.startsWith('/painel/pedidos') },
    ...(admin ? [{ href: '/painel/equipe', nome: 'Equipe', ativa: caminho.startsWith('/painel/equipe') }] : []),
  ];
  return (
    <nav aria-label="Telas do painel" className="flex items-center gap-x-5">
      {telas.map((tela) => (
        <Link
          key={tela.href}
          href={tela.href}
          aria-current={tela.ativa ? 'page' : undefined}
          className="py-3 text-[0.9375rem] leading-5 font-semibold decoration-2 underline-offset-[0.45em] hover:underline aria-[current=page]:underline"
        >
          {tela.nome}
        </Link>
      ))}
    </nav>
  );
}
