import 'server-only';
import { lerPacote } from './catalogo';
import type { PecaDoCheckout, PedidoCriado, PedidoDoCheckout, SituacaoDoPedido } from './checkout';
import { ESPACO_DAS_FOTOS, ehCodigo } from './foto/espaco';
import { cotarFrete, FreteIndisponivel } from './frete';
import { MAX_PECAS_POR_PEDIDO, PRAZO_EM_TEXTO, precoDaPeca, precoDoPresente, somar } from './loja';
import { buscarPagamento, pagamentoEmTeste, situacaoDoPagamento, type SituacaoDoPagamento } from './mercadopago';
import { LIMITE_DO_CARTAO } from './montagem/tipos';
import { ehConfigDoMolde, ladosDaPeca, type AreasDaPeca, type Lado } from './molde/tipos';
import { criarClienteAdmin } from './supabase/admin';
import {
  cepValido,
  cpfValido,
  emailValido,
  nomeCompletoValido,
  normalizarWhatsapp,
  soDigitos,
  ufValida,
  whatsappValido,
} from './validar';

// O pedido do lado do servidor: confere tudo o que o navegador mandou, refaz as
// contas (preço das peças, presente e frete) e grava pelas rotinas do banco. Nada
// do que o navegador diz sobre valores é usado: só o que está no banco.

export class PedidoRecusado extends Error {
  constructor(
    mensagem: string,
    readonly status = 400,
    // Peças cuja foto original não chegou ao espaço privado.
    readonly fotosPendentes: string[] = [],
  ) {
    super(mensagem);
  }
}

type Admin = NonNullable<ReturnType<typeof criarClienteAdmin>>;

function admin(): Admin {
  const cliente = criarClienteAdmin();
  if (!cliente) throw new PedidoRecusado('A loja ainda não está recebendo pedidos.', 503);
  return cliente;
}

// ---------------------------------------------------------------------------
// O que chega do navegador
// ---------------------------------------------------------------------------

const texto = (valor: unknown, maximo: number) =>
  typeof valor === 'string' ? valor.trim().replace(/\s+/g, ' ').slice(0, maximo) : '';

