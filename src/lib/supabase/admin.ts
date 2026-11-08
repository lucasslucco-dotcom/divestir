import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente do Supabase com a chave secreta (SUPABASE_SECRET_KEY), só para o servidor.
// Ele passa por cima das regras de acesso (RLS), então só faz o que as rotas do site
// mandam: abrir a vaga para a foto do cliente e guardar o recorte.
// A chave fica nas variáveis de ambiente da Vercel e nunca vai para o navegador.
// Sem a chave, devolve null e o site segue sem guardar a foto.
export function criarClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) return null;
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
