// Recorte de fundo, do lado do navegador: reduz a foto e pede o recorte ao
// servidor do site (src/app/api/recorte), que fala com o Photoroom.
import { abrir } from './checar';

// 2.048 px no lado maior: nítido para a prévia e leve para enviar pelo celular.
const LADO_DO_ENVIO = 2048;

export type Recorte = { url: string; teste: boolean };

export async function prepararParaRecorte(url: string): Promise<Blob | null> {
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
    return await new Promise<Blob | null>((resolver) => tela.toBlob(resolver, 'image/jpeg', 0.9));
  } catch {
    return null;
  }
}

export async function pedirRecorte(foto: Blob): Promise<Recorte> {
  const dados = new FormData();
  dados.append('foto', foto, 'foto.jpg');
  const resposta = await fetch('/api/recorte', { method: 'POST', body: dados });
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null;
    throw new Error(corpo?.erro ?? 'Não consegui tirar o fundo agora.');
  }
  const imagem = await resposta.blob();
  return { url: URL.createObjectURL(imagem), teste: resposta.headers.get('x-recorte-modo') === 'teste' };
}
