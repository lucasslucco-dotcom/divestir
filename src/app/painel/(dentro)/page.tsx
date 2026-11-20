import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { exigirEquipe, horaDoServidor } from '@/lib/painel/sessao';
import { ehStatus } from '@/lib/painel/status';
import type { PedidoDaLista } from '@/lib/painel/tipos';
import { Lista, type Filtros } from './lista';
import { Quadro } from './quadro';

// Pedidos: o quadro por status (para o dia a dia) e a lista com busca e filtros.

type Busca = Promise<Record<string, string | string[] | undefined>>;

const um = (valor: string | string[] | undefined) => (typeof valor === 'string' ? valor.trim().slice(0, 80) : '');
const data = (valor: string) => (/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : '');

async function Pedidos({ searchParams }: { searchParams: Busca }) {
  await connection();
  const busca = await searchParams;
  const { supabase } = await exigirEquipe();
  const naLista = um(busca.visao) === 'lista';
  const agora = horaDoServidor();

  if (!naLista) {
    const { data: pedidos, error } = await supabase.rpc('painel_pedidos');
    if (error) throw new Error(`Não consegui ler os pedidos: ${error.message}`);
    return <Quadro pedidos={(pedidos ?? []) as PedidoDaLista[]} agora={agora} />;
  }

  const status = um(busca.status);
  const filtros: Filtros = {
    busca: um(busca.busca),
    status: status === 'todos' || ehStatus(status) ? status : '',
    peca: um(busca.peca),
    design: um(busca.design),
    de: data(um(busca.de)),
    ate: data(um(busca.ate)),
  };
  const [pedidos, pecas, designs] = await Promise.all([
    supabase.rpc('painel_pedidos', {
      p_busca: filtros.busca || null,
      p_status: filtros.status || null,
      p_peca: filtros.peca || null,
      p_design: filtros.design || null,
      p_de: filtros.de || null,
      p_ate: filtros.ate || null,
    }),
    supabase.from('pecas').select('slug, nome').order('ordem'),
    supabase.from('designs').select('slug, nome').order('ordem'),
  ]);
  if (pedidos.error) throw new Error(`Não consegui ler os pedidos: ${pedidos.error.message}`);
  return (
    <Lista
      pedidos={(pedidos.data ?? []) as PedidoDaLista[]}
      filtros={filtros}
      pecas={pecas.data ?? []}
      designs={designs.data ?? []}
    />
  );
}

async function Visoes({ searchParams }: { searchParams: Busca }) {
  const naLista = um((await searchParams).visao) === 'lista';
  const pilula =
    'inline-flex min-h-11 items-center rounded-full border border-verde px-4 text-sm leading-none font-semibold aria-[current=page]:bg-verde aria-[current=page]:text-creme';
  return (
    <nav aria-label="Jeito de ver os pedidos" className="flex gap-2">
      <Link href="/painel" aria-current={naLista ? undefined : 'page'} className={pilula}>
        Quadro
      </Link>
      <Link href="/painel?visao=lista" aria-current={naLista ? 'page' : undefined} className={pilula}>
        Lista
      </Link>
    </nav>
  );
}

export default function PaginaDosPedidos({ searchParams }: { searchParams: Busca }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Pedidos</h1>
        <Suspense fallback={null}>
          <Visoes searchParams={searchParams} />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <p aria-busy="true" className="mt-10 text-[0.9375rem]">
            Abrindo os pedidos…
          </p>
        }
      >
        <Pedidos searchParams={searchParams} />
      </Suspense>
    </>
  );
}
