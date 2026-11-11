'use client';

import { useId, useSyncExternalStore } from 'react';
import type { Cor, Peca } from '@/lib/catalogo';
import { TEMAS, designsDoTema, type Design, type Lado } from '@/lib/molde/tipos';
import { TelaDaPrevia, type FotoDaPrevia } from './tela-da-previa';

// Passo 2: o design, antes da foto (caminho novo, pedido do Lucas, 10/11/2026): a
// pessoa diz para quem é, escolhe o design e só então manda a foto, que já é ajustada
// nele. Antes da foto, cada miniatura mostra uma foto de exemplo do tema; depois, a
// foto e o nome do cliente: é aqui que a pessoa se apaixona (briefing). Aqui também se
// escolhe onde vai a estampa (decisão do Lucas, 08/11/2026).

const DIA = 24 * 60 * 60 * 1000;
// O "tema" de quem quer ver todos os designs.
export const TODOS = 'todos';

// A hora de agora vem do relógio do aparelho; no servidor, ainda não há selo.
const semAssinatura = () => () => {};
const HORA = 60 * 60 * 1000;
const agora = () => Math.floor(Date.now() / HORA) * HORA;

// "Novo" nas duas primeiras semanas do drop; "Últimos dias" na semana final.
function seloDoDrop(design: Design, hoje: number) {
  const saida = design.drop?.saida ? Date.parse(`${design.drop.saida}T23:59:59-03:00`) : NaN;
  if (Number.isFinite(saida) && saida >= hoje && saida - hoje <= 7 * DIA) return 'Últimos dias';
  const entrada = design.drop?.entrada ? Date.parse(`${design.drop.entrada}T00:00:00-03:00`) : NaN;
  if (Number.isFinite(entrada) && entrada <= hoje && hoje - entrada < 14 * DIA) return 'Novo';
  return null;
}

// Uma opção da pílula de escolha (Nas costas / Na frente), também usada no checkout.
export const opcaoDaPilula =
  'block cursor-pointer rounded-full px-3.5 py-3 text-sm leading-5 font-semibold transition-colors duration-200 ease-saida peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde';

