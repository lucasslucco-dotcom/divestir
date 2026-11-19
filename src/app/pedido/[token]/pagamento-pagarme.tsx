'use client';

import { useId, useState, type FormEvent } from 'react';
import { MINUTOS_DO_PIX, parcelasPossiveis, reais } from '@/lib/loja';
import { IconeAlerta, IconeCarregando } from '../../montar/icones';
import type { Envio } from './pagamento-mp';

// O formulário de pagamento da loja, para o Pagar.me (desde 19/11/2026): Pix ou cartão
// de crédito. Os dados do cartão vão direto do navegador para o Pagar.me, que devolve
// um código de uso único (token); o site só recebe esse código, nunca o número.

const TOKENS = 'https://api.pagar.me/core/v5/tokens';

const caixa =
  'block h-12 w-full rounded-md border border-verde bg-creme px-4 text-base outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-verde aria-[invalid=true]:ring-inset';

const soDigitos = (texto: string) => texto.replace(/\D/g, '');

// 0000 0000 0000 0000 (até 19 dígitos, que é o maior cartão que existe).
const mascaraDoNumero = (texto: string) =>
  soDigitos(texto)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const mascaraDaValidade = (texto: string) => {
  const d = soDigitos(texto).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

// A conta que todo número de cartão fecha (Luhn): pega erro de digitação.
function numeroValido(numero: string) {
  if (numero.length < 13) return false;
  let soma = 0;
  for (let i = 0; i < numero.length; i++) {
    let d = Number(numero[numero.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    soma += d;
  }
  return soma % 10 === 0;
}

function lerValidade(texto: string) {
  const d = soDigitos(texto);
  if (d.length !== 4) return null;
  const mes = Number(d.slice(0, 2));
  const ano = Number(d.slice(2));
  if (mes < 1 || mes > 12) return null;
  const hoje = new Date();
  const vencido = 2000 + ano < hoje.getFullYear() || (2000 + ano === hoje.getFullYear() && mes < hoje.getMonth() + 1);
  return vencido ? null : { mes, ano };
}

type Erros = { numero?: string; nome?: string; validade?: string; codigo?: string };

function Campo({
  rotulo,
  erro,
  className = '',
  ...resto
}: { rotulo: string; erro?: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-base leading-snug font-semibold">
        {rotulo}
      </label>
      <input
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`mt-2 ${caixa}`}
        {...resto}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 flex items-start gap-1.5 text-[0.9375rem] leading-snug font-semibold">
          <IconeAlerta className="mt-0.5 shrink-0" />
          {erro}
        </p>
      ) : null}
    </div>
  );
}

