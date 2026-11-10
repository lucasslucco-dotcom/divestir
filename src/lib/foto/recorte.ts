// Recorte de fundo, do lado do navegador: reduz a foto e pede o recorte ao
// servidor do site (src/app/api/recorte), que fala com o Photoroom.
import { abrir } from './checar';

// 2.048 px no lado maior: nítido para a prévia e leve para enviar pelo celular.
const LADO_DO_ENVIO = 2048;
// A Vercel aceita até 4,5 MB por envio.
const LIMITE_DO_ENVIO = 4 * 1024 * 1024;

// "inteiro": o recorte veio no mesmo quadro da foto enviada (sem cortar a sobra em
// volta de quem aparece), então a foto com fundo encaixa nele.
export type Recorte = { url: string; recorte: Blob; teste: boolean; inteiro: boolean };
export type FotoParaRecorte = { foto: Blob; nome: string };

function ehHeic(arquivo: File) {
  return /hei[cf]/i.test(arquivo.type) || /\.hei[cf]$/i.test(arquivo.name);
}

export async function prepararParaRecorte(url: string, arquivo: File): Promise<FotoParaRecorte | null> {
  try {
    const imagem = await abrir(url);
    const escala = Math.min(1, LADO_DO_ENVIO / Math.max(imagem.naturalWidth, imagem.naturalHeight));
    const tela = document.createElement('canvas');
    tela.width = Math.round(imagem.naturalWidth * escala);
    tela.height = Math.round(imagem.naturalHeight * escala);
    const contexto = tela.getContext('2d');
    if (!contexto) return null;
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
    const foto = await new Promise<Blob | null>((resolver) => tela.toBlob(resolver, 'image/jpeg', 0.9));
    return foto ? { foto, nome: 'foto.jpg' } : null;
  } catch {
    // O navegador não abriu a foto. Se for HEIC do iPhone e couber no envio,
    // ela vai do jeito que está: o Photoroom lê HEIC.
    if (ehHeic(arquivo) && arquivo.size <= LIMITE_DO_ENVIO) return { foto: arquivo, nome: 'foto.heic' };
    return null;
  }
}

// Com a vaga aberta em /api/fotos, o servidor guarda o recorte ao lado da original.
export async function pedirRecorte(
  { foto, nome }: FotoParaRecorte,
  vaga?: { id: string; sessao: string } | null,
): Promise<Recorte> {
  const dados = new FormData();
  dados.append('foto', foto, nome);
  if (vaga) {
    dados.append('foto_id', vaga.id);
    dados.append('sessao', vaga.sessao);
  }
  let resposta: Response;
  try {
    resposta = await fetch('/api/recorte', { method: 'POST', body: dados });
  } catch {
    // O pedido nem saiu do aparelho: a internet caiu.
    throw new Error('Parece que a internet caiu. Confere a conexão e tenta de novo.');
  }
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
    throw new Error(corpo?.erro ?? 'Não consegui tirar o fundo agora.');
  }
  const recorte = await resposta.blob();
  return {
    url: URL.createObjectURL(recorte),
    recorte,
    teste: resposta.headers.get('x-recorte-modo') === 'teste',
    inteiro: resposta.headers.get('x-recorte-quadro') === 'inteiro',
  };
}
