// As escolhas da montagem e o que sai delas: a peça, a cor, o design, o lado da
// estampa, o tamanho e o que ainda falta para ir ao carrinho.
import type { Catalogo, Cor, Modelagem, Peca } from '@/lib/catalogo';
import {
  LARGURA_PADRAO_DA_ESTAMPA_CM,
  definicaoDaEstampa,
  zoomMaximoDaEstampa,
  type Definicao,
} from '@/lib/foto/definicao';
import { ZOOM_MAXIMO, zoomEm, type Enquadramento } from '@/lib/foto/enquadramento';
import { MONTAGEM_VAZIA, fotoNoDesign, type FotoDaMontagem, type Montagem } from '@/lib/montagem/tipos';
import { janelaDaFoto } from '@/lib/molde/desenhar';
import {
  LARGURA_DA_ARTE,
  areaDoDesign,
  larguraImpressaCm,
  ladosDaPeca,
  valorDoCampo,
  type CamadaFoto,
  type Campo,
  type Design,
  type Lado,
} from '@/lib/molde/tipos';

export type Acao =
  | { tipo: 'restaurar'; montagem: Montagem }
  // "peca": a peça que fica depois da escolha (null: a primeira da modelagem nova,
  // porque a que estava não existe nela).
  | { tipo: 'modelagem'; modelagem: Modelagem; peca: string | null }
  | { tipo: 'peca'; slug: string }
  | { tipo: 'cor'; slug: string }
  // "de": o design que estava na prévia (o ajuste da foto é guardado por design).
  | { tipo: 'design'; slug: string; de: string | null }
  | { tipo: 'tema'; tema: string }
  | { tipo: 'lado'; lado: Lado }
  | { tipo: 'campo'; chave: string; valor: string }
  | { tipo: 'tamanho'; tamanho: string }
  | { tipo: 'foto'; foto: FotoDaMontagem; campos?: Record<string, string> }
  // "teto": até onde o zoom pode ir sem a estampa perder a definição mínima.
  | { tipo: 'enquadrar'; mudanca: (atual: Enquadramento) => Enquadramento; teto: number }
  // A peça ou o design mudou e o zoom guardado ficou acima do que a foto aguenta ali.
  | { tipo: 'teto-do-zoom'; teto: number }
  // O ajuste da foto na prévia (zoom, "Trocar a foto"): fecha e abre, sem travar nada.
  | { tipo: 'fechar-ajuste' }
  | { tipo: 'abrir-ajuste' }
  | { tipo: 'original'; chave: string; original: FotoDaMontagem['original'] }
  | { tipo: 'sem-foto' }
  | { tipo: 'no-carrinho'; id: string | null }
  | { tipo: 'nova' };

export function reduzir(m: Montagem, acao: Acao): Montagem {
  switch (acao.tipo) {
    case 'restaurar':
      return acao.montagem;
    case 'modelagem':
      return { ...m, modelagem: acao.modelagem, peca: acao.peca };
    case 'peca':
      return { ...m, peca: acao.slug };
    case 'cor':
      return { ...m, cor: acao.slug };
    case 'design':
      // A foto vai junto para o design novo: com o ajuste que a pessoa já fez nele ou,
      // na primeira vez, encaixada sozinha.
      return { ...m, design: acao.slug, foto: m.foto ? fotoNoDesign(m.foto, acao.de, acao.slug) : null };
    case 'tema':
      return { ...m, tema: acao.tema };
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
    case 'enquadrar': {
      if (!m.foto || m.foto.aprovada) return m;
      const atual = m.foto.enquadramento;
      const novo = acao.mudanca(atual);
      // O zoom para onde a foto ainda tem qualidade para a estampa. Mover continua valendo.
      const limite = Math.max(acao.teto, atual.zoom);
      const enquadramento = novo.zoom > limite + 1e-9 ? zoomEm(novo, limite / novo.zoom) : novo;
      return { ...m, foto: { ...m.foto, enquadramento } };
    }
    case 'teto-do-zoom': {
      if (!m.foto || m.foto.enquadramento.zoom <= acao.teto) return m;
      const atual = m.foto.enquadramento;
      return { ...m, foto: { ...m.foto, enquadramento: zoomEm(atual, acao.teto / atual.zoom) } };
    }
    case 'fechar-ajuste':
      return m.foto && !m.foto.aprovada ? { ...m, foto: { ...m.foto, aprovada: true } } : m;
    case 'abrir-ajuste':
      return m.foto?.aprovada ? { ...m, foto: { ...m.foto, aprovada: false } } : m;
    case 'original':
      return m.foto?.chave === acao.chave ? { ...m, foto: { ...m.foto, original: acao.original } } : m;
    case 'sem-foto':
      return { ...m, foto: null };
    case 'no-carrinho':
      return { ...m, noCarrinho: acao.id };
    case 'nova':
      return MONTAGEM_VAZIA;
  }
}

