import Image from 'next/image';

export type Exemplo = {
  nome: string;
  peca: string;
  foto: string;
  descricao: string;
};

// Exemplos ilustrativos do design Fã-Clube para a vitrine. Todas as fotos têm o
// fundo no verde exato da marca, então a peça parece solta na faixa verde.
export const EXEMPLOS: Exemplo[] = [
  {
    nome: 'Thor',
    peca: 'Camiseta oversized preta',
    foto: '/exemplos/exemplo-thor.jpg',
    descricao:
      'Costas de uma camiseta oversized preta com o design Fã-Clube: “Membro Oficial”, o nome THOR e a foto de um cachorro caramelo sorrindo dentro de um círculo.',
  },
];

// Com uma peça, ela fica sozinha no centro. Com várias, viram uma fileira que
// desliza com o dedo no celular e se abre em quatro colunas no computador.
export function Vitrine({ exemplos = EXEMPLOS }: { exemplos?: Exemplo[] }) {
  const varios = exemplos.length > 1;

  return (
    <figure className="mt-12 sm:mt-16">
      <ul
        className={
          varios
            ? 'vitrine flex snap-x snap-mandatory scroll-pl-4 gap-2 overflow-x-auto px-4 lg:mx-auto lg:grid lg:max-w-6xl lg:grid-cols-4 lg:gap-4 lg:overflow-visible'
            : 'mx-auto max-w-md px-4'
        }
      >
        {exemplos.map((exemplo, i) => (
          <li
            key={exemplo.nome}
            className={varios ? 'w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-auto' : undefined}
          >
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
              <span className="font-semibold text-rosa">{exemplo.nome}</span> · {exemplo.peca}
            </p>
          </li>
        ))}
      </ul>
      <figcaption className="mx-auto mt-8 max-w-[34ch] px-4 text-center text-[0.9375rem] leading-relaxed text-pretty">
        Exemplos com o design Fã-Clube. Na sua peça entram a foto e o nome de quem você ama.
      </figcaption>
    </figure>
  );
}
