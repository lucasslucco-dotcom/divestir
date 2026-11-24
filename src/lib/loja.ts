// As regras da loja que valem no navegador e no servidor: prazo, preços, presente,
// parcelas e limites do pedido. Nada aqui é segredo. O servidor sempre refaz as
// contas antes de criar o pedido; o navegador só mostra.
import type { Peca } from './catalogo';

// Prazo de personalização mostrado no carrinho e no checkout: o tempo de fazer a peça,
// antes de ela sair para a entrega. São 10 dias úteis (decisão do Lucas, 23/11/2026;
// antes, de 10 a 15). Com mínimo e máximo iguais, os textos dizem "até 10 dias úteis".
export const PRAZO_DE_PERSONALIZACAO: { min: number; max: number } = { min: 10, max: 10 };

// "10" quando os dois números são iguais, "10 a 15" quando não são.
export function faixaDeDias(min: number, max: number) {
  return min === max ? String(max) : `${min} a ${max}`;
}

// O prazo de fazer a peça, em dias: "até 10" (o Lucas fechou em "até 10 dias", em
// 23/11/2026) ou "10 a 15", se um dia voltar a ser uma faixa.
const PRAZO_E_UM_TETO = PRAZO_DE_PERSONALIZACAO.min === PRAZO_DE_PERSONALIZACAO.max;
export const PRAZO_EM_DIAS = PRAZO_E_UM_TETO
  ? `até ${PRAZO_DE_PERSONALIZACAO.max}`
  : faixaDeDias(PRAZO_DE_PERSONALIZACAO.min, PRAZO_DE_PERSONALIZACAO.max);
export const PRAZO_EM_TEXTO = `${PRAZO_EM_DIAS} dias úteis`;

// O prazo até a peça chegar, em dias: o de fazer a peça somado ao da entrega. Como a
// peça fica pronta em "até 10", a soma também é um teto: "até 17".
export function prazoComEntrega(entregaMin: number, entregaMax: number) {
  if (PRAZO_E_UM_TETO) return `até ${PRAZO_DE_PERSONALIZACAO.max + entregaMax}`;
  return faixaDeDias(PRAZO_DE_PERSONALIZACAO.min + entregaMin, PRAZO_DE_PERSONALIZACAO.max + entregaMax);
}

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

// Cartão parcelado no Mercado Pago (desligado desde 19/11/2026): até 12 vezes, com os
// juros pagos por quem compra.
export const MAX_PARCELAS = 12;

// Cartão parcelado no Pagar.me: sem juros para quem compra (a taxa do parcelamento
// fica com a loja), em até PARCELAS_SEM_JUROS vezes e com parcela de pelo menos
// PARCELA_MINIMA reais. Os dois números são da operação: o Lucas ainda vai fechar.
export const PARCELAS_SEM_JUROS = 6;
export const PARCELA_MINIMA = 30;

export function parcelasPossiveis(total: number) {
  return Math.max(1, Math.min(PARCELAS_SEM_JUROS, Math.floor(total / PARCELA_MINIMA)));
}

export const MAX_PECAS_POR_PEDIDO = 10;

// O Pix vale por 30 minutos: depois disso, o pedido pede um código novo.
export const MINUTOS_DO_PIX = 30;

// Pedido que fica sem pagamento por mais que isso é cancelado pela faxina diária
// (src/app/api/faxina). Um pagamento aprovado que chegue depois traz o pedido de volta.
export const DIAS_SEM_PAGAR = 3;

// O perfil da marca no Instagram (informado pelo Lucas em 22/11/2026): aparece no e-mail
// e na página do pedido entregue ("Marca o @divestirbr quando vestir").
export const INSTAGRAM = '@divestirbr';

// Contas em centavos, para não perder um centavo no caminho.
export function somar(...valores: number[]) {
  return valores.reduce((total, valor) => total + Math.round(valor * 100), 0) / 100;
}

export const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
