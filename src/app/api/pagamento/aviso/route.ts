// Aviso de pagamento do Mercado Pago (webhook). Regra do projeto: "Webhooks de
// pagamento sempre validados por assinatura." Só depois da assinatura conferida o
// site pergunta ao próprio Mercado Pago como está o pagamento (o conteúdo do aviso
// não é usado para nada além do número do pagamento) e registra no pedido.
//
// Endereço para cadastrar no Mercado Pago: https://divestir.vercel.app/api/pagamento/aviso
// (Suas integrações → a aplicação → Webhooks, evento "Pagamentos").

import { erro } from '@/lib/api';
import { avisoAssinado, buscarPagamento, situacaoDoPagamento } from '@/lib/mercadopago';
import { lerPedidoPorNumero, registrarPagamento } from '@/lib/pedidos';

export const maxDuration = 20;

export async function POST(request: Request) {
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
  if (tipo !== 'payment' || !id) return Response.json({ ok: true });

  try {
    const pagamento = await buscarPagamento(id);
    // O aviso de teste do painel do Mercado Pago aponta para um pagamento que não existe.
    if (!pagamento) return Response.json({ ok: true, aviso: 'pagamento não encontrado' });
    const numero = Number(pagamento.external_reference);
    const pedido = Number.isInteger(numero) ? await lerPedidoPorNumero(numero) : null;
    if (!pedido) return Response.json({ ok: true, aviso: 'pagamento sem pedido da loja' });
    const status = await registrarPagamento(pedido, situacaoDoPagamento(pagamento));
    return Response.json({ ok: true, status });
  } catch (motivo) {
    // Responder com erro faz o Mercado Pago mandar o aviso de novo mais tarde.
    console.error('aviso: não consegui registrar o pagamento', motivo);
    return erro('Não consegui registrar agora.', 500);
  }
}
