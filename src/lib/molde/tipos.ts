// O molde (template) de um design: o que entra na arte, onde e com que tinta.
// Fica na coluna config da tabela designs (briefing, "Sistema de templates de design").
//
// Medidas em unidades da arte: ela tem 1000 de largura e 1000 ÷ proporcao de altura.
// Como tudo é proporcional, o mesmo molde serve para qualquer peça, lado e tamanho
// de impressão. As camadas são pintadas na ordem em que aparecem.

export type Lado = 'frente' | 'costas';

// Papéis de fonte da marca: o site resolve cada um para a fonte carregada.
// titulo: Anton; destaque: Instrument Serif; destaque-italico: a mesma, itálica;
// cinema e cinema-forte: Bodoni Moda (só nas estampas de cinema).
export type FonteDoMolde = 'titulo' | 'destaque' | 'destaque-italico' | 'cinema' | 'cinema-forte';

// Giro de uma camada, em graus (positivo: sentido horário), em volta de um ponto.
export type Giro = { graus: number; x: number; y: number };

// Texto fixo, com a base da linha em "base".
// Sem "altura", o texto é esticado até ocupar a "largura" (o jeito do Fã-Clube).
// Com "altura" (a altura da maiúscula), o tamanho é esse e a "largura" vira o
// máximo: texto mais largo que ela é estreitado.
// O texto pode levar {ano} (o ano do pedido) e o valor de um campo ({nome},
// {desde}), e ★ vira uma estrela desenhada. "espaco" abre as letras (em frações
// do tamanho da letra). "vazado" faz o texto furar o que está embaixo (a faixa),
// deixando aparecer o tecido. Tudo isso é opcional.
export type CamadaTexto = {
  tipo: 'texto';
  texto: string;
  fonte: FonteDoMolde;
  x: number;
  base: number;
  largura: number;
  altura?: number;
  espaco?: number;
  alinhar?: 'centro' | 'esquerda' | 'direita';
  vazado?: boolean;
  giro?: Giro;
};

// Retângulo de tinta, com centro em x e y: cheio (uma faixa) ou, com "contorno",
// só a linha (uma moldura, um selo). "raio" arredonda os cantos.
export type CamadaForma = {
  tipo: 'forma';
  x: number;
  y: number;
  largura: number;
  altura: number;
  raio?: number;
  contorno?: number;
  giro?: Giro;
};

// Anel em volta da foto.
export type CamadaAnel = {
  tipo: 'anel';
  x: number;
  y: number;
  raio: number;
  espessura: number;
};

// Campo que o cliente preenche (o nome). O topo da maiúscula fica reto e a base
// desce nas pontas da arte ("arco": quanto uma letra na ponta da largura máxima
// fica mais alta que uma no meio). Nome curto fica no meio e quase não desce.
// Nomes longos primeiro estreitam as letras (até "compressao_maxima") e só
// depois diminuem.
//
// "curva" faz o nome inteiro subir no meio, como um arco (quantas unidades as pontas
// da largura máxima ficam abaixo do meio). "folga" abre um respiro em volta das
// letras, apagando o que estiver embaixo (para o nome passar por cima da foto).
export type CamadaNome = {
  tipo: 'nome';
  campo: string;
  fonte: FonteDoMolde;
  x: number;
  topo: number;
  largura_maxima: number;
  altura_no_centro: number;
  arco: number;
  compressao_maxima: number;
  curva?: number;
  folga?: number;
  // "vazado": o nome fura o que está embaixo (a faixa do letreiro) e aparece o tecido.
  vazado?: boolean;
  // "tinta": uma tinta fixa (de TINTAS) no lugar da tinta da peça: o nome em creme
  // por cima da foto do pôster, em qualquer cor de peça.
  tinta?: string;
};

// A foto do cliente, recortada pelo círculo. Na metade de cima, ela pode passar do
// círculo até "vaza_acima" unidades (a cabeça passa por cima do anel e da base do
// nome); dali em diante, um círculo maior corta. Assim o nome nunca some.
//
// "janela" ajusta o quadro onde a foto entra: "escala" encolhe o quadro (1 é o
// diâmetro do círculo) e "desce" baixa o centro dele. É o que decide onde a cabeça
// fica quando a foto chega: encostando na base do nome, sem esconder as letras.
export type CamadaFotoCirculo = {
  tipo: 'foto';
  formato: 'circulo';
  x: number;
  y: number;
  raio: number;
  vaza_acima: number;
  janela?: { escala?: number; desce?: number };
};

// A foto do cliente solta, sem círculo: o recorte aparece inteiro, e um retângulo
// (centro em x, de "topo" até topo + altura) corta o que passar dele: é o que
// esconde a base do recorte atrás de uma faixa.
//
// "janela" é o quadro onde quem está na foto se encaixa (ocupando 90% dele): a
// largura, a altura e o centro na vertical. Sem ela, é o próprio retângulo. É ela
// que diz o tamanho com que a foto chega: do nome até a faixa, por exemplo.
//
// Com "fundo", a foto entra com o fundo original (o pôster de cinema) e sempre
// cobre o retângulo inteiro. Sem a foto com fundo guardada no aparelho, entra o
// recorte sobre um painel de tinta.
export type CamadaFotoQuadro = {
  tipo: 'foto';
  formato: 'quadro';
  x: number;
  topo: number;
  largura: number;
  altura: number;
  janela?: { largura?: number; altura?: number; y?: number };
  fundo?: boolean;
  // Só com "fundo": escurece a base da foto (esta fração da altura), como em pôster
  // de cinema, para o nome ser lido por cima dela.
  sombra?: number;
};

