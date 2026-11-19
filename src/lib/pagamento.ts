import 'server-only';
import * as mercadoPago from './mercadopago';
import * as pagarme from './pagarme';

// O meio de pagamento da loja. Desde 19/11/2026 é o Pagar.me (decisão do Lucas); o
// Mercado Pago continua no código, desligado, e só volta a valer se as chaves dele
// estiverem na Vercel e as do Pagar.me não. O resto do site fala só com este arquivo.

export type Provedor = 'pagarme' | 'mercadopago';

export function pagamentoEmTeste() {
  return process.env.PAGAMENTO_MODO !== 'producao';
}

export function provedor(): Provedor | null {
  if (pagarme.pagarmeLigado()) return 'pagarme';
  if (mercadoPago.mercadoPagoLigado()) return 'mercadopago';
  return null;
}

export function chavePublica() {
  const qual = provedor();
  if (qual === 'pagarme') return pagarme.chavePublicaDoPagarme();
  return qual === 'mercadopago' ? mercadoPago.chavePublica() : null;
}

export type SituacaoDoPagamento = mercadoPago.SituacaoDoPagamento;

export type Pix = { codigo: string; imagem: string | null; venceEm: string | null };

export type PagamentoLido = {
  situacao: SituacaoDoPagamento;
  // O número do pedido da loja a que o pagamento pertence.
  pedido: number | null;
  pix: Pix | null;
};

const numeroDoPedido = (texto: string | null | undefined) => {
  const numero = Number(texto);
  return texto && Number.isInteger(numero) ? numero : null;
};

export function lerDoPagarme(pedido: pagarme.PedidoPM): PagamentoLido {
  return {
    situacao: pagarme.situacaoDoPedido(pedido),
    pedido: numeroDoPedido(pedido.code),
    pix: pagarme.dadosDoPix(pedido),
  };
}

export function lerDoMercadoPago(pagamento: mercadoPago.PagamentoMP): PagamentoLido {
  return {
    situacao: mercadoPago.situacaoDoPagamento(pagamento),
    pedido: numeroDoPedido(pagamento.external_reference),
    pix: mercadoPago.dadosDoPix(pagamento),
  };
}

// Pergunta a quem processou o pagamento como ele está. O código diz de quem é: os do
// Pagar.me começam com "or_". Devolve null quando o pagamento não existe.
export async function buscarPagamento(id: string): Promise<PagamentoLido | null> {
  if (pagarme.ehDoPagarme(id)) {
    const pedido = await pagarme.buscarPedido(id);
    return pedido ? lerDoPagarme(pedido) : null;
  }
  const pagamento = await mercadoPago.buscarPagamento(id);
  return pagamento ? lerDoMercadoPago(pagamento) : null;
}

// Cancela um Pix que ainda não foi pago (quando a pessoa troca para o cartão).
export function cancelarPagamento(id: string) {
  return pagarme.ehDoPagarme(id) ? pagarme.cancelarCobranca(id) : mercadoPago.cancelarPagamento(id);
}

// Devolve um pagamento inteiro a quem pagou (estorno).
export function devolverPagamento(id: string) {
  return pagarme.ehDoPagarme(id) ? pagarme.cancelarCobranca(id) : mercadoPago.devolverPagamento(id);
}

export const nomeDoProvedor = (qual: Provedor | null) =>
  qual === 'pagarme' ? 'Pagar.me' : qual === 'mercadopago' ? 'Mercado Pago' : 'meio de pagamento';
