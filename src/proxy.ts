import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Roda antes de toda página do painel (/painel): renova o login da equipe, que vence
// de hora em hora, e manda para a entrada quem não está logado. As páginas e as ações
// do painel conferem de novo quem é a pessoa: esta é só a porta da frente.
export async function proxy(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave) return resposta;

  const supabase = createServerClient(url, chave, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => request.cookies.set(name, value));
        resposta = NextResponse.next({ request });
        cookies.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const logado = !!data?.claims?.sub;
  const naEntrada = request.nextUrl.pathname === '/painel/entrar';

  if (!logado && !naEntrada) {
    const destino = request.nextUrl.clone();
    destino.pathname = '/painel/entrar';
    destino.search = '';
    const ida = NextResponse.redirect(destino);
    resposta.cookies.getAll().forEach((cookie) => ida.cookies.set(cookie));
    return ida;
  }
  return resposta;
}

export const config = {
  matcher: ['/painel', '/painel/:caminho*'],
};
