import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import type { EnderecoDoCheckout } from './checkout';
import { MINUTOS_DO_PIX } from './loja';
import { soDigitos } from './validar';

// Pagamento pelo Pagar.me (decisão do Lucas, 19/11/2026, no lugar do Mercado Pago, que
// estava com a conta em análise): Pix e cartão de crédito, com o formulário da própria
// loja. Os dados do cartão vão direto do navegador para o Pagar.me, que devolve um
// código de uso único (token); o servidor do site só cria o pedido de pagamento com
// esse código.
//
// No Pagar.me, cada pagamento é um "pedido" (order, código "or_...") com uma cobrança
// (charge) dentro. O site guarda o código do pedido do Pagar.me como o do pagamento.
//
// Variáveis de ambiente (na Vercel):
//   PAGARME_PUBLIC_KEY    chave pública (vai para o navegador, não é segredo)
//   PAGARME_SECRET_KEY    chave secreta, só no servidor
//   PAGARME_AVISO_SENHA   senha dos avisos (webhooks), só no servidor
//   PAGARME_AVISO_USUARIO usuário dos avisos (opcional; sem ele, vale "divestir")
//   PAGAMENTO_MODO        "producao" = vendas de verdade; vazio = modo de teste

export function chavePublicaDoPagarme() {
  return process.env.PAGARME_PUBLIC_KEY || null;
}

export function pagarmeLigado() {
  return !!process.env.PAGARME_SECRET_KEY && !!chavePublicaDoPagarme();
}

// Um pagamento do Pagar.me se reconhece pelo código: "or_..." (os do Mercado Pago são números).
export const ehDoPagarme = (id: string) => id.startsWith('or_');

// Só o teste local troca o endereço da API (por um Pagar.me de mentira).
const API = () => process.env.PAGARME_API_URL ?? 'https://api.pagar.me/core/v5';

type TransacaoPM = {
  status?: string;
  qr_code?: string;
  qr_code_url?: string;
  expires_at?: string;
  installments?: number;
  acquirer_return_code?: string;
  acquirer_message?: string;
  success?: boolean;
  gateway_response?: { code?: string; errors?: { message?: string }[] };
  antifraud_response?: { status?: string };
};

type CobrancaPM = {
  id: string;
  status: string;
  amount?: number;
  payment_method?: string;
  last_transaction?: TransacaoPM;
};

export type PedidoPM = {
  id: string;
  code?: string;
  status: string;
  amount?: number;
  charges?: CobrancaPM[];
};

export class ErroDoPagarme extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
  }
}

