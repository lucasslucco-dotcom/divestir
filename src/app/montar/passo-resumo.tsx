'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { Falta, Resolvida } from './estado';
import { IconeSim } from './icones';
import { linkDeTexto } from './passo-foto';
import { preco } from './passos';
import { TelaDaPrevia, type FotoDaPrevia } from './tela-da-previa';

// Passo 7: o resumo da peça e o carrinho. A peça fica guardada no carrinho do
// navegador; "Finalizar compra" leva ao carrinho (onde fica o presente) e "Criar
// outra Divestir" começa outra, reaproveitando a foto (decisão do Lucas, 08/11/2026).
// Vindo do "Editar" do carrinho, o botão salva as mudanças na mesma peça.

function juntar(itens: string[]) {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

export function PassoResumo({
  r,
  nomeDaPeca,
  nome,
  valores,
  foto,
  falta,
  pecasNoCarrinho,
  adicionada,
  editando,
  rotulo,
  aoAdicionar,
  aoCriarOutra,
  aoIrPara,
}: {
  r: Resolvida;
  nomeDaPeca: string;
  nome: string;
  valores: Record<string, string>;
  foto: FotoDaPrevia | null;
  falta: Falta[];
  pecasNoCarrinho: number;
  adicionada: boolean;
  editando: boolean;
  rotulo: string;
  aoAdicionar: () => void;
  aoCriarOutra: () => void;
  aoIrPara: (passo: Falta['passo']) => void;
}) {
  const [tentou, setTentou] = useState(false);

  if (adicionada) {
    return (
      <div role="status">
        <p className="flex items-start gap-2 text-lg leading-snug font-semibold">
          <IconeSim tamanho={20} className="mt-[3px] shrink-0" />
          Prontinho, sua Divestir está no carrinho!
        </p>
        <p className="mt-1 text-[0.9375rem] leading-snug">
          {pecasNoCarrinho === 1 ? '1 peça no carrinho.' : `${pecasNoCarrinho} peças no carrinho.`}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/carrinho" className="ingresso w-full sm:w-auto">
            Finalizar compra
          </Link>
          <button type="button" onClick={aoCriarOutra} className={linkDeTexto}>
            Criar outra Divestir
          </button>
        </div>
      </div>
    );
  }

  const base = r.peca.fotos[r.cor.slug]?.[r.lado];
  const area = r.peca.areas[r.lado]?.previa ?? null;
  const linhas: [string, string][] = [
    ['Peça', nomeDaPeca],
    ['Cor', r.cor.nome],
    ['Design', r.design?.nome ?? '—'],
    ['Nome', nome ? nome.toLocaleUpperCase('pt-BR') : '—'],
    [
      'Estampa',
      r.lado === 'costas' ? (r.marcaNoPeito ? 'Nas costas, com DIVESTIR no peito' : 'Nas costas') : 'Na frente',
    ],
    ['Tamanho', r.tamanho ?? '—'],
  ];
  if (r.peca.preco !== null) linhas.push(['Preço', `a partir de ${preco.format(r.peca.preco)}`]);

  return (
    <>
      <div className="flex items-start gap-4">
        <div className="w-24 shrink-0 sm:w-28">
          {base && area && foto && r.design ? (
            <TelaDaPrevia
              base={base}
              area={area}
              corDaPeca={r.cor.slug}
              arte={{ tipo: 'design', design: r.design, valores, foto }}
              perto
              rotulo={rotulo}
              adiar
              className="rounded-xl"
            />
          ) : base ? (
            <Image
              src={base}
              alt=""
              width={1440}
              height={1800}
              sizes="112px"
              className="h-auto w-full rounded-xl bg-estudio"
            />
          ) : null}
          {foto ? <p className="mt-1.5 text-[0.6875rem] leading-4 font-semibold">Prévia ilustrativa</p> : null}
        </div>
        <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-[0.9375rem] leading-snug">
          {linhas.map(([rotuloDaLinha, valor]) => (
            <div key={rotuloDaLinha} className="contents">
              <dt>{rotuloDaLinha}</dt>
              <dd className="font-semibold">{valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      {falta.length && tentou ? (
        <div role="alert" className="mt-6">
          <p className="max-w-[38ch] text-base leading-snug font-semibold">
            Antes do carrinho, falta {juntar(falta.map((f) => f.texto))}.
          </p>
          <div className="flex flex-wrap gap-x-6">
            {falta.map((f) => (
              <button key={f.texto} type="button" onClick={() => aoIrPara(f.passo)} className={linkDeTexto}>
                {f.texto.charAt(0).toLocaleUpperCase('pt-BR') + f.texto.slice(1)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {editando ? (
          <p className="mb-4 max-w-[38ch] text-[0.9375rem] leading-snug">
            Você está mudando uma peça do carrinho. Ao salvar, ela volta para lá com as mudanças.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setTentou(true);
            aoAdicionar();
          }}
          className="ingresso w-full sm:w-auto"
        >
          {editando ? 'Salvar as mudanças' : 'Adicionar ao carrinho'}
        </button>
        {editando ? (
          <div>
            <Link href="/carrinho" className={linkDeTexto}>
              Voltar ao carrinho sem mudar
            </Link>
          </div>
        ) : pecasNoCarrinho ? (
          <p className="mt-3 text-[0.9375rem] leading-snug">
            {pecasNoCarrinho === 1 ? 'Já tem 1 peça no carrinho. ' : `Já tem ${pecasNoCarrinho} peças no carrinho. `}
            <Link href="/carrinho" className="underline decoration-1 underline-offset-[0.3em] hover:decoration-2">
              Ver o carrinho
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
