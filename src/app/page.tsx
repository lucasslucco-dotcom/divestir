import Link from 'next/link';
import { Cabecalho } from './cabecalho';
import { Vitrine } from './vitrine';

// As três linhas da Divestir (ideia do Lucas, 25/11/2026): a foto, que já existe, a
// frase, que está sendo feita, e os designs prontos, que ele ainda vai criar. Linha sem
// endereço aparece como "Em breve".
const LINHAS: { titulo: string; texto: string; href: string | null; chamada?: string }[] = [
  {
    titulo: 'Com a sua foto',
    texto: 'Quem você ama dentro de um design da Divestir.',
    href: '/montar',
    chamada: 'Criar com foto',
  },
  {
    titulo: 'Com a sua frase',
    texto: 'Você escreve o que quiser e o design faz o resto.',
    href: null,
  },
  {
    titulo: 'Designs Divestir',
    texto: 'Estampas prontas, em edições que chegam e vão embora.',
    href: null,
  },
];

const PASSOS = [
  {
    titulo: 'Escolhe a peça',
    texto: 'Camiseta, moletom ou jaqueta bomber, na modelagem masculina ou feminina.',
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
      <div className="bg-verde text-creme">
        <Cabecalho />
      </div>

      <main>
        <section className="bg-verde pb-16 text-creme sm:pb-24">
          <div className="mx-auto flex max-w-5xl flex-col items-center px-4 pt-14 text-center sm:pt-24">
            <h1 className="font-titulo text-[clamp(3.4rem,12vw,6rem)] leading-[1.12] text-balance uppercase">
              Agora dá pra vestir suas ideias.
            </h1>
            <p className="mt-6 max-w-[22ch] font-destaque text-[clamp(1.5rem,5.6vw,2.4rem)] leading-tight text-balance italic">
              Com a sua foto. Com a sua frase.
            </p>
            <ol className="mt-10 w-full max-w-2xl divide-y divide-creme border-y border-creme text-left">
              {LINHAS.map((linha, i) => (
                <li key={linha.titulo} className="flex gap-5 py-6">
                  <span aria-hidden="true" className="numero-vazado-creme w-7 shrink-0 font-titulo text-5xl leading-none">
                    {i + 1}
                  </span>
                  <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
                    <div>
                      <h2 className="font-titulo text-[1.75rem] leading-none uppercase sm:text-[2rem]">{linha.titulo}</h2>
                      <p className="mt-2 leading-snug">{linha.texto}</p>
                    </div>
                    {linha.href ? (
                      <Link href={linha.href} className="ingresso ingresso-rosa shrink-0 self-start sm:self-auto">
                        {linha.chamada}
                      </Link>
                    ) : (
                      <span className="shrink-0 self-start rounded-full border border-creme px-4 py-2 text-sm font-semibold sm:self-auto">
                        Em breve
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Vitrine />
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <h2 className="text-center font-titulo text-[clamp(2.6rem,9vw,4.75rem)] leading-none uppercase">
            Como funciona com foto
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
