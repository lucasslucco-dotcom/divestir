// As fotos de exemplo do montador. Desde 11/11/2026 o design vem antes da foto (pedido
// do Lucas): enquanto a pessoa não manda a dela, as miniaturas dos designs e a prévia
// mostram uma foto de exemplo do tema escolhido em "Para quem é?", sempre marcada como
// exemplo. São fotos geradas (ninguém de verdade), em `public/designs/exemplos/`,
// preparadas pelo `scripts/preparar-exemplos.py`, que também mostra a geometria.
import type { Geometria } from '@/lib/foto/enquadramento';
import type { Design } from './tipos';

export type FotoDeExemplo = {
  url: string;
  // Onde está quem aparece, como no recorte do cliente.
  geometria: Geometria;
  // A mesma foto com o fundo, no mesmo quadro (para o design que usa a foto inteira).
  inteira?: string;
  // O nome que aparece na estampa enquanto a pessoa não escreve o dela (até 8 letras,
  // para caber em qualquer design; o de casal só aparece nos designs de casal e nos
  // que servem para todo mundo, que aceitam 10).
  nome: string;
};

const PASTA = '/designs/exemplos';

const FOTOS = {
  mae: {
    url: `${PASTA}/mae.webp`,
    geometria: { largura: 1000, altura: 1250, caixa: { x: 78, y: 118, largura: 808, altura: 1132 } },
    nome: 'REGINA',
  },
  pai: {
    url: `${PASTA}/pai.webp`,
    geometria: { largura: 900, altura: 1125, caixa: { x: 69, y: 15, largura: 804, altura: 1110 } },
    nome: 'PAULÃO',
  },
  'avo-ele': {
    url: `${PASTA}/avo-ele.webp`,
    geometria: { largura: 800, altura: 1000, caixa: { x: 0, y: 172, largura: 794, altura: 828 } },
    nome: 'VÔ ZECA',
  },
  'avo-ela': {
    url: `${PASTA}/avo-ela.webp`,
    geometria: { largura: 800, altura: 1000, caixa: { x: 156, y: 281, largura: 484, altura: 719 } },
    nome: 'VÓ CIDA',
  },
  filho: {
    url: `${PASTA}/filho.webp`,
    geometria: { largura: 800, altura: 1000, caixa: { x: 169, y: 293, largura: 454, altura: 707 } },
    nome: 'THEO',
  },
  irmao: {
    url: `${PASTA}/amigo.webp`,
    geometria: { largura: 1000, altura: 1250, caixa: { x: 204, y: 182, largura: 573, altura: 1068 } },
    nome: 'DUDU',
  },
  casal: {
    url: `${PASTA}/casal.webp`,
    geometria: { largura: 800, altura: 1000, caixa: { x: 132, y: 356, largura: 612, altura: 644 } },
    inteira: `${PASTA}/casal-inteira.jpg`,
    nome: 'ANA & LEO',
  },
  amiga: {
    url: `${PASTA}/amiga.webp`,
    geometria: { largura: 999, altura: 1250, caixa: { x: 85, y: 24, largura: 914, altura: 1226 } },
    nome: 'CAROL',
  },
  amigo: {
    url: `${PASTA}/amigo.webp`,
    geometria: { largura: 1000, altura: 1250, caixa: { x: 204, y: 182, largura: 573, altura: 1068 } },
    nome: 'TONHÃO',
  },
  pet: {
    url: `${PASTA}/pet.webp`,
    geometria: { largura: 800, altura: 1000, caixa: { x: 119, y: 228, largura: 537, altura: 772 } },
    nome: 'LUNA',
  },
} satisfies Record<string, FotoDeExemplo>;

// O exemplo de cada tema (os códigos de TEMAS, em tipos.ts).
const DO_TEMA: Record<string, FotoDeExemplo> = {
  maes: FOTOS.mae,
  pais: FOTOS.pai,
  'avos-ele': FOTOS['avo-ele'],
  'avos-ela': FOTOS['avo-ela'],
  filhos: FOTOS.filho,
  irmaos: FOTOS.irmao,
  casal: FOTOS.casal,
  amigas: FOTOS.amiga,
  amigos: FOTOS.amigo,
  pets: FOTOS.pet,
};

// Design que serve para todo mundo, visto sem tema: pet, gente e gente, para a fila
// mostrar que qualquer foto cabe (princípio do produto).
const SEM_TEMA = [FOTOS.pet, FOTOS.amiga, FOTOS.pai];

// A foto de exemplo de um design: a do tema escolhido, se o design foi feito para ele
// ou serve para todo mundo; senão a do primeiro tema do próprio design.
export function exemploDoDesign(design: Design, tema: string | null): FotoDeExemplo {
  const temas = design.config.temas ?? [];
  if (tema && DO_TEMA[tema] && (!temas.length || temas.includes(tema))) return DO_TEMA[tema];
  for (const t of temas) if (DO_TEMA[t]) return DO_TEMA[t];
  let soma = 0;
  for (const letra of design.slug) soma += letra.charCodeAt(0);
  return SEM_TEMA[soma % SEM_TEMA.length];
}
