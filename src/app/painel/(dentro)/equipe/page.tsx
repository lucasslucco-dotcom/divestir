import { connection } from 'next/server';
import { Suspense } from 'react';
import { exigirAdmin } from '@/lib/painel/sessao';
import type { Papel } from '@/lib/painel/tipos';
import { criarClienteAdmin } from '@/lib/supabase/admin';
import { Equipe, type Pessoa } from './equipe';

// Equipe (briefing: "usuários do painel com dois papéis: administrador (tudo) e
// operação (pedidos e lotes)"). Só o administrador abre esta tela.

async function Pessoas() {
  await connection();
  const { supabase, id } = await exigirAdmin();
  const { data, error } = await supabase.from('equipe').select('user_id, nome, papel, criado_em').order('criado_em');
  if (error) throw new Error(`Não consegui ler a equipe: ${error.message}`);

  // O e-mail de cada pessoa fica no cadastro de acesso, que só o servidor lê.
  const admin = criarClienteAdmin();
  const pessoas: Pessoa[] = await Promise.all(
    (data ?? []).map(async (linha) => {
      const acesso = admin ? await admin.auth.admin.getUserById(linha.user_id) : null;
      return {
        id: linha.user_id as string,
        nome: linha.nome as string,
        papel: linha.papel as Papel,
        email: acesso?.data.user?.email ?? '',
      };
    }),
  );
  return <Equipe pessoas={pessoas} eu={id} />;
}

export default function PaginaDaEquipe() {
  return (
    <>
      <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Equipe</h1>
      <p className="mt-4 max-w-[58ch] leading-relaxed">
        Quem entra no painel. <span className="font-semibold">Administrador</span> faz tudo, inclusive cancelar pedido e
        mexer na equipe. <span className="font-semibold">Operação</span> cuida dos pedidos.
      </p>
      <Suspense
        fallback={
          <p aria-busy="true" className="mt-10 text-[0.9375rem]">
            Abrindo a equipe…
          </p>
        }
      >
        <Pessoas />
      </Suspense>
    </>
  );
}
