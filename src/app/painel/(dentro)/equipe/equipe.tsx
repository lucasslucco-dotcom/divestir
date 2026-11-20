'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import type { Papel } from '@/lib/painel/tipos';
import { IconeAlerta, IconeCarregando } from '../../../montar/icones';
import { adicionarPessoa, mudarPapel, novaSenhaProvisoria, removerPessoa, type RetornoDaEquipe } from '../../acoes';
import { botao, caixa, etiqueta, link, rotulo, seletorCurto } from '../../estilo';
import { Dialogo } from '../dialogo';

export type Pessoa = { id: string; nome: string; email: string; papel: Papel };

const PAPEL: Record<Papel, string> = { admin: 'Administrador', operacao: 'Operação' };

// A senha provisória aparece uma vez só, para o administrador passar à pessoa.
function SenhaProvisoria({ email, senha, aoFechar }: { email: string; senha: string; aoFechar: () => void }) {
  return (
    <Dialogo titulo="Acesso pronto. Passe estes dados para a pessoa:" aoFechar={aoFechar}>
      <dl className="mt-5 grid gap-4">
        <div>
          <dt className="text-[0.8125rem] leading-snug">Endereço do painel</dt>
          <dd className="font-semibold [overflow-wrap:anywhere]">
            {typeof window === 'undefined' ? '' : `${window.location.origin}/painel`}
          </dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] leading-snug">E-mail</dt>
          <dd className="font-semibold [overflow-wrap:anywhere]">{email}</dd>
        </div>
        <div>
          <dt className="text-[0.8125rem] leading-snug">Senha provisória</dt>
          <dd className="font-mono text-xl font-semibold tracking-wide select-all">{senha}</dd>
        </div>
      </dl>
      <p className="mt-5 leading-relaxed">
        Esta senha não aparece de novo. No primeiro acesso, a pessoa troca por uma dela, tocando no próprio nome, no
        alto do painel.
      </p>
      <button type="button" onClick={aoFechar} className={`${botao} mt-6 bg-verde text-creme hover:bg-verde-claro`}>
        Anotei
      </button>
    </Dialogo>
  );
}

export function Equipe({ pessoas, eu }: { pessoas: Pessoa[]; eu: string }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [acesso, setAcesso] = useState<{ email: string; senha: string } | null>(null);
  const [remover, setRemover] = useState<Pessoa | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, comecar] = useTransition();

  // Pessoa criada: mostra a senha provisória e limpa o formulário.
  async function criar(dados: FormData) {
    setErro(null);
    setEnviando(true);
    const retorno = await adicionarPessoa(null, dados);
    setEnviando(false);
    if (retorno && 'erro' in retorno) return setErro(retorno.erro);
    if (retorno && 'ok' in retorno) {
      setAcesso({ email: retorno.email, senha: retorno.senha });
      formulario.current?.reset();
      router.refresh();
    }
  }

  function fazer(acao: () => Promise<RetornoDaEquipe | { erro: string } | { ok: true } | null>) {
    setAviso(null);
    comecar(async () => {
      const resposta = await acao();
      if (resposta && 'erro' in resposta) setAviso(resposta.erro);
      else if (resposta && 'senha' in resposta) setAcesso({ email: resposta.email, senha: resposta.senha });
      router.refresh();
    });
  }

  return (
    <>
      {aviso ? (
        <p role="alert" className="mt-8 flex items-start gap-2 leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
          {aviso}
        </p>
      ) : null}

      <ul className="mt-8 max-w-3xl border-t border-verde">
        {pessoas.map((pessoa) => (
          <li
            key={pessoa.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-verde py-4"
            aria-busy={ocupado || undefined}
          >
            <div className="min-w-0 flex-1 basis-56">
              <p className="leading-snug font-semibold">
                {pessoa.nome}
                {pessoa.id === eu ? <span className="font-normal"> (você)</span> : null}
              </p>
              <p className="text-[0.9375rem] leading-snug [overflow-wrap:anywhere]">{pessoa.email}</p>
            </div>
            {pessoa.id === eu ? (
              <span className={etiqueta}>{PAPEL[pessoa.papel]}</span>
            ) : (
              <>
                <label className="sr-only" htmlFor={`papel-${pessoa.id}`}>
                  Papel de {pessoa.nome}
                </label>
                <select
                  id={`papel-${pessoa.id}`}
                  value={pessoa.papel}
                  disabled={ocupado}
                  onChange={(evento) => fazer(() => mudarPapel(pessoa.id, evento.target.value))}
                  className={seletorCurto}
                >
                  <option value="operacao">Operação</option>
                  <option value="admin">Administrador</option>
                </select>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => fazer(() => novaSenhaProvisoria(pessoa.id))}
                  className={link}
                >
                  Nova senha
                </button>
                <button type="button" disabled={ocupado} onClick={() => setRemover(pessoa)} className={link}>
                  Remover
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <section aria-labelledby="nova-pessoa" className="mt-12 max-w-3xl">
        <h2 id="nova-pessoa" className="font-titulo text-3xl leading-none uppercase">
          Adicionar alguém
        </h2>
        <form ref={formulario} action={criar} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="nome" className={rotulo}>
              Nome
            </label>
            <input id="nome" name="nome" autoComplete="off" required className={`mt-2 ${caixa}`} />
          </div>
          <div>
            <label htmlFor="email-novo" className={rotulo}>
              E-mail
            </label>
            <input
              id="email-novo"
              name="email"
              type="email"
              autoComplete="off"
              inputMode="email"
              required
              className={`mt-2 ${caixa}`}
            />
          </div>
          <div>
            <label htmlFor="papel-novo" className={rotulo}>
              Papel
            </label>
            <select
              id="papel-novo"
              name="papel"
              defaultValue="operacao"
              className={`mt-2 ${caixa} appearance-auto pr-2`}
            >
              <option value="operacao">Operação</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {erro ? (
            <p role="alert" className="flex items-start gap-2 leading-snug font-semibold sm:col-span-3">
              <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
              {erro}
            </p>
          ) : null}
          <div className="sm:col-span-3">
            <button type="submit" disabled={enviando} className="ingresso mt-2 w-full sm:w-auto">
              <span className="flex items-center gap-2">
                {enviando ? <IconeCarregando /> : null}
                {enviando ? 'Criando o acesso…' : 'Criar o acesso'}
              </span>
            </button>
            <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-snug">
              O painel cria uma senha provisória e mostra para você passar à pessoa. Ela troca no primeiro acesso.
            </p>
          </div>
        </form>
      </section>

      {acesso ? <SenhaProvisoria {...acesso} aoFechar={() => setAcesso(null)} /> : null}
      {remover ? (
        <Dialogo titulo={`Remover ${remover.nome} da equipe?`} aoFechar={() => setRemover(null)}>
          <p className="mt-3 leading-relaxed">
            O acesso de {remover.email} deixa de existir na hora. O que a pessoa já fez nos pedidos continua no
            histórico, sem o nome dela.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                const pessoa = remover;
                setRemover(null);
                fazer(() => removerPessoa(pessoa.id));
              }}
              className={`${botao} bg-verde text-creme hover:bg-verde-claro`}
            >
              Remover o acesso
            </button>
            <button type="button" onClick={() => setRemover(null)} className={botao}>
              Agora não
            </button>
          </div>
        </Dialogo>
      ) : null}
    </>
  );
}
