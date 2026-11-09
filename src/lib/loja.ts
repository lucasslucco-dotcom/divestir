// As regras da loja que valem no navegador e no servidor: prazo, preços, presente,
// parcelas e limites do pedido. Nada aqui é segredo. O servidor sempre refaz as
// contas antes de criar o pedido; o navegador só mostra.
import type { Peca } from './catalogo';

// Prazo de personalização mostrado no carrinho e no checkout (decisão do Lucas,
// 08/11/2026). É o tempo de fazer a peça, antes de ela sair para a entrega.
export const PRAZO_DE_PERSONALIZACAO = { min: 10, max: 15 } as const;
export const PRAZO_EM_TEXTO = `${PRAZO_DE_PERSONALIZACAO.min} a ${PRAZO_DE_PERSONALIZACAO.max} dias úteis`;

// Os avisos vão por e-mail; o WhatsApp entra quando o provedor estiver liberado
// (decisão do Lucas, 08/11/2026). Ligar aqui muda a mensagem do prazo.
export const AVISOS_POR_WHATSAPP = false;

// A mensagem de prazo do briefing ("Carrinho e checkout").
export function mensagemDoPrazo() {
  const canais = AVISOS_POR_WHATSAPP ? 'por e-mail e WhatsApp' : 'por e-mail';
  return `Cada Divestir é feita sob medida pra você. Seu pedido é personalizado e enviado em ${PRAZO_EM_TEXTO}. Você recebe todas as atualizações ${canais}, do primeiro ajuste até a entrega.`;
}

// Preços ainda em aberto no briefing (decisão do Lucas, 08/11/2026: "use preço de
// teste"). Peça sem preço no banco usa o preço de teste, e só no modo de teste do
// pagamento; a tela marca como "preço de teste". Fora do modo de teste, peça sem
// preço não é vendida.
export const PRECO_DE_TESTE = 100;

// Presente: embalagem especial e cartão com a mensagem do cliente, por peça. O preço
// ainda está em aberto; até lá, vale o de teste, também só no modo de teste.
export const PRECO_DO_PRESENTE: number | null = null;
export const PRECO_DO_PRESENTE_DE_TESTE = 10;

export type Preco = { valor: number; teste: boolean };

export function precoDaPeca(peca: Pick<Peca, 'preco'>, modoDeTeste: boolean): Preco | null {
  if (peca.preco !== null) return { valor: peca.preco, teste: false };
  return modoDeTeste ? { valor: PRECO_DE_TESTE, teste: true } : null;
}

export function precoDoPresente(modoDeTeste: boolean): Preco | null {
  if (PRECO_DO_PRESENTE !== null) return { valor: PRECO_DO_PRESENTE, teste: false };
  return modoDeTeste ? { valor: PRECO_DO_PRESENTE_DE_TESTE, teste: true } : null;
}

// Desconto no Pix: o briefing deixa a critério da operação ("com desconto, se a
// operação quiser"). Ainda não decidido, então fica sem desconto.
export const DESCONTO_NO_PIX = 0;

// Cartão parcelado: até 12 vezes, com os juros do Mercado Pago pagos por quem compra
// (o padrão da conta, até a operação decidir outra coisa).
export const MAX_PARCELAS = 12;

export const MAX_PECAS_POR_PEDIDO = 10;

// O Pix vale por 30 minutos: depois disso, o pedido pede um código novo.
export const MINUTOS_DO_PIX = 30;

// Contas em centavos, para não perder um centavo no caminho.
export function somar(...valores: number[]) {
  return valores.reduce((total, valor) => total + Math.round(valor * 100), 0) / 100;
}

export const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
