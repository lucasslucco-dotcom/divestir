// Cotação do frete no checkout: o CEP de quem recebe e as peças do carrinho.
// O valor que vale é o que o servidor cota de novo na hora de criar o pedido.

import { erro, veioDeFora } from '@/lib/api';
import { carregarCatalogo } from '@/lib/catalogo';
import { cotarFrete, FreteIndisponivel } from '@/lib/frete';
import { MAX_PECAS_POR_PEDIDO, precoDaPeca, precoDoPresente, somar } from '@/lib/loja';
import { pagamentoEmTeste } from '@/lib/mercadopago';
import { cepValido, soDigitos } from '@/lib/validar';

export async function POST(request: Request) {
  if (veioDeFora(request)) return erro('Pedido de fora do site.', 403);

  let dados: Record<string, unknown>;
  try {
    dados = await request.json();
  } catch {
    return erro('Pedido inválido.', 400);
  }

  const cep = soDigitos(typeof dados.cep === 'string' ? dados.cep : '');
  if (!cepValido(cep)) return erro('Confere o CEP.', 400);
  const pecas = Array.isArray(dados.pecas) ? dados.pecas.slice(0, MAX_PECAS_POR_PEDIDO) : [];
  if (!pecas.length) return erro('O carrinho está vazio.', 400);

  const catalogo = await carregarCatalogo();
  const teste = pagamentoEmTeste();
  const presente = precoDoPresente(teste)?.valor ?? 0;
  const itens = pecas.map((bruto) => {
    const item = (bruto ?? {}) as Record<string, unknown>;
    const peca = catalogo.pecas.find((p) => p.slug === item.peca);
    const preco = peca ? (precoDaPeca(peca, teste)?.valor ?? 0) : 0;
    return { pacote: peca?.envio ?? null, valor: somar(preco, item.presente ? presente : 0) };
  });

  try {
    const opcoes = await cotarFrete(cep, itens);
    if (!opcoes.length) return erro('Nenhuma transportadora entrega nesse CEP. Confere o número?', 404);
    return Response.json({ opcoes }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (motivo) {
    if (motivo instanceof FreteIndisponivel) {
      return erro('Não consegui calcular o frete agora. Tenta de novo em instantes?', 502);
    }
    console.error('frete: erro inesperado', motivo);
    return erro('Não consegui calcular o frete agora. Tenta de novo em instantes?', 500);
  }
}
