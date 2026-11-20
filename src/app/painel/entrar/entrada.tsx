'use client';

import { useActionState } from 'react';
import { IconeAlerta, IconeCarregando } from '../../montar/icones';
import { entrar, type Retorno } from '../acoes';
import { caixa, rotulo } from '../estilo';

export function Entrada() {
  const [retorno, enviar, enviando] = useActionState<Retorno, FormData>(entrar, null);
  const erro = retorno && 'erro' in retorno ? retorno.erro : null;
  return (
    <form action={enviar} className="mt-10 grid gap-5">
      <div>
        <label htmlFor="email" className={rotulo}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          defaultValue={retorno && 'erro' in retorno ? (retorno.email ?? '') : ''}
          required
          className={`mt-2 ${caixa}`}
        />
      </div>
      <div>
        <label htmlFor="senha" className={rotulo}>
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className={`mt-2 ${caixa}`}
        />
      </div>
      {erro ? (
        <p role="alert" className="flex items-start gap-2 text-base leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
          {erro}
        </p>
      ) : null}
      <div className="mt-3">
        <button type="submit" disabled={enviando} className="ingresso w-full">
          <span className="flex items-center gap-2">
            {enviando ? <IconeCarregando /> : null}
            {enviando ? 'Entrando…' : 'Entrar'}
          </span>
        </button>
      </div>
      <p className="text-[0.9375rem] leading-snug">Esqueceu a senha? Peça uma nova a quem administra o painel.</p>
    </form>
  );
}
