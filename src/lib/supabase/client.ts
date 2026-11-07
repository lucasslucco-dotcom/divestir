import { createBrowserClient } from '@supabase/ssr';

// Cliente do Supabase para código que roda no navegador.
// Usa só a chave publicável: o que ela pode ler é decidido pelas regras (RLS) do banco.
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
