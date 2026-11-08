import { cacheLife, cacheTag } from 'next/cache';
import { ehConfigDoMolde, type Design } from './molde/tipos';
import { criarClientePublico } from './supabase/publico';

// Lê do banco os designs ativos (o público só enxerga esses, pelas regras do banco)
// com a configuração do molde de cada um. Molde que não passa na conferência fica
// de fora, para um design mal configurado não derrubar o montador.
// O resultado fica guardado por algumas horas; o painel (Etapa 8) renova com
// revalidateTag('designs').
export async function carregarDesigns(): Promise<Design[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('designs');

  const supabase = criarClientePublico();
  const { data, error } = await supabase
    .from('designs')
    .select('slug, nome, config, drop_entrada, drop_saida')
    .eq('status', 'ativo')
    .order('ordem');
  if (error || !data) throw new Error(`Não foi possível carregar os designs: ${error?.message ?? 'resposta vazia'}`);

  return data
    .filter((design) => ehConfigDoMolde(design.config))
    .map((design) => ({
      slug: design.slug,
      nome: design.nome,
      config: design.config,
      drop: { entrada: design.drop_entrada, saida: design.drop_saida },
    }));
}
