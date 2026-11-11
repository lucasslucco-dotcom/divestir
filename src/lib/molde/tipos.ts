// O molde (template) de um design: o que entra na arte, onde e com que tinta.
// Fica na coluna config da tabela designs (briefing, "Sistema de templates de design").
//
// Medidas em unidades da arte: ela tem 1000 de largura e 1000 ÷ proporcao de altura.
// Como tudo é proporcional, o mesmo molde serve para qualquer peça, lado e tamanho
// de impressão. As camadas são pintadas na ordem em que aparecem.

export type Lado = 'frente' | 'costas';

// Papéis de fonte da marca: o site resolve cada um para a fonte carregada.
// titulo: Anton; destaque: Instrument Serif; destaque-italico: a mesma, itálica;
// cinema, cinema-forte e cinema-preta: Bodoni Moda nos pesos 500, 700 e 900 (só nas
// estampas de cinema; a preta é a do nome do Melhor Mãe); vintage: Shrikhand
// (a letra gorda e inclinada de camiseta de turnê antiga); show: Passion One (a letra
// grossa de pôster de show); bloco: Alfa Slab One (a letra de bloco com serifa, de
// placa de bar); colegial: Graduate (a letra de camisa de time, com os cantos
// cortados); realeza: Cinzel (a letra de inscrição, de brasão); astral: Cinzel
// Decorative (a mesma, com floreios); gotica: Grenze Gotisch (a letra gótica de
// camiseta de rua); geometrica: Poppins Black (a letra geométrica bem grossa, de
// embalagem: o nome do Alto Em). Essas só existem nas estampas. texto: Inter em negrito, a fonte de
// texto do site, para as linhas pequenas que o site escreve numa estampa de cara
// atual (o "No repete desde 2012" do Tocando Agora).
export type FonteDoMolde =
  | 'titulo'
  | 'texto'
  | 'destaque'
  | 'destaque-italico'
  | 'cinema'
  | 'cinema-forte'
  | 'cinema-preta'
  | 'vintage'
  | 'show'
  | 'bloco'
  | 'colegial'
  | 'realeza'
  | 'astral'
  | 'gotica'
  | 'geometrica';

// Giro de uma camada, em graus (positivo: sentido horário), em volta de um ponto.
export type Giro = { graus: number; x: number; y: number };

// Texto fixo, com a base da linha em "base".
// Sem "altura", o texto é esticado até ocupar a "largura" (o jeito do Fã-Clube).
// Com "altura" (a altura da maiúscula), o tamanho é esse e a "largura" vira o
// máximo: texto mais largo que ela é estreitado.
// O texto pode levar {ano} (o ano do pedido) e o valor de um campo ({nome},
// {desde}), e ★ vira uma estrela desenhada. "espaco" abre as letras (em frações
// do tamanho da letra). "vazado" faz o texto furar o que está embaixo (a faixa),
// deixando aparecer o tecido. "folga" abre um respiro em volta das letras, para o
// texto passar por cima da foto sem se misturar. Tudo isso é opcional.
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
  folga?: number;
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
// depois diminuem. Com "expansao_maxima" (1,3, por exemplo), nome curto alarga as
// letras até ocupar a largura máxima: LUNA enche a estampa como PAÇOCA.
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
  expansao_maxima?: number;
  // Engrossa a letra: quantas unidades de tinta a mais de cada lado das hastes, com o
  // nome no tamanho cheio e sem estreitar (nome longo engrossa na mesma proporção).
  engrossa?: number;
  // O acento de cima (Â, É, Ã) cabe dentro da altura do nome, em vez de subir além
  // do topo: a letra diminui um pouco e a base fica onde está.
  acento_dentro?: boolean;
  // Inclina a letra para a direita, como itálico de corrida: quanto o topo da maiúscula
  // anda para a direita, em relação à altura dela (0,3 dá uns 17 graus). A base fica
  // onde está, e "x" continua sendo o meio do nome, já inclinado.
  inclina?: number;
  // "rastro": uma arte que anda junto com o nome (os riscos de velocidade do Grande
  // Prêmio). Fica colada à esquerda dele, com a altura da maiúscula, e os dois juntos
  // ficam centrados em "x" e cabem em "largura_maxima": nome curto ou comprido, o
  // rastro sai sempre da primeira letra. "proporcao" é a largura da arte dividida pela
  // altura, e "respiro", o espaço entre ela e o nome (em unidades, com o nome cheio).
  rastro?: { arquivo: string; proporcao: number; respiro?: number };
  curva?: number;
  folga?: number;
  // "vazado": o nome fura o que está embaixo (a faixa do letreiro) e aparece o tecido.
  vazado?: boolean;
  // "tinta": uma tinta fixa (de TINTAS) no lugar da tinta da peça: o nome em creme
  // por cima da foto do pôster, em qualquer cor de peça.
  tinta?: string;
  // Com o "desgaste" do molde: o nome sai rachado, como estampa antiga.
  desgaste?: boolean;
};

// A foto do cliente, recortada pelo círculo. Na metade de cima, ela pode passar do
// círculo até "vaza_acima" unidades (a cabeça passa por cima do anel e da base do
// nome); dali em diante, um círculo maior corta. Assim o nome nunca some.
//
// "janela" ajusta o quadro onde a foto entra: "escala" encolhe o quadro (1 é o
// diâmetro do círculo) e "desce" baixa o centro dele. É o que decide onde a cabeça
// fica quando a foto chega: encostando na base do nome, sem esconder as letras.
//
// Com "raio_y", o círculo vira um oval (a moldura do Sua Majestade): "raio" é a
// metade da largura e "raio_y", a metade da altura.
export type CamadaFotoCirculo = {
  tipo: 'foto';
  formato: 'circulo';
  x: number;
  y: number;
  raio: number;
  raio_y?: number;
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
  // Arredonda os dois cantos de baixo do retângulo (o raio, em unidades da arte): a
  // foto acompanha uma moldura de cantos redondos, como a capa do Tocando Agora.
  canto_de_baixo?: number;
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
  // Com o "desgaste" do molde: a arte sai rachada, como estampa antiga.
  desgaste?: boolean;
};