export function PagamentoPagarme({
  chavePublica,
  total,
  aoPagar,
}: {
  chavePublica: string;
  total: number;
  // Devolve quando o site terminou de tratar o pagamento (o formulário espera).
  aoPagar: (envio: Envio) => Promise<void>;
}) {
  const [metodo, setMetodo] = useState<'pix' | 'cartao'>('pix');
  const [numero, setNumero] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [codigo, setCodigo] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [erros, setErros] = useState<Erros>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const idDasParcelas = useId();
  const maximo = parcelasPossiveis(total);

  async function pagarComPix() {
    if (enviando) return;
    setEnviando(true);
    setAviso(null);
    await aoPagar({ metodo: 'pix', formulario: { metodo: 'pix' } });
    setEnviando(false);
  }

  async function pagarComCartao(evento: FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    const digitos = soDigitos(numero);
    const quando = lerValidade(validade);
    const achados: Erros = {};
    if (!numeroValido(digitos)) achados.numero = 'Confere o número do cartão.';
    if (nome.trim().length < 3) achados.nome = 'Escreve o nome como está no cartão.';
    if (!quando) achados.validade = 'Confere a validade (mês e ano).';
    if (!/^\d{3,4}$/.test(codigo)) achados.codigo = 'São os 3 ou 4 números de segurança.';
    setErros(achados);
    if (Object.keys(achados).length || !quando) return;

    setEnviando(true);
    setAviso(null);
    let token: string | null = null;
    try {
      const resposta = await fetch(`${TOKENS}?appId=${encodeURIComponent(chavePublica)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'card',
          card: {
            number: digitos,
            holder_name: nome.trim(),
            exp_month: quando.mes,
            exp_year: quando.ano,
            cvv: codigo,
          },
        }),
      });
      const dados = (await resposta.json().catch(() => null)) as { id?: unknown } | null;
      if (resposta.ok && typeof dados?.id === 'string') token = dados.id;
      else if (resposta.status === 401 || resposta.status === 403) {
        console.error('pagarme: o site não tem permissão para registrar o cartão (domínio ou chave pública)');
        setAviso('O pagamento com cartão ainda não está liberado na loja. Dá para pagar com Pix.');
      } else setAviso('O cartão não foi aceito. Confere os dados e tenta de novo?');
    } catch {
      setAviso('A internet caiu no meio do caminho. Tenta de novo?');
    }
    if (token) await aoPagar({ metodo: 'cartao', formulario: { metodo: 'cartao', token, parcelas } });
    setEnviando(false);
  }

  const opcao =
    'block cursor-pointer rounded-full border border-verde px-4 py-3 text-sm leading-none font-semibold transition-colors duration-200 ease-saida peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde';

  return (
    <div>
      <fieldset disabled={enviando} className="min-w-0">
        <legend className="text-base leading-snug font-semibold">Como você quer pagar?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ['pix', 'Pix'],
              ['cartao', 'Cartão de crédito'],
            ] as const
          ).map(([valor, rotulo]) => (
            <label key={valor}>
              <input
                type="radio"
                name="forma-de-pagar"
                value={valor}
                checked={metodo === valor}
                onChange={() => {
                  setMetodo(valor);
                  setAviso(null);
                }}
                className="peer sr-only"
              />
              <span className={opcao}>{rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {aviso ? (
        <p role="alert" className="mt-5 flex items-start gap-2 text-base leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
          {aviso}
        </p>
      ) : null}

      {metodo === 'pix' ? (
        <div className="mt-6">
          <p className="max-w-[40ch] leading-relaxed">
            A gente gera um código Pix de {reais.format(total)}, que vale por {MINUTOS_DO_PIX} minutos. Assim que o
            pagamento cair, esta página muda sozinha.
          </p>
          <button
            type="button"
            onClick={() => void pagarComPix()}
            disabled={enviando}
            className="ingresso mt-6 w-full sm:w-auto"
          >
            <span className="flex items-center gap-2">
              {enviando ? <IconeCarregando /> : null}
              {enviando ? 'Gerando o Pix…' : 'Gerar o código Pix'}
            </span>
          </button>
        </div>
      ) : (
        <form onSubmit={(evento) => void pagarComCartao(evento)} noValidate className="mt-6 grid gap-5">
          <Campo
            rotulo="Número do cartão"
            value={numero}
            onChange={(evento) => setNumero(mascaraDoNumero(evento.target.value))}
            erro={erros.numero}
            inputMode="numeric"
            autoComplete="cc-number"
            disabled={enviando}
          />
          <Campo
            rotulo="Nome impresso no cartão"
            value={nome}
            onChange={(evento) => setNome(evento.target.value.slice(0, 64))}
            erro={erros.nome}
            autoComplete="cc-name"
            autoCapitalize="characters"
            disabled={enviando}
          />
          <div className="grid grid-cols-2 gap-4">
            <Campo
              rotulo="Validade"
              value={validade}
              onChange={(evento) => setValidade(mascaraDaValidade(evento.target.value))}
              erro={erros.validade}
              placeholder="MM/AA"
              inputMode="numeric"
              autoComplete="cc-exp"
              disabled={enviando}
            />
            <Campo
              rotulo="Código de segurança"
              value={codigo}
              onChange={(evento) => setCodigo(soDigitos(evento.target.value).slice(0, 4))}
              erro={erros.codigo}
              inputMode="numeric"
              autoComplete="cc-csc"
              disabled={enviando}
            />
          </div>
          <div>
            <label htmlFor={idDasParcelas} className="block text-base leading-snug font-semibold">
              Parcelas
            </label>
            <select
              id={idDasParcelas}
              value={parcelas}
              onChange={(evento) => setParcelas(Number(evento.target.value))}
              disabled={enviando}
              className={`mt-2 ${caixa}`}
            >
              {Array.from({ length: maximo }, (_, i) => i + 1).map((vezes) => (
                <option key={vezes} value={vezes}>
                  {vezes === 1
                    ? `1× de ${reais.format(total)}`
                    : `${vezes}× de ${reais.format(total / vezes)} sem juros`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button type="submit" disabled={enviando} className="ingresso w-full sm:w-auto">
              <span className="flex items-center gap-2">
                {enviando ? <IconeCarregando /> : null}
                {enviando ? 'Pagando…' : `Pagar ${reais.format(total)}`}
              </span>
            </button>
            <p className="mt-4 max-w-[44ch] text-[0.9375rem] leading-snug">
              Os dados do cartão vão direto para o Pagar.me, que processa o pagamento. A Divestir não vê nem guarda o
              número do seu cartão.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
