// A montagem de uma Divestir: tudo o que o cliente escolhe no montador. Fica guardada
// no próprio navegador (briefing: "se a pessoa fechar a aba, volta de onde parou"),
// e o recorte da foto fica junto, no armazenamento do navegador (guardar.ts).
import { ENQUADRAMENTO_INICIAL, type Enquadramento, type Geometria } from '@/lib/foto/enquadramento';
import type { Lado } from '@/lib/molde/tipos';

export type FotoDaMontagem = {
  // Onde o recorte fica guardado no navegador.
  chave: string;
  // A linha da foto no banco e a sessão que a criou (null se o servidor não guardou).
  id: string | null;
  sessao: string | null;
  geometria: Geometria;
  // Quantos pixels da foto original cada pixel do recorte representa (null: não deu
  // para medir). É o que diz se a estampa vai ter definição (foto/definicao.ts).
  escalaDaOriginal: number | null;
  enquadramento: Enquadramento;
  aprovada: boolean;
  // Recorte feito no modo de teste do Photoroom (sai com marca d'água).
  teste: boolean;
  // Como ficou o envio da foto original para o espaço privado.
  original: 'enviando' | 'enviada' | 'falhou' | 'sem-vaga';
  criadaEm: string;
};

export type Montagem = {
  versao: 1;
  peca: string | null;
  cor: string | null;
  design: string | null;
  // Onde vai a estampa (null: o lado padrão do design).
  lado: Lado | null;
  campos: Record<string, string>;
  tamanho: string | null;
  foto: FotoDaMontagem | null;
  // A peça do carrinho que está sendo editada ("Editar", no carrinho).
  editando: string | null;
  // A peça do carrinho que saiu desta montagem ("Adicionar ao carrinho"): se a pessoa
  // mudar alguma coisa depois, a mudança vai para a mesma peça, sem duplicar.
  noCarrinho: string | null;
};

export const MONTAGEM_VAZIA: Montagem = {
  versao: 1,
  peca: null,
  cor: null,
  design: null,
  lado: null,
  campos: {},
  tamanho: null,
  foto: null,
  editando: null,
  noCarrinho: null,
};

// Presente (briefing, "Carrinho e checkout"): embalagem especial e cartão com a
// mensagem escrita pelo cliente, peça por peça.
export type Presente = { mensagem: string };

// Uma peça pronta no carrinho do navegador.
export type ItemDoCarrinho = {
  id: string;
  criadoEm: string;
  peca: string;
  cor: string;
  design: string;
  lado: Lado;
  campos: Record<string, string>;
  tamanho: string;
  foto: FotoDaMontagem;
  presente: Presente | null;
};

export type Carrinho = { versao: 1; itens: ItemDoCarrinho[] };

export const CARRINHO_VAZIO: Carrinho = { versao: 1, itens: [] };

// Um pedido feito neste navegador: as peças como estavam no carrinho, para a página
// do pedido mostrar as prévias (as fotos ficam no próprio aparelho).
export type PedidoGuardado = { token: string; numero: number; criadoEm: string; itens: ItemDoCarrinho[] };

// As fotos guardadas no banco são apagadas 30 dias depois, se a montagem não virar
// pedido (briefing, "Segurança desde o primeiro dia"). Aqui vale o mesmo prazo.
export const VALIDADE_DA_FOTO_EM_DIAS = 30;

// O que vem do armazenamento do navegador pode estar velho ou quebrado: tudo é
// conferido antes de entrar no montador.
const texto = (valor: unknown) => (typeof valor === 'string' && valor.length <= 200 ? valor : null);
const numero = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : null);
const lado = (valor: unknown): Lado | null => (valor === 'frente' || valor === 'costas' ? valor : null);

// Mensagem do cartão: até 240 letras, com as quebras de linha que a pessoa escreveu.
export const LIMITE_DO_CARTAO = 240;
function presente(valor: unknown): Presente | null {
  if (!valor || typeof valor !== 'object') return null;
  const mensagem = (valor as Record<string, unknown>).mensagem;
  return { mensagem: typeof mensagem === 'string' ? mensagem.slice(0, LIMITE_DO_CARTAO) : '' };
}

function campos(valor: unknown): Record<string, string> {
  if (!valor || typeof valor !== 'object') return {};
  const saida: Record<string, string> = {};
  for (const [chave, v] of Object.entries(valor as Record<string, unknown>)) {
    const t = texto(v);
    if (t !== null && /^[a-z_]{1,30}$/.test(chave)) saida[chave] = t.slice(0, 40);
  }
  return saida;
}

function geometria(valor: unknown): Geometria | null {
  if (!valor || typeof valor !== 'object') return null;
  const g = valor as Record<string, unknown>;
  const caixa = g.caixa as Record<string, unknown> | undefined;
  const largura = numero(g.largura);
  const altura = numero(g.altura);
  if (!largura || !altura || !caixa) return null;
  const x = numero(caixa.x);
  const y = numero(caixa.y);
  const cl = numero(caixa.largura);
  const ca = numero(caixa.altura);
  if (x === null || y === null || !cl || !ca) return null;
  return { largura, altura, caixa: { x, y, largura: cl, altura: ca } };
}