export type Camada = CamadaTexto | CamadaAnel | CamadaNome | CamadaFoto | CamadaArte | CamadaForma;

// "exemplo" é o que aparece na arte enquanto o campo está vazio (sem ele, o rótulo).
// Com "opcoes", o cliente escolhe uma das opções em vez de digitar (PAI, AVÔ, TIO...);
// enquanto não escolhe, vale a primeira. "resumo" é o nome curto do campo, para o
// resumo da peça (sem ele, o rótulo).
export type Campo = {
  chave: string;
  rotulo: string;
  resumo?: string;
  max: number;
  caixa: 'alta' | 'livre';
  exemplo?: string;
  opcoes?: string[];
};

export type ConfigDoMolde = {
  versao: 1;
  proporcao: number;
  posicao: Lado;
  camadas: Camada[];
  campos: Campo[];
  // Cor da peça → tinta. As tintas existentes estão em TINTAS.
  tintas: Record<string, string>;
  // Desgaste de estampa antiga: uma textura (PNG transparente: onde tem cor, a tinta
  // sai) que fura o nome e as artes marcadas com "desgaste", deixando aparecer o
  // tecido. A foto e os textos pequenos ficam inteiros.
  desgaste?: { arquivo: string };
  // "grande": a estampa toma mais da peça (a área "grande" de cada lado, quando existe).
  tamanho?: 'grande';
  // Para quem o design foi feito (os temas de TEMAS). Sem temas, serve para todo mundo
  // e aparece em qualquer tema.
  temas?: string[];
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

// Os temas do passo do design: para quem é a peça (pedido do Lucas, 10/11/2026). O
// cliente escolhe um e vê primeiro os designs feitos para ele; os designs sem tema
// servem para todo mundo e aparecem em todos.
// A ordem é a da fila no montador (pedido do Lucas, 10/11/2026): a família primeiro,
// começando pelas mães; "Todos" entra por último, no passo do design.
export const TEMAS = [
  { slug: 'maes', nome: 'Mães' },
  { slug: 'pais', nome: 'Pais' },
  { slug: 'avos-ele', nome: 'Avôs' },
  { slug: 'avos-ela', nome: 'Avós' },
  // Para pais e mães homenagearem os filhos (pedido do Lucas, 10/11/2026).
  { slug: 'filhos', nome: 'Filhos' },
  // Entre irmãos (pedido do Lucas, 11/11/2026).
  { slug: 'irmaos', nome: 'Irmãos' },
  { slug: 'casal', nome: 'Casal' },
  { slug: 'amigas', nome: 'Amigas' },
  { slug: 'amigos', nome: 'Amigos' },
  { slug: 'pets', nome: 'Pets' },
] as const;

// Os designs de um tema: primeiro os feitos para ele, depois os que servem para todo
// mundo. Sem tema (null), todos, na ordem da loja.
export function designsDoTema(designs: Design[], tema: string | null): Design[] {
  if (!tema) return designs;
  const doTema = designs.filter((d) => d.config.temas?.includes(tema));
  const paraTodos = designs.filter((d) => !d.config.temas?.length);
  return [...doTema, ...paraTodos];
}

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

// O valor de um campo como vai para a estampa: limpo e no tamanho do campo; no campo
// de opções, a opção escolhida ou, sem escolha, a primeira.
export function valorDoCampo(campo: Campo, valores: Record<string, string>) {
  const valor = limparTextoDaEstampa(valores[campo.chave] ?? '')
    .slice(0, campo.max)
    .trim();
  if (campo.opcoes?.length) return campo.opcoes.includes(valor) ? valor : campo.opcoes[0];
  return valor;
}

// As tintas da estampa: as cores da marca e o creme quente das estampas de turnê e
// de cinema (o tom dos mockups aprovados pelo Lucas em 10/11/2026).
export const TINTAS: Record<string, string> = {
  creme: '#FAF5EB',
  'creme-quente': '#F3DFB2',
  'verde-escuro': '#0D2B17',
};

// Onde a arte fica na foto de base de uma peça, em frações da foto: centro (x),
// topo e largura. A altura sai da proporção do molde.
// "grande" é a mesma área para os designs de estampa grande (os de turnê, que tomam
// as costas): outra largura e, se preciso, outro topo.
export type AreaNaFoto = { x: number; topo: number; largura: number; grande?: { largura: number; topo?: number } };

// A área que um design usa na peça: a normal ou, no design de estampa grande, a grande
// (quando a peça tem; o moletom com capuz na frente, por exemplo, não tem).
export function areaDoDesign(area: AreaNaFoto | null, config: ConfigDoMolde): AreaNaFoto | null {
  if (!area || config.tamanho !== 'grande' || !area.grande) return area;
  return { x: area.x, topo: area.grande.topo ?? area.topo, largura: area.grande.largura };
}

// Área de impressão de cada lado da peça (coluna area_impressao_cm de pecas).
// Lado que não aparece aqui não recebe estampa (a jaqueta bomber só tem costas).
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
