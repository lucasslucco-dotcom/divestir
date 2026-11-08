// Ajudas para as rotas do site (src/app/api).

export function erro(mensagem: string, status: number) {
  return Response.json({ erro: mensagem }, { status, headers: { 'Cache-Control': 'no-store' } });
}

// Só aceita pedidos vindos do próprio site: em todo envio, o navegador diz de
// qual endereço ele saiu (o cabeçalho Origin).
export function veioDeFora(request: Request) {
  const origem = request.headers.get('origin');
  if (!origem) return false;
  try {
    return new URL(origem).host !== request.headers.get('host');
  } catch {
    return true;
  }
}