export type CamadaFoto = CamadaFotoCirculo | CamadaFotoQuadro;

// Arte fixa em SVG de uma tinta só (a cor vem de currentColor). "folga" abre um
// respiro em volta dela, apagando o que estiver embaixo (foto, anel, nome).
// "base" é a mesma arte sem os furos (a faixa inteira, sem as letras vazadas): com
// ela, o que estiver embaixo da faixa é apagado antes, e as letras vazadas mostram o
// tecido, não a foto.
export type CamadaArte = {
  tipo: 'arte';
  arquivo: string;
  x: number;
  topo: number;
  largura: number;
  folga: number;
  base?: string;
};

export type Camada = CamadaTexto | CamadaAnel | CamadaNome | CamadaFoto | CamadaArte | CamadaForma;

// "exemplo" é o que aparece na arte enquanto o campo está vazio (sem ele, o rótulo).
export type Campo = {
  chave: string;
  rotulo: string;
  max: number;
  caixa: 'alta' | 'livre';
  exemplo?: string;
};

export type ConfigDoMolde = {
  versao: 1;
  proporcao: number;
  posicao: Lado;
  camadas: Camada[];
  campos: Campo[];
  // Cor da peça → tinta. As tintas existentes estão em TINTAS.
  tintas: Record<string, string>;
  pecas_permitidas?: string[];
  // Com a estampa nas costas, a frente leva a marca pequena no peito, na mesma
  // tinta (briefing: "logo_peito"). Até o logo ficar pronto, a marca é o nome
  // DIVESTIR em Anton (decisão do Lucas, 08/11/2026).
  logo_peito?: boolean;
};

export type Design = {
  slug: string;
  nome: string;
  config: ConfigDoMolde;
  // Datas do drop (AAAA-MM-DD): o selo "Novo" nas duas primeiras semanas e
  // "Últimos dias" na semana final (briefing, "Mecânica de drops").
  drop?: { entrada: string | null; saida: string | null };
};

export const LARGURA_DA_ARTE = 1000;

// O que sai na estampa de um campo de texto (o nome): letras, com ou sem acento,
// números, espaço e . - ' & !. Emoji e outros símbolos não existem na fonte da
// estampa, que é impressa numa tinta só, então ficam de fora.
export const temSimboloForaDaEstampa = (valor: string) =>
  /[^\p{Script=Latin}\p{Nd} .\-'&!\u2018\u2019]/u.test(valor.normalize('NFC'));

// Tira só o que não sai na estampa, sem mexer nos espaços (para usar enquanto a
// pessoa digita).
export function tirarSimbolosDaEstampa(valor: string) {
  return valor
    .normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^\p{Script=Latin}\p{Nd} .\-'&!]/gu, '');
}

export function limparTextoDaEstampa(valor: string) {
  return tirarSimbolosDaEstampa(valor).replace(/ {2,}/g, ' ').trim();
}

// As tintas da estampa: as cores da marca.
export const TINTAS: Record<string, string> = {
  creme: '#FAF5EB',
  'verde-escuro': '#0D2B17',
};

// Onde a arte fica na foto de base de uma peça, em frações da foto: centro (x),
// topo e largura. A altura sai da proporção do molde.
export type AreaNaFoto = { x: number; topo: number; largura: number };

// Área de impressão de cada lado da peça (coluna area_impressao_cm de pecas).
// Lado que não aparece aqui não recebe estampa (a jaqueta college só tem costas).
// "peito" é o lugar da marca no peito, na foto da frente (do lado esquerdo de quem
// veste). As medidas em centímetros chegam quando a estamparia confirmar.
export type AreaDeImpressao = {
  largura_cm?: number | null;
  altura_cm?: number | null;
  previa: AreaNaFoto;
};
export type AreasDaPeca = Partial<Record<Lado, AreaDeImpressao>> & { peito?: AreaDeImpressao };

// Confere o que veio do banco antes de desenhar: um molde quebrado não pode
// derrubar a tela.
export function ehConfigDoMolde(valor: unknown): valor is ConfigDoMolde {
  if (!valor || typeof valor !== 'object') return false;
  const c = valor as Partial<ConfigDoMolde>;
  return (
    c.versao === 1 &&
    typeof c.proporcao === 'number' &&
    c.proporcao > 0 &&
    Array.isArray(c.camadas) &&
    Array.isArray(c.campos) &&
    !!c.tintas &&
    typeof c.tintas === 'object'
  );
}

export function alturaDaArte(config: ConfigDoMolde) {
  return LARGURA_DA_ARTE / config.proporcao;
}

export function ladosDaPeca(areas: AreasDaPeca | null | undefined): Lado[] {
  return (['frente', 'costas'] as const).filter((lado) => areas?.[lado]?.previa);
}
