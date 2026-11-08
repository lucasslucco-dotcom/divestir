// Guarda a montagem e o carrinho no próprio navegador, para a pessoa voltar de onde
// parou mesmo fechando a aba. As escolhas vão para o localStorage; o recorte da foto
// (uma imagem) vai para o IndexedDB, que aceita arquivos. Nada disso sai do aparelho:
// a foto original e o recorte do servidor ficam no espaço privado do Supabase.
// Tudo aqui pode falhar (aba anônima, armazenamento cheio ou bloqueado): o montador
// continua funcionando, só não lembra.
import { lerCarrinho, lerMontagem, type Carrinho, type Montagem } from './tipos';

const CHAVE_DA_MONTAGEM = 'divestir:montagem';
const CHAVE_DO_CARRINHO = 'divestir:carrinho';

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
export const lerCarrinhoGuardado = (): Carrinho => lerCarrinho(ler(CHAVE_DO_CARRINHO));
export const guardarCarrinho = (carrinho: Carrinho) => gravar(CHAVE_DO_CARRINHO, carrinho);

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

// Apaga os recortes que nenhuma montagem nem peça do carrinho usa mais.
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
