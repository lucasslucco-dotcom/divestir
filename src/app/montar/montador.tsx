'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Catalogo, Lado, Peca } from '@/lib/catalogo';

const LADOS: { valor: Lado; nome: string }[] = [
  { valor: 'frente', nome: 'Frente' },
  { valor: 'costas', nome: 'Costas' },
];

// Uma foto de base da prévia. Todas as fotos da peça escolhida ficam
// carregadas e empilhadas; só a ativa aparece, então trocar de cor ou de lado
// é instantâneo, com uma passagem suave.
function FotoDaPeca({ url, ativa, descricao }: { url: string; ativa: boolean; descricao: string }) {
  const [carregada, setCarregada] = useState(false);
  return (
    <Image
      src={url}
      alt={ativa ? descricao : ''}
      aria-hidden={!ativa}
      fill
      sizes="(min-width: 1024px) 640px, (min-width: 640px) 576px, calc(100vw - 32px)"
      loading="eager"
      fetchPriority={ativa ? 'high' : 'low'}
      onLoad={() => setCarregada(true)}
      className={`object-cover transition-opacity duration-300 ease-saida ${ativa && carregada ? 'opacity-100' : 'opacity-0'}`}
    />
  );
}

function nomeDaPeca(peca: Peca) {
  return `${peca.nome} · ${peca.caimento}`;
}

