'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Catalogo } from '@/lib/catalogo';
import type { SituacaoDoPedido } from '@/lib/checkout';
import { codigoNovo } from '@/lib/foto/guardar';
import { MINUTOS_DO_PIX, PRAZO_DE_PERSONALIZACAO, reais } from '@/lib/loja';
import { lerPedidoGuardado, prepararNovaMontagem, tirarDoCarrinho } from '@/lib/montagem/guardar';
import type { PedidoGuardado } from '@/lib/montagem/tipos';
import type { Design } from '@/lib/molde/tipos';
import { AvisoDeTeste, linhasDoCarrinho, MiniaturaDaPeca, useRecortes } from '../../carrinho/carrinho';
import { IconeAlerta, IconeCarregando, IconeCopiar, IconeSim } from '../../montar/icones';
import { linkDeTexto } from '../../montar/passo-foto';
import { PagamentoMercadoPago, type Envio } from './pagamento-mp';

// A página do pedido, pelo link com o código do pedido (sem login): o pagamento
// (Pix ou cartão, pelo Mercado Pago), o Pix aguardando, o pagamento em análise e,
// depois de pago, a confirmação com a prévia das peças e o número do pedido
// (briefing, "Depois do pagamento").

type Situacao = SituacaoDoPedido;
type Leve = { status: string; pago: boolean; pagamento: Situacao['pagamento'] };

// Por que o cartão foi recusado, nas palavras do cliente (status_detail do Mercado Pago).
const RECUSAS: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'Confere o número do cartão.',
  cc_rejected_bad_filled_date: 'Confere a validade do cartão.',
  cc_rejected_bad_filled_security_code: 'Confere o código de segurança do cartão.',
  cc_rejected_bad_filled_other: 'Confere os dados do cartão.',
  cc_rejected_insufficient_amount: 'O cartão não tem limite para esse valor. Tenta outro cartão ou o Pix?',
  cc_rejected_call_for_authorize: 'O banco pediu para você autorizar esse pagamento. Fala com o banco e tenta de novo.',
  cc_rejected_card_disabled: 'Esse cartão está bloqueado. Fala com o banco ou usa outro cartão.',
  cc_rejected_duplicated_payment: 'Parece que esse pagamento já foi feito. Confere o extrato antes de tentar de novo.',
  cc_rejected_high_risk: 'O pagamento foi recusado por segurança. Tenta outro cartão ou o Pix?',
  cc_rejected_max_attempts: 'Foram muitas tentativas com esse cartão. Tenta outro cartão ou o Pix?',
};

function motivoDaRecusa(detalhe: string | null) {
  return (detalhe && RECUSAS[detalhe]) ?? 'O pagamento não foi aprovado. Tenta outro cartão ou o Pix?';
}

// A hora de agora, de meio em meio minuto (para saber se o Pix venceu).
const MEIO_MINUTO = 30_000;
function useAgora() {
  return useSyncExternalStore(
    (aoMudar) => {
      const relogio = setInterval(aoMudar, MEIO_MINUTO);
      return () => clearInterval(relogio);
    },
    () => Math.floor(Date.now() / MEIO_MINUTO) * MEIO_MINUTO,
    () => 0,
  );
}

const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

async function buscar(
  token: string,
  pergunta: string,
): Promise<{ ok: true; dados: Situacao & Leve } | { ok: false; status: number; erro: string }> {
  try {
    const resposta = await fetch(`/api/pedidos/${token}${pergunta}`, { cache: 'no-store' });
    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok)
      return { ok: false, status: resposta.status, erro: dados.erro ?? 'Não consegui abrir o pedido agora.' };
    return { ok: true, dados };
  } catch {
    return { ok: false, status: 0, erro: 'A internet caiu no meio do caminho. Tenta de novo?' };
  }
}

function AjudaDoTeste() {
  return (
    <div className="mt-6 rounded-md border border-dashed border-verde px-4 py-3 text-[0.9375rem] leading-snug">
      <p className="font-semibold">Pagamento em modo de teste: nada é cobrado.</p>
      <p className="mt-1">
        Para ver o pedido pago, use um cartão de teste do Mercado Pago: Mastercard 5031 4332 1540 6351, validade 11/30,
        código 123, nome <strong>APRO</strong> e CPF 123.456.789-09. O Pix de teste gera o código, mas não dá para
        pagar.
      </p>
    </div>
  );
}

