// Cria o pedido a partir do checkout. O servidor confere cada peça no banco, refaz
// as contas (preços, presente e frete) e grava tudo de uma vez pela rotina
// criar_pedido. O pedido nasce aguardando o pagamento.

import { erro, veioDeFora } from '@/lib/api';
import { criarPedido, lerPedidoDoCheckout, PedidoRecusado } from '@/lib/pedidos';

export const maxDuration = 30;

const SEM_GUARDAR = { 'Cache-Control': 'no-store' };

export async function POST(request: Request) {
  if (veioDeFora(request)) return erro('Pedido de fora do site.', 403);

  const corpo = await request.text();
  if (corpo.length > 64_000) return erro('Pedido grande demais.', 413);
  let dados: unknown;
  try {
    dados = JSON.parse(corpo);
  } catch {
    return erro('Pedido inválido.', 400);
  }

  try {
    const criado = await criarPedido(lerPedidoDoCheckout(dados));
    return Response.json(criado, { headers: SEM_GUARDAR });
  } catch (motivo) {
    if (motivo instanceof PedidoRecusado) {
      return Response.json(
        { erro: motivo.message, fotosPendentes: motivo.fotosPendentes },
        { status: motivo.status, headers: SEM_GUARDAR },
      );
    }
    console.error('pedidos: erro inesperado ao criar o pedido', motivo);
    return erro('Não consegui fechar o pedido agora. Tenta de novo em instantes?', 500);
  }
}
