// Abre a vaga para a foto original do cliente no espaço privado "fotos" do Supabase.
// Regra do projeto: "Fotos dos clientes ficam em bucket privado, com upload por URL assinada."
//
// O servidor cria a linha da foto na tabela fotos e uma URL assinada que vale para
// um arquivo só e expira em 2 horas. O navegador envia a foto direto para o Supabase
// por essa URL, sem passar pela Vercel (que aceita até 4,5 MB por envio, e a foto
// original pode ter até 20 MB).

import { randomUUID } from 'node:crypto';
import { erro, veioDeFora } from '@/lib/api';
import { ESPACO_DAS_FOTOS, LIMITE_DO_ESPACO, caminhoDaFoto, ehCodigo, extensaoDoTipo } from '@/lib/foto/espaco';
import { criarClienteAdmin } from '@/lib/supabase/admin';

// Briefing ("Segurança desde o primeiro dia"): fotos de montagens nunca compradas
// são apagadas depois de 30 dias. Quando a foto entra num pedido, o prazo muda.
const DIAS_ATE_APAGAR = 30;

function medida(valor: unknown, maximo: number) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor >= 0 && valor <= maximo ? valor : null;
}

export async function POST(request: Request) {
  if (veioDeFora(request)) return erro('Pedido de fora do site.', 403);
  const admin = criarClienteAdmin();
  if (!admin) return erro('Ainda não dá para guardar a foto.', 503);

  let dados: Record<string, unknown>;
  try {
    dados = await request.json();
  } catch {
    return erro('Pedido inválido.', 400);
  }

  const { sessao, tipo, tamanho } = dados;
  if (!ehCodigo(sessao)) return erro('Sessão inválida.', 400);
  const extensao = typeof tipo === 'string' ? extensaoDoTipo(tipo) : null;
  if (!extensao) return erro('Esse formato não dá.', 415);
  if (typeof tamanho !== 'number' || tamanho <= 0 || tamanho > LIMITE_DO_ESPACO) {
    return erro('A foto passou de 20 MB.', 413);
  }

  const id = randomUUID();
  const caminho = caminhoDaFoto(sessao, id, `original.${extensao}`);

  const { data: vaga, error: erroDaVaga } = await admin.storage.from(ESPACO_DAS_FOTOS).createSignedUploadUrl(caminho);
  if (erroDaVaga || !vaga) {
    console.error('fotos: não consegui criar a URL assinada', erroDaVaga?.message);
    return erro('Não consegui preparar o envio da foto.', 502);
  }

  const largura = medida(dados.largura, 100_000);
  const altura = medida(dados.altura, 100_000);
  const { error: erroDaLinha } = await admin.from('fotos').insert({
    id,
    sessao_id: sessao,
    original_url: caminho,
    largura: largura ? Math.round(largura) : null,
    altura: altura ? Math.round(altura) : null,
    nitidez: medida(dados.nitidez, 9_999_999),
    apagar_em: new Date(Date.now() + DIAS_ATE_APAGAR * 24 * 60 * 60 * 1000).toISOString(),
  });
  if (erroDaLinha) {
    console.error('fotos: não consegui registrar a foto', erroDaLinha.message);
    return erro('Não consegui preparar o envio da foto.', 502);
  }

  return Response.json({ id, url: vaga.signedUrl }, { headers: { 'Cache-Control': 'no-store' } });
}
