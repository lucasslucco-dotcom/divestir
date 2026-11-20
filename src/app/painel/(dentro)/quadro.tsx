'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type DragEvent } from 'react';
import { COLUNAS_DO_QUADRO, NOME_DO_STATUS, podeMover, type Status } from '@/lib/painel/status';
import type { PedidoDaLista } from '@/lib/painel/tipos';
import { IconeAlerta } from '../../montar/icones';
import { moverPedido } from '../acoes';
import { etiqueta, haQuantoTempo, link } from '../estilo';
import { PerguntaDoRastreio, PerguntaDaFoto } from './perguntas';

// O quadro por status (briefing, "Telas do painel"): cada coluna é uma etapa, cada
// cartão é um pedido, e arrastar o cartão para outra coluna muda o status. No celular
// não se arrasta: o cartão abre o pedido, e os botões de lá fazem a mesma coisa.

// Na coluna "Entregue" ficam só os das últimas duas semanas; o resto está na lista.
const DIAS_DOS_ENTREGUES = 14;

const O_QUE_FAZER: Record<string, string> = {
  revisao_arte: 'Conferir a foto e a arte de cada peça.',
  ajuste_foto: 'Esperando uma foto melhor do cliente.',
  em_producao: 'Arte aprovada, na estamparia.',
  enviado: 'Com a transportadora.',
  entregue: `Entregues nos últimos ${DIAS_DOS_ENTREGUES} dias.`,
};

type Pergunta = { pedido: PedidoDaLista; para: 'enviado' | 'ajuste_foto' };

