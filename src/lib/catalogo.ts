import { cacheLife, cacheTag } from 'next/cache';
import type { AreasDaPeca, Lado } from './molde/tipos';
import { criarClientePublico } from './supabase/publico';

export type { Lado };

export type Cor = {
  slug: string;
  nome: string;
  hex: string;
};

// Tabela de medidas de um modelo (coluna medidas de pecas): uma linha por medida,
// com o valor de cada tamanho. Vazia até o fornecedor mandar as medidas.
export type TabelaDeMedidas = {
  unidade: string;
  linhas: { nome: string; como_medir?: string; valores: Record<string, number | string> }[];
};

// Pacote de uma peça dobrada, para cotar o frete (coluna envio de pecas).
export type PacoteDeEnvio = { peso_kg: number; largura_cm: number; altura_cm: number; comprimento_cm: number };

export type Peca = {
  slug: string;
  nome: string;
  caimento: string;
  preco: number | null;
  tamanhos: string[];
  medidas: TabelaDeMedidas | null;
  envio: PacoteDeEnvio | null;
  // Fotos de base por cor e por lado, por exemplo fotos.preto.frente.
  fotos: Record<string, Partial<Record<Lado, string>>>;
  // Onde a estampa pode ir em cada lado (a jaqueta bomber só tem costas).
  areas: AreasDaPeca;
};

export type Catalogo = {
  pecas: Peca[];
  cores: Cor[];
};

// Confere a tabela de medidas que veio do banco: sem linhas válidas, não há tabela.
function lerMedidas(valor: unknown): TabelaDeMedidas | null {
  if (!valor || typeof valor !== 'object') return null;
  const tabela = valor as Partial<TabelaDeMedidas>;
  const linhas = (Array.isArray(tabela.linhas) ? tabela.linhas : []).filter(
    (linha) => linha && typeof linha.nome === 'string' && linha.valores && typeof linha.valores === 'object',
  );
  if (!linhas.length) return null;
  return { unidade: typeof tabela.unidade === 'string' ? tabela.unidade : 'cm', linhas };
}

// Confere o pacote de envio que veio do banco: medida faltando, não há pacote.
export function lerPacote(valor: unknown): PacoteDeEnvio | null {
  if (!valor || typeof valor !== 'object') return null;
  const p = valor as Record<string, unknown>;
  const medidas = [p.peso_kg, p.largura_cm, p.altura_cm, p.comprimento_cm];
  if (!medidas.every((m) => typeof m === 'number' && Number.isFinite(m) && m > 0)) return null;
  const [peso_kg, largura_cm, altura_cm, comprimento_cm] = medidas as number[];
  return { peso_kg, largura_cm, altura_cm, comprimento_cm };
}

// Lê do banco as peças e cores ativas e as fotos de base de cada uma.
// O resultado fica guardado por algumas horas. Quando o painel mudar o
// catálogo (etapa 8), ele renova com revalidateTag('catalogo').
export async function carregarCatalogo(): Promise<Catalogo> {
  'use cache';
  cacheLife('hours');
  cacheTag('catalogo');

  const supabase = criarClientePublico();
  const [pecas, cores, imagens] = await Promise.all([
    supabase
      .from('pecas')
      .select('id, slug, nome, caimento, preco, tamanhos, medidas, envio, area_impressao_cm')
      .eq('ativo', true)
      .order('ordem'),
    supabase.from('cores').select('id, slug, nome, hex').eq('ativo', true).order('ordem'),
    supabase.from('peca_imagens').select('peca_id, cor_id, lado, url'),
  ]);
  if (pecas.error || cores.error || imagens.error || !pecas.data || !cores.data || !imagens.data) {
    const motivo = (pecas.error ?? cores.error ?? imagens.error)?.message ?? 'resposta vazia';
    throw new Error(`Não foi possível carregar o catálogo: ${motivo}`);
  }

  const corPorId = new Map(cores.data.map((cor) => [cor.id, cor.slug]));

  return {
    cores: cores.data.map(({ slug, nome, hex }) => ({ slug, nome, hex })),
    pecas: pecas.data.map((peca) => {
      const fotos: Peca['fotos'] = {};
      for (const imagem of imagens.data) {
        const cor = corPorId.get(imagem.cor_id);
        if (imagem.peca_id !== peca.id || !cor) continue;
        (fotos[cor] ??= {})[imagem.lado as Lado] = imagem.url;
      }
      return {
        slug: peca.slug,
        nome: peca.nome,
        caimento: peca.caimento,
        preco: peca.preco === null ? null : Number(peca.preco),
        tamanhos: Array.isArray(peca.tamanhos) ? peca.tamanhos : [],
        medidas: lerMedidas(peca.medidas),
        envio: lerPacote(peca.envio),
        fotos,
        areas: (peca.area_impressao_cm ?? {}) as AreasDaPeca,
      };
    }),
  };
}
