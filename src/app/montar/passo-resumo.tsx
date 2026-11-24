'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { valorDoCampo } from '@/lib/molde/tipos';
import type { Falta, Resolvida } from './estado';
import { IconeAlerta, IconeSim } from './icones';
import { linkDeTexto } from './passo-foto';
import { preco } from './passos';
import { TelaDaPrevia, type FotoDaPrevia } from './tela-da-previa';

// Passo 7: o resumo da peça e o carrinho. A peça fica guardada no carrinho do
// navegador; "Finalizar compra" leva ao carrinho (onde fica o presente) e "Criar
// outra Divestir" começa outra, reaproveitando a foto (decisão do Lucas, 08/11/2026).
// Vindo do "Editar" do carrinho, o botão salva as mudanças na mesma peça. E quem
// muda alguma coisa depois de adicionar atualiza a peça que já está no carrinho, em
// vez de ganhar uma segunda sem querer.

// nova: ainda não foi para o carrinho; no-carrinho: está lá, igual à tela; mudou:
// está lá, mas a pessoa mudou alguma coisa depois; editando: veio do "Editar".
export type SituacaoDaPeca = 'nova' | 'no-carrinho' | 'mudou' | 'editando';

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
  situacao,
  rotulo,
  aoAdicionar,
  aoAdicionarOutra,
  aoCriarOutra,
  aoIrPara,
  aoAjustarFoto,
  aoTrocarFoto,
  fotoSemQualidade,
}: {
  r: Resolvida;
  nomeDaPeca: string;
  nome: string;
  valores: Record<string, string>;
  foto: FotoDaPrevia | null;
  falta: Falta[];
  pecasNoCarrinho: number;
  situacao: SituacaoDaPeca;
  rotulo: string;
  aoAdicionar: () => void;
  aoAdicionarOutra: () => void;
  aoCriarOutra: () => void;
  aoIrPara: (passo: Falta['passo']) => void;
  // Abre o ajuste da foto na prévia (só com a foto da pessoa no lugar).
  aoAjustarFoto?: () => void;
  aoTrocarFoto: () => void;
  // A foto está abaixo da qualidade da estampa: dá para seguir, mas a pessoa fica sabendo.
  fotoSemQualidade: boolean;
}) {
  const [tentou, setTentou] = useState(false);
  const editando = situacao === 'editando';
  const mudou = situacao === 'mudou';

  if (situacao === 'no-carrinho') {
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
    // Os outros textos que o design pede (o ano do "Destino").
    ...(r.design?.config.campos ?? [])
      .filter((campo) => campo.chave !== 'nome')
      .map((campo): [string, string] => [
        campo.resumo ?? campo.rotulo.replace(/\?$/, ''),
        valorDoCampo(campo, valores).toLocaleUpperCase('pt-BR') || '—',
      ]),
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

      {/* É aqui que a pessoa aprova a peça (versão leve, 18/11/2026): não existe mais um
          "Ficou ótimo" só para a foto, que ninguém ia lembrar de tocar. */}
      {foto && aoAjustarFoto && !fotoSemQualidade ? (
        <div className="mt-6">
          <p className="max-w-[38ch] text-[0.9375rem] leading-snug">
            Confere na prévia como a foto e o nome ficaram: é assim que eles vão para a estampa.
          </p>
          <div className="flex flex-wrap gap-x-6">
            <button type="button" onClick={aoAjustarFoto} className={linkDeTexto}>
              Ajustar a foto
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-6">
        {editando ? (
          <p className="mb-4 max-w-[38ch] text-[0.9375rem] leading-snug">
            Você está mudando uma peça do carrinho. Ao salvar, ela volta para lá com as mudanças.
          </p>
        ) : null}
        {mudou ? (
          <p className="mb-4 max-w-[38ch] text-[0.9375rem] leading-snug">
            Essa peça já está no carrinho, e você mudou alguma coisa nela.
          </p>
        ) : null}
        {/* Foto sem qualidade para a estampa não vai para o carrinho (decisão do Lucas,
            22/11/2026): o caminho é mandar outra foto. */}
        {fotoSemQualidade ? (
          <>
            <p className="mb-4 flex max-w-[38ch] items-start gap-2 text-[0.9375rem] leading-snug font-semibold">
              <IconeAlerta className="mt-[3px] shrink-0" />
              Essa foto não tem qualidade para a nossa estampa: ia sair sem definição na peça. Com outra foto, a peça
              vai para o carrinho.
            </p>
            <button type="button" onClick={aoTrocarFoto} className="ingresso w-full px-5! sm:w-auto sm:px-10!">
              Escolher outra foto
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTentou(true);
              aoAdicionar();
            }}
            // O rótulo comprido ("Ficou ótimo, pôr no carrinho") cabe numa linha só no celular.
            className="ingresso w-full px-5! max-[339px]:text-[1.0625rem]! sm:w-auto sm:px-10!"
          >
            {editando
              ? 'Salvar as mudanças'
              : mudou
                ? 'Atualizar a peça do carrinho'
                : !foto
                  ? 'Adicionar ao carrinho'
                  : 'Ficou ótimo, pôr no carrinho'}
          </button>
        )}
        {editando ? (
          <div>
            <Link href="/carrinho" className={linkDeTexto}>
              Voltar ao carrinho sem mudar
            </Link>
          </div>
        ) : mudou ? (
          <div>
            <button
              type="button"
              onClick={() => {
                setTentou(true);
                aoAdicionarOutra();
              }}
              className={linkDeTexto}
            >
              Adicionar como outra peça
            </button>
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