function lerPeca(valor: unknown): PecaDoCheckout | null {
  if (!valor || typeof valor !== 'object') return null;
  const p = valor as Record<string, unknown>;
  const foto = (p.foto ?? {}) as Record<string, unknown>;
  const enquadramento = (foto.enquadramento ?? {}) as Record<string, unknown>;
  const numero = (v: unknown, min: number, max: number, padrao: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao;
  const campos: Record<string, string> = {};
  if (p.campos && typeof p.campos === 'object') {
    for (const [chave, v] of Object.entries(p.campos as Record<string, unknown>)) {
      if (/^[a-z_]{1,30}$/.test(chave) && typeof v === 'string') campos[chave] = v.trim().slice(0, 40);
    }
  }
  const presente = p.presente && typeof p.presente === 'object' ? (p.presente as Record<string, unknown>) : null;
  const lado = p.lado === 'frente' || p.lado === 'costas' ? p.lado : null;
  if (!lado) return null;
  return {
    id: texto(p.id, 60),
    peca: texto(p.peca, 60),
    cor: texto(p.cor, 60),
    design: texto(p.design, 60),
    lado,
    tamanho: texto(p.tamanho, 5),
    campos,
    foto: {
      id: ehCodigo(foto.id) ? foto.id : null,
      sessao: ehCodigo(foto.sessao) ? foto.sessao : null,
      enquadramento: {
        x: numero(enquadramento.x, -0.5, 0.5, 0),
        y: numero(enquadramento.y, -0.5, 0.5, 0),
        zoom: numero(enquadramento.zoom, 0.5, 4, 1),
      },
    },
    presente: presente
      ? { mensagem: typeof presente.mensagem === 'string' ? presente.mensagem.trim().slice(0, LIMITE_DO_CARTAO) : '' }
      : null,
  };
}

export function lerPedidoDoCheckout(dados: unknown): PedidoDoCheckout {
  if (!dados || typeof dados !== 'object') throw new PedidoRecusado('Pedido inválido.');
  const d = dados as Record<string, unknown>;
  const contato = (d.contato ?? {}) as Record<string, unknown>;
  const endereco = (d.endereco ?? {}) as Record<string, unknown>;
  const pecas = Array.isArray(d.pecas) ? d.pecas.map(lerPeca) : [];
  if (!ehCodigo(d.chave)) throw new PedidoRecusado('Pedido inválido.');
  if (!pecas.length) throw new PedidoRecusado('O carrinho está vazio.');
  if (pecas.length > MAX_PECAS_POR_PEDIDO) {
    throw new PedidoRecusado(`Cabem até ${MAX_PECAS_POR_PEDIDO} peças num pedido.`);
  }
  if (pecas.some((p) => !p)) throw new PedidoRecusado('Uma das peças do carrinho veio quebrada. Monta ela de novo?');

  const pedido: PedidoDoCheckout = {
    chave: d.chave,
    contato: {
      nome: texto(contato.nome, 120),
      email: texto(contato.email, 160).toLowerCase(),
      whatsapp: normalizarWhatsapp(texto(contato.whatsapp, 30)),
      cpf: soDigitos(texto(contato.cpf, 20)),
    },
    endereco: {
      cep: soDigitos(texto(endereco.cep, 12)),
      rua: texto(endereco.rua, 160),
      numero: texto(endereco.numero, 20),
      complemento: texto(endereco.complemento, 80),
      bairro: texto(endereco.bairro, 80),
      cidade: texto(endereco.cidade, 80),
      uf: texto(endereco.uf, 2).toUpperCase(),
    },
    destinatario: texto(d.destinatario, 120) || null,
    frete: texto(d.frete, 60),
    termos: d.termos === true,
    divulgacao: d.divulgacao === true,
    pecas: pecas as PecaDoCheckout[],
  };

  const { contato: c, endereco: e } = pedido;
  if (!nomeCompletoValido(c.nome)) throw new PedidoRecusado('Confere o seu nome completo.');
  if (!emailValido(c.email)) throw new PedidoRecusado('Confere o seu e-mail.');
  if (!whatsappValido(c.whatsapp)) throw new PedidoRecusado('Confere o seu WhatsApp, com DDD.');
  if (!cpfValido(c.cpf)) throw new PedidoRecusado('Confere o seu CPF.');
  if (!cepValido(e.cep)) throw new PedidoRecusado('Confere o CEP.');
  if (e.rua.length < 2 || e.bairro.length < 2 || e.cidade.length < 2 || !e.numero) {
    throw new PedidoRecusado('Confere o endereço de entrega.');
  }
  if (!ufValida(e.uf)) throw new PedidoRecusado('Confere o estado do endereço.');
  if (!pedido.frete) throw new PedidoRecusado('Escolhe como o pedido vai chegar.');
  if (!pedido.termos) throw new PedidoRecusado('Para fechar o pedido, é preciso aceitar os termos.');
  const presente = pedido.pecas.some((p) => p.presente);
  if (!presente) pedido.destinatario = null;
  if (pedido.destinatario && !nomeCompletoValido(pedido.destinatario)) {
    throw new PedidoRecusado('Confere o nome completo de quem vai receber o presente.');
  }
  return pedido;
}

// ---------------------------------------------------------------------------
// Montar e criar o pedido
// ---------------------------------------------------------------------------

type LinhaDaPeca = {
  id: number;
  slug: string;
  nome: string;
  caimento: string;
  preco: number | string | null;
  tamanhos: string[] | null;
  area_impressao_cm: AreasDaPeca | null;
  envio: unknown;
  ativo: boolean;
};
type LinhaDaCor = { id: number; slug: string; ativo: boolean };
type LinhaDoDesign = { id: number; slug: string; config: unknown; status: string };
type LinhaDaFoto = { id: string; sessao_id: string; original_url: string };

async function conferirFotos(cliente: Admin, pecas: PecaDoCheckout[]) {
  const ids = [...new Set(pecas.map((p) => p.foto.id).filter((id): id is string => !!id))];
  const { data, error } = ids.length
    ? await cliente.from('fotos').select('id, sessao_id, original_url').in('id', ids)
    : { data: [], error: null };
  if (error) {
    console.error('pedidos: não consegui ler as fotos', error.message);
    throw new PedidoRecusado('Não consegui conferir as fotos agora. Tenta de novo em instantes?', 502);
  }
  const fotos = new Map((data as LinhaDaFoto[]).map((f) => [f.id, f]));

  // A original precisa estar no espaço privado: é dela que sai o arquivo de impressão.
  const chegou = new Map<string, boolean>();
  await Promise.all(
    [...fotos.values()].map(async (foto) => {
      const pasta = foto.original_url.split('/').slice(0, -1).join('/');
      const arquivo = foto.original_url.split('/').pop();
      const { data: lista, error: erroDaLista } = await cliente.storage
        .from(ESPACO_DAS_FOTOS)
        .list(pasta, { limit: 10 });
      if (erroDaLista) {
        console.error('pedidos: não consegui olhar o espaço das fotos', erroDaLista.message);
        throw new PedidoRecusado('Não consegui conferir as fotos agora. Tenta de novo em instantes?', 502);
      }
      chegou.set(foto.id, !!lista?.some((item) => item.name === arquivo));
    }),
  );

  const pendentes = pecas
    .filter((p) => {
      const foto = p.foto.id ? fotos.get(p.foto.id) : null;
      return !foto || foto.sessao_id !== p.foto.sessao || !chegou.get(foto.id);
    })
    .map((p) => p.id);
  if (pendentes.length) {
    throw new PedidoRecusado(
      pendentes.length === 1
        ? 'A foto de uma das peças não chegou até a gente. Manda ela de novo pelo carrinho?'
        : 'As fotos de algumas peças não chegaram até a gente. Manda de novo pelo carrinho?',
      409,
      pendentes,
    );
  }
}

export async function criarPedido(pedido: PedidoDoCheckout): Promise<PedidoCriado> {
  const cliente = admin();
  const teste = pagamentoEmTeste();
  const slugs = (campo: 'peca' | 'cor' | 'design') => [...new Set(pedido.pecas.map((p) => p[campo]))];

  const [pecas, cores, designs] = await Promise.all([
    cliente
      .from('pecas')
      .select('id, slug, nome, caimento, preco, tamanhos, area_impressao_cm, envio, ativo')
      .in('slug', slugs('peca')),
    cliente.from('cores').select('id, slug, ativo').in('slug', slugs('cor')),
    cliente.from('designs').select('id, slug, config, status').in('slug', slugs('design')),
  ]);
  if (pecas.error || cores.error || designs.error) {
    console.error('pedidos: não consegui ler o catálogo', (pecas.error ?? cores.error ?? designs.error)?.message);
    throw new PedidoRecusado('Não consegui fechar o pedido agora. Tenta de novo em instantes?', 502);
  }
  const pecaPorSlug = new Map((pecas.data as LinhaDaPeca[]).map((p) => [p.slug, p]));
  const corPorSlug = new Map((cores.data as LinhaDaCor[]).map((c) => [c.slug, c]));
  const designPorSlug = new Map((designs.data as LinhaDoDesign[]).map((d) => [d.slug, d]));

  const presente = precoDoPresente(teste);
  const itens = pedido.pecas.map((p) => {
    const peca = pecaPorSlug.get(p.peca);
    const cor = corPorSlug.get(p.cor);
    const design = designPorSlug.get(p.design);
    if (!peca?.ativo || !cor?.ativo || !design || design.status !== 'ativo' || !ehConfigDoMolde(design.config)) {
      throw new PedidoRecusado('Uma das peças do carrinho saiu de linha. Confere o carrinho?', 409);
    }
    const config = design.config;
    const areas = peca.area_impressao_cm ?? {};
    if (config.pecas_permitidas && !config.pecas_permitidas.includes(peca.slug)) {
      throw new PedidoRecusado(`O design ${p.design} não vai nessa peça. Confere o carrinho?`, 409);
    }
    if (!(peca.tamanhos ?? []).includes(p.tamanho)) throw new PedidoRecusado('Confere o tamanho das peças.', 409);
    if (!ladosDaPeca(areas).includes(p.lado)) throw new PedidoRecusado('Confere onde vai a estampa.', 409);
    const campos: Record<string, string> = {};
    for (const campo of config.campos) {
      const valor = (p.campos[campo.chave] ?? '').trim();
      if (!valor || valor.length > campo.max) throw new PedidoRecusado('Confere o nome que vai na estampa.', 409);
      campos[campo.chave] = valor;
    }
    const preco = precoDaPeca({ preco: peca.preco === null ? null : Number(peca.preco) }, teste);
    if (!preco) throw new PedidoRecusado('Essa peça ainda não está à venda.', 409);
    if (p.presente && !presente) throw new PedidoRecusado('A embalagem de presente ainda não está disponível.', 409);
    const lado: Lado = p.lado;
    return {
      pacote: lerPacote(peca.envio),
      linha: {
        peca_id: peca.id,
        cor_id: cor.id,
        design_id: design.id,
        tamanho: p.tamanho,
        foto_id: p.foto.id,
        campos,
        lado,
        enquadramento: p.foto.enquadramento,
        marca_no_peito: !!config.logo_peito && lado === 'costas' && !!areas.peito,
        presente: p.presente ? { mensagem: p.presente.mensagem } : null,
        preco: preco.valor,
        preco_presente: p.presente && presente ? presente.valor : 0,
      },
    };
  });

  await conferirFotos(cliente, pedido.pecas);

  const subtotal = somar(...itens.map((i) => somar(i.linha.preco, i.linha.preco_presente)));
  let opcoes;
  try {
    opcoes = await cotarFrete(
      pedido.endereco.cep,
      itens.map((i) => ({ pacote: i.pacote, valor: somar(i.linha.preco, i.linha.preco_presente) })),
    );
  } catch (motivo) {
    if (motivo instanceof FreteIndisponivel) {
      throw new PedidoRecusado('Não consegui confirmar o frete agora. Tenta de novo em instantes?', 502);
    }
    throw motivo;
  }
  const frete = opcoes.find((o) => o.id === pedido.frete);
  if (!frete) throw new PedidoRecusado('O frete escolhido mudou. Escolhe de novo, por favor.', 409);

  const { contato, endereco } = pedido;
  const { data, error } = await cliente.rpc('criar_pedido', {
    dados: {
      chave_do_checkout: pedido.chave,
      nome: contato.nome,
      email: contato.email,
      whatsapp: contato.whatsapp,
      cpf: contato.cpf,
      endereco: { ...endereco, destinatario: pedido.destinatario ?? contato.nome },
      presente: pedido.destinatario ? { destinatario: pedido.destinatario } : null,
      subtotal,
      desconto: 0,
      frete: frete.preco,
      frete_servico: {
        id: frete.id,
        transportadora: frete.transportadora,
        servico: frete.servico,
        preco: frete.preco,
        prazo_min: frete.prazo.min,
        prazo_max: frete.prazo.max,
        simulado: frete.simulado,
      },
      total: somar(subtotal, frete.preco),
      prazo_personalizacao: PRAZO_EM_TEXTO,
      termos_aceitos_em: new Date().toISOString(),
      autoriza_divulgacao: pedido.divulgacao,
      teste,
      itens: itens.map((i) => i.linha),
    },
  });
  const criado = Array.isArray(data) ? data[0] : data;
  if (error || !criado) {
    console.error('pedidos: a rotina criar_pedido falhou', error?.message);
    throw new PedidoRecusado('Não consegui fechar o pedido agora. Tenta de novo em instantes?', 502);
  }
  return {
    token: String(criado.token_do_pedido),
    numero: Number(criado.numero_do_pedido),
    total: Number(criado.total_do_pedido),
  };
}

// ---------------------------------------------------------------------------
// Ler o pedido e registrar pagamentos
// ---------------------------------------------------------------------------

export type LinhaDoPedido = {
  id: number;
  numero: number;
  nome: string;
  email: string;
  whatsapp: string;
  cpf: string | null;
  endereco: Record<string, string> | null;
  status: string;
  teste: boolean;
  subtotal: number | string;
  frete: number | string;
  total: number | string;
  frete_servico: SituacaoDoPedido['freteServico'];
  prazo_personalizacao: string | null;
  pagamento_id: string | null;
  pagamento_situacao: string | null;
  pagamento_metodo: 'pix' | 'cartao' | null;
  pago_em: string | null;
};

const COLUNAS_DO_PEDIDO =
  'id, numero, nome, email, whatsapp, cpf, endereco, status, teste, subtotal, frete, total, frete_servico, prazo_personalizacao, pagamento_id, pagamento_situacao, pagamento_metodo, pago_em';

export async function lerPedido(token: string): Promise<LinhaDoPedido | null> {
  if (!ehCodigo(token)) return null;
  const { data, error } = await admin()
    .from('pedidos')
    .select(COLUNAS_DO_PEDIDO)
    .eq('token_acompanhamento', token)
    .maybeSingle();
  if (error) {
    console.error('pedidos: não consegui ler o pedido', error.message);
    throw new PedidoRecusado('Não consegui abrir o pedido agora. Tenta de novo em instantes?', 502);
  }
  return (data as LinhaDoPedido | null) ?? null;
}

export async function lerPedidoPorNumero(numero: number): Promise<LinhaDoPedido | null> {
  const { data, error } = await admin().from('pedidos').select(COLUNAS_DO_PEDIDO).eq('numero', numero).maybeSingle();
  if (error) throw new PedidoRecusado('Não consegui abrir o pedido agora.', 502);
  return (data as LinhaDoPedido | null) ?? null;
}

// Registra o que o Mercado Pago disse sobre um pagamento. "novo": é a tentativa que
// o site acabou de criar. Devolve o status do pedido depois do registro.
export async function registrarPagamento(
  pedido: Pick<LinhaDoPedido, 'id' | 'numero'>,
  situacao: SituacaoDoPagamento,
  novo = false,
) {
  const { data, error } = await admin().rpc('registrar_pagamento', {
    p_pedido: pedido.id,
    p_pagamento: { ...situacao, novo },
  });
  if (error) {
    console.error('pedidos: a rotina registrar_pagamento falhou', error.message);
    throw new PedidoRecusado('Não consegui registrar o pagamento agora.', 502);
  }
  if (data === 'pago_em_dobro') {
    // O cliente pagou duas vezes o mesmo pedido: a equipe precisa devolver um dos dois.
    console.error(
      `pedidos: COBRANÇA EM DOBRO no pedido ${pedido.numero} (pagamento ${situacao.id}). Devolver pelo Mercado Pago.`,
    );
  }
  return String(data);
}

// Pergunta ao Mercado Pago como está o pagamento atual de um pedido ainda não pago
// (para quando o aviso do Mercado Pago atrasa ou não chega).
export async function conferirPagamento(pedido: LinhaDoPedido) {
  if (pedido.pago_em || !pedido.pagamento_id) return false;
  const pagamento = await buscarPagamento(pedido.pagamento_id).catch(() => null);
  if (!pagamento) return false;
  const situacao = situacaoDoPagamento(pagamento);
  if (situacao.situacao === pedido.pagamento_situacao) return false;
  await registrarPagamento(pedido, situacao);
  return true;
}

function mascararEmail(email: string) {
  const [usuario, dominio] = email.split('@');
  if (!usuario || !dominio) return '';
  return `${usuario.slice(0, Math.min(2, usuario.length - 1) || 1)}•••@${dominio}`;
}

const nomeDaPeca = (peca: { nome: string; caimento: string }, repetido: boolean) =>
  repetido ? `${peca.nome} ${peca.caimento.toLocaleLowerCase('pt-BR')}` : peca.nome;

export async function situacaoDoPedido(pedido: LinhaDoPedido): Promise<Omit<SituacaoDoPedido, 'pix'>> {
  const cliente = admin();
  const { data: itens, error } = await cliente
    .from('itens_pedido')
    .select('peca_id, cor_id, design_id, tamanho, campos, lado, presente')
    .eq('pedido_id', pedido.id)
    .order('id');
  if (error) throw new PedidoRecusado('Não consegui abrir o pedido agora. Tenta de novo em instantes?', 502);
  const linhas = (itens ?? []) as {
    peca_id: number;
    cor_id: number;
    design_id: number;
    tamanho: string;
    campos: Record<string, string>;
    lado: Lado;
    presente: unknown;
  }[];
  const ids = (campo: 'peca_id' | 'cor_id' | 'design_id') => [...new Set(linhas.map((l) => l[campo]))];
  const [pecas, cores, designs] = await Promise.all([
    cliente.from('pecas').select('id, nome, caimento'),
    cliente.from('cores').select('id, nome').in('id', ids('cor_id')),
    cliente.from('designs').select('id, nome').in('id', ids('design_id')),
  ]);
  const todas = (pecas.data ?? []) as { id: number; nome: string; caimento: string }[];
  const peca = new Map(todas.map((p) => [p.id, nomeDaPeca(p, todas.filter((o) => o.nome === p.nome).length > 1)]));
  const cor = new Map(((cores.data ?? []) as { id: number; nome: string }[]).map((c) => [c.id, c.nome]));
  const design = new Map(((designs.data ?? []) as { id: number; nome: string }[]).map((d) => [d.id, d.nome]));

  return {
    numero: Number(pedido.numero),
    primeiroNome: pedido.nome.split(' ')[0] ?? '',
    status: pedido.status,
    pago: !!pedido.pago_em,
    teste: pedido.teste,
    subtotal: Number(pedido.subtotal),
    frete: Number(pedido.frete),
    total: Number(pedido.total),
    freteServico: pedido.frete_servico,
    prazoPersonalizacao: pedido.prazo_personalizacao,
    emailParcial: mascararEmail(pedido.email),
    pagamento: { situacao: pedido.pagamento_situacao, metodo: pedido.pagamento_metodo },
    pecas: linhas.map((l) => ({
      peca: peca.get(l.peca_id) ?? 'Peça',
      cor: cor.get(l.cor_id) ?? '',
      design: design.get(l.design_id) ?? '',
      tamanho: l.tamanho,
      nome: (l.campos?.nome ?? '').toLocaleUpperCase('pt-BR'),
      lado: l.lado,
      presente: !!l.presente,
    })),
  };
}