// O e-mail digitado no checkout (só nesta aba), para o Mercado Pago não pedir de novo.
function emailDoCheckout() {
  try {
    const rascunho = JSON.parse(sessionStorage.getItem('divestir:checkout') ?? 'null') as { email?: unknown } | null;
    return typeof rascunho?.email === 'string' && rascunho.email.includes('@') ? rascunho.email : null;
  } catch {
    return null;
  }
}

export function Pedido({
  token,
  catalogo,
  designs,
  chavePublica,
}: {
  token: string;
  catalogo: Catalogo;
  designs: Design[];
  chavePublica: string | null;
}) {
  const [situacao, setSituacao] = useState<Situacao | null>(null);
  const [erro, setErro] = useState<{ status: number; erro: string } | null>(null);
  const [guardado, setGuardado] = useState<PedidoGuardado | null>(null);
  const [trocar, setTrocar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [rodada, setRodada] = useState(0);
  const [copiado, setCopiado] = useState<'pix' | 'link' | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const agora = useAgora();
  const atual = useRef<Situacao | null>(null);
  const recortes = useRecortes(guardado?.itens.map((i) => i.foto.chave) ?? []);

  const carregar = useCallback(
    async (pergunta = '?pix=1') => {
      const resposta = await buscar(token, pergunta);
      if (!resposta.ok) {
        if (!atual.current) setErro(resposta);
        return;
      }
      atual.current = resposta.dados;
      setSituacao(resposta.dados);
      setErro(null);
    },
    [token],
  );

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- o pedido guardado mora no navegador */
    setGuardado(lerPedidoGuardado(token));
    setEmail(emailDoCheckout());
    /* eslint-enable react-hooks/set-state-in-effect */
    void carregar();
  }, [token, carregar]);

  // Pedido pago: as peças saem do carrinho e o rascunho do checkout é esquecido.
  const pago = !!situacao?.pago;
  useEffect(() => {
    if (!pago) return;
    if (guardado) tirarDoCarrinho(guardado.itens.map((i) => i.id));
    try {
      sessionStorage.removeItem('divestir:checkout');
      sessionStorage.removeItem('divestir:checkout:tentativa');
    } catch {
      // Sem acesso ao armazenamento: nada a esquecer.
    }
  }, [pago, guardado]);

  // Esperando o Pix cair (ou o cartão sair da análise): pergunta de tempos em tempos
  // e, a cada meio minuto, confere também com o Mercado Pago. Ao voltar para a aba
  // (depois de pagar no app do banco), confere na hora.
  const pixAguardando =
    !!situacao && !situacao.pago && situacao.pagamento.metodo === 'pix' && situacao.pagamento.situacao === 'pending';
  // Cartão em análise (ou aguardando, que no cartão é raro): a página espera, sem
  // abrir outro pagamento por cima.
  const emAnalise =
    !!situacao &&
    !situacao.pago &&
    (situacao.pagamento.situacao === 'in_process' ||
      (situacao.pagamento.situacao === 'pending' && situacao.pagamento.metodo === 'cartao'));
  const esperando = pixAguardando || emAnalise;
  useEffect(() => {
    if (!esperando) return;
    let vezes = 0;
    const conferir = async (comMercadoPago: boolean) => {
      const resposta = await buscar(token, comMercadoPago ? '?leve=1&conferir=1' : '?leve=1');
      const antes = atual.current;
      if (!resposta.ok || !antes) return;
      const agora = resposta.dados;
      if (
        agora.pago !== antes.pago ||
        agora.status !== antes.status ||
        agora.pagamento.situacao !== antes.pagamento.situacao
      ) {
        void carregar();
      }
    };
    const relogio = setInterval(() => void conferir(++vezes % 6 === 0), 5000);
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void conferir(true);
    };
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      clearInterval(relogio);
      document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [esperando, token, carregar]);

  const pagar = useCallback(
    async ({ formulario }: Envio) => {
      setAviso(null);
      try {
        const resposta = await fetch(`/api/pedidos/${token}/pagamento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tentativa: codigoNovo(), formulario }),
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) {
          setAviso(dados.erro ?? 'Não consegui criar o pagamento agora. Tenta de novo em instantes?');
          if (resposta.status === 409) await carregar();
          setRodada((r) => r + 1);
          return;
        }
        if (dados.situacao === 'rejected' || dados.situacao === 'cancelled') {
          setAviso(motivoDaRecusa(dados.detalhe ?? null));
          setRodada((r) => r + 1);
          await carregar('');
          return;
        }
        setTrocar(false);
        await carregar();
      } catch {
        setAviso('A internet caiu no meio do caminho. Confere se o pagamento saiu antes de tentar de novo.');
        setRodada((r) => r + 1);
        await carregar();
      }
    },
    [token, carregar],
  );

  async function copiar(texto: string, qual: 'pix' | 'link') {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado((c) => (c === qual ? null : c)), 4000);
    } catch {
      // Sem permissão para copiar: o texto continua na tela para copiar à mão.
    }
  }

  if (erro && !situacao) {
    return (
      <div className="mt-10 max-w-md">
        <p className="flex items-start gap-2 text-lg leading-snug font-semibold">
          <IconeAlerta tamanho={20} className="mt-1 shrink-0" />
          {erro.status === 404 ? 'Não encontrei esse pedido. Confere o link?' : erro.erro}
        </p>
        {erro.status !== 404 ? (
          <button type="button" onClick={() => void carregar()} className={linkDeTexto}>
            Tentar de novo
          </button>
        ) : null}
      </div>
    );
  }

  if (!situacao) {
    return (
      <p role="status" aria-busy="true" className="mt-10 flex items-center gap-2 text-[0.9375rem]">
        <IconeCarregando /> Abrindo o seu pedido…
      </p>
    );
  }

  const linhas = guardado ? linhasDoCarrinho(guardado.itens, catalogo, designs, situacao.teste) : [];
  const frete = situacao.freteServico;
  const prazoTotal = frete
    ? { min: PRAZO_DE_PERSONALIZACAO.min + frete.prazo_min, max: PRAZO_DE_PERSONALIZACAO.max + frete.prazo_max }
    : null;

  // As peças do pedido: com as prévias (quando o pedido foi feito neste aparelho)
  // ou só o texto. "grade": prévias grandes, na confirmação; "lista": ao lado do pagamento.
  const pecas = (forma: 'grade' | 'lista') =>
    linhas.length > 0 ? (
      <ul
        className={
          forma === 'lista' ? 'mt-4 space-y-3' : linhas.length === 1 ? 'mt-6 max-w-80' : 'mt-6 grid grid-cols-2 gap-4'
        }
      >
        {linhas.map((linha) => (
          <li key={linha.item.id} className={forma === 'lista' ? 'flex items-start gap-3' : undefined}>
            <MiniaturaDaPeca
              linha={linha}
              recorte={recortes[linha.item.foto.chave]}
              className={forma === 'grade' ? 'w-full' : 'w-14'}
            />
            <div className="min-w-0">
              <p className={`${forma === 'grade' ? 'mt-2' : ''} text-[0.9375rem] leading-snug font-semibold`}>
                {(linha.item.campos.nome ?? '').toLocaleUpperCase('pt-BR')}
              </p>
              <p className="text-sm leading-5">
                {linha.nome} · {linha.detalhes}
                {linha.item.presente ? ' · presente' : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <ul className="mt-4 space-y-2 text-[0.9375rem] leading-snug">
        {situacao.pecas.map((peca, i) => (
          <li key={i}>
            <span className="font-semibold">{peca.nome}</span> · {peca.peca} {peca.cor.toLocaleLowerCase('pt-BR')} ·{' '}
            {peca.tamanho} · {peca.design}, {peca.lado === 'costas' ? 'nas costas' : 'na frente'}
            {peca.presente ? ' · presente' : ''}
          </li>
        ))}
      </ul>
    );

  const valores = (
    <dl className="mt-6 grid max-w-sm grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.9375rem] leading-snug">
      <dt>Peças{situacao.pecas.some((p) => p.presente) ? ' e presentes' : ''}</dt>
      <dd className="text-right tabular-nums">{reais.format(situacao.subtotal)}</dd>
      <dt>Frete{frete ? ` (${frete.servico})` : ''}</dt>
      <dd className="text-right tabular-nums">{reais.format(situacao.frete)}</dd>
      <div className="col-span-2 mt-2 grid grid-cols-subgrid border-t border-verde pt-3 text-base font-semibold">
        <dt>Total</dt>
        <dd className="text-right tabular-nums">{reais.format(situacao.total)}</dd>
      </div>
    </dl>
  );

  // Pago: a confirmação.
  if (situacao.pago) {
    const link = typeof window === 'undefined' ? '' : window.location.href;
    return (
      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start lg:gap-x-14">
        <div className="lg:col-start-1 lg:row-start-1">
          <p className="font-destaque text-[clamp(1.6rem,6vw,2.4rem)] leading-tight italic">
            Valeu, {situacao.primeiroNome}!
          </p>
          <h2 className="mt-2 font-titulo text-[clamp(2.6rem,10vw,4.75rem)] leading-none uppercase">
            Recebemos seu pedido!
          </h2>
          <p className="mt-4 text-lg leading-snug">Agora é com a gente.</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-base font-semibold text-creme">
            <IconeSim /> Pedido nº {situacao.numero}
          </p>
          {situacao.teste ? <AvisoDeTeste className="mt-6 max-w-xl" /> : null}
        </div>

        <div className="mt-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0">{pecas('grade')}</div>

        <div className="max-w-xl lg:col-start-1 lg:row-start-2">
          <div className="mt-10 border-t border-verde pt-6">
            <h3 className="text-lg leading-snug font-semibold">E agora?</h3>
            <p className="mt-2 leading-relaxed">
              A equipe confere a arte de cada peça e já começa a produção. Sua Divestir fica pronta em{' '}
              {situacao.prazoPersonalizacao ??
                `${PRAZO_DE_PERSONALIZACAO.min} a ${PRAZO_DE_PERSONALIZACAO.max} dias úteis`}
              {prazoTotal ? ` e chega em ${prazoTotal.min} a ${prazoTotal.max} dias úteis, contando a entrega` : ''}.
            </p>
            <p className="mt-2 leading-relaxed">
              As novidades do pedido chegam no e-mail {situacao.emailParcial}
              {situacao.teste ? ' (os e-mails de aviso ainda não estão ligados)' : ''}.
            </p>
            {valores}
          </div>

          <div className="mt-10 border-t border-verde pt-6">
            <p className="leading-relaxed">Guarde este link: é por ele que você acompanha o pedido.</p>
            <div className="flex flex-wrap gap-x-6">
              <button type="button" onClick={() => void copiar(link, 'link')} className={linkDeTexto}>
                {copiado === 'link' ? 'Link copiado!' : 'Copiar o link do pedido'}
              </button>
              <Link href="/montar" onClick={prepararNovaMontagem} className={linkDeTexto}>
                Criar outra Divestir
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (situacao.status === 'cancelado') {
    return (
      <div className="mt-10 max-w-md">
        <p className="text-lg leading-snug font-semibold">Esse pedido foi cancelado.</p>
        <Link href="/carrinho" className="ingresso mt-8">
          Voltar ao carrinho
        </Link>
      </div>
    );
  }

  const cabecalho = (titulo: string) => (
    <>
      <h2 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">{titulo}</h2>
      <p className="mt-3 text-[0.9375rem] leading-snug">
        Pedido nº {situacao.numero} · Total{' '}
        <span className="font-semibold tabular-nums">{reais.format(situacao.total)}</span>
      </p>
    </>
  );

  // Pagamento em análise no Mercado Pago.
  if (emAnalise) {
    return (
      <div className="mt-8 max-w-xl">
        {cabecalho('Pagamento em análise')}
        <p className="mt-6 leading-relaxed">
          O Mercado Pago está conferindo o pagamento do cartão. Costuma levar poucos minutos, e esta página muda sozinha
          quando ele terminar.
        </p>
        <p role="status" className="mt-4 flex items-center gap-2 text-[0.9375rem]">
          <IconeCarregando /> Esperando a resposta do Mercado Pago…
        </p>
      </div>
    );
  }

  // Pix aguardando: o QR e o copia e cola.
  const pix = situacao.pix;
  const pixVencido = !!pix?.venceEm && agora > 0 && Date.parse(pix.venceEm) < agora;
  if (pixAguardando && !trocar) {
    return (
      <div className="mt-8 max-w-xl">
        {cabecalho('Falta só o Pix')}
        {pix && !pixVencido ? (
          <>
            <p className="mt-6 leading-relaxed">
              Abre o app do seu banco e paga com o QR ou com o código abaixo. Assim que o Pix cair, esta página muda
              sozinha.
            </p>
            {pix.imagem ? (
              // eslint-disable-next-line @next/next/no-img-element -- imagem que o Mercado Pago gera na hora
              <img
                src={pix.imagem}
                alt="QR do Pix para pagar o pedido"
                width={224}
                height={224}
                className="mt-6 size-48 rounded-xl sm:size-56"
              />
            ) : null}
            <label htmlFor="codigo-do-pix" className="mt-6 block text-base leading-snug font-semibold">
              Pix copia e cola
            </label>
            <input
              id="codigo-do-pix"
              readOnly
              value={pix.codigo}
              onFocus={(evento) => evento.currentTarget.select()}
              className="mt-2 block h-12 w-full truncate rounded-md border border-verde bg-creme px-4 text-[0.9375rem]"
            />
            <button
              type="button"
              onClick={() => void copiar(pix.codigo, 'pix')}
              className="ingresso mt-4 w-full sm:w-auto"
            >
              <span className="flex items-center gap-2">
                {copiado === 'pix' ? <IconeSim /> : <IconeCopiar />}
                {copiado === 'pix' ? 'Código copiado!' : 'Copiar o código Pix'}
              </span>
            </button>
            {pix.venceEm ? (
              <p className="mt-4 text-[0.9375rem] leading-snug">
                O código vale até {hora(pix.venceEm)} ({MINUTOS_DO_PIX} minutos).
              </p>
            ) : null}
            <p role="status" className="mt-4 flex items-center gap-2 text-[0.9375rem]">
              <IconeCarregando /> Esperando o Pix…
            </p>
          </>
        ) : (
          <p className="mt-6 leading-relaxed">
            {pixVencido
              ? 'Esse código Pix venceu. Gera outro aqui embaixo, ou paga com cartão.'
              : 'Não consegui mostrar o código do Pix agora.'}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setTrocar(true);
            setRodada((r) => r + 1);
          }}
          className={linkDeTexto}
        >
          {pixVencido ? 'Gerar outro Pix ou pagar com cartão' : 'Prefiro pagar com cartão'}
        </button>
        {situacao.teste ? <AjudaDoTeste /> : null}
      </div>
    );
  }

  // Ainda sem pagamento (ou o último não deu certo): o formulário do Mercado Pago.
  const ultima = situacao.pagamento.situacao;
  const naoDeu = !aviso && (ultima === 'rejected' || ultima === 'cancelled' || ultima === 'valor_divergente');
  return (
    <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-14">
      <div className="max-w-xl">
        {cabecalho('Pagamento')}
        {aviso || naoDeu ? (
          <p role="alert" className="mt-6 flex items-start gap-2 text-base leading-snug font-semibold">
            <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
            {aviso ?? 'O último pagamento não foi concluído. Tenta de novo?'}
          </p>
        ) : null}
        <div className="mt-6">
          {chavePublica ? (
            <PagamentoMercadoPago
              key={rodada}
              chavePublica={chavePublica}
              total={situacao.total}
              email={email}
              aoPagar={pagar}
            />
          ) : (
            <p className="text-[0.9375rem] leading-snug font-semibold">
              O pagamento ainda não está ligado na loja. Seu pedido fica guardado aqui.
            </p>
          )}
        </div>
        {situacao.teste ? <AjudaDoTeste /> : null}
      </div>
      <aside aria-label="Resumo do pedido" className="mt-10 border-t border-verde pt-6 lg:mt-0 lg:border-t-0 lg:pt-0">
        <h2 className="text-lg leading-snug font-semibold">Seu pedido</h2>
        {pecas('lista')}
        {valores}
        {prazoTotal ? (
          <p className="mt-4 text-[0.9375rem] leading-snug">
            Chega em {prazoTotal.min} a {prazoTotal.max} dias úteis, contando a produção e a entrega.
          </p>
        ) : null}
      </aside>
    </div>
  );
}
