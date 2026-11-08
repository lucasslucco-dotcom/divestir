import { createClient } from '@supabase/supabase-js';

// Cliente do Supabase para leituras públicas no servidor (catálogo, designs ativos).
// Não usa sessão nem cookies, então pode ser guardado em cache e servir qualquer visitante.
// Usa só a chave publicável: o que ela pode ler é decidido pelas regras (RLS) do banco.
export function criarClientePublico() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
