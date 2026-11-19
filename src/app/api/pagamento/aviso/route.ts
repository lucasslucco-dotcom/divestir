// Aviso de pagamento (webhook) do meio de pagamento da loja. Regra do projeto:
// "Webhooks de pagamento sempre validados por assinatura."
//
// Pagar.me (o que vale desde 19/11/2026): o aviso não vem assinado; ele chega com o
// usuário e a senha que a gente cadastra no painel do Pagar.me junto com o endereço
// (PAGARME_AVISO_USUARIO e PAGARME_AVISO_SENHA). Sem a senha certa, é recusado.
// Mercado Pago (desligado): o aviso vem assinado (cabeçalho x-signature).
//
// Nos dois, o conteúdo do aviso só serve para saber de qual pagamento se trata: a
// situação é sempre perguntada ao próprio meio de pagamento, com a chave secreta.
//
// Endereço para cadastrar: https://divestir.vercel.app/api/pagamento/aviso
// (no Pagar.me: Configurações → Webhooks, eventos de pedido: order.paid,
// order.payment_failed e order.canceled).

import { erro } from '@/lib/api';
import { avisoAssinado } from '@/lib/mercadopago';
import { buscarPagamento } from '@/lib/pagamento';
import { avisoAutorizado, ehDoPagarme } from '@/lib/pagarme';
import { lerPedidoPorNumero, registrarPagamento } from '@/lib/pedidos';

export const maxDuration = 20;

async function registrar(id: string) {
  try {
    const pagamento = await buscarPagamento(id);
    // O aviso de teste do painel aponta para um pagamento que não existe.
    if (!pagamento) return Response.json({ ok: true, aviso: 'pagamento não encontrado' });
    const pedido = pagamento.pedido !== null ? await lerPedidoPorNumero(pagamento.pedido) : null;
    if (!pedido) return Response.json({ ok: true, aviso: 'pagamento sem pedido da loja' });
    const status = await registrarPagamento(pedido, pagamento.situacao);
    return Response.json({ ok: true, status });
  } catch (motivo) {
    // Responder com erro faz o aviso ser mandado de novo mais tarde.
    console.error('aviso: não consegui registrar o pagamento', motivo);
    return erro('Não consegui registrar agora.', 500);
  }
}

async function doMercadoPago(request: Request) {
  if (!process.env.MERCADOPAGO_ASSINATURA) {
    console.error('aviso: falta a variável MERCADOPAGO_ASSINATURA na Vercel');
    return erro('O aviso de pagamento ainda não está ligado.', 503);
  }
  const pergunta = new URL(request.url).searchParams;
  const dataId = pergunta.get('data.id');
  if (!avisoAssinado(request.headers.get('x-signature'), request.headers.get('x-request-id'), dataId)) {
    return erro('Assinatura inválida.', 401);
  }
  const corpo = (await request.json().catch(() => null)) as { type?: string; data?: { id?: string | number } } | null;
  const tipo = pergunta.get('type') ?? corpo?.type;
  const id = dataId ?? (corpo?.data?.id !== undefined ? String(corpo.data.id) : null);
  // Outros avisos (pedidos de reembolso, contestação...) ficam para o painel.
  if (tipo !== 'payment' || !id || ehDoPagarme(id)) return Response.json({ ok: true });
  return registrar(id);
}

async function doPagarme(request: Request) {
  if (!process.env.PAGARME_AVISO_SENHA) {
    console.error('aviso: falta a variável PAGARME_AVISO_SENHA na Vercel');
    return erro('O aviso de pagamento ainda não está ligado.', 503);
  }
  if (!avisoAutorizado(request.headers.get('authorization'))) return erro('Aviso sem a senha certa.', 401);
  const corpo = (await request.json().catch(() => null)) as {
    type?: string;
    data?: { id?: string; order?: { id?: string } };
  } | null;
  const tipo = typeof corpo?.type === 'string' ? corpo.type : '';
  // Aviso de pedido traz o código do pedido; aviso de cobrança, o pedido dentro dela.
  const id = tipo.startsWith('order.') ? corpo?.data?.id : tipo.startsWith('charge.') ? corpo?.data?.order?.id : null;
  if (typeof id !== 'string' || !ehDoPagarme(id) || !/^or_[\w-]{6,80}$/.test(id)) return Response.json({ ok: true });
  return registrar(id);
}

export async function POST(request: Request) {
  return request.headers.has('x-signature') ? doMercadoPago(request) : doPagarme(request);
}
