// O molde (template) de um design: o que entra na arte, onde e com que tinta.
// Fica na coluna config da tabela designs (briefing, "Sistema de templates de design").
//
// Medidas em unidades da arte: ela tem 1000 de largura e 1000 ÷ proporcao de altura.
// Como tudo é proporcional, o mesmo molde serve para qualquer peça, lado e tamanho
// de impressão. As camadas são pintadas na ordem em que aparecem.

export type Lado = 'frente' | 'costas';

// Papéis de fonte da marca: o site resolve cada um para a fonte carregada.
export type FonteDoMolde = 'titulo' | 'destaque-italico';

// Texto fixo, centralizado em x, com a base da linha em "base" e a largura dada.
export type CamadaTexto = {
  tipo: 'texto';
  texto: string;
  fonte: FonteDoMolde;
  x: number;
  base: number;
  largura: number;
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
// desce nas pontas ("arco": quanto as pontas ficam mais altas que o meio).
// Nomes longos primeiro estreitam as letras (até "compressao_maxima") e só
// depois diminuem.
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
};

// A foto do cliente, recortada pelo círculo. Na metade de cima, ela pode passar do
// círculo até "vaza_acima" unidades (a cabeça passa por cima do anel e da base do
// nome); dali em diante, um círculo maior corta. Assim o nome nunca some.
export type CamadaFoto = {
  tipo: 'foto';
  formato: 'circulo';
  x: number;
  y: number;
  raio: number;
  vaza_acima: number;
};

// Arte fixa em SVG de uma tinta só (a cor vem de currentColor). "folga" abre um
// respiro em volta dela, apagando o que estiver embaixo (foto, anel, nome).
export type CamadaArte = {
  tipo: 'arte';
  arquivo: string;
  x: number;
  topo: number;
  largura: number;
  folga: number;
};

export type Camada = CamadaTexto | CamadaAnel | CamadaNome | CamadaFoto | CamadaArte;

export type Campo = {
  chave: string;
  rotulo: string;
  max: number;
  caixa: 'alta' | 'livre';
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
};

export type Design = {
  slug: string;
  nome: string;
  config: ConfigDoMolde;
};

export const LARGURA_DA_ARTE = 1000;

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
// As medidas em centímetros chegam quando a estamparia confirmar.
export type AreaDeImpressao = {
  largura_cm?: number | null;
  altura_cm?: number | null;
  previa: AreaNaFoto;
};
export type AreasDaPeca = Partial<Record<Lado, AreaDeImpressao>>;

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
