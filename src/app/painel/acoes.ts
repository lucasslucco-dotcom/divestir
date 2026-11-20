'use server';

import { randomInt } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { estourouOLimite, MUITAS_TENTATIVAS } from '@/lib/limite';
import { exigirAdmin, exigirEquipe } from '@/lib/painel/sessao';
import { ehStatus, limparRastreio, nomeDoStatus } from '@/lib/painel/status';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import { criarClienteServidor } from '@/lib/supabase/server';
import { emailValido } from '@/lib/validar';

// As ações do painel da equipe. Toda ação confere de novo quem está logado: o painel
// nunca confia só na tela. O que mexe em pedido passa pelas rotinas do banco, que
// conferem a equipe mais uma vez e guardam quem mudou o quê.

// "email": o que a pessoa digitou na entrada, para ela não precisar digitar de novo.
export type Retorno = { erro: string; email?: string } | { ok: true } | null;

const texto = (dados: FormData, campo: string, maximo = 200) => {
  const valor = dados.get(campo);
  return typeof valor === 'string' ? valor.trim().slice(0, maximo) : '';
};

// --- Entrar e sair ---

export async function entrar(_antes: Retorno, dados: FormData): Promise<Retorno> {
  const email = texto(dados, 'email').toLowerCase();
  const senha = typeof dados.get('senha') === 'string' ? String(dados.get('senha')) : '';
  if (!emailValido(email) || !senha) return { erro: 'Preenche o e-mail e a senha.', email };
  if (await estourouOLimite(await headers(), 'entrar')) return { erro: MUITAS_TENTATIVAS, email };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return { erro: 'E-mail ou senha não conferem.', email };

  // Login certo, mas a pessoa não está na equipe: sai na hora.
  const { data: eu } = await supabase.rpc('painel_eu');
  if (!eu) {
    await supabase.auth.signOut();
    return { erro: 'Esse acesso não é da equipe da Divestir.', email };
  }
  redirect('/painel');
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect('/painel/entrar');
}

export async function trocarSenha(_antes: Retorno, dados: FormData): Promise<Retorno> {
  const { supabase } = await exigirEquipe();
  const nova = typeof dados.get('nova') === 'string' ? String(dados.get('nova')) : '';
  const repetida = typeof dados.get('repetida') === 'string' ? String(dados.get('repetida')) : '';
  if (nova.length < 8) return { erro: 'A senha precisa de pelo menos 8 letras ou números.' };
  if (nova.length > 72) return { erro: 'A senha passou de 72 caracteres.' };
  if (nova !== repetida) return { erro: 'As duas senhas não estão iguais.' };
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) {
    console.error('painel: não consegui trocar a senha', error.message);
    return { erro: 'Não consegui trocar a senha agora. Tenta de novo?' };
  }
  return { ok: true };
}

// --- Pedidos ---

const MOTIVOS: [RegExp, string][] = [
  [/falta o rastreio/, 'Falta o código de rastreio.'],
  [/rastreio comprido/, 'O código de rastreio está comprido demais.'],
  [/só o administrador/, 'Só o administrador cancela um pedido.'],
  [/mudança não permitida/, 'Esse pedido já mudou de etapa. Atualiza a página para ver onde ele está.'],
  [/sem permissão/, 'Seu acesso não permite essa mudança.'],
  [/não existe/, 'Não encontrei esse pedido.'],
];

export async function moverPedido(
  numero: number,
  para: string,
  extras: { rastreio?: string; nota?: string } = {},
): Promise<Retorno> {
  const { supabase } = await exigirEquipe();
  if (!Number.isInteger(numero) || !ehStatus(para)) return { erro: 'Pedido inválido.' };
  const rastreio = extras.rastreio ? limparRastreio(extras.rastreio) : '';
  if (para === 'enviado' && extras.rastreio !== undefined && !rastreio) return { erro: 'Falta o código de rastreio.' };

  const { error } = await supabase.rpc('painel_mover_pedido', {
    p_numero: numero,
    p_para: para,
    p_rastreio: rastreio || null,
    p_nota: extras.nota?.trim().slice(0, 500) || null,
  });
  if (error) {
    const motivo = MOTIVOS.find(([padrao]) => padrao.test(error.message))?.[1];
    if (!motivo) console.error(`painel: pedido ${numero} não foi para ${para}`, error.message);
    return { erro: motivo ?? `Não consegui levar o pedido para "${nomeDoStatus(para)}". Tenta de novo?` };
  }
  return { ok: true };
}

