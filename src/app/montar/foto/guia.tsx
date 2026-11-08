import Image from 'next/image';
import { IconeNao, IconeSim } from './icones';

// O guia da foto perfeita (briefing, seção "Guia da foto perfeita"): cada dica
// mostra a mesma foto feita do jeito certo e do jeito errado, lado a lado.
// As fotos ficam em public/guia/ e são exemplos ilustrativos.
const DICAS = [
  {
    id: 'luz',
    titulo: 'Luz natural',
    texto: 'Perto de uma janela, de dia. Nada de flash ou contra a luz.',
    sim: 'Cachorro caramelo iluminado pela luz de uma janela',
    nao: 'O mesmo cachorro contra a luz, com o rosto escuro',
  },
  {
    id: 'foco',
    titulo: 'Foco nítido',
    texto: 'Sem tremido, sem desfoque.',
    sim: 'Gato rajado com os bigodes bem nítidos',
    nao: 'O mesmo gato numa foto tremida',
  },
  {
    id: 'rosto',
    titulo: 'Rosto inteiro',
    texto: 'Nada cortado, coberto ou de óculos escuros.',
    sim: 'Moça de cabelo cacheado com o rosto inteiro na foto',
    nao: 'A mesma moça de óculos escuros e com a testa cortada',
  },
  {
    id: 'sozinho',
    titulo: 'Só ele(a) na foto',
    texto: 'Se tiver mais gente, a gente recorta, mas o protagonista precisa estar bem visível.',
    sim: 'Rapaz sozinho na foto, bem no centro',
    nao: 'O mesmo rapaz pequeno no meio de muita gente',
  },
  {
    id: 'filtro',
    titulo: 'Sem filtro',
    texto: 'Nada de efeito, moldura ou figurinha.',
    sim: 'Senhora sorrindo numa foto sem filtro',
    nao: 'A mesma foto com filtro, figurinhas e moldura',
  },
  {
    id: 'altura',
    titulo: 'Na altura dos olhos',
    texto: 'Pets ficam muito mais expressivos assim.',
    sim: 'Cachorro fotografado na altura dos olhos',
    nao: 'O mesmo cachorro fotografado de cima',
  },
  {
    id: 'objeto',
    titulo: 'Foto de objeto',
    texto: 'Fundo liso e o objeto inteiro no quadro.',
    sim: 'Violão inteiro em frente a uma parede lisa',
    nao: 'O mesmo violão cortado, num quarto bagunçado',
  },
];

function Exemplo({
  src,
  alt,
  certo,
  rotulo,
  quadrado = false,
}: {
  src: string;
  alt: string;
  certo: boolean;
  rotulo: string;
  quadrado?: boolean;
}) {
  return (
    <figure className="relative">
      <Image
        src={src}
        alt={alt}
        width={quadrado ? 640 : 900}
        height={quadrado ? 640 : 1125}
        sizes="(min-width: 640px) 200px, 44vw"
        className={`h-auto w-full rounded-xl bg-estudio object-cover ${quadrado ? 'aspect-square' : 'aspect-[4/5]'}`}
      />
      <figcaption
        className={`absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full py-1 pr-2.5 pl-2 text-xs leading-4 font-semibold ${
          certo ? 'bg-verde text-creme' : 'border border-verde bg-creme text-verde'
        }`}
      >
        {certo ? <IconeSim tamanho={13} /> : <IconeNao tamanho={13} />}
        {rotulo}
      </figcaption>
    </figure>
  );
}

export function Guia() {
  return (
    <section aria-labelledby="guia-titulo">
      <h2 id="guia-titulo" className="sr-only">
        Guia da foto perfeita
      </h2>
      {/* No celular, as dicas deslizam com o dedo; do tablet para cima, viram uma grade de duas colunas. */}
      <ul
        tabIndex={0}
        aria-label="Dicas para a foto"
        className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-1 focus-visible:outline-offset-[-2px] sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 sm:overflow-visible sm:px-0 lg:gap-x-8 lg:gap-y-12"
      >
        {DICAS.map((dica) => (
          <li key={dica.id} className="w-[86%] shrink-0 snap-start sm:w-auto">
            <div className="grid grid-cols-2 gap-2">
              <Exemplo src={`/guia/${dica.id}-sim.jpg`} alt={dica.sim} certo rotulo="Assim sim" />
              <Exemplo src={`/guia/${dica.id}-nao.jpg`} alt={dica.nao} certo={false} rotulo="Assim não" />
            </div>
            <h3 className="mt-3 text-[1.0625rem] leading-snug font-semibold">{dica.titulo}</h3>
            <p className="mt-1 max-w-[34ch] text-[0.9375rem] leading-snug">{dica.texto}</p>
          </li>
        ))}
      </ul>

      <div className="mt-14 border-t border-verde pt-8">
        <h3 className="font-titulo text-[clamp(1.75rem,6.5vw,2.25rem)] leading-none uppercase">Dica de ouro</h3>
        <p className="mt-3 max-w-[34ch] font-destaque text-[clamp(1.2rem,4.4vw,1.45rem)] leading-tight italic">
          A foto original do celular é sempre melhor que a que passou pelo WhatsApp.
        </p>
        <div className="mt-5 grid max-w-md grid-cols-2 gap-2">
          <Exemplo
            src="/guia/ouro-original.jpg"
            alt="Detalhe do olho do cachorro na foto original, bem nítido"
            certo
            rotulo="Original"
            quadrado
          />
          <Exemplo
            src="/guia/ouro-whatsapp.jpg"
            alt="O mesmo detalhe depois de passar pelo WhatsApp, borrado e quadriculado"
            certo={false}
            rotulo="Pelo WhatsApp"
            quadrado
          />
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed">As fotos do guia são exemplos ilustrativos.</p>
    </section>
  );
}
