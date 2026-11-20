'use client';

import { useActionState } from 'react';
import { IconeAlerta, IconeCarregando, IconeSim } from '../../../montar/icones';
import { trocarSenha, type Retorno } from '../../acoes';
import { caixa, rotulo } from '../../estilo';

export function NovaSenha() {
  const [retorno, enviar, enviando] = useActionState<Retorno, FormData>(trocarSenha, null);
  const erro = retorno && 'erro' in retorno ? retorno.erro : null;
  const trocada = !!retorno && 'ok' in retorno;
  return (
    <form action={enviar} className="mt-8 grid max-w-sm gap-5">
      <div>
        <label htmlFor="nova" className={rotulo}>
          Senha nova
        </label>
        <input
          id="nova"
          name="nova"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={`mt-2 ${caixa}`}
        />
      </div>
      <div>
        <label htmlFor="repetida" className={rotulo}>
          De novo, para conferir
        </label>
        <input
          id="repetida"
          name="repetida"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={`mt-2 ${caixa}`}
        />
      </div>
      {erro ? (
        <p role="alert" className="flex items-start gap-2 leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
          {erro}
        </p>
      ) : null}
      {trocada ? (
        <p role="status" className="flex items-start gap-2 leading-snug font-semibold">
          <IconeSim tamanho={18} className="mt-0.5 shrink-0" />
          Senha trocada. Da próxima vez, entre com a nova.
        </p>
      ) : null}
      <div className="mt-2">
        <button type="submit" disabled={enviando} className="ingresso w-full sm:w-auto">
          <span className="flex items-center gap-2">
            {enviando ? <IconeCarregando /> : null}
            {enviando ? 'Trocando…' : 'Trocar a senha'}
          </span>
        </button>
      </div>
    </form>
  );
}
