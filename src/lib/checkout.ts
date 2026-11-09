// O que o navegador manda para criar o pedido e o que a página do pedido recebe de
// volta. Vale para o navegador e para o servidor: aqui não tem segredo nenhum.
import type { Enquadramento } from './foto/enquadramento';
import type { ItemDoCarrinho } from './montagem/tipos';
import type { Lado } from './molde/tipos';

export type ContatoDoCheckout = { nome: string; email: string; whatsapp: string; cpf: string };

export type EnderecoDoCheckout = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type PecaDoCheckout = {
  id: string;
  peca: string;
  cor: string;
  design: string;
  lado: Lado;
  tamanho: string;
  campos: Record<string, string>;
  foto: { id: string | null; sessao: string | null; enquadramento: Enquadramento };
  presente: { mensagem: string } | null;
};

export type PedidoDoCheckout = {
  // Código desta tentativa de checkout: o mesmo envio repetido não vira dois pedidos.
  chave: string;
  contato: ContatoDoCheckout;
  endereco: EnderecoDoCheckout;
  // Nome de quem recebe, quando o presente vai direto para a pessoa presenteada.
  destinatario: string | null;
  frete: string;
  termos: boolean;
  divulgacao: boolean;
  pecas: PecaDoCheckout[];
};

export type PedidoCriado = { token: string; numero: number; total: number };

// Uma opção de frete cotada no Melhor Envio (ou simulada, sem a conta ligada).
export type OpcaoDeFrete = {
  id: string;
  transportadora: string;
  servico: string;
  preco: number;
  // Dias úteis só de transporte, depois que a peça sai.
  prazo: { min: number; max: number };
  simulado: boolean;
};

export function pecaDoCheckout(item: ItemDoCarrinho): PecaDoCheckout {
  return {
    id: item.id,
    peca: item.peca,
    cor: item.cor,
    design: item.design,
    lado: item.lado,
    tamanho: item.tamanho,
    campos: item.campos,
    foto: { id: item.foto.id, sessao: item.foto.sessao, enquadramento: item.foto.enquadramento },
    presente: item.presente,
  };
}

// A situação do pedido para a página do pedido (sem endereço, CPF nem contato).
export type SituacaoDoPedido = {
  numero: number;
  primeiroNome: string;
  status: string;
  pago: boolean;
  teste: boolean;
  subtotal: number;
  frete: number;
  total: number;
  freteServico: {
    transportadora: string;
    servico: string;
    prazo_min: number;
    prazo_max: number;
    simulado?: boolean;
  } | null;
  prazoPersonalizacao: string | null;
  // O e-mail dos avisos, com o meio escondido (lu•••@gmail.com).
  emailParcial: string;
  pagamento: { situacao: string | null; metodo: 'pix' | 'cartao' | null };
  pix: { codigo: string; imagem: string | null; venceEm: string | null } | null;
  pecas: { peca: string; cor: string; design: string; tamanho: string; nome: string; lado: Lado; presente: boolean }[];
};

// Peças com foto que não chegou ao espaço privado: o carrinho pede a foto de novo.
export function fotoPendente(item: ItemDoCarrinho) {
  return !item.foto.id || !item.foto.sessao || item.foto.original !== 'enviada';
}
