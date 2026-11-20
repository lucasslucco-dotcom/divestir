import 'server-only';
import { redirect } from 'next/navigation';
import { criarClienteServidor } from '../supabase/server';
import type { Eu } from './tipos';

// Quem está logado no painel. O login é do Supabase (e-mail e senha) e só entra quem
// está na tabela equipe: a rotina painel_eu devolve o nome e o papel, ou nada.
export async function quemEstaLogado() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: eu, error } = await supabase.rpc('painel_eu');
  if (error) console.error('painel: não consegui ler quem está logado', error.message);
  if (!eu || typeof eu !== 'object') return null;
  const email = typeof data.claims.email === 'string' ? data.claims.email : '';
  return { supabase, id, email, eu: eu as Eu };
}

// Para as páginas e ações do painel: sem login da equipe, volta para a entrada.
export async function exigirEquipe() {
  const sessao = await quemEstaLogado();
  if (!sessao) redirect('/painel/entrar');
  return sessao;
}

// Para o que é só do administrador (a equipe, cancelar pedido).
export async function exigirAdmin() {
  const sessao = await exigirEquipe();
  if (sessao.eu.papel !== 'admin') redirect('/painel');
  return sessao;
}

// A hora de agora, para as contas de "há quantos dias" feitas no servidor.
export const horaDoServidor = () => Date.now();