// --- Equipe (só o administrador) ---

// Senha provisória: 12 letras e números fáceis de ditar (sem 0/O, 1/l/I).
const LETRAS = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const senhaProvisoria = () => Array.from({ length: 12 }, () => LETRAS[randomInt(LETRAS.length)]).join('');

export type RetornoDaEquipe = { erro: string } | { ok: true; email: string; senha: string } | null;

export async function adicionarPessoa(_antes: RetornoDaEquipe, dados: FormData): Promise<RetornoDaEquipe> {
  await exigirAdmin();
  const nome = texto(dados, 'nome', 80);
  const email = texto(dados, 'email').toLowerCase();
  const papel = dados.get('papel') === 'admin' ? 'admin' : 'operacao';
  if (nome.length < 2) return { erro: 'Escreve o nome da pessoa.' };
  if (!emailValido(email)) return { erro: 'Confere o e-mail.' };

  const admin = criarClienteAdmin();
  if (!admin) return { erro: 'O painel ainda não consegue criar acessos (falta a chave do banco no servidor).' };
  const senha = senhaProvisoria();
  const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (error || !data.user) {
    if (/already|registered|exists/i.test(error?.message ?? '')) {
      return { erro: 'Já existe um acesso com esse e-mail.' };
    }
    console.error('painel: não consegui criar o acesso', error?.message);
    return { erro: 'Não consegui criar o acesso agora. Tenta de novo?' };
  }
  const { error: erroDaLinha } = await admin.from('equipe').insert({ user_id: data.user.id, nome, papel });
  if (erroDaLinha) {
    console.error('painel: criei o acesso, mas não a linha da equipe', erroDaLinha.message);
    await admin.auth.admin.deleteUser(data.user.id);
    return { erro: 'Não consegui criar o acesso agora. Tenta de novo?' };
  }
  return { ok: true, email, senha };
}

export async function novaSenhaProvisoria(usuario: string): Promise<RetornoDaEquipe> {
  const { id } = await exigirAdmin();
  if (usuario === id) return { erro: 'A sua senha você troca em "Minha senha".' };
  const admin = criarClienteAdmin();
  if (!admin) return { erro: 'Falta a chave do banco no servidor.' };
  const { data: linha } = await admin.from('equipe').select('user_id').eq('user_id', usuario).maybeSingle();
  if (!linha) return { erro: 'Não encontrei essa pessoa na equipe.' };
  const senha = senhaProvisoria();
  const { data, error } = await admin.auth.admin.updateUserById(usuario, { password: senha });
  if (error || !data.user) {
    console.error('painel: não consegui trocar a senha de alguém', error?.message);
    return { erro: 'Não consegui gerar a senha agora. Tenta de novo?' };
  }
  return { ok: true, email: data.user.email ?? '', senha };
}

export async function mudarPapel(usuario: string, papel: string): Promise<Retorno> {
  const { id } = await exigirAdmin();
  if (papel !== 'admin' && papel !== 'operacao') return { erro: 'Papel inválido.' };
  if (usuario === id) return { erro: 'Você não muda o seu próprio papel: peça a outro administrador.' };
  const admin = criarClienteAdmin();
  if (!admin) return { erro: 'Falta a chave do banco no servidor.' };
  const { error } = await admin.from('equipe').update({ papel }).eq('user_id', usuario);
  if (error) {
    console.error('painel: não consegui mudar o papel', error.message);
    return { erro: 'Não consegui mudar o papel agora. Tenta de novo?' };
  }
  return { ok: true };
}

export async function removerPessoa(usuario: string): Promise<Retorno> {
  const { id } = await exigirAdmin();
  if (usuario === id) return { erro: 'Você não remove o seu próprio acesso.' };
  const admin = criarClienteAdmin();
  if (!admin) return { erro: 'Falta a chave do banco no servidor.' };
  const { data: linha } = await admin.from('equipe').select('user_id').eq('user_id', usuario).maybeSingle();
  if (!linha) return { erro: 'Não encontrei essa pessoa na equipe.' };
  // Apagar o acesso apaga junto a linha da equipe (o banco faz isso sozinho).
  const { error } = await admin.auth.admin.deleteUser(usuario);
  if (error) {
    console.error('painel: não consegui remover o acesso', error.message);
    return { erro: 'Não consegui remover o acesso agora. Tenta de novo?' };
  }
  return { ok: true };
}
