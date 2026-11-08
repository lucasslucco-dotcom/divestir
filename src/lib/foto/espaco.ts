// O espaço privado das fotos dos clientes no Supabase Storage (bucket "fotos",
// criado na migration espaco_das_fotos). Vale para o navegador e para o servidor:
// aqui não tem segredo nenhum, só nomes e limites.

export const ESPACO_DAS_FOTOS = 'fotos';

// O mesmo limite do espaço no banco (20 MB por arquivo).
export const LIMITE_DO_ESPACO = 20 * 1024 * 1024;

const EXTENSAO_DO_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const TIPO_DA_EXTENSAO: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
};

// O tipo certo da foto. O iPhone às vezes manda HEIC sem tipo, e alguns
// celulares dizem "image/jpg": nesses casos vale a extensão do nome.
export function tipoDaFoto(nome: string, tipo: string): string | null {
  if (tipo in EXTENSAO_DO_TIPO) return tipo;
  const extensao = nome.split('.').pop()?.toLowerCase() ?? '';
  return TIPO_DA_EXTENSAO[extensao] ?? null;
}

export function extensaoDoTipo(tipo: string): string | null {
  return EXTENSAO_DO_TIPO[tipo] ?? null;
}

// Sessão e foto são identificadas por códigos aleatórios (UUID), criados no
// navegador (sessão) e no servidor (foto).
export function ehCodigo(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

export function caminhoDaFoto(sessao: string, foto: string, arquivo: string) {
  return `${sessao}/${foto}/${arquivo}`;
}