export type Resolvida = {
  // A modelagem escolhida (null: a pessoa ainda não disse) e as peças que ela mostra.
  modelagem: Modelagem | null;
  pecas: Peca[];
  peca: Peca;
  cor: Cor;
  // Designs que aceitam a peça escolhida, e o escolhido entre eles.
  designs: Design[];
  design: Design | null;
  // A pessoa escolheu este design (antes disso, vale o primeiro da fila, e a prévia só
  // mostra o design quando já tem a foto dela).
  designEscolhido: boolean;
  lados: Lado[];
  lado: Lado;
  outroLado: Lado;
  tamanho: string | null;
  // Com a estampa nas costas, a frente leva DIVESTIR no peito.
  marcaNoPeito: boolean;
};

// As cores em que uma peça existe: as que têm foto de base (a jaqueta bomber só vem
// em preto).
export function coresDaPeca(catalogo: Catalogo, peca: Peca): Cor[] {
  return catalogo.cores.filter((cor) => peca.fotos[cor.slug]);
}

// As peças de uma modelagem: as dela e as que servem para os dois. Sem modelagem, só
// as que servem para os dois.
export function pecasDaModelagem(catalogo: Catalogo, modelagem: Modelagem | null): Peca[] {
  return catalogo.pecas.filter((p) => p.modelagem === 'unissex' || p.modelagem === modelagem);
}

// A modelagem da montagem: a que a pessoa escolheu ou, numa montagem de antes da
// pergunta existir, a da peça que ela já tinha escolhido (a camiseta regular é masculina).
export function modelagemDaMontagem(catalogo: Catalogo, m: Montagem): Modelagem | null {
  if (m.modelagem) return m.modelagem;
  const peca = catalogo.pecas.find((p) => p.slug === m.peca);
  return peca && peca.modelagem !== 'unissex' ? peca.modelagem : null;
}

