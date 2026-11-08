// As escolhas da montagem e o que sai delas: a peça, a cor, o design, o lado da
// estampa, o tamanho e o que ainda falta para ir ao carrinho.
import type { Catalogo, Cor, Peca } from '@/lib/catalogo';
import type { Enquadramento } from '@/lib/foto/enquadramento';
import { MONTAGEM_VAZIA, type FotoDaMontagem, type Montagem } from '@/lib/montagem/tipos';
import { ladosDaPeca, type Campo, type Design, type Lado } from '@/lib/molde/tipos';

export type Acao =
  | { tipo: 'restaurar'; montagem: Montagem }
  | { tipo: 'peca'; slug: string }
  | { tipo: 'cor'; slug: string }
  | { tipo: 'design'; slug: string }
  | { tipo: 'lado'; lado: Lado }
  | { tipo: 'campo'; chave: string; valor: string }
  | { tipo: 'tamanho'; tamanho: string }
  | { tipo: 'foto'; foto: FotoDaMontagem; campos?: Record<string, string> }
  | { tipo: 'enquadrar'; mudanca: (atual: Enquadramento) => Enquadramento }
  | { tipo: 'aprovar' }
  | { tipo: 'ajustar' }
  | { tipo: 'original'; chave: string; original: FotoDaMontagem['original'] }
  | { tipo: 'sem-foto' }
  | { tipo: 'nova' };

export function reduzir(m: Montagem, acao: Acao): Montagem {
  switch (acao.tipo) {
    case 'restaurar':
      return acao.montagem;
    case 'peca':
      return { ...m, peca: acao.slug };
    case 'cor':
      return { ...m, cor: acao.slug };
    case 'design':
      return { ...m, design: acao.slug };
    case 'lado':
      return { ...m, lado: acao.lado };
    case 'campo':
      return { ...m, campos: { ...m.campos, [acao.chave]: acao.valor } };
    case 'tamanho':
      return { ...m, tamanho: acao.tamanho };
    case 'foto':
      // Foto reaproveitada traz junto o nome de quem está nela, se o campo estiver vazio.
      return {
        ...m,
        foto: acao.foto,
        campos: acao.campos
          ? { ...acao.campos, ...Object.fromEntries(Object.entries(m.campos).filter(([, v]) => v)) }
          : m.campos,
      };
    case 'enquadrar':
      return m.foto && !m.foto.aprovada
        ? { ...m, foto: { ...m.foto, enquadramento: acao.mudanca(m.foto.enquadramento) } }
        : m;
    case 'aprovar':
      return m.foto ? { ...m, foto: { ...m.foto, aprovada: true } } : m;
    case 'ajustar':
      return m.foto ? { ...m, foto: { ...m.foto, aprovada: false } } : m;
    case 'original':
      return m.foto?.chave === acao.chave ? { ...m, foto: { ...m.foto, original: acao.original } } : m;
    case 'sem-foto':
      return { ...m, foto: null };
    case 'nova':
      return MONTAGEM_VAZIA;
  }
}

export type Resolvida = {
  peca: Peca;
  cor: Cor;
  // Designs que aceitam a peça escolhida, e o escolhido entre eles.
  designs: Design[];
  design: Design | null;
  lados: Lado[];
  lado: Lado;
  outroLado: Lado;
  tamanho: string | null;
  // Com a estampa nas costas, a frente leva DIVESTIR no peito.
  marcaNoPeito: boolean;
};

// Junta as escolhas com o que existe: a peça e a cor ativas, um design que aceita a
// peça, um lado que a peça tem e um tamanho que ela vende.
export function resolver(catalogo: Catalogo, designs: Design[], m: Montagem): Resolvida | null {
  const peca = catalogo.pecas.find((p) => p.slug === m.peca) ?? catalogo.pecas[0];
  const cor =
    catalogo.cores.find((c) => c.slug === m.cor) ?? catalogo.cores.find((c) => c.slug === 'preto') ?? catalogo.cores[0];
  if (!peca || !cor) return null;
  const permitidos = designs.filter((d) => !d.config.pecas_permitidas || d.config.pecas_permitidas.includes(peca.slug));
  const design = permitidos.find((d) => d.slug === m.design) ?? permitidos[0] ?? null;
  const lados = ladosDaPeca(peca.areas);
  const lado =
    m.lado && lados.includes(m.lado)
      ? m.lado
      : design && lados.includes(design.config.posicao)
        ? design.config.posicao
        : (lados[0] ?? 'costas');
  return {
    peca,
    cor,
    designs: permitidos,
    design,
    lados,
    lado,
    outroLado: lado === 'frente' ? 'costas' : 'frente',
    tamanho: m.tamanho && peca.tamanhos.includes(m.tamanho) ? m.tamanho : null,
    marcaNoPeito: !!design?.config.logo_peito && lado === 'costas' && !!peca.areas.peito,
  };
}

// Nome da peça para o cliente: "Camiseta oversized", "Moletom com capuz".
export function nomeDaPeca(peca: Peca, pecas: Peca[]) {
  const repetido = pecas.filter((p) => p.nome === peca.nome).length > 1;
  return repetido ? `${peca.nome} ${peca.caimento.toLocaleLowerCase('pt-BR')}` : peca.nome;
}

export const ID_DOS_PASSOS = {
  peca: 'passo-peca',
  foto: 'passo-foto',
  nome: 'passo-nome',
  design: 'passo-design',
  cor: 'passo-cor',
  tamanho: 'passo-tamanho',
  carrinho: 'passo-carrinho',
} as const;

export type Falta = { texto: string; passo: keyof typeof ID_DOS_PASSOS };

// O que ainda falta para a peça ir ao carrinho, na ordem dos passos.
export function oQueFalta(m: Montagem, r: Resolvida | null): Falta[] {
  const falta: Falta[] = [];
  if (!m.foto) falta.push({ texto: 'mandar a foto', passo: 'foto' });
  else if (!m.foto.aprovada) falta.push({ texto: 'aprovar a foto', passo: 'foto' });
  const campos: Campo[] = r?.design?.config.campos ?? [];
  for (const campo of campos) {
    if ((m.campos[campo.chave] ?? '').trim()) continue;
    falta.push(
      campo.chave === 'nome'
        ? { texto: 'dar o nome', passo: 'nome' }
        : { texto: `preencher ${campo.rotulo.toLocaleLowerCase('pt-BR')}`, passo: 'design' },
    );
  }
  if (!r?.design) falta.push({ texto: 'escolher um design', passo: 'design' });
  if (!r?.tamanho) falta.push({ texto: 'escolher o tamanho', passo: 'tamanho' });
  return falta;
}
