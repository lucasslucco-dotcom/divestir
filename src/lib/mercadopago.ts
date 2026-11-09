import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';

// Pagamento pelo Mercado Pago (decisão do Lucas, 08/11/2026): Pix e cartão, pelo
// formulário do próprio Mercado Pago dentro da página (Payment Brick). Os dados do
// cartão vão direto do navegador para o Mercado Pago, que devolve um código de uso
// único; o servidor do site só cria o pagamento com esse código.
//
// Variáveis de ambiente (na Vercel):
//   MERCADOPAGO_PUBLIC_KEY    chave pública (vai para o navegador, não é segredo)
//   MERCADOPAGO_ACCESS_TOKEN  chave secreta, só no servidor
//   MERCADOPAGO_ASSINATURA    assinatura secreta dos avisos (webhooks), só no servidor
//   PAGAMENTO_MODO            "producao" = vendas de verdade; vazio = modo de teste

export function pagamentoEmTeste() {
  return process.env.PAGAMENTO_MODO !== 'producao';
}

export function chavePublica() {
  return process.env.MERCADOPAGO_PUBLIC_KEY || null;
}

export function mercadoPagoLigado() {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN && !!chavePublica();
}

// Só o teste local troca o endereço da API (por um Mercado Pago de mentira).
const API = () => process.env.MERCADOPAGO_API_URL ?? 'https://api.mercadopago.com';

export type PagamentoMP = {
  id: number | string;
  status: string;
  status_detail?: string;
  transaction_amount: number;
  payment_type_id?: string;
  payment_method_id?: string;
  installments?: number;
  external_reference?: string | null;
  date_of_expiration?: string | null;
  point_of_interaction?: {
    transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
  };
};

export class ErroDoMercadoPago extends Error {
  constructor(
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
  }
}

async function chamar(caminho: string, init: RequestInit & { idempotencia?: string } = {}) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new ErroDoMercadoPago('O Mercado Pago ainda não está ligado.', 503);
  const { idempotencia, ...resto } = init;
  let resposta: Response;
  try {
    resposta = await fetch(`${API()}${caminho}`, {
      ...resto,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(idempotencia ? { 'X-Idempotency-Key': idempotencia } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch (motivo) {
    console.error(`mercadopago: sem resposta em ${caminho}`, motivo);
    throw new ErroDoMercadoPago('O Mercado Pago não respondeu.', 504);
  }
  const dados: unknown = await resposta.json().catch(() => null);
  return { resposta, dados };
}

export async function criarPagamento(corpo: Record<string, unknown>, idempotencia: string): Promise<PagamentoMP> {
  const { resposta, dados } = await chamar('/v1/payments', {
    method: 'POST',
    body: JSON.stringify(corpo),
    idempotencia,
  });
  if (!resposta.ok || !dados || typeof dados !== 'object' || !('id' in dados)) {
    console.error(`mercadopago: pagamento não criado (${resposta.status})`, JSON.stringify(dados).slice(0, 500));
    throw new ErroDoMercadoPago('O Mercado Pago não aceitou o pagamento.', resposta.status >= 500 ? 502 : 400);
  }
  return dados as PagamentoMP;
}

// Devolve null quando o pagamento não existe (um aviso de teste, por exemplo).
export async function buscarPagamento(id: string): Promise<PagamentoMP | null> {
  const { resposta, dados } = await chamar(`/v1/payments/${encodeURIComponent(id)}`);
  if (resposta.status === 404) return null;
  if (!resposta.ok || !dados || typeof dados !== 'object') {
    throw new ErroDoMercadoPago(`O Mercado Pago respondeu ${resposta.status}.`, 502);
  }
  return dados as PagamentoMP;
}

// Cancela um Pix que ainda não foi pago (quando a pessoa troca para o cartão).
export async function cancelarPagamento(id: string) {
  try {
    const { resposta } = await chamar(`/v1/payments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' }),
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

export type SituacaoDoPagamento = {
  id: string;
  situacao: string;
  valor: number;
  metodo: 'pix' | 'cartao' | null;
  parcelas: number | null;
};

export function situacaoDoPagamento(p: PagamentoMP): SituacaoDoPagamento {
  const cartao = p.payment_type_id === 'credit_card' || p.payment_type_id === 'debit_card';
  return {
    id: String(p.id),
    situacao: p.status,
    valor: Number(p.transaction_amount),
    metodo: p.payment_method_id === 'pix' ? 'pix' : cartao ? 'cartao' : null,
    parcelas: cartao && p.installments ? p.installments : null,
  };
}

// O código do Pix (copia e cola), a imagem do QR e até quando ele vale.
export function dadosDoPix(p: PagamentoMP) {
  const dados = p.point_of_interaction?.transaction_data;
  if (p.payment_method_id !== 'pix' || !dados?.qr_code) return null;
  return {
    codigo: dados.qr_code,
    imagem: dados.qr_code_base64 ? `data:image/png;base64,${dados.qr_code_base64}` : null,
    venceEm: p.date_of_expiration ?? null,
  };
}

// O aviso (webhook) do Mercado Pago vem assinado: o cabeçalho x-signature traz a
// hora (ts) e a assinatura (v1), uma HMAC-SHA256 com a assinatura secreta sobre
// "id:<data.id>;request-id:<x-request-id>;ts:<ts>;". Parte que não veio sai do texto.
export function avisoAssinado(cabecalho: string | null, requestId: string | null, dataId: string | null) {
  const segredo = process.env.MERCADOPAGO_ASSINATURA;
  if (!segredo || !cabecalho) return false;
  const partes = new Map(
    cabecalho.split(',').map((parte) => {
      const [chave, ...valor] = parte.split('=');
      return [chave.trim(), valor.join('=').trim()] as const;
    }),
  );
  const ts = partes.get('ts');
  const v1 = partes.get('v1');
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;
  let texto = '';
  if (dataId) texto += `id:${/^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) texto += `request-id:${requestId};`;
  texto += `ts:${ts};`;
  const esperada = createHmac('sha256', segredo).update(texto).digest();
  const recebida = Buffer.from(v1, 'hex');
  return recebida.length === esperada.length && timingSafeEqual(recebida, esperada);
}

// Validade do Pix no formato que o Mercado Pago aceita, no horário de Brasília.
export function validadeDoPix(minutos: number, agora = Date.now()) {
  const brasilia = new Date(agora + minutos * 60_000 - 3 * 60 * 60_000);
  return `${brasilia.toISOString().slice(0, 19)}.000-03:00`;
}
