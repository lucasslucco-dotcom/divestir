import 'server-only';
import { createHash } from 'node:crypto';
import { erro } from './api';
import { criarClienteAdmin } from './supabase/admin';

// Limite de uso por visitante (pedido do Lucas, 19/11/2026): cada rota que custa
// dinheiro ou espaço (o recorte, a vaga da foto, o frete, o pedido, o pagamento) aceita
// um número de chamadas por visitante num intervalo. Passou disso, a rota responde
// "espera um pouco" em vez de fazer o trabalho.
//
// O visitante é reconhecido pelo endereço de internet dele, que nunca é guardado: o
// banco só recebe um código embaralhado desse endereço (tabela uso, rotina contar_uso).
// Os limites são folgados de propósito: no celular, muita gente da mesma operadora sai
// pelo mesmo endereço, e ninguém que está comprando de verdade pode ser barrado.
//
// Se o banco não responder, a rota segue normalmente: o limite protege a conta, mas
// não pode derrubar a loja.

const HORA = 60 * 60;
const DIA = 24 * HORA;

type Regra = { limite: number; segundos: number; deTodos?: boolean };

// Por visitante, a cada hora (e, no recorte e na foto, também por dia).
export const LIMITES = {
  // Cada recorte custa no Photoroom. O teto "de todos" segura a conta do dia mesmo
  // que o abuso venha de muitos endereços ao mesmo tempo.
  recorte: [
    { limite: 60, segundos: HORA },
    { limite: 200, segundos: DIA },
    { limite: 3000, segundos: DIA, deTodos: true },
  ],
  // Cada vaga aceita um arquivo de até 20 MB no espaço das fotos.
  fotos: [
    { limite: 60, segundos: HORA },
    { limite: 200, segundos: DIA },
  ],
  frete: [{ limite: 120, segundos: HORA }],
  pedidos: [{ limite: 20, segundos: HORA }],
  pagamento: [{ limite: 30, segundos: HORA }],
} satisfies Record<string, Regra[]>;

export type RotaComLimite = keyof typeof LIMITES;

// Na Vercel, o endereço de quem chamou vem em x-real-ip (e no começo de
// x-forwarded-for), posto pela própria Vercel: quem chama não consegue trocar.
function enderecoDe(request: Request) {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sem-endereco';
}

// O código embaralhado do visitante: não dá para voltar dele ao endereço, e o
// tempero (a chave secreta do banco) impede que alguém refaça a conta por fora.
function codigoDoVisitante(request: Request) {
  const tempero = process.env.SUPABASE_SECRET_KEY ?? '';
  return createHash('sha256')
    .update(`${tempero}:${enderecoDe(request)}`)
    .digest('hex')
    .slice(0, 32);
}

// Conta a chamada e devolve a resposta de "espera um pouco" se passou do limite;
// devolve null quando está tudo bem e a rota pode seguir.
export async function passouDoLimite(request: Request, rota: RotaComLimite): Promise<Response | null> {
  const admin = criarClienteAdmin();
  if (!admin) return null;
  const visitante = codigoDoVisitante(request);
  const regras: Regra[] = LIMITES[rota];
  const contar = async (regra: Regra) => {
    const { data, error } = await admin.rpc('contar_uso', {
      p_chave: `${rota}:${regra.segundos}:${regra.deTodos ? 'todos' : visitante}`,
      p_limite: regra.limite,
      p_segundos: regra.segundos,
    });
    if (error) console.error(`limite: não consegui contar o uso de ${rota}`, error.message);
    return data !== false;
  };
  try {
    // Primeiro as contas do visitante; a conta "de todos" só anda se ele passou, para
    // quem já estourou o próprio limite não gastar o teto dos outros.
    const doVisitante = await Promise.all(regras.filter((r) => !r.deTodos).map(contar));
    let cabe = doVisitante.every(Boolean);
    for (const regra of regras.filter((r) => r.deTodos)) cabe = cabe && (await contar(regra));
    if (!cabe) {
      console.warn(`limite: ${rota} passou do limite (visitante ${visitante.slice(0, 8)})`);
      return erro('Foram muitas tentativas em pouco tempo. Espera uns minutinhos e tenta de novo?', 429);
    }
  } catch (motivo) {
    console.error(`limite: não consegui contar o uso de ${rota}`, motivo);
  }
  return null;
}
