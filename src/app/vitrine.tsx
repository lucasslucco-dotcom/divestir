import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Image from 'next/image';

export type Exemplo = {
  nome: string;
  design: string;
  peca: string;
  foto: string;
  descricao: string;
};

// Exemplos ilustrativos da vitrine: um para cada design, com gente, pet e objeto,
// em peças e cores diferentes. Todas as fotos têm o fundo no verde exato da
// marca (passam antes pelo scripts/preparar-vitrine.py), então a peça parece
// solta na faixa verde. A ordem alterna design, peça e cor para o cliente
// entender o produto logo nas primeiras fotos.
export const EXEMPLOS: Exemplo[] = [
  {
    nome: 'Thor',
    design: 'Fã-Clube',
    peca: 'Camiseta oversized preta',
    foto: '/exemplos/exemplo-thor.jpg',
    descricao:
      'Costas de uma camiseta oversized preta com o design Fã-Clube: “Membro Oficial”, o nome THOR e a foto de um cachorro caramelo sorrindo dentro de um círculo.',
  },
  {
    nome: 'Regina',
    design: 'Capa de Revista',
    peca: 'Camiseta oversized branca',
    foto: '/exemplos/exemplo-regina.jpg',
    descricao:
      'Costas de uma camiseta oversized branca com o design Capa de Revista: a foto de uma mulher elegante como capa de moda, o nome REGINA no topo, “Edição Especial” e “O ícone do ano”.',
  },
  {
    nome: 'Paçoca',
    design: 'Futebol Clube',
    peca: 'Moletom branco',
    foto: '/exemplos/exemplo-pacoca.jpg',
    descricao:
      'Costas de um moletom branco com o design Futebol Clube: um escudo vintage com a foto de um buldogue francês, “Paçoca F.C.” e “Fundado em 2021”.',
  },
  {
    nome: 'Vó Cida',
    design: 'Fã-Clube',
    peca: 'Moletom com capuz creme',
    foto: '/exemplos/exemplo-vo-cida.jpg',
    descricao:
      'Costas de um moletom com capuz creme com o design Fã-Clube: “Membro Oficial”, o nome VÓ CIDA e a foto de uma avó sorrindo dentro de um círculo.',
  },
  {
    nome: 'Seu Zé',
    design: 'Turnê',
    peca: 'Camiseta preta',
    foto: '/exemplos/exemplo-seu-ze.jpg',
    descricao:
      'Costas de uma camiseta preta com o design Turnê: “Seu Zé · Turnê 2026”, a foto de um senhor de bigode rindo e as datas Sala de Estar, Almoço de Domingo, Sofá e Meu Coração.',
  },
  {
    nome: 'Viola',
    design: 'Maison',
    peca: 'Camiseta creme',
    foto: '/exemplos/exemplo-viola.jpg',
    descricao:
      'Costas de uma camiseta creme com o design Maison: o nome VIOLA em letras finas e espaçadas, a foto de uma viola caipira e “Uberlândia · Paris · Sofá da Sala”.',
  },
  {
    nome: 'Nina',
    design: 'Procura-se',
    peca: 'Moletom com capuz preto',
    foto: '/exemplos/exemplo-nina.jpg',
    descricao:
      'Costas de um moletom com capuz preto com o design Procura-se: cartaz de velho oeste com a foto de uma gata, o nome NINA, “Por roubar meu coração” e “Recompensa: amor eterno”.',
  },
];

// Só entram na vitrine os exemplos cuja foto já está em public/exemplos.
function exemplosComFoto(exemplos: Exemplo[]) {
  return exemplos.filter((exemplo) => existsSync(join(process.cwd(), 'public', exemplo.foto)));
}

// Com uma peça, ela fica sozinha no centro. Com várias, viram uma fileira que
// desliza com o dedo no celular e se abre em quatro colunas no computador.
export function Vitrine({ exemplos = exemplosComFoto(EXEMPLOS) }: { exemplos?: Exemplo[] }) {
  const varios = exemplos.length > 1;

  return (
    <figure className="mt-12 sm:mt-16">
      <ul
        className={
          varios
            ? 'vitrine flex snap-x snap-mandatory scroll-pl-4 gap-2 overflow-x-auto px-4 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-4 lg:gap-x-4 lg:gap-y-8 lg:overflow-visible'
            : 'mx-auto max-w-md px-4'
        }
      >
        {exemplos.map((exemplo, i) => (
          <li key={exemplo.nome} className={varios ? 'w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-auto' : undefined}>
            <Image
              src={exemplo.foto}
              alt={exemplo.descricao}
              width={896}
              height={1120}
              sizes={
                varios ? '(min-width: 1024px) 280px, (min-width: 640px) 44vw, 78vw' : '(min-width: 448px) 416px, 92vw'
              }
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
              className="borda-suave h-auto w-full"
            />
            <p className="mt-1 text-center text-sm">
              <span className="font-semibold text-rosa">{exemplo.nome}</span> · {exemplo.design}
            </p>
            <p className="text-center text-sm">{exemplo.peca}</p>
          </li>
        ))}
      </ul>
      <figcaption className="mx-auto mt-8 max-w-[34ch] px-4 text-center text-[0.9375rem] leading-relaxed text-pretty">
        Exemplos ilustrativos. Na sua peça entram a foto e o nome de quem você ama, no design que você escolher.
      </figcaption>
    </figure>
  );
}
