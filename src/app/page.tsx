import Link from 'next/link';

const NOMES_DE_EXEMPLO = ['Thor', 'Vó Cida', 'Duda', 'Mel'];

const PASSOS = [
  {
    titulo: 'Escolhe a peça',
    texto: 'Camiseta regular ou oversized, moletom com ou sem capuz, ou jaqueta college.',
  },
  {
    titulo: 'Manda a foto',
    texto: 'Do pet, da vó, do melhor amigo ou daquele objeto que é a cara da pessoa.',
  },
  {
    titulo: 'Escolhe o design',
    texto: 'Você vê a peça pronta, na cor que escolher, antes de comprar.',
  },
  {
    titulo: 'Recebe em casa',
    texto: 'Cada Divestir é feita sob medida e chega na sua porta.',
  },
];

// Picote da área da foto: 72 furos distribuídos por igual na volta do círculo.
const RAIO_DO_PICOTE = 48;
const DISTANCIA_ENTRE_FUROS = ((2 * Math.PI * RAIO_DO_PICOTE) / 72).toFixed(4);

function BotaoCriar() {
  return (
    <Link href="/montar" className="ingresso">
      Criar minha Divestir
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <header className="flex justify-center px-4 pt-5">
        <Link href="/" className="px-2 py-2 font-titulo text-xl uppercase tracking-[0.06em]">
          Divestir
        </Link>
      </header>

      <main>
        <section className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 pb-20 text-center sm:pt-24 sm:pb-28">
          <h1 className="font-titulo text-[clamp(3.4rem,12vw,6rem)] leading-[1.12] text-balance uppercase">
            Merch oficial de quem você ama.
          </h1>
          <p className="mt-6 max-w-[22ch] font-destaque text-[clamp(1.5rem,5.6vw,2.4rem)] leading-tight text-balance italic">
            Manda a foto. A gente transforma em ídolo.
          </p>
          <div className="mt-10">
            <BotaoCriar />
          </div>
        </section>

        <section className="bg-azul text-creme">
          <figure className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
            <div aria-hidden="true" className="flex flex-col items-center">
              <p className="font-destaque text-[clamp(1.25rem,4.6vw,1.9rem)] italic">Membro Oficial</p>
              <p className="nome-rotativo mt-[0.14em] font-titulo text-[clamp(5rem,25vw,11.5rem)] leading-none uppercase">
                {NOMES_DE_EXEMPLO.map((nome) => (
                  <span key={nome}>{nome}</span>
                ))}
              </p>
              <div className="relative z-10 -mt-[clamp(1.9rem,9.5vw,4.4rem)] grid aspect-square w-[clamp(9.5rem,42vw,16.5rem)] place-items-center rounded-full bg-creme text-azul outline-[0.55rem] outline-azul outline-solid">
                <svg viewBox="0 0 100 100" fill="none" className="absolute top-[6%] left-[6%] size-[88%]">
                  <circle
                    cx="50"
                    cy="50"
                    r={RAIO_DO_PICOTE}
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeDasharray={`0 ${DISTANCIA_ENTRE_FUROS}`}
                  />
                </svg>
                <span className="font-destaque text-[clamp(1.15rem,4.4vw,1.6rem)] italic">sua foto aqui</span>
              </div>
              <p className="relative z-20 mt-[0.06em] font-destaque text-[clamp(2.9rem,12vw,5.75rem)] leading-none text-amarelo italic">
                Fã-Clube
              </p>
            </div>
            <figcaption className="mt-10 max-w-[34ch] text-[0.9375rem] leading-relaxed text-pretty">
              Esse é o design Fã-Clube. Na sua peça entram a foto e o nome de quem você ama.
            </figcaption>
          </figure>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <h2 className="text-center font-titulo text-[clamp(2.6rem,9vw,4.75rem)] leading-none uppercase">
            Como funciona
          </h2>
          <ol className="mx-auto mt-12 grid max-w-3xl gap-10 sm:mt-16 sm:grid-cols-2 sm:gap-x-16 sm:gap-y-14">
            {PASSOS.map((passo, i) => (
              <li key={passo.titulo} className="flex gap-5">
                <span aria-hidden="true" className="numero-vazado w-7 shrink-0 font-titulo text-5xl leading-none">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{passo.titulo}</h3>
                  <p className="mt-1.5 leading-relaxed">{passo.texto}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-16 flex justify-center">
            <BotaoCriar />
          </div>
        </section>
      </main>

      <footer className="bg-azul px-4 py-8 text-center text-sm text-creme">© 2026 Divestir</footer>
    </>
  );
}
