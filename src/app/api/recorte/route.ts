// Recorte de fundo da foto do cliente, pelo Photoroom (briefing, tabela "Stack":
// "API de remoção de fundo"). A chave fica só no servidor (PHOTOROOM_API_KEY,
// nas variáveis de ambiente da Vercel) e nunca chega ao navegador.
//
// Enquanto PHOTOROOM_MODO não for "producao", o recorte roda no modo de teste
// gratuito do Photoroom (até 100 por dia, com marca d'água).
//
// Quando o navegador manda também o código da foto e da sessão (a vaga aberta em
// /api/fotos), o recorte fica guardado no espaço privado "fotos", ao lado da original.

import { erro, veioDeFora } from '@/lib/api';
import { ESPACO_DAS_FOTOS, caminhoDaFoto, ehCodigo, extensaoDoTipo } from '@/lib/foto/espaco';
import { criarClienteAdmin } from '@/lib/supabase/admin';

export const maxDuration = 30;

// A Vercel aceita até 4,5 MB por envio; o navegador reduz a foto antes de mandar.
const LIMITE_BYTES = 4 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

// HEIC (o formato do iPhone) chega às vezes sem tipo; vale a extensão do nome.
function ehHeic(foto: File) {
  return /hei[cf]/i.test(foto.type) || /\.hei[cf]$/i.test(foto.name);
}

async function guardarRecorte(foto: unknown, sessao: unknown, recorte: ArrayBuffer, tipo: string) {
  if (!ehCodigo(foto) || !ehCodigo(sessao)) return false;
  const admin = criarClienteAdmin();
  if (!admin) return false;

  // O recorte só vai para a foto daquela sessão.
  const { data: linha } = await admin.from('fotos').select('sessao_id').eq('id', foto).maybeSingle();
  if (!linha || linha.sessao_id !== sessao) return false;

  const caminho = caminhoDaFoto(sessao, foto, `recorte.${extensaoDoTipo(tipo) ?? 'webp'}`);
  const { error: erroDoArquivo } = await admin.storage
    .from(ESPACO_DAS_FOTOS)
    .upload(caminho, recorte, { contentType: tipo, upsert: true });
  if (erroDoArquivo) {
    console.error('recorte: não consegui guardar o arquivo', erroDoArquivo.message);
    return false;
  }
  const { error: erroDaLinha } = await admin.from('fotos').update({ recorte_url: caminho }).eq('id', foto);
  if (erroDaLinha) {
    console.error('recorte: não consegui registrar o recorte', erroDaLinha.message);
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const chave = process.env.PHOTOROOM_API_KEY;
  if (!chave) return erro('O recorte ainda não está ligado.', 503);
  if (veioDeFora(request)) return erro('Pedido de fora do site.', 403);

  let dados: FormData;
  try {
    dados = await request.formData();
  } catch {
    return erro('Não deu para ler a foto.', 400);
  }
  const foto = dados.get('foto');
  if (!(foto instanceof File)) return erro('Faltou a foto.', 400);
  if (!TIPOS.includes(foto.type) && !ehHeic(foto)) return erro('Esse formato não dá para recortar.', 415);
  if (foto.size > LIMITE_BYTES) return erro('A foto chegou grande demais.', 413);

  const teste = process.env.PHOTOROOM_MODO !== 'producao';
  const chaveDoModo = teste && !chave.startsWith('sandbox_') ? `sandbox_${chave}` : chave;

  const envio = new FormData();
  envio.append('image_file', foto, ehHeic(foto) ? 'foto.heic' : 'foto.jpg');
  envio.append('format', 'webp'); // mantém a transparência com arquivo leve
  envio.append('size', 'hd'); // até 4 megapixels, de sobra para a prévia
  envio.append('crop', 'true'); // corta a sobra transparente em volta do protagonista

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

  const recorte = await resposta.arrayBuffer();
  const tipo = resposta.headers.get('content-type')?.split(';')[0] ?? 'image/webp';
  const guardado = await guardarRecorte(dados.get('foto_id'), dados.get('sessao'), recorte, tipo).catch((motivo) => {
    console.error('recorte: falhou ao guardar', motivo);
    return false;
  });

  return new Response(recorte, {
    headers: {
      'Content-Type': tipo,
      'Cache-Control': 'no-store',
      'X-Recorte-Modo': teste ? 'teste' : 'producao',
      'X-Recorte-Guardado': guardado ? 'sim' : 'nao',
    },
  });
}
