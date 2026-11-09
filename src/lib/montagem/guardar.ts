// Guarda a montagem e o carrinho no próprio navegador, para a pessoa voltar de onde
// parou mesmo fechando a aba. As escolhas vão para o localStorage; o recorte da foto
// (uma imagem) vai para o IndexedDB, que aceita arquivos. Nada disso sai do aparelho:
// a foto original e o recorte do servidor ficam no espaço privado do Supabase.
// Tudo aqui pode falhar (aba anônima, armazenamento cheio ou bloqueado): o montador
// continua funcionando, só não lembra.
import {
  MONTAGEM_VAZIA,
  lerCarrinho,
  lerMontagem,
  lerPedidos,
  type Carrinho,
  type ItemDoCarrinho,
  type Montagem,
  type PedidoGuardado,
} from './tipos';

const CHAVE_DA_MONTAGEM = 'divestir:montagem';
const CHAVE_DO_CARRINHO = 'divestir:carrinho';
const CHAVE_DOS_PEDIDOS = 'divestir:pedidos';
// Avisa a própria aba que o carrinho mudou (outras abas recebem o evento "storage").
export const EVENTO_DO_CARRINHO = 'divestir:carrinho';

function ler(chave: string): unknown {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaço ou sem permissão: segue sem guardar.
  }
}

export const lerMontagemGuardada = (): Montagem | null => lerMontagem(ler(CHAVE_DA_MONTAGEM));
export const guardarMontagem = (montagem: Montagem) => gravar(CHAVE_DA_MONTAGEM, montagem);

// Antes de abrir o montador: "Editar" (do carrinho) deixa guardada a peça escolhida,
// e "Criar outra Divestir" deixa guardada uma montagem vazia. O montador lê o que
// está guardado sempre que aparece (o site mantém a página escondida entre uma
// visita e outra), então não precisa de nada no endereço.
export function prepararEdicao(item: ItemDoCarrinho) {
  guardarMontagem({
    versao: 1,
    peca: item.peca,
    cor: item.cor,
    design: item.design,
    lado: item.lado,
    campos: item.campos,
    tamanho: item.tamanho,
    foto: { ...item.foto, aprovada: true },
    editando: item.id,
  });
}

export const prepararNovaMontagem = () => guardarMontagem(MONTAGEM_VAZIA);
export const lerCarrinhoGuardado = (): Carrinho => lerCarrinho(ler(CHAVE_DO_CARRINHO));
export function guardarCarrinho(carrinho: Carrinho) {
  gravar(CHAVE_DO_CARRINHO, carrinho);
  window.dispatchEvent(new Event(EVENTO_DO_CARRINHO));
}

// Quantas peças tem no carrinho, para o link do topo. Lê o texto guardado e só
// refaz a conta quando ele muda.
let ultimoTexto: string | null = null;
let ultimaConta = 0;
export function contarCarrinho(): number {
  let bruto: string | null = null;
  try {
    bruto = localStorage.getItem(CHAVE_DO_CARRINHO);
  } catch {
    return 0;
  }
  if (bruto !== ultimoTexto) {
    ultimoTexto = bruto;
    try {
      ultimaConta = lerCarrinho(bruto ? JSON.parse(bruto) : null).itens.length;
    } catch {
      ultimaConta = 0;
    }
  }
  return ultimaConta;
}

export function acompanharCarrinho(aoMudar: () => void) {
  const naOutraAba = (evento: StorageEvent) => {
    if (evento.key === null || evento.key === CHAVE_DO_CARRINHO) aoMudar();
  };
  window.addEventListener(EVENTO_DO_CARRINHO, aoMudar);
  window.addEventListener('storage', naOutraAba);
  return () => {
    window.removeEventListener(EVENTO_DO_CARRINHO, aoMudar);
    window.removeEventListener('storage', naOutraAba);
  };
}

