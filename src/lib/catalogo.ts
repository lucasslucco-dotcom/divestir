import { cacheLife, cacheTag } from 'next/cache';
import type { AreasDaPeca, Lado } from './molde/tipos';
import { criarClientePublico } from './supabase/publico';

export type { Lado };

export type Cor = {
  slug: string;
  nome: string;
  hex: string;
};

export type Peca = {
  slug: string;
  nome: string;
  caimento: string;
  preco: number | null;
  // Fotos de base por cor e por lado, por exemplo fotos.preto.frente.
  fotos: Record<string, Partial<Record<Lado, string>>>;
  // Onde a estampa pode ir em cada lado (a jaqueta college só tem costas).
  areas: AreasDaPeca;
};

export type Catalogo = {
  pecas: Peca[];
  cores: Cor[];
};

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
      .select('id, slug, nome, caimento, preco, area_impressao_cm')
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
        fotos,
        areas: (peca.area_impressao_cm ?? {}) as AreasDaPeca,
      };
    }),
  };
}
