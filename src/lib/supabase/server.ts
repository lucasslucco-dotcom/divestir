import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cliente do Supabase para código que roda no servidor (páginas, rotas e server actions).
// Crie um novo a cada requisição; nunca reaproveite entre requisições.
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesParaGravar) {
          try {
            cookiesParaGravar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components não conseguem gravar cookies.
            // A renovação da sessão entra junto com o login da equipe (etapa 8).
          }
        },
      },
    },
  );
}
