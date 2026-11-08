// Guarda a foto original do cliente no espaço privado "fotos" do Supabase.
// Primeiro o servidor do site abre a vaga (/api/fotos) e devolve uma URL assinada;
// depois o navegador envia a foto direto para o Supabase por ela, sem passar pela
// Vercel. A URL vale para um arquivo só, e a foto não fica visível para ninguém de
// fora: só a equipe logada vê o que tem no espaço.
import { abrir } from './checar';
import { LIMITE_DO_ESPACO, ehCodigo, tipoDaFoto } from './espaco';

export type Vaga = { id: string; sessao: string; url: string };
export type Medidas = { largura?: number; altura?: number; nitidez?: number };

const CHAVE_DA_SESSAO = 'divestir:sessao';
// Fotos acima do limite são refeitas em JPEG com até 16 megapixels, o máximo
// que o Safari do iPhone desenha de uma vez.
const PIXELS_MAXIMOS = 16_000_000;

let sessaoDaAba: string | undefined;

export function codigoNovo(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// A sessão junta as fotos de uma mesma pessoa neste navegador ("Criar outra
// Divestir" reaproveita a foto). Fica guardada no próprio navegador.
export function sessaoDoNavegador(): string {
  if (sessaoDaAba) return sessaoDaAba;
  try {
    const salva = localStorage.getItem(CHAVE_DA_SESSAO);
    if (ehCodigo(salva)) return (sessaoDaAba = salva);
    sessaoDaAba = codigoNovo();
    localStorage.setItem(CHAVE_DA_SESSAO, sessaoDaAba);
  } catch {
    sessaoDaAba ??= codigoNovo();
  }
  return sessaoDaAba;
}

type Original = { foto: Blob; tipo: string; nome: string };

async function prepararOriginal(arquivo: File, url: string): Promise<Original | null> {
  const tipo = tipoDaFoto(arquivo.name, arquivo.type);
  if (!tipo) return null;
  if (arquivo.size <= LIMITE_DO_ESPACO) {
    // A foto vai como está, só com o tipo certo (o HEIC às vezes chega sem tipo).
    const foto = arquivo.type === tipo ? arquivo : new Blob([arquivo], { type: tipo });
    return { foto, tipo, nome: arquivo.name };
  }
  // Passou de 20 MB: refaz em JPEG de alta qualidade, sem perder a resolução que importa.
  try {
    const imagem = await abrir(url);
    const pixels = imagem.naturalWidth * imagem.naturalHeight;
    const escala = Math.min(1, Math.sqrt(PIXELS_MAXIMOS / pixels));
    const tela = document.createElement('canvas');
    tela.width = Math.round(imagem.naturalWidth * escala);
    tela.height = Math.round(imagem.naturalHeight * escala);
    const contexto = tela.getContext('2d');
    if (!contexto) return null;
    contexto.imageSmoothingQuality = 'high';
    contexto.drawImage(imagem, 0, 0, tela.width, tela.height);
    const foto = await new Promise<Blob | null>((resolver) => tela.toBlob(resolver, 'image/jpeg', 0.92));
    if (!foto || foto.size > LIMITE_DO_ESPACO) return null;
    return { foto, tipo: 'image/jpeg', nome: 'original.jpg' };
  } catch {
    return null;
  }
}

const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// Abre a vaga e já devolve o que o envio vai precisar. Se o servidor não puder
// guardar agora, devolve null e o recorte segue normalmente.
export async function abrirVaga(arquivo: File, url: string, medidas: Medidas) {
  const original = await prepararOriginal(arquivo, url);
  if (!original) return null;
  const sessao = sessaoDoNavegador();
  try {
    const resposta = await fetch('/api/fotos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessao, tipo: original.tipo, tamanho: original.foto.size, ...medidas }),
    });
    if (!resposta.ok) return null;
    const { id, url: destino } = (await resposta.json()) as { id: string; url: string };
    return { vaga: { id, sessao, url: destino } satisfies Vaga, original };
  } catch {
    return null;
  }
}

// Envia a original pela URL assinada, do mesmo jeito que a biblioteca do
// Supabase faz. Tenta de novo se a rede cair no meio.
export async function enviarOriginal(vaga: Vaga, original: Original): Promise<boolean> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (tentativa > 0) await esperar(1500 * tentativa);
    try {
      const corpo = new FormData();
      corpo.append('cacheControl', '3600');
      corpo.append('', original.foto, original.nome);
      const resposta = await fetch(vaga.url, {
        method: 'PUT',
        body: corpo,
        headers: { 'x-upsert': 'false', apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '' },
      });
      // 409: a foto já tinha chegado numa tentativa anterior.
      if (resposta.ok || resposta.status === 409) return true;
      if (resposta.status < 500 && resposta.status !== 408 && resposta.status !== 429) return false;
    } catch {
      // A rede caiu: tenta de novo.
    }
  }
  return false;
}