async function chamar(caminho: string, init: RequestInit & { idempotencia?: string } = {}) {
  const chave = process.env.PAGARME_SECRET_KEY;
  if (!chave) throw new ErroDoPagarme('O Pagar.me ainda não está ligado.', 503);
  const { idempotencia, ...resto } = init;
  let resposta: Response;
  try {
    resposta = await fetch(`${API()}${caminho}`, {
      ...resto,
      headers: {
        // A chave secreta entra como usuário, com a senha vazia.
        Authorization: `Basic ${Buffer.from(`${chave}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(idempotencia ? { 'Idempotency-Key': idempotencia } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (motivo) {
    console.error(`pagarme: sem resposta em ${caminho}`, motivo);
    throw new ErroDoPagarme('O Pagar.me não respondeu.', 504);
  }
  const dados: unknown = await resposta.json().catch(() => null);
  return { resposta, dados };
}

const ehPedido = (dados: unknown): dados is PedidoPM =>
  !!dados && typeof dados === 'object' && typeof (dados as PedidoPM).id === 'string' && 'status' in dados;

export type PedidoDaLoja = {
  numero: number;
  nome: string;
  email: string;
  cpf: string | null;
  whatsapp: string;
  total: number | string;
  endereco: Partial<Record<keyof EnderecoDoCheckout, string>> | null;
};

export type FormaDePagar = { metodo: 'pix' } | { metodo: 'cartao'; token: string; parcelas: number };

// O pedido de pagamento, com o total do pedido da loja (em centavos) e os dados de quem
// compra: o Pagar.me pede nome, e-mail, CPF e telefone, e o endereço ajuda a aprovar o cartão.
export function montarPedido(pedido: PedidoDaLoja, forma: FormaDePagar) {
  const centavos = Math.round(Number(pedido.total) * 100);
  const whatsapp = soDigitos(pedido.whatsapp);
  const e = pedido.endereco ?? {};
  const endereco = {
    line_1: [e.numero, e.rua, e.bairro].filter(Boolean).join(', '),
    ...(e.complemento ? { line_2: e.complemento } : {}),
    zip_code: soDigitos(e.cep ?? ''),
    city: e.cidade ?? '',
    state: e.uf ?? '',
    country: 'BR',
  };
  return {
    code: String(pedido.numero),
    closed: true,
    items: [
      {
        amount: centavos,
        description: `Divestir · pedido ${pedido.numero}`,
        quantity: 1,
        code: `pedido-${pedido.numero}`,
      },
    ],
    customer: {
      name: pedido.nome,
      email: pedido.email,
      type: 'individual',
      document: soDigitos(pedido.cpf ?? ''),
      document_type: 'CPF',
      phones: { mobile_phone: { country_code: '55', area_code: whatsapp.slice(0, 2), number: whatsapp.slice(2) } },
      address: endereco,
    },
    metadata: { pedido: String(pedido.numero) },
    payments: [
      forma.metodo === 'pix'
        ? { payment_method: 'pix', pix: { expires_in: MINUTOS_DO_PIX * 60 } }
        : {
            payment_method: 'credit_card',
            credit_card: {
              installments: forma.parcelas,
              statement_descriptor: 'DIVESTIR',
              operation_type: 'auth_and_capture',
              card_token: forma.token,
              // O endereço de cobrança não vem junto com o código do cartão: vai o da entrega.
              card: { billing_address: endereco },
            },
          },
    ],
  };
}

// Anota nos registros como ficou um pagamento com cartão: a situação e, se não passou,
// o motivo que o Pagar.me deu (o código do banco, a mensagem e os erros do pedido). Só
// códigos e mensagens do Pagar.me: nenhum dado de quem compra nem do cartão.
function anotarCartao(p: PedidoPM, quando: string) {
  const cobranca = p.charges?.[0];
  if (cobranca?.payment_method !== 'credit_card') return;
  const t = cobranca.last_transaction;
  const linha = {
    pedido: p.code,
    cobranca: cobranca.status,
    transacao: t?.status,
    codigo_do_banco: t?.acquirer_return_code,
    mensagem_do_banco: t?.acquirer_message?.slice(0, 120),
    codigo_do_pagarme: t?.gateway_response?.code,
    erros: t?.gateway_response?.errors?.map((e) => String(e.message).slice(0, 160)).slice(0, 5),
    antifraude: t?.antifraud_response?.status,
  };
  const passou = cobranca.status === 'paid' || cobranca.status === 'overpaid';
  (passou ? console.log : console.warn)(`pagarme: cartão ${quando}`, JSON.stringify(linha));
}

export async function criarPedido(corpo: unknown, idempotencia: string): Promise<PedidoPM> {
  const { resposta, dados } = await chamar('/orders', { method: 'POST', body: JSON.stringify(corpo), idempotencia });
  if (!resposta.ok || !ehPedido(dados)) {
    console.error(`pagarme: pedido não criado (${resposta.status})`, JSON.stringify(dados).slice(0, 600));
    throw new ErroDoPagarme('O Pagar.me não aceitou o pagamento.', resposta.status >= 500 ? 502 : 400);
  }
  anotarCartao(dados, 'na criação');
  return dados;
}

// Devolve null quando o pedido não existe (um aviso de teste, por exemplo).
export async function buscarPedido(id: string): Promise<PedidoPM | null> {
  const { resposta, dados } = await chamar(`/orders/${encodeURIComponent(id)}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok || !ehPedido(dados)) throw new ErroDoPagarme(`O Pagar.me respondeu ${resposta.status}.`, 502);
  if (dados.charges?.[0]?.status === 'failed') anotarCartao(dados, 'na consulta');
  return dados;
}

// Cancela a cobrança de um pedido: um Pix que ainda não foi pago sai de cena, e um
// pagamento já feito volta inteiro para quem pagou (estorno).
export async function cancelarCobranca(id: string) {
  try {
    const pedido = await buscarPedido(id);
    const cobranca = pedido?.charges?.[0];
    if (!cobranca) return false;
    const { resposta } = await chamar(`/charges/${encodeURIComponent(cobranca.id)}`, {
      method: 'DELETE',
      idempotencia: `cancelar-${cobranca.id}`,
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

const metodoDe = (c: CobrancaPM | undefined) =>
  c?.payment_method === 'pix' ? 'pix' : c?.payment_method === 'credit_card' ? 'cartao' : null;

// A situação nas mesmas palavras que o site já usa (as do Mercado Pago): approved,
// pending (Pix aguardando), in_process (cartão em análise), rejected, cancelled, refunded.
export function situacaoDoPedido(p: PedidoPM) {
  const cobranca = p.charges?.[0];
  const metodo = metodoDe(cobranca);
  const s = cobranca?.status ?? p.status;
  const transacao = cobranca?.last_transaction?.status;
  let situacao = s;
  if (s === 'paid' || s === 'overpaid') situacao = 'approved';
  else if (s === 'processing') situacao = 'in_process';
  else if (s === 'pending' || s === 'underpaid') situacao = metodo === 'cartao' ? 'in_process' : 'pending';
  else if (s === 'failed') situacao = 'rejected';
  else if (s === 'canceled') situacao = transacao === 'refunded' ? 'refunded' : 'cancelled';
  else if (s === 'chargedback') situacao = 'charged_back';
  return {
    id: p.id,
    situacao,
    valor: (cobranca?.amount ?? p.amount ?? 0) / 100,
    metodo,
    parcelas: metodo === 'cartao' ? (cobranca?.last_transaction?.installments ?? null) : null,
  } as const;
}

// Por que o cartão foi recusado: o código do banco, traduzido para os motivos que a
// página do pedido já sabe explicar.
const RECUSAS_DO_BANCO: Record<string, string> = {
  '51': 'cc_rejected_insufficient_amount',
  '54': 'cc_rejected_bad_filled_date',
  '14': 'cc_rejected_bad_filled_card_number',
  '55': 'cc_rejected_bad_filled_security_code',
  '82': 'cc_rejected_bad_filled_security_code',
  N7: 'cc_rejected_bad_filled_security_code',
  '01': 'cc_rejected_call_for_authorize',
  '02': 'cc_rejected_call_for_authorize',
  '41': 'cc_rejected_card_disabled',
  '43': 'cc_rejected_card_disabled',
  '62': 'cc_rejected_card_disabled',
  '78': 'cc_rejected_card_disabled',
  '38': 'cc_rejected_max_attempts',
  '75': 'cc_rejected_max_attempts',
  '59': 'cc_rejected_high_risk',
  '63': 'cc_rejected_high_risk',
};

export function detalheDaRecusa(p: PedidoPM) {
  const transacao = p.charges?.[0]?.last_transaction;
  if (transacao?.antifraud_response?.status === 'reproved') return 'cc_rejected_high_risk';
  return (transacao?.acquirer_return_code && RECUSAS_DO_BANCO[transacao.acquirer_return_code]) || null;
}

// O código do Pix (copia e cola), a imagem do QR e até quando ele vale.
export function dadosDoPix(p: PedidoPM) {
  const cobranca = p.charges?.[0];
  const transacao = cobranca?.last_transaction;
  if (cobranca?.payment_method !== 'pix' || !transacao?.qr_code) return null;
  return {
    codigo: transacao.qr_code,
    imagem: transacao.qr_code_url?.startsWith('https://') ? transacao.qr_code_url : null,
    venceEm: transacao.expires_at ?? null,
  };
}

const iguais = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

// O aviso (webhook) do Pagar.me não vem assinado como o do Mercado Pago: ele chega com
// usuário e senha, que a gente cadastra no painel do Pagar.me junto com o endereço. Sem
// a senha certa, o aviso é recusado. E, mesmo com ela, o conteúdo do aviso só serve
// para saber de qual pagamento se trata: a situação é sempre perguntada ao próprio
// Pagar.me, com a chave secreta.
export function avisoAutorizado(autorizacao: string | null) {
  const senha = process.env.PAGARME_AVISO_SENHA;
  if (!senha || !autorizacao?.startsWith('Basic ')) return false;
  let texto: string;
  try {
    texto = Buffer.from(autorizacao.slice(6), 'base64').toString('utf8');
  } catch {
    return false;
  }
  const corte = texto.indexOf(':');
  if (corte < 0) return false;
  const usuario = process.env.PAGARME_AVISO_USUARIO || 'divestir';
  return iguais(texto.slice(0, corte), usuario) && iguais(texto.slice(corte + 1), senha);
}