function Cartao({
  pedido,
  agora,
  movendo,
  aoPegar,
  aoSoltar,
}: {
  pedido: PedidoDaLista;
  agora: number;
  movendo: boolean;
  aoPegar: (evento: DragEvent, pedido: PedidoDaLista) => void;
  aoSoltar: () => void;
}) {
  const [primeira, ...outras] = pedido.pecas;
  return (
    <li>
      <Link
        href={`/painel/pedidos/${pedido.numero}`}
        draggable
        onDragStart={(evento) => aoPegar(evento, pedido)}
        onDragEnd={aoSoltar}
        aria-busy={movendo || undefined}
        className="block rounded-xl border border-verde bg-creme p-4 outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde aria-busy:border-dashed"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-base leading-snug font-semibold tabular-nums">Nº {pedido.numero}</span>
          <span className="text-[0.8125rem] leading-none">{haQuantoTempo(pedido.mudou_em, agora)}</span>
        </span>
        <span className="mt-1 block text-[0.9375rem] leading-snug">{pedido.nome}</span>
        {primeira ? (
          <span className="mt-3 block text-[0.9375rem] leading-snug">
            <span className="font-semibold">{primeira.design}</span>
            {primeira.nome ? ` · ${primeira.nome.toLocaleUpperCase('pt-BR')}` : ''}
            <span className="block">
              {primeira.peca} · {primeira.cor} · {primeira.tamanho}
            </span>
            {outras.length ? (
              <span className="block">{outras.length === 1 ? 'e mais 1 peça' : `e mais ${outras.length} peças`}</span>
            ) : null}
          </span>
        ) : null}
        {pedido.presente || pedido.teste ? (
          <span className="mt-3 flex flex-wrap gap-1.5">
            {pedido.presente ? <span className={etiqueta}>Presente</span> : null}
            {pedido.teste ? <span className={etiqueta}>Teste</span> : null}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function Quadro({ pedidos, agora }: { pedidos: PedidoDaLista[]; agora: number }) {
  const router = useRouter();
  const [pegado, setPegado] = useState<PedidoDaLista | null>(null);
  const [sobre, setSobre] = useState<Status | null>(null);
  const [pergunta, setPergunta] = useState<Pergunta | null>(null);
  const [movendo, setMovendo] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [, comecar] = useTransition();

  const limite = agora - DIAS_DOS_ENTREGUES * 86_400_000;
  const daColuna = (status: Status) =>
    pedidos
      .filter((p) => (p.status === 'pago' ? 'revisao_arte' : p.status) === status)
      .filter((p) => status !== 'entregue' || new Date(p.mudou_em).getTime() >= limite)
      // Quem está parado há mais tempo fica em cima.
      .sort((a, b) => a.mudou_em.localeCompare(b.mudou_em));

  function mover(pedido: PedidoDaLista, para: Status, extras: { rastreio?: string; nota?: string } = {}) {
    setAviso(null);
    setMovendo(pedido.numero);
    comecar(async () => {
      const retorno = await moverPedido(pedido.numero, para, extras);
      if (retorno && 'erro' in retorno) setAviso(`Pedido nº ${pedido.numero}: ${retorno.erro}`);
      router.refresh();
      setMovendo(null);
    });
  }

  function soltarNa(coluna: Status) {
    const pedido = pegado;
    setPegado(null);
    setSobre(null);
    if (!pedido || !podeMover(pedido.status, coluna)) return;
    if (coluna === 'enviado' || coluna === 'ajuste_foto') setPergunta({ pedido, para: coluna });
    else mover(pedido, coluna);
  }

  return (
    <>
      {aviso ? (
        <p role="alert" className="mt-6 flex items-start gap-2 text-base leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
          {aviso}
        </p>
      ) : null}
      {pedidos.length === 0 ? (
        <p className="mt-10 max-w-[44ch] leading-relaxed">
          Nenhum pedido em andamento. Quando um pagamento cair, o pedido aparece aqui, em “Revisão de arte”.
        </p>
      ) : null}
      <div className="-mx-4 mt-8 overflow-x-auto px-4 pb-4">
        <ol className="grid w-max snap-x snap-mandatory grid-flow-col gap-4 xl:w-full xl:auto-cols-fr">
          {COLUNAS_DO_QUADRO.map((coluna) => {
            const lista = daColuna(coluna);
            const cabe = pegado ? podeMover(pegado.status, coluna) : false;
            return (
              <li
                key={coluna}
                onDragOver={(evento) => {
                  if (!cabe) return;
                  evento.preventDefault();
                  evento.dataTransfer.dropEffect = 'move';
                  if (sobre !== coluna) setSobre(coluna);
                }}
                onDragLeave={(evento) => {
                  if (!evento.currentTarget.contains(evento.relatedTarget as Node | null)) setSobre(null);
                }}
                onDrop={(evento) => {
                  evento.preventDefault();
                  soltarNa(coluna);
                }}
                data-cabe={pegado ? cabe : undefined}
                data-sobre={sobre === coluna || undefined}
                className="flex w-[78vw] max-w-80 snap-start flex-col rounded-xl border border-transparent p-2 data-[cabe=true]:border-dashed data-[cabe=true]:border-verde data-[sobre]:border-solid xl:w-auto xl:max-w-none"
              >
                <h2 className="flex items-baseline justify-between gap-3 px-2 pt-1">
                  <span className="text-lg leading-snug font-semibold">{NOME_DO_STATUS[coluna]}</span>
                  <span className="text-[0.9375rem] leading-none font-semibold tabular-nums">{lista.length}</span>
                </h2>
                <p className="mt-1 px-2 text-[0.8125rem] leading-snug">{O_QUE_FAZER[coluna]}</p>
                <ul className="mt-4 grid gap-3">
                  {lista.map((pedido) => (
                    <Cartao
                      key={pedido.numero}
                      pedido={pedido}
                      agora={agora}
                      movendo={movendo === pedido.numero}
                      aoPegar={(evento, p) => {
                        evento.dataTransfer.effectAllowed = 'move';
                        evento.dataTransfer.setData('text/plain', `Pedido nº ${p.numero}`);
                        setPegado(p);
                      }}
                      aoSoltar={() => {
                        setPegado(null);
                        setSobre(null);
                      }}
                    />
                  ))}
                </ul>
                {coluna === 'entregue' ? (
                  <Link href="/painel?visao=lista&status=entregue" className={`${link} mt-2 px-2`}>
                    Ver todos os entregues
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-4 hidden max-w-[60ch] text-[0.9375rem] leading-snug xl:block">
        Arraste o cartão para a próxima etapa, ou abra o pedido para ver a arte e usar os botões.
      </p>

      {pergunta?.para === 'enviado' ? (
        <PerguntaDoRastreio
          numero={pergunta.pedido.numero}
          aoFechar={() => setPergunta(null)}
          aoConfirmar={(rastreio) => {
            mover(pergunta.pedido, 'enviado', { rastreio });
            setPergunta(null);
          }}
        />
      ) : null}
      {pergunta?.para === 'ajuste_foto' ? (
        <PerguntaDaFoto
          numero={pergunta.pedido.numero}
          aoFechar={() => setPergunta(null)}
          aoConfirmar={(nota) => {
            mover(pergunta.pedido, 'ajuste_foto', { nota });
            setPergunta(null);
          }}
        />
      ) : null}
    </>
  );
}
