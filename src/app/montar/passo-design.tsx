'use client';

import { useId, useState, useSyncExternalStore } from 'react';
import type { Cor, Peca } from '@/lib/catalogo';
import { TEMAS, designsDoTema, tirarSimbolosDaEstampa, type Design, type Lado } from '@/lib/molde/tipos';
import { TelaDaPrevia, type FotoDaPrevia } from './tela-da-previa';

// Passo 4: o design. Cada miniatura já vem com a foto e o nome do cliente, não com
// um exemplo genérico: é aqui que a pessoa se apaixona (briefing). Aqui também se
// escolhe onde vai a estampa (decisão do Lucas, 08/11/2026).

const DIA = 24 * 60 * 60 * 1000;

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
  peca,
  cor,
  lado,
  lados,
  marcaNoPeito,
  foto,
  valores,
  rotuloDoDesign,
  aoEscolherDesign,
  aoEscolherLado,
  aoMudarCampo,
}: {
  designs: Design[];
  design: Design | null;
  peca: Peca;
  cor: Cor;
  lado: Lado;
  lados: Lado[];
  marcaNoPeito: boolean;
  foto: FotoDaPrevia | null;
  valores: Record<string, string>;
  rotuloDoDesign: (design: Design) => string;
  aoEscolherDesign: (slug: string) => void;
  aoEscolherLado: (lado: Lado) => void;
  aoMudarCampo: (chave: string, valor: string) => void;
}) {
  const id = useId();
  const hoje = useSyncExternalStore(semAssinatura, agora, () => null);
  // O tema escolhido ("Para quem é?"): null é "Todos".
  const [tema, setTema] = useState<string | null>(null);

  if (!designs.length) {
    return <p className="max-w-[38ch] text-[0.9375rem] leading-snug">Ainda não temos um design para essa peça.</p>;
  }
  if (!foto) {
    return (
      <p className="max-w-[38ch] text-[0.9375rem] leading-snug">
        Os designs aparecem aqui já com a sua foto e o nome, assim que a foto estiver pronta.
      </p>
    );
  }

  const base = peca.fotos[cor.slug]?.[lado];
  const area = peca.areas[lado]?.previa ?? null;
  const extras = design?.config.campos.filter((campo) => campo.chave !== 'nome') ?? [];
  // Costas primeiro: é o lado padrão dos designs.
  const ordem = (['costas', 'frente'] as const).filter((l) => lados.includes(l));
  // Todo tema tem pelo menos os designs que servem para todo mundo; os feitos para
  // ele vêm na frente.
  const temas = TEMAS.filter((t) => designsDoTema(designs, t.slug).length > 0);
  const temaAtual = temas.some((t) => t.slug === tema) ? tema : null;
  const lista = designsDoTema(designs, temaAtual);
  const escolherTema = (slug: string | null) => {
    setTema(slug);
    // O design escolhido continua valendo se também for desse tema; senão, entra o
    // primeiro do tema, para a prévia grande mostrar o que está na fila.
    const novos = designsDoTema(designs, slug);
    if (novos.length && !novos.some((d) => d.slug === design?.slug)) aoEscolherDesign(novos[0].slug);
  };

  return (
    <>
      {temas.length ? (
        <fieldset className="mb-5">
          <legend className="text-base leading-snug font-semibold">Para quem é?</legend>
          <div className="vitrine -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: null, nome: 'Todos' }, ...temas].map((opcao) => (
              <label key={opcao.slug ?? 'todos'} className="relative shrink-0">
                <input
                  type="radio"
                  name={`${id}-tema`}
                  value={opcao.slug ?? ''}
                  checked={opcao.slug === temaAtual}
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
                checked={opcaoDeDesign.slug === design?.slug}
                onChange={() => aoEscolherDesign(opcaoDeDesign.slug)}
                className="peer sr-only"
              />
              <span className="block overflow-hidden rounded-xl border-2 border-transparent bg-estudio transition-colors duration-200 ease-saida peer-checked:border-verde peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde">
                {base && area ? (
                  <TelaDaPrevia
                    base={base}
                    area={area}
                    corDaPeca={cor.slug}
                    arte={{ tipo: 'design', design: opcaoDeDesign, valores, foto }}
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
      <p className="mt-2 text-xs leading-relaxed">Prévias ilustrativas, com a sua foto e o nome.</p>

      {extras.map((campo) => (
        <div key={campo.chave} className="mt-6">
          <label htmlFor={`${id}-${campo.chave}`} className="block text-base leading-snug font-semibold">
            {campo.rotulo}
          </label>
          <input
            id={`${id}-${campo.chave}`}
            type="text"
            value={valores[campo.chave] ?? ''}
            // Como no nome: emoji e símbolos não saem na estampa e nem entram aqui.
            onChange={(evento) =>
              aoMudarCampo(
                campo.chave,
                (evento.nativeEvent as InputEvent).isComposing
                  ? evento.target.value.slice(0, campo.max)
                  : tirarSimbolosDaEstampa(evento.target.value).slice(0, campo.max),
              )
            }
            onBlur={(evento) =>
              aoMudarCampo(campo.chave, tirarSimbolosDaEstampa(evento.target.value).slice(0, campo.max))
            }
            onKeyDown={(evento) => {
              if (evento.key === 'Enter') evento.currentTarget.blur();
            }}
            maxLength={campo.max}
            inputMode={campo.exemplo && /^\d+$/.test(campo.exemplo) ? 'numeric' : undefined}
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby={campo.exemplo ? `${id}-${campo.chave}-ajuda` : undefined}
            className={`mt-2 h-12 w-full max-w-[22rem] rounded-md border border-verde bg-creme px-4 text-lg leading-none font-semibold outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde ${
              campo.caixa === 'alta' ? 'tracking-[0.04em] uppercase' : ''
            }`}
          />
          {campo.exemplo ? (
            <p id={`${id}-${campo.chave}-ajuda`} className="mt-2 text-[0.9375rem] leading-snug">
              Vai na estampa. Por exemplo: {campo.exemplo}.
            </p>
          ) : null}
        </div>
      ))}

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
