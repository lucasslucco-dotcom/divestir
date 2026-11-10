'use client';

import Image from 'next/image';
import { useId, useState, type ReactNode } from 'react';
import type { Catalogo, Cor, Peca } from '@/lib/catalogo';
import { temSimboloForaDaEstampa, tirarSimbolosDaEstampa, type Campo } from '@/lib/molde/tipos';
import { IconeAlerta, IconeSim } from './icones';
import { linkDeTexto } from './passo-foto';
import { TelaDaPrevia, type ArteDaPrevia } from './tela-da-previa';

export const preco = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Um passo do montador: número vazado (como a numeração de uma camisa de time),
// título e, quando o passo está resolvido, um resumo da escolha.
export function Passo({
  id,
  numero,
  titulo,
  resumo,
  children,
}: {
  id: string;
  numero: number;
  titulo: string;
  resumo?: string | null;
  children: ReactNode;
}) {
  return (
    <li
      id={id}
      className="scroll-mt-[calc(var(--altura-da-doca,0px)+0.75rem)] border-t border-verde pt-6 pb-9 first:border-t-0 lg:scroll-mt-6 lg:first:border-t lg:first:pt-6"
    >
      <section aria-labelledby={`${id}-titulo`}>
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="numero-vazado w-7 shrink-0 text-center font-titulo text-5xl leading-[0.9]"
          >
            {numero}
          </span>
          <div className="min-w-0 pt-1">
            <h2 id={`${id}-titulo`} className="text-lg leading-snug font-semibold">
              {titulo}
            </h2>
            {resumo ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[0.9375rem] leading-snug">
                <IconeSim className="shrink-0" />
                <span className="min-w-0 truncate">{resumo}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </li>
  );
}

// Passo 1: a peça.
export function PassoPeca({
  catalogo,
  peca,
  cor,
  aoEscolher,
}: {
  catalogo: Catalogo;
  peca: Peca;
  cor: Cor;
  aoEscolher: (slug: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Peça"
      className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-3 lg:gap-x-3 lg:gap-y-5 lg:overflow-visible"
    >
      {catalogo.pecas.map((opcao) => {
        const foto = opcao.fotos[cor.slug]?.frente ?? Object.values(opcao.fotos)[0]?.frente;
        return (
          // relative: o botão invisível fica preso no cartão. Sem isso, o das peças
          // fora da tela escapa da faixa e alarga a página no celular.
          <label key={opcao.slug} className="relative w-[36%] shrink-0 cursor-pointer snap-start sm:w-[24%] lg:w-auto">
            <input
              type="radio"
              name="peca"
              value={opcao.slug}
              checked={opcao.slug === peca.slug}
              onChange={() => aoEscolher(opcao.slug)}
              className="peer sr-only"
            />
            <span className="block overflow-hidden rounded-xl border-2 border-transparent bg-estudio transition-colors duration-200 ease-saida peer-checked:border-verde peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
              {foto ? (
                <Image
                  src={foto}
                  alt=""
                  width={1440}
                  height={1800}
                  sizes="(min-width: 1024px) 128px, (min-width: 640px) 140px, 36vw"
                  className="h-auto w-full"
                />
              ) : (
                <span className="block aspect-[4/5]" />
              )}
            </span>
            <span className="mt-2 block text-sm leading-snug font-semibold">{opcao.nome}</span>
            <span className="block text-sm leading-snug">{opcao.caimento}</span>
            {opcao.preco !== null ? (
              <span className="block text-sm leading-snug tabular-nums">a partir de {preco.format(opcao.preco)}</span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}

// Passo 3: o nome. Entra na prévia enquanto a pessoa digita.
export function PassoNome({
  campo,
  valor,
  aoMudar,
}: {
  campo: Campo | undefined;
  valor: string;
  aoMudar: (valor: string) => void;
}) {
  const id = useId();
  const max = campo?.max ?? 10;
  const [tirou, setTirou] = useState(false);

  // Emoji e símbolos não existem na fonte da estampa (confirmado pelo Lucas,
  // 10/11/2026): eles nem entram no campo, e um aviso explica. Enquanto o teclado
  // ainda está montando uma letra (o acento antes da vogal), nada é mexido.
  function mudar(bruto: string, montando: boolean) {
    if (montando) return aoMudar(bruto.slice(0, max));
    // O aviso fica até a pessoa voltar ao campo: sumir na letra seguinte seria rápido demais.
    if (temSimboloForaDaEstampa(bruto)) setTirou(true);
    aoMudar(tirarSimbolosDaEstampa(bruto).slice(0, max));
  }

  return (
    <>
      <label htmlFor={`${id}-nome`} className="block text-base leading-snug font-semibold">
        Como ele(a) se chama?
      </label>
      <input
        id={`${id}-nome`}
        type="text"
        value={valor}
        onChange={(evento) => mudar(evento.target.value, (evento.nativeEvent as InputEvent).isComposing === true)}
        onCompositionEnd={(evento) => mudar(evento.currentTarget.value, false)}
        onFocus={() => setTirou(false)}
        onBlur={(evento) => {
          if (temSimboloForaDaEstampa(evento.currentTarget.value)) mudar(evento.currentTarget.value, false);
        }}
        onKeyDown={(evento) => {
          if (evento.key === 'Enter') evento.currentTarget.blur();
        }}
        maxLength={max}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="done"
        aria-describedby={`${id}-ajuda`}
        className="mt-2 h-12 w-full max-w-[22rem] rounded-md border border-verde bg-creme px-4 text-lg leading-none font-semibold tracking-[0.04em] uppercase outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde"
      />
      <p id={`${id}-ajuda`} className="mt-2 text-[0.9375rem] leading-snug">
        Até {max} letras, como Thor, Vó Cida ou Duda.
      </p>
      <div aria-live="polite">
        {tirou ? (
          <p className="mt-2 flex max-w-[38ch] items-start gap-2 text-[0.9375rem] leading-snug font-semibold">
            <IconeAlerta className="mt-[3px] shrink-0" />
            Emoji e símbolos não saem na estampa: o nome vai só com letras e números.
          </p>
        ) : null}
      </div>
    </>
  );
}

// Passo 5: a cor. As três lado a lado, já com a estampa na tinta de cada uma.
export function PassoCor({
  cores,
  cor,
  peca,
  lado,
  arte,
  aoEscolher,
  rotuloDaCor,
}: {
  cores: Cor[];
  cor: Cor;
  peca: Peca;
  lado: 'frente' | 'costas';
  arte: ArteDaPrevia | null;
  aoEscolher: (slug: string) => void;
  rotuloDaCor: (cor: Cor) => string;
}) {
  const area = peca.areas[lado]?.previa ?? null;
  return (
    <>
      <div role="radiogroup" aria-label="Cor da peça" className="grid max-w-md grid-cols-3 gap-2 sm:gap-3">
        {cores.map((opcao) => {
          const base = peca.fotos[opcao.slug]?.[lado];
          return (
            <label key={opcao.slug} className="relative cursor-pointer">
              <input
                type="radio"
                name="cor"
                value={opcao.slug}
                checked={opcao.slug === cor.slug}
                onChange={() => aoEscolher(opcao.slug)}
                className="peer sr-only"
              />
              <span className="block overflow-hidden rounded-xl border-2 border-transparent bg-estudio transition-colors duration-200 ease-saida peer-checked:border-verde peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                {base && arte && area ? (
                  <TelaDaPrevia
                    base={base}
                    area={area}
                    corDaPeca={opcao.slug}
                    arte={arte}
                    perto
                    rotulo={rotuloDaCor(opcao)}
                    adiar
                  />
                ) : base ? (
                  <Image
                    src={base}
                    alt=""
                    width={1440}
                    height={1800}
                    sizes="(min-width: 1024px) 128px, 30vw"
                    className="h-auto w-full"
                  />
                ) : (
                  <span className="block aspect-[4/5]" />
                )}
              </span>
              <span className="mt-1.5 block text-sm leading-5 font-semibold">{opcao.nome}</span>
            </label>
          );
        })}
      </div>
      {arte ? (
        <p className="mt-3 text-[0.9375rem] leading-snug">
          A tinta da estampa muda junto com a cor da peça.
          <span className="mt-1 block text-xs leading-relaxed">Prévias ilustrativas.</span>
        </p>
      ) : null}
    </>
  );
}

// Passo 6: o tamanho. Fica no fim porque não muda a prévia (briefing).
export function PassoTamanho({
  peca,
  tamanho,
  aoEscolher,
}: {
  peca: Peca;
  tamanho: string | null;
  aoEscolher: (tamanho: string) => void;
}) {
  const { medidas } = peca;
  return (
    <>
      <p className="mb-3 text-[0.9375rem] leading-snug">Escolhe o tamanho de quem vai vestir.</p>
      <div role="radiogroup" aria-label="Tamanho" className="flex max-w-md flex-wrap gap-2">
        {peca.tamanhos.map((opcao) => (
          <label key={opcao} className="relative cursor-pointer">
            <input
              type="radio"
              name="tamanho"
              value={opcao}
              checked={opcao === tamanho}
              onChange={() => aoEscolher(opcao)}
              className="peer sr-only"
            />
            <span className="flex h-11 min-w-12 items-center justify-center rounded-full border border-verde px-3 text-sm leading-none font-semibold transition-colors duration-200 ease-saida peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
              {opcao}
            </span>
          </label>
        ))}
      </div>
      {medidas ? (
        <details className="mt-3 group">
          <summary className={`${linkDeTexto} list-none [&::-webkit-details-marker]:hidden`}>Tabela de medidas</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full max-w-md border-collapse text-left text-[0.9375rem] tabular-nums">
              <caption className="sr-only">
                Medidas de {peca.nome.toLocaleLowerCase('pt-BR')} {peca.caimento.toLocaleLowerCase('pt-BR')}, em{' '}
                {medidas.unidade}
              </caption>
              <thead>
                <tr className="border-b border-verde">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Tamanho
                  </th>
                  {medidas.linhas.map((linha) => (
                    <th key={linha.nome} scope="col" className="py-2 pr-4 font-semibold">
                      {linha.nome} ({medidas.unidade})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {peca.tamanhos.map((opcao) => (
                  <tr key={opcao} className="border-b border-verde last:border-0">
                    <th scope="row" className="py-2 pr-4 font-semibold">
                      {opcao}
                    </th>
                    {medidas.linhas.map((linha) => (
                      <td key={linha.nome} className="py-2 pr-4">
                        {linha.valores[opcao] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {medidas.linhas.some((linha) => linha.como_medir) ? (
              <ul className="mt-3 space-y-1 text-[0.9375rem] leading-snug">
                {medidas.linhas
                  .filter((linha) => linha.como_medir)
                  .map((linha) => (
                    <li key={linha.nome}>
                      <span className="font-semibold">{linha.nome}:</span> {linha.como_medir}
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}
    </>
  );
}
