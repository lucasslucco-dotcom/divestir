// A situação do pedido para a página do pedido, pelo código do link (o
// token_acompanhamento, que só quem fez o pedido tem). Não devolve endereço, CPF
// nem contato.
//   ?leve=1     só o status e o pagamento (para a página perguntar de tempos em tempos)
//   ?conferir=1 pergunta também ao Mercado Pago, se o aviso dele ainda não chegou
//   ?pix=1      traz o código e o QR do Pix que está aguardando

import { erro } from '@/lib/api';
import { buscarPagamento, dadosDoPix } from '@/lib/mercadopago';
import { conferirPagamento, lerPedido, PedidoRecusado, situacaoDoPedido } from '@/lib/pedidos';

const SEM_GUARDAR = { 'Cache-Control': 'no-store' };

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const pergunta = new URL(request.url).searchParams;
  try {
    let pedido = await lerPedido(token);
    if (!pedido) return erro('Não encontrei esse pedido.', 404);
    if (pergunta.has('conferir') && (await conferirPagamento(pedido))) pedido = (await lerPedido(token)) ?? pedido;

    const pagamento = { situacao: pedido.pagamento_situacao, metodo: pedido.pagamento_metodo };
    if (pergunta.has('leve')) {
      return Response.json({ status: pedido.status, pago: !!pedido.pago_em, pagamento }, { headers: SEM_GUARDAR });
    }

    let pix = null;
    const pixAguardando =
      !pedido.pago_em && pedido.pagamento_metodo === 'pix' && pedido.pagamento_situacao === 'pending';
    if (pergunta.has('pix') && pixAguardando && pedido.pagamento_id) {
      const doMercadoPago = await buscarPagamento(pedido.pagamento_id).catch(() => null);
      pix = doMercadoPago ? dadosDoPix(doMercadoPago) : null;
    }
    return Response.json({ ...(await situacaoDoPedido(pedido)), pix }, { headers: SEM_GUARDAR });
  } catch (motivo) {
    if (motivo instanceof PedidoRecusado) return erro(motivo.message, motivo.status);
    console.error('pedidos: erro inesperado ao ler o pedido', motivo);
    return erro('Não consegui abrir o pedido agora. Tenta de novo em instantes?', 500);
  }
}