function enquadramento(valor: unknown): Enquadramento {
  if (!valor || typeof valor !== 'object') return ENQUADRAMENTO_INICIAL;
  const e = valor as Record<string, unknown>;
  const x = numero(e.x);
  const y = numero(e.y);
  const zoom = numero(e.zoom);
  if (x === null || y === null || !zoom) return ENQUADRAMENTO_INICIAL;
  return {
    x: Math.min(0.5, Math.max(-0.5, x)),
    y: Math.min(0.5, Math.max(-0.5, y)),
    zoom: Math.min(4, Math.max(0.5, zoom)),
  };
}

export function fotoVencida(foto: FotoDaMontagem, agora = Date.now()) {
  const criada = Date.parse(foto.criadaEm);
  return !Number.isFinite(criada) || agora - criada > VALIDADE_DA_FOTO_EM_DIAS * 24 * 60 * 60 * 1000;
}

export function lerFoto(valor: unknown): FotoDaMontagem | null {
  if (!valor || typeof valor !== 'object') return null;
  const f = valor as Record<string, unknown>;
  const chave = texto(f.chave);
  const g = geometria(f.geometria);
  const criadaEm = texto(f.criadaEm);
  if (!chave || !g || !criadaEm) return null;
  const original = f.original;
  const foto: FotoDaMontagem = {
    chave,
    id: texto(f.id),
    sessao: texto(f.sessao),
    geometria: g,
    escalaDaOriginal: (numero(f.escalaDaOriginal) ?? 0) > 0 ? numero(f.escalaDaOriginal) : null,
    enquadramento: enquadramento(f.enquadramento),
    aprovada: f.aprovada === true,
    teste: f.teste === true,
    // "enviando" só vale enquanto o envio está acontecendo nesta aba: quem lê o que
    // está guardado confere isso (guardar.ts).
    original:
      original === 'enviada' || original === 'falhou' || original === 'sem-vaga' || original === 'enviando'
        ? original
        : 'sem-vaga',
    criadaEm,
  };
  return fotoVencida(foto) ? null : foto;
}

export function lerMontagem(valor: unknown): Montagem | null {
  if (!valor || typeof valor !== 'object') return null;
  const m = valor as Record<string, unknown>;
  if (m.versao !== 1) return null;
  return {
    versao: 1,
    peca: texto(m.peca),
    cor: texto(m.cor),
    design: texto(m.design),
    lado: lado(m.lado),
    campos: campos(m.campos),
    tamanho: texto(m.tamanho),
    foto: lerFoto(m.foto),
    editando: texto(m.editando),
    noCarrinho: texto(m.noCarrinho),
  };
}

function lerItens(valor: unknown): ItemDoCarrinho[] {
  if (!Array.isArray(valor)) return [];
  const itens: ItemDoCarrinho[] = [];
  for (const bruto of valor.slice(0, 50)) {
    if (!bruto || typeof bruto !== 'object') continue;
    const i = bruto as Record<string, unknown>;
    const id = texto(i.id);
    const criadoEm = texto(i.criadoEm);
    const peca = texto(i.peca);
    const cor = texto(i.cor);
    const design = texto(i.design);
    const l = lado(i.lado);
    const tamanho = texto(i.tamanho);
    // Peça cuja foto já passou do prazo sai do carrinho: a foto também já saiu do banco.
    const foto = lerFoto(i.foto);
    if (!id || !criadoEm || !peca || !cor || !design || !l || !tamanho || !foto) continue;
    itens.push({
      id,
      criadoEm,
      peca,
      cor,
      design,
      lado: l,
      campos: campos(i.campos),
      tamanho,
      foto,
      presente: presente(i.presente),
    });
  }
  return itens;
}

export function lerCarrinho(valor: unknown): Carrinho {
  if (!valor || typeof valor !== 'object') return CARRINHO_VAZIO;
  const c = valor as Record<string, unknown>;
  if (c.versao !== 1 || !Array.isArray(c.itens)) return CARRINHO_VAZIO;
  return { versao: 1, itens: lerItens(c.itens) };
}

// Os pedidos feitos neste navegador, dos últimos 30 dias (o prazo das fotos).
export function lerPedidos(valor: unknown): PedidoGuardado[] {
  if (!valor || typeof valor !== 'object') return [];
  const lista = (valor as Record<string, unknown>).pedidos;
  if ((valor as Record<string, unknown>).versao !== 1 || !Array.isArray(lista)) return [];
  const pedidos: PedidoGuardado[] = [];
  for (const bruto of lista.slice(0, 20)) {
    if (!bruto || typeof bruto !== 'object') continue;
    const p = bruto as Record<string, unknown>;
    const token = texto(p.token);
    const criadoEm = texto(p.criadoEm);
    const numeroDoPedido = numero(p.numero);
    if (!token || !criadoEm || !numeroDoPedido) continue;
    const criado = Date.parse(criadoEm);
    if (!Number.isFinite(criado) || Date.now() - criado > VALIDADE_DA_FOTO_EM_DIAS * 24 * 60 * 60 * 1000) continue;
    pedidos.push({ token, numero: numeroDoPedido, criadoEm, itens: lerItens(p.itens) });
  }
  return pedidos;
}
