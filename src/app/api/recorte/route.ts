// Recorte de fundo da foto do cliente, pelo Photoroom (briefing, tabela "Stack":
// "API de remoção de fundo"). A chave fica só no servidor (PHOTOROOM_API_KEY,
// nas variáveis de ambiente da Vercel) e nunca chega ao navegador.
//
// Enquanto PHOTOROOM_MODO não for "producao", o recorte roda no modo de teste
// gratuito do Photoroom (até 100 por dia, com marca d'água).

export const maxDuration = 30;

// A Vercel aceita até 4,5 MB por envio; o navegador reduz a foto antes de mandar.
const LIMITE_BYTES = 4 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

function erro(mensagem: string, status: number) {
  return Response.json({ erro: mensagem }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const chave = process.env.PHOTOROOM_API_KEY;
  if (!chave) return erro('O recorte ainda não está ligado.', 503);

  // Só aceita pedidos vindos do próprio site.
  const origem = request.headers.get('origin');
  if (origem && new URL(origem).host !== request.headers.get('host')) {
    return erro('Pedido de fora do site.', 403);
  }

  let foto: FormDataEntryValue | null;
  try {
    foto = (await request.formData()).get('foto');
  } catch {
    return erro('Não deu para ler a foto.', 400);
  }
  if (!(foto instanceof File)) return erro('Faltou a foto.', 400);
  if (!TIPOS.includes(foto.type)) return erro('Esse formato não dá para recortar.', 415);
  if (foto.size > LIMITE_BYTES) return erro('A foto chegou grande demais.', 413);

  const teste = process.env.PHOTOROOM_MODO !== 'producao';
  const chaveDoModo = teste && !chave.startsWith('sandbox_') ? `sandbox_${chave}` : chave;

  const envio = new FormData();
  envio.append('image_file', foto, 'foto.jpg');
  envio.append('format', 'webp'); // mantém a transparência com arquivo leve
  envio.append('size', 'hd'); // até 4 megapixels, de sobra para a prévia

  let resposta: Response;
  try {
    resposta = await fetch('https://sdk.photoroom.com/v1/segment', {
      method: 'POST',
      headers: { 'x-api-key': chaveDoModo },
      body: envio,
      signal: AbortSignal.timeout(25_000),
    });
  } catch (motivo) {
    console.error('recorte: o Photoroom não respondeu', motivo);
    return erro('O recorte demorou demais. Tenta de novo?', 504);
  }

  if (!resposta.ok) {
    const detalhe = (await resposta.text().catch(() => '')).slice(0, 300);
    console.error(`recorte: Photoroom respondeu ${resposta.status}`, detalhe);
    return erro('Não consegui tirar o fundo dessa foto agora.', 502);
  }

  return new Response(await resposta.arrayBuffer(), {
    headers: {
      'Content-Type': resposta.headers.get('content-type') ?? 'image/webp',
      'Cache-Control': 'no-store',
      'X-Recorte-Modo': teste ? 'teste' : 'producao',
    },
  });
}
