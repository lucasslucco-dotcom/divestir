'use client';

import { useEffect, useRef } from 'react';

// Uma janela por cima da tela, para as perguntas curtas do painel (o rastreio, o
// recado da foto, a confirmação de cancelar). É a janela do próprio navegador: fecha
// com Esc e devolve o foco para onde estava.
export function Dialogo({
  titulo,
  aoFechar,
  children,
}: {
  titulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
}) {
  const janela = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const elemento = janela.current;
    if (elemento && !elemento.open) elemento.showModal();
  }, []);
  return (
    <dialog
      ref={janela}
      onClose={aoFechar}
      onClick={(evento) => {
        if (evento.target === janela.current) janela.current?.close();
      }}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-xl border border-verde bg-creme p-0 text-verde backdrop:bg-verde/70"
    >
      <div className="p-6">
        <h2 className="text-lg leading-snug font-semibold">{titulo}</h2>
        {children}
      </div>
    </dialog>
  );
}
