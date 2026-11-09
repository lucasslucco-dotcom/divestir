// Cria o pagamento de um pedido no Mercado Pago, com o que o formulário do Mercado
// Pago (Payment Brick) devolveu no navegador: o código de uso único do cartão, ou o
// pedido de Pix. O valor é sempre o total do pedido no banco, nunca o do navegador.
// O resultado já fica registrado no pedido; o aviso do Mercado Pago (webhook)
// confirma depois.

import { erro, veioDeFora } from '@/lib/api';
import { ehCodigo } from '@/lib/foto/espaco';
import { MAX_PARCELAS, MINUTOS_DO_PIX } from '@/lib/loja';
import {
  cancelarPagamento,
  criarPagamento,
  dadosDoPix,
  ErroDoMercadoPago,
  mercadoPagoLigado,
  situacaoDoPagamento,
  validadeDoPix,
} from '@/lib/mercadopago';
import { lerPedido, PedidoRecusado, registrarPagamento, type LinhaDoPedido } from '@/lib/pedidos';
import { emailValido, separarNome, soDigitos } from '@/lib/validar';

export const maxDuration = 30;

const SEM_GUARDAR = { 'Cache-Control': 'no-store' };

function montarPagamento(pedido: LinhaDoPedido, formulario: Record<string, unknown>) {
  const { primeiro, resto } = separarNome(pedido.nome);
  const endereco = pedido.endereco ?? {};
  const whatsapp = soDigitos(pedido.whatsapp);
  const total = Number(pedido.total);
  const base = {
    transaction_amount: total,
    description: `Divestir · pedido ${pedido.numero}`,
    external_reference: String(pedido.numero),
    metadata: { pedido: pedido.numero },
    // Mais dados da compra ajudam o Mercado Pago a aprovar o cartão.
    additional_info: {
      items: [
        {
          id: `pedido-${pedido.numero}`,
          title: `Divestir · pedido ${pedido.numero}`,
          category_id: 'fashion',
          quantity: 1,
          unit_price: total,
        },
      ],
      payer: {
        first_name: primeiro,
        last_name: resto,
        phone: { area_code: whatsapp.slice(0, 2), number: whatsapp.slice(2) },
        address: { zip_code: endereco.cep, street_name: endereco.rua, street_number: endereco.numero },
      },
      shipments: {
        receiver_address: {
          zip_code: endereco.cep,
          state_name: endereco.uf,
          city_name: endereco.cidade,
          street_name: endereco.rua,
          street_number: endereco.numero,
        },
      },
    },
  };

  const metodo = typeof formulario.payment_method_id === 'string' ? formulario.payment_method_id : '';
  if (metodo === 'pix') {
    return {
      ...base,
      payment_method_id: 'pix',
      date_of_expiration: validadeDoPix(MINUTOS_DO_PIX),
      payer: {
        email: pedido.email,
        first_name: primeiro,
        last_name: resto,
        identification: { type: 'CPF', number: pedido.cpf },
      },
    };
  }

  // Cartão: o código do cartão (token) vale uma vez só e vem do Mercado Pago.
  const cartao =
    typeof formulario.token === 'string' && /^[\w-]{8,200}$/.test(formulario.token) ? formulario.token : null;
  const parcelas = Number(formulario.installments);
  const emissor = formulario.issuer_id;
  if (
    !cartao ||
    !/^[a-z_]{2,30}$/.test(metodo) ||
    !Number.isInteger(parcelas) ||
    parcelas < 1 ||
    parcelas > MAX_PARCELAS
  ) {
    throw new PedidoRecusado('Os dados do cartão não chegaram direito. Tenta de novo?');
  }
  const pagador = (formulario.payer ?? {}) as Record<string, unknown>;
  const documento = (pagador.identification ?? {}) as Record<string, unknown>;
  const tipo = documento.type === 'CNPJ' ? 'CNPJ' : 'CPF';
  const numero = soDigitos(typeof documento.number === 'string' ? documento.number : '') || pedido.cpf;
  return {
    ...base,
    token: cartao,
    installments: parcelas,
    payment_method_id: metodo,
    ...(typeof emissor === 'string' || typeof emissor === 'number' ? { issuer_id: String(emissor) } : {}),
    statement_descriptor: 'DIVESTIR',
    payer: {
      email: typeof pagador.email === 'string' && emailValido(pagador.email) ? pagador.email : pedido.email,
      identification: { type: tipo, number: numero },
    },
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (veioDeFora(request)) return erro('Pedido de fora do site.', 403);
  if (!mercadoPagoLigado()) return erro('O pagamento ainda não está ligado.', 503);
  const { token } = await params;

  let dados: Record<string, unknown>;
  try {
    dados = await request.json();
  } catch {
    return erro('Pedido inválido.', 400);
  }
  // Código desta tentativa: o mesmo envio repetido não vira duas cobranças.
  if (!ehCodigo(dados.tentativa)) return erro('Pedido inválido.', 400);
  const formulario =
    dados.formulario && typeof dados.formulario === 'object' ? (dados.formulario as Record<string, unknown>) : {};

  try {
    const pedido = await lerPedido(token);
    if (!pedido) return erro('Não encontrei esse pedido.', 404);
    if (pedido.pago_em || pedido.status !== 'aguardando_pagamento') {
      return Response.json(
        { erro: 'Esse pedido já foi pago.', status: pedido.status },
        { status: 409, headers: SEM_GUARDAR },
      );
    }
    if (
      pedido.pagamento_situacao === 'in_process' ||
      (pedido.pagamento_situacao === 'pending' && pedido.pagamento_metodo === 'cartao')
    ) {
      return erro('Seu pagamento ainda está em análise. Espera um pouquinho que a página avisa.', 409);
    }

    // Um Pix ainda aguardando sai de cena antes da tentativa nova: assim não dá
    // para pagar o mesmo pedido duas vezes.
    if (pedido.pagamento_id && pedido.pagamento_metodo === 'pix' && pedido.pagamento_situacao === 'pending') {
      await cancelarPagamento(pedido.pagamento_id);
    }

    const pagamento = await criarPagamento(montarPagamento(pedido, formulario), dados.tentativa);
    const status = await registrarPagamento(pedido, situacaoDoPagamento(pagamento), true);
    return Response.json(
      {
        situacao: pagamento.status,
        detalhe: pagamento.status_detail ?? null,
        status,
        pix: dadosDoPix(pagamento),
      },
      { headers: SEM_GUARDAR },
    );
  } catch (motivo) {
    if (motivo instanceof PedidoRecusado) return erro(motivo.message, motivo.status);
    if (motivo instanceof ErroDoMercadoPago) {
      return erro(
        motivo.status === 400
          ? 'O Mercado Pago não aceitou esse pagamento. Confere os dados ou tenta outro jeito de pagar?'
          : 'O Mercado Pago não respondeu agora. Tenta de novo em instantes?',
        motivo.status,
      );
    }
    console.error('pagamento: erro inesperado', motivo);
    return erro('Não consegui criar o pagamento agora. Tenta de novo em instantes?', 500);
  }
}
