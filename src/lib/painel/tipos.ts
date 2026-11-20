import type { Enquadramento } from '../foto/enquadramento';
import type { AreasDaPeca, ConfigDoMolde, Lado } from '../molde/tipos';

// O que as rotinas do painel devolvem (migration painel_da_equipe).

export type Papel = 'admin' | 'operacao';

export type Eu = { nome: string; papel: Papel };

export type PedidoDaLista = {
  numero: number;
  nome: string;
  status: string;
  total: number;
  teste: boolean;
  criado_em: string;
  pago_em: string | null;
  rastreio: string | null;
  // Quando o status mudou pela última vez.
  mudou_em: string;
  presente: boolean;
  pecas: { peca: string; cor: string; hex: string; design: string; tamanho: string; nome: string | null }[];
};

export type ItemDoPedido = {
  id: number;
  tamanho: string;
  lado: Lado;
  campos: Record<string, string>;
  enquadramento: Partial<Enquadramento>;
  marca_no_peito: boolean;
  presente: { mensagem?: string } | null;
  preco: number;
  preco_presente: number;
  peca: { slug: string; nome: string; areas: AreasDaPeca | null };
  cor: { slug: string; nome: string; hex: string };
  design: { slug: string; nome: string; config: ConfigDoMolde };
  // A foto de base da peça nessa cor e nesse lado.
  base: string | null;
  foto: {
    id: string;
    original: string | null;
    recorte: string | null;
    largura: number | null;
    altura: number | null;
    nitidez: number | null;
  } | null;
};

export type PedidoInteiro = {
  numero: number;
  status: string;
  teste: boolean;
  criado_em: string;
  pago_em: string | null;
  nome: string;
  email: string;
  whatsapp: string;
  cpf: string | null;
  endereco: Record<string, string> | null;
  presente: Record<string, string> | null;
  subtotal: number;
  frete: number;
  total: number;
  frete_servico: { transportadora?: string; servico?: string; prazo_min?: number; prazo_max?: number } | null;
  prazo_personalizacao: string | null;
  autoriza_divulgacao: boolean;
  pagamento: { id: string | null; situacao: string | null; metodo: 'pix' | 'cartao' | null; parcelas: number | null };
  rastreio: string | null;
  token: string;
  itens: ItemDoPedido[];
  historico: { de: string | null; para: string; nota: string | null; quando: string; por: string | null }[];
  avisos: { canal: string; tipo: string; enviado_em: string | null; erro: string | null }[];
};

// Os endereços assinados (valem uma hora) das fotos de cada peça do pedido.
export type FotosDoItem = { original: string | null; recorte: string | null };