export function PassoDesign({
  designs,
  design,
  escolhido,
  tema,
  peca,
  cor,
  lado,
  lados,
  marcaNoPeito,
  comExemplo,
  fotoDoDesign,
  valoresDoDesign,
  rotuloDoDesign,
  aoEscolherTema,
  aoEscolherDesign,
  aoEscolherLado,
}: {
  designs: Design[];
  design: Design | null;
  // A pessoa já escolheu um design (antes disso, nenhuma miniatura fica marcada, a não
  // ser que a foto dela já esteja na prévia, no primeiro da fila).
  escolhido: boolean;
  // "Para quem é?": um dos temas, "todos" ou, antes de a pessoa tocar em algum, nada (a
  // fila mostra todos os designs e nenhum tema fica marcado).
  tema: string | null;
  peca: Peca;
  cor: Cor;
  lado: Lado;
  lados: Lado[];
  marcaNoPeito: boolean;
  // As miniaturas estão com fotos de exemplo (a pessoa ainda não mandou a dela).
  comExemplo: boolean;
  // A foto de cada miniatura (a do cliente, com o ajuste daquele design, ou a de
  // exemplo) e os textos que entram na estampa.
  fotoDoDesign: (design: Design) => FotoDaPrevia | null;
  valoresDoDesign: (design: Design) => Record<string, string>;
  rotuloDoDesign: (design: Design) => string;
  aoEscolherTema: (tema: string) => void;
  aoEscolherDesign: (slug: string) => void;
  aoEscolherLado: (lado: Lado) => void;
}) {
  const id = useId();
  const hoje = useSyncExternalStore(semAssinatura, agora, () => null);

  if (!designs.length) {
    return <p className="max-w-[38ch] text-[0.9375rem] leading-snug">Ainda não temos um design para essa peça.</p>;
  }

  const base = peca.fotos[cor.slug]?.[lado];
  const area = peca.areas[lado]?.previa ?? null;
  // Costas primeiro: é o lado padrão dos designs.
  const ordem = (['costas', 'frente'] as const).filter((l) => lados.includes(l));
  // Todo tema tem pelo menos os designs que servem para todo mundo; os feitos para
  // ele vêm na frente.
  const temas = TEMAS.filter((t) => designsDoTema(designs, t.slug).length > 0);
  const temaAtual = temas.some((t) => t.slug === tema) ? tema : null;
  const lista = designsDoTema(designs, temaAtual);
  const escolherTema = (slug: string | null) => {
    aoEscolherTema(slug ?? TODOS);
    // Quem toca num tema quer ver os designs feitos para ele: o primeiro da fila entra
    // na prévia grande, a não ser que o design escolhido já seja desse tema. Tema que
    // só tem os designs de todo mundo deixa a escolha como está.
    const novos = designsDoTema(designs, slug);
    const doTema = slug ? novos.filter((d) => d.config.temas?.includes(slug)) : [];
    const serve = doTema.length ? doTema : novos;
    // "Todos" não escolhe nada por conta própria.
    if (slug && serve.length && !(escolhido && serve.some((d) => d.slug === design?.slug))) {
      aoEscolherDesign(serve[0].slug);
    }
  };

  return (
    <>
      {temas.length ? (
        // min-w-0: sem ele, o fieldset fica da largura da fila inteira e a página
        // passa da tela do celular.
        <fieldset className="mb-5 min-w-0">
          <legend className="text-base leading-snug font-semibold">Para quem é?</legend>
          <div className="vitrine -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {/* "Todos" fica por último (pedido do Lucas, 10/11/2026). */}
            {[...temas, { slug: null, nome: 'Todos' }].map((opcao) => (
              <label key={opcao.slug ?? TODOS} className="relative shrink-0">
                <input
                  type="radio"
                  name={`${id}-tema`}
                  value={opcao.slug ?? TODOS}
                  checked={opcao.slug ? opcao.slug === temaAtual : tema === TODOS}
                  onChange={() => escolherTema(opcao.slug)}
                  className="peer sr-only"
                />
                <span className={`${opcaoDaPilula} border border-verde whitespace-nowrap`}>{opcao.nome}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
      <div
        role="radiogroup"
        aria-label="Design"
        className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
      >
        {lista.map((opcaoDeDesign) => {
          const selo = hoje === null ? null : seloDoDrop(opcaoDeDesign, hoje);
          return (
            <label
              key={opcaoDeDesign.slug}
              className="relative w-[44%] shrink-0 cursor-pointer snap-start sm:w-[11rem]"
            >
              <input
                type="radio"
                name="design"
                value={opcaoDeDesign.slug}
                checked={escolhido && opcaoDeDesign.slug === design?.slug}
                onChange={() => aoEscolherDesign(opcaoDeDesign.slug)}
                className="peer sr-only"
              />
              <span className="block overflow-hidden rounded-xl border-2 border-transparent bg-estudio transition-colors duration-200 ease-saida peer-checked:border-verde peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                {base && area ? (
                  <TelaDaPrevia
                    base={base}
                    area={area}
                    corDaPeca={cor.slug}
                    arte={{
                      tipo: 'design',
                      design: opcaoDeDesign,
                      valores: valoresDoDesign(opcaoDeDesign),
                      foto: fotoDoDesign(opcaoDeDesign),
                    }}
                    perto
                    rotulo={rotuloDoDesign(opcaoDeDesign)}
                    adiar
                  />
                ) : (
                  <span className="block aspect-[4/5]" />
                )}
              </span>
              <span className="mt-1.5 flex items-center justify-between gap-2">
                <span className="text-sm leading-5 font-semibold">{opcaoDeDesign.nome}</span>
                {selo ? (
                  <span className="rounded-full bg-verde px-2 py-0.5 text-[0.6875rem] leading-4 font-semibold text-creme">
                    {selo}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 max-w-[42ch] text-xs leading-relaxed">
        {comExemplo
          ? 'Prévias ilustrativas, com fotos de exemplo. A sua foto entra no lugar assim que você mandar.'
          : 'Prévias ilustrativas, com a sua foto e o nome.'}
      </p>

      <fieldset className="mt-7">
        <legend className="text-base leading-snug font-semibold">Onde vai a estampa?</legend>
        {ordem.length > 1 ? (
          <div className="mt-2 inline-flex rounded-full border border-verde p-1">
            {ordem.map((l) => (
              <label key={l} className="relative">
                <input
                  type="radio"
                  name={`${id}-lado`}
                  value={l}
                  checked={l === lado}
                  onChange={() => aoEscolherLado(l)}
                  className="peer sr-only"
                />
                <span className={opcaoDaPilula}>{l === 'frente' ? 'Na frente' : 'Nas costas'}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[0.9375rem] leading-snug">
            Nessa peça, a estampa vai {lado === 'costas' ? 'nas costas' : 'na frente'}.
          </p>
        )}
        {marcaNoPeito ? (
          <p className="mt-3 max-w-[38ch] text-[0.9375rem] leading-snug">
            Com a estampa nas costas, a frente leva DIVESTIR pequenininho no peito.
          </p>
        ) : null}
      </fieldset>
    </>
  );
}
