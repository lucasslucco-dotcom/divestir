// Os status de um pedido, na ordem em que ele anda (briefing, "Status do pedido e aviso
// automático"), com o nome que a equipe lê no painel e os caminhos que o banco deixa
// passar (os mesmos da rotina painel_mover_pedido). Vale para o navegador e o servidor.

export type Status =
  | 'aguardando_pagamento'
  | 'pago'
  | 'revisao_arte'
  | 'ajuste_foto'
  | 'em_producao'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export const NOME_DO_STATUS: Record<Status, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  revisao_arte: 'Revisão de arte',
  ajuste_foto: 'Ajuste de foto',
  em_producao: 'Em produção',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

// As colunas do quadro: o que a equipe move no dia a dia.
export const COLUNAS_DO_QUADRO: Status[] = ['revisao_arte', 'ajuste_foto', 'em_producao', 'enviado', 'entregue'];

// Todos, na ordem do filtro da lista.
export const TODOS_OS_STATUS: Status[] = [
  'aguardando_pagamento',
  'revisao_arte',
  'ajuste_foto',
  'em_producao',
  'enviado',
  'entregue',
  'cancelado',
];

const CAMINHOS: Record<Status, Status[]> = {
  aguardando_pagamento: ['cancelado'],
  pago: ['revisao_arte', 'cancelado'],
  revisao_arte: ['em_producao', 'ajuste_foto', 'cancelado'],
  ajuste_foto: ['revisao_arte', 'cancelado'],
  em_producao: ['enviado', 'revisao_arte', 'cancelado'],
  enviado: ['entregue', 'em_producao'],
  entregue: ['enviado'],
  cancelado: [],
};

export const ehStatus = (valor: unknown): valor is Status => typeof valor === 'string' && valor in NOME_DO_STATUS;

export const nomeDoStatus = (status: string) => (ehStatus(status) ? NOME_DO_STATUS[status] : status);

export function podeMover(de: string, para: string) {
  return ehStatus(de) && ehStatus(para) && CAMINHOS[de].includes(para);
}

// O rastreio que a transportadora dá: letras, números e traço, até 60.
export const limparRastreio = (texto: string) =>
  texto
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 60);

// Os avisos que o cliente recebe por e-mail, com o nome que a equipe lê no painel.
export const NOME_DO_AVISO: Record<string, string> = {
  pago: 'Recebemos seu pedido',
  ajuste_foto: 'Precisamos de uma foto melhor',
  em_producao: 'Sua Divestir está sendo feita',
  enviado: 'Saiu pra entrega',
  entregue: 'Chegou',
};
