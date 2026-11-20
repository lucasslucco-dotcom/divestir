'use client';

import { useId, useState, type FormEvent } from 'react';
import { limparRastreio } from '@/lib/painel/status';
import { botao, caixa, rotulo } from '../estilo';
import { Dialogo } from './dialogo';

// As perguntas que o painel faz antes de mudar um pedido de etapa.

function Botoes({ confirmar, aoFechar }: { confirmar: string; aoFechar: () => void }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button type="submit" className={`${botao} bg-verde text-creme hover:bg-verde-claro`}>
        {confirmar}
      </button>
      <button type="button" onClick={aoFechar} className={botao}>
        Agora não
      </button>
    </div>
  );
}

// Ida para "Enviado": o código de rastreio da transportadora.
export function PerguntaDoRastreio({
  numero,
  atual = '',
  aoFechar,
  aoConfirmar,
}: {
  numero: number;
  atual?: string;
  aoFechar: () => void;
  aoConfirmar: (rastreio: string) => void;
}) {
  const id = useId();
  const [rastreio, setRastreio] = useState(atual);
  const [falta, setFalta] = useState(false);
  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (rastreio.length < 5) return setFalta(true);
    aoConfirmar(rastreio);
  }
  return (
    <Dialogo titulo={`Pedido nº ${numero}: qual é o código de rastreio?`} aoFechar={aoFechar}>
      <form onSubmit={enviar} className="mt-5">
        <label htmlFor={id} className={rotulo}>
          Código de rastreio
        </label>
        <input
          id={id}
          value={rastreio}
          onChange={(evento) => {
            setRastreio(limparRastreio(evento.target.value));
            setFalta(false);
          }}
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          aria-invalid={falta || undefined}
          aria-describedby={`${id}-ajuda`}
          className={`mt-2 ${caixa} tabular-nums`}
        />
        <p id={`${id}-ajuda`} className="mt-2 text-[0.9375rem] leading-snug">
          {falta
            ? 'Cola aqui o código que a transportadora deu.'
            : 'É o código que o cliente usa para acompanhar a entrega.'}
        </p>
        <Botoes confirmar="Marcar como enviado" aoFechar={aoFechar} />
      </form>
    </Dialogo>
  );
}

// Ida para "Ajuste de foto": o que há de errado com a foto.
export function PerguntaDaFoto({
  numero,
  aoFechar,
  aoConfirmar,
}: {
  numero: number;
  aoFechar: () => void;
  aoConfirmar: (nota: string) => void;
}) {
  const id = useId();
  const [nota, setNota] = useState('');
  const [falta, setFalta] = useState(false);
  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (nota.trim().length < 5) return setFalta(true);
    aoConfirmar(nota.trim());
  }
  return (
    <Dialogo titulo={`Pedido nº ${numero}: o que a foto precisa?`} aoFechar={aoFechar}>
      <form onSubmit={enviar} className="mt-5">
        <label htmlFor={id} className={rotulo}>
          Recado para o cliente
        </label>
        <textarea
          id={id}
          value={nota}
          onChange={(evento) => {
            setNota(evento.target.value.slice(0, 500));
            setFalta(false);
          }}
          autoFocus
          rows={4}
          aria-invalid={falta || undefined}
          aria-describedby={`${id}-ajuda`}
          className={`mt-2 ${caixa} h-auto py-3 leading-relaxed`}
        />
        <p id={`${id}-ajuda`} className="mt-2 text-[0.9375rem] leading-snug">
          {falta
            ? 'Escreve em uma frase o que a pessoa precisa mandar.'
            : 'Ex.: “A foto ficou escura e o rosto saiu borrado. Manda outra, de dia, mais de perto?”'}
        </p>
        <Botoes confirmar="Pedir outra foto" aoFechar={aoFechar} />
      </form>
    </Dialogo>
  );
}

// Cancelar o pedido (só o administrador).
export function PerguntaDoCancelamento({
  numero,
  pago,
  aoFechar,
  aoConfirmar,
}: {
  numero: number;
  pago: boolean;
  aoFechar: () => void;
  aoConfirmar: (nota: string) => void;
}) {
  const id = useId();
  const [nota, setNota] = useState('');
  return (
    <Dialogo titulo={`Cancelar o pedido nº ${numero}?`} aoFechar={aoFechar}>
      <form
        onSubmit={(evento) => {
          evento.preventDefault();
          aoConfirmar(nota.trim());
        }}
        className="mt-3"
      >
        <p className="leading-relaxed">
          {pago
            ? 'O pedido sai do quadro e não volta. O dinheiro não é devolvido sozinho: a devolução é feita no painel do meio de pagamento.'
            : 'O pedido sai da fila e não volta.'}
        </p>
        <label htmlFor={id} className={`${rotulo} mt-5`}>
          Motivo (fica no histórico)
        </label>
        <input
          id={id}
          value={nota}
          onChange={(evento) => setNota(evento.target.value.slice(0, 200))}
          autoComplete="off"
          className={`mt-2 ${caixa}`}
        />
        <Botoes confirmar="Cancelar o pedido" aoFechar={aoFechar} />
      </form>
    </Dialogo>
  );
}