// Tira do carrinho as peças de um pedido pago (lendo de novo: outra aba pode ter mexido).
export function tirarDoCarrinho(ids: string[]) {
  const atual = lerCarrinhoGuardado();
  const restantes = atual.itens.filter((item) => !ids.includes(item.id));
  if (restantes.length !== atual.itens.length) guardarCarrinho({ versao: 1, itens: restantes });
}

// Os pedidos feitos neste navegador (até 20, dos últimos 30 dias).
export const lerPedidosGuardados = (): PedidoGuardado[] => lerPedidos(ler(CHAVE_DOS_PEDIDOS));
export const lerPedidoGuardado = (token: string) => lerPedidosGuardados().find((p) => p.token === token) ?? null;
export function guardarPedido(pedido: PedidoGuardado) {
  const outros = lerPedidosGuardados().filter((p) => p.token !== pedido.token);
  gravar(CHAVE_DOS_PEDIDOS, { versao: 1, pedidos: [pedido, ...outros].slice(0, 20) });
}

// Os recortes que ainda servem: o da montagem, os do carrinho e os dos pedidos.
export function recortesEmUso(montagem: Montagem | null, carrinho: Carrinho): Set<string> {
  const chaves = new Set<string>();
  if (montagem?.foto) chaves.add(montagem.foto.chave);
  for (const item of carrinho.itens) chaves.add(item.foto.chave);
  for (const pedido of lerPedidosGuardados()) for (const item of pedido.itens) chaves.add(item.foto.chave);
  return chaves;
}

// Os recortes, no IndexedDB do navegador.
const BANCO = 'divestir';
const RECORTES = 'recortes';
let conexao: Promise<IDBDatabase> | null = null;

function abrirBanco(): Promise<IDBDatabase> {
  if (!conexao) {
    conexao = new Promise<IDBDatabase>((resolver, recusar) => {
      const pedido = indexedDB.open(BANCO, 1);
      pedido.onupgradeneeded = () => {
        if (!pedido.result.objectStoreNames.contains(RECORTES)) pedido.result.createObjectStore(RECORTES);
      };
      pedido.onsuccess = () => resolver(pedido.result);
      pedido.onerror = () => recusar(pedido.error);
      pedido.onblocked = () => recusar(new Error('O armazenamento do navegador está ocupado.'));
    });
    conexao.catch(() => {
      conexao = null;
    });
  }
  return conexao;
}

async function naLoja<T>(modo: IDBTransactionMode, fazer: (loja: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const banco = await abrirBanco();
  return new Promise<T>((resolver, recusar) => {
    const transacao = banco.transaction(RECORTES, modo);
    const pedido = fazer(transacao.objectStore(RECORTES));
    transacao.oncomplete = () => resolver(pedido.result);
    transacao.onerror = () => recusar(transacao.error);
    transacao.onabort = () => recusar(transacao.error);
  });
}

export async function guardarRecorte(chave: string, recorte: Blob): Promise<boolean> {
  try {
    await naLoja('readwrite', (loja) => loja.put(recorte, chave));
    return true;
  } catch {
    return false;
  }
}

export async function lerRecorte(chave: string): Promise<Blob | null> {
  try {
    const recorte = await naLoja<unknown>('readonly', (loja) => loja.get(chave));
    return recorte instanceof Blob ? recorte : null;
  } catch {
    return null;
  }
}

// Apaga os recortes que nenhuma montagem, peça do carrinho ou pedido usa mais.
export async function apagarRecortesFora(emUso: Set<string>) {
  try {
    const chaves = await naLoja<IDBValidKey[]>('readonly', (loja) => loja.getAllKeys());
    const sobrando = chaves.filter((chave) => typeof chave === 'string' && !emUso.has(chave));
    if (sobrando.length) {
      await naLoja('readwrite', (loja) => {
        let ultimo: IDBRequest<undefined> = loja.delete(sobrando[0]);
        for (const chave of sobrando.slice(1)) ultimo = loja.delete(chave);
        return ultimo;
      });
    }
  } catch {
    // Fica para a próxima.
  }
}