export function Montador({ catalogo }: { catalogo: Catalogo }) {
  const corPadrao = catalogo.cores.find((cor) => cor.slug === 'preto') ?? catalogo.cores[0];
  const [pecaEscolhida, setPecaEscolhida] = useState(catalogo.pecas[0]?.slug);
  const [corEscolhida, setCorEscolhida] = useState(corPadrao?.slug);
  const [lado, setLado] = useState<Lado>('frente');

  const peca = catalogo.pecas.find((item) => item.slug === pecaEscolhida) ?? catalogo.pecas[0];
  const cor = catalogo.cores.find((item) => item.slug === corEscolhida) ?? corPadrao;

  if (!peca || !cor) {
    return (
      <p className="mx-auto mt-16 max-w-[34ch] text-center leading-relaxed">
        As peças ainda estão chegando por aqui. Volta daqui a pouco que elas já estarão no lugar.
      </p>
    );
  }

  const descricaoAtiva = `${nomeDaPeca(peca)}, cor ${cor.nome.toLowerCase()}, ${lado === 'frente' ? 'de frente' : 'de costas'}`;

  return (
    // Celular e tablet: uma coluna só (no tablet, centralizada e com largura de
    // leitura). Computador: prévia à esquerda e escolhas à direita; a última
    // linha (1fr) absorve a altura da prévia, para as escolhas ficarem juntas no alto.
    <div className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_25rem] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:items-start lg:gap-x-12 xl:gap-x-16">
      <div className="lg:col-start-2 lg:row-start-1">
        <h1 className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none uppercase">Escolhe a peça</h1>
        <p className="mt-3 font-destaque text-[clamp(1.25rem,4.6vw,1.6rem)] leading-tight italic">
          Toca numa peça e numa cor para ver como ela fica.
        </p>
      </div>

      <section
        aria-label="Prévia da peça"
        className="mt-6 lg:sticky lg:top-6 lg:col-start-1 lg:row-span-5 lg:row-start-1 lg:mt-0"
      >
        {/* No computador, a prévia nunca passa da altura da janela (notebooks baixos, como 1366×768). */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-estudio lg:mx-auto lg:max-w-[calc((100dvh_-_8rem)_*_0.8)]">
          {catalogo.cores.flatMap((opcao) =>
            LADOS.map(({ valor }) => {
              const url = peca.fotos[opcao.slug]?.[valor];
              if (!url) return null;
              return (
                <FotoDaPeca
                  key={`${peca.slug}-${opcao.slug}-${valor}`}
                  url={url}
                  ativa={opcao.slug === cor.slug && valor === lado}
                  descricao={descricaoAtiva}
                />
              );
            }),
          )}
        </div>
      </section>

      <div className="mt-8 lg:col-start-2 lg:row-start-2 lg:mt-10">
        <div role="radiogroup" aria-label="Peça" className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-x-3 lg:gap-y-5 lg:overflow-visible lg:px-0">
          {catalogo.pecas.map((opcao) => {
            const miniatura = opcao.fotos[cor.slug]?.frente ?? opcao.fotos[corPadrao?.slug ?? '']?.frente;
            return (
              // relative: o botão invisível fica preso no cartão. Sem isso, o das
              // peças fora da tela escapa da faixa e alarga a página no celular.
              <label key={opcao.slug} className="relative w-[36%] shrink-0 cursor-pointer snap-start sm:w-[24%] lg:w-auto">
                <input
                  type="radio"
                  name="peca"
                  value={opcao.slug}
                  checked={opcao.slug === peca.slug}
                  onChange={() => setPecaEscolhida(opcao.slug)}
                  className="peer sr-only"
                />
                <span className="block overflow-hidden rounded-xl border-2 border-transparent bg-estudio transition-colors duration-200 ease-saida peer-checked:border-verde peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                  {miniatura ? (
                    <Image src={miniatura} alt="" width={1440} height={1800} sizes="(min-width: 1024px) 128px, (min-width: 640px) 140px, 36vw" className="h-auto w-full" />
                  ) : (
                    <span className="block aspect-[4/5]" />
                  )}
                </span>
                <span className="mt-2 block text-sm leading-snug font-semibold">{opcao.nome}</span>
                <span className="block text-sm leading-snug">{opcao.caimento}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Celular: presa no pé da tela, com a cor e o lado sempre a um toque do
          polegar e a foto livre de botões. Computador: entra na coluna das escolhas. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-verde bg-creme px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] lg:static lg:col-start-2 lg:row-start-3 lg:mt-10 lg:border-0 lg:p-0">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 lg:max-w-none lg:justify-start lg:gap-x-10">
          <div role="radiogroup" aria-label="Cor da peça" className="flex gap-3">
            {catalogo.cores.map((opcao) => (
              <label key={opcao.slug} className="relative flex min-w-11 cursor-pointer flex-col items-center gap-1.5">
                <input
                  type="radio"
                  name="cor"
                  value={opcao.slug}
                  checked={opcao.slug === cor.slug}
                  onChange={() => setCorEscolhida(opcao.slug)}
                  className="peer sr-only"
                />
                <span
                  className="block size-10 rounded-full border border-verde outline-offset-[3px] peer-checked:outline-2 peer-checked:outline-verde peer-focus-visible:outline-2 peer-focus-visible:outline-verde"
                  style={{ backgroundColor: opcao.hex }}
                />
                <span className="text-xs leading-none">{opcao.nome}</span>
              </label>
            ))}
          </div>
          <div role="radiogroup" aria-label="Lado da peça" className="flex rounded-full border border-verde p-1">
            {LADOS.map(({ valor, nome }) => (
              <label key={valor} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="lado"
                  value={valor}
                  checked={lado === valor}
                  onChange={() => setLado(valor)}
                  className="peer sr-only"
                />
                <span className="block rounded-full px-3.5 py-3 text-sm leading-5 font-semibold transition-colors duration-200 ease-saida peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                  {nome}
                </span>
              </label>
            ))}
          </div>
        </div>
        {/* Quem usa leitor de tela ouve a escolha inteira sempre que ela muda. */}
        <p className="sr-only" aria-live="polite">
          {descricaoAtiva}
        </p>
      </div>

      <div className="mt-10 lg:col-start-2 lg:row-start-4">
        {/* A peça escolhida segue junto, para a prévia do design mostrar a mesma peça. */}
        <Link href={`/montar/foto?peca=${encodeURIComponent(peca.slug)}`} className="ingresso">
          Continuar para a foto
        </Link>
      </div>
    </div>
  );
}
