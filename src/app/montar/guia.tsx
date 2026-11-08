import Image from 'next/image';
import { IconeNao, IconeSim } from './icones';

// O guia da foto perfeita (briefing, seção "Guia da foto perfeita"): cada dica
// mostra a mesma foto feita do jeito certo e do jeito errado, lado a lado, e a dica
// de ouro fecha a fila. As fotos ficam em public/guia/ e são exemplos ilustrativos.
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
    id: 'frente',
    titulo: 'Nada na frente',
    texto: 'Sem mesa, copo ou mão de alguém na frente: o que encosta no protagonista sai junto no recorte.',
    sim: 'Cachorro preto sentado, sem nada na frente',
    nao: 'O mesmo cachorro com uma mão no peito e uma mesa com copo na frente',
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
        sizes="(min-width: 1024px) 180px, (min-width: 640px) 220px, 42vw"
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
      <h3 id="guia-titulo" className="sr-only">
        Guia da foto perfeita
      </h3>
      {/* As dicas deslizam com o dedo, e a próxima aparece na beirada. */}
      <ul
        tabIndex={0}
        aria-label="Dicas para a foto"
        className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-4 overflow-x-auto px-4 pb-1 focus-visible:outline-offset-[-2px] sm:mx-0 sm:px-0 lg:-mx-1 lg:scroll-pl-1 lg:px-1"
      >
        {DICAS.map((dica) => (
          <li key={dica.id} className="w-[84%] shrink-0 snap-start sm:w-[22rem] lg:w-[88%]">
            <div className="grid grid-cols-2 gap-2">
              <Exemplo src={`/guia/${dica.id}-sim.jpg`} alt={dica.sim} certo rotulo="Assim sim" />
              <Exemplo src={`/guia/${dica.id}-nao.jpg`} alt={dica.nao} certo={false} rotulo="Assim não" />
            </div>
            <h4 className="mt-3 text-[1.0625rem] leading-snug font-semibold">{dica.titulo}</h4>
            <p className="mt-1 max-w-[34ch] text-[0.9375rem] leading-snug">{dica.texto}</p>
          </li>
        ))}
        <li className="w-[84%] shrink-0 snap-start sm:w-[22rem] lg:w-[88%]">
          <div className="grid grid-cols-2 gap-2">
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
          <h4 className="mt-3 font-titulo text-[1.75rem] leading-none uppercase">Dica de ouro</h4>
          <p className="mt-2 max-w-[30ch] font-destaque text-[1.3rem] leading-tight italic">
            A foto original do celular é sempre melhor que a que passou pelo WhatsApp.
          </p>
        </li>
      </ul>
      <p className="mt-3 text-xs leading-relaxed">As fotos do guia são exemplos ilustrativos.</p>
    </section>
  );
}
