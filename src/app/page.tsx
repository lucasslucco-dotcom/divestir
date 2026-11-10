import Link from 'next/link';
import { Cabecalho } from './cabecalho';
import { Vitrine } from './vitrine';

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

function BotaoCriar({ sobreVerde = false }: { sobreVerde?: boolean }) {
  return (
    <Link href="/montar" className={sobreVerde ? 'ingresso ingresso-rosa' : 'ingresso'}>
      Criar minha Divestir
    </Link>
  );
}

export default function Home() {
  return (
    <>
      <div className="bg-verde text-creme">
        <Cabecalho />
      </div>

      <main>
        <section className="bg-verde pb-16 text-creme sm:pb-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 text-center sm:pt-24">
            <h1 className="font-titulo text-[clamp(3.4rem,12vw,6rem)] leading-[1.12] text-balance uppercase">
              Aquela foto merece virar roupa.
            </h1>
            <p className="mt-6 max-w-[22ch] font-destaque text-[clamp(1.5rem,5.6vw,2.4rem)] leading-tight text-balance italic">
              Uma foto <span className="font-titulo tracking-[0.02em] not-italic">DIVESTIR</span>.
            </p>
            <div className="mt-10">
              <BotaoCriar sobreVerde />
            </div>
          </div>

          <Vitrine />
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

      <footer className="bg-verde px-4 py-8 text-center text-sm text-creme">© 2026 Divestir</footer>
    </>
  );
}