// Junta as escolhas com o que existe: a peça ativa, uma cor em que ela existe, um
// design que aceita a peça, um lado que a peça tem e um tamanho que ela vende.
export function resolver(catalogo: Catalogo, designs: Design[], m: Montagem): Resolvida | null {
  const modelagem = modelagemDaMontagem(catalogo, m);
  const daModelagem = pecasDaModelagem(catalogo, modelagem);
  // Sem peça escolhida, vale a primeira da modelagem; antes da modelagem, uma que serve
  // para os dois (a prévia não adianta a resposta de ninguém).
  const escolhida = catalogo.pecas.find((p) => p.slug === m.peca);
  const peca = (escolhida && daModelagem.includes(escolhida) ? escolhida : null) ?? daModelagem[0] ?? catalogo.pecas[0];
  if (!peca) return null;
  // Só as cores em que a peça existe: quem estava na creme e troca para a bomber vai
  // para a preta.
  const cores = coresDaPeca(catalogo, peca);
  const cor = cores.find((c) => c.slug === m.cor) ?? cores.find((c) => c.slug === 'preto') ?? cores[0];
  if (!cor) return null;
  const permitidos = designs.filter((d) => !d.config.pecas_permitidas || d.config.pecas_permitidas.includes(peca.slug));
  const escolhido = permitidos.find((d) => d.slug === m.design);
  const design = escolhido ?? permitidos[0] ?? null;
  const lados = ladosDaPeca(peca.areas);
  const lado =
    m.lado && lados.includes(m.lado)
      ? m.lado
      : design && lados.includes(design.config.posicao)
        ? design.config.posicao
        : (lados[0] ?? 'costas');
  return {
    modelagem,
    // Antes da modelagem, as peças não aparecem. (Montagem antiga, com uma peça que serve
    // para os dois já escolhida: aparecem as que servem para os dois.)
    pecas: modelagem || escolhida ? daModelagem : [],
    peca,
    cor,
    designs: permitidos,
    design,
    designEscolhido: !!escolhido,
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

// Na ordem em que aparecem: peça, design, foto, nome, cor, tamanho e carrinho (o
// design vem antes da foto desde 11/11/2026, pedido do Lucas).
export const ID_DOS_PASSOS = {
  peca: 'passo-peca',
  design: 'passo-design',
  foto: 'passo-foto',
  nome: 'passo-nome',
  cor: 'passo-cor',
  tamanho: 'passo-tamanho',
  carrinho: 'passo-carrinho',
} as const;

export type Falta = { texto: string; passo: keyof typeof ID_DOS_PASSOS };

// A qualidade da foto para a estampa desta montagem: a definição com o enquadramento de
// agora (quem aparece pequeno na foto, ou com muito zoom, sai com poucos pontos na peça
// impressa) e até onde o zoom pode ir. Depende da peça, do lado e do design, porque o
// tamanho impresso muda com eles.
export function qualidadeDaFoto(m: Montagem, r: Resolvida | null): { definicao: Definicao | null; tetoDoZoom: number } {
  const semMedida = { definicao: null, tetoDoZoom: ZOOM_MAXIMO };
  if (!m.foto || !r) return semMedida;
  const camada = r.design?.config.camadas.find((c): c is CamadaFoto => c.tipo === 'foto');
  const quadro = camada ? janelaDaFoto(camada) : null;
  if (!quadro) return semMedida;
  // A largura impressa é a maior que cabe na área de impressão da peça, na proporção do
  // design. Peça sem os centímetros cadastrados usa a largura padrão, que no design de
  // estampa grande cresce na mesma medida da prévia.
  const areaDaPeca = r.peca.areas[r.lado]?.previa ?? null;
  const areaDaEstampa = r.design ? areaDoDesign(areaDaPeca, r.design.config) : areaDaPeca;
  const aumento = areaDaPeca && areaDaEstampa ? areaDaEstampa.largura / areaDaPeca.largura : 1;
  const impressa = r.design ? larguraImpressaCm(r.peca.areas[r.lado], r.design.config) : null;
  const definicao = definicaoDaEstampa(
    m.foto,
    quadro.largura / LARGURA_DA_ARTE,
    impressa ?? LARGURA_PADRAO_DA_ESTAMPA_CM * aumento,
    quadro.largura / quadro.altura,
  );
  if (!definicao) return semMedida;
  return { definicao, tetoDoZoom: Math.min(ZOOM_MAXIMO, zoomMaximoDaEstampa(definicao, m.foto.enquadramento.zoom)) };
}

// O que ainda falta para a peça ir ao carrinho, na ordem dos passos.
export function oQueFalta(m: Montagem, r: Resolvida | null): Falta[] {
  const falta: Falta[] = [];
  // Sem dizer a modelagem, a peça da prévia é só um exemplo: ninguém escolheu.
  if (r && !r.modelagem && !m.peca) falta.push({ texto: 'escolher a peça', passo: 'peca' });
  if (!r?.design) falta.push({ texto: 'escolher um design', passo: 'design' });
  // A foto não precisa de um "aprovar" à parte: quem aprova a peça é o botão do carrinho.
  if (!m.foto) falta.push({ texto: 'mandar a foto', passo: 'foto' });
  // Foto sem qualidade para a estampa não vai para o carrinho (decisão do Lucas, 22/11/2026).
  else if (qualidadeDaFoto(m, r).definicao?.nivel === 'baixa') falta.push({ texto: 'trocar a foto', passo: 'foto' });
  const campos: Campo[] = r?.design?.config.campos ?? [];
  for (const campo of campos) {
    if (valorDoCampo(campo, m.campos)) continue;
    falta.push(
      campo.chave === 'nome'
        ? { texto: 'dar o nome', passo: 'nome' }
        : // "Desde que ano?" vira "dizer desde que ano". Os textos do design ficam no passo do nome.
          campo.rotulo.trim().endsWith('?')
          ? { texto: `dizer ${campo.rotulo.trim().slice(0, -1).toLocaleLowerCase('pt-BR')}`, passo: 'nome' }
          : { texto: `preencher ${campo.rotulo.toLocaleLowerCase('pt-BR')}`, passo: 'nome' },
    );
  }
  if (!r?.tamanho) falta.push({ texto: 'escolher o tamanho', passo: 'tamanho' });
  return falta;
}
