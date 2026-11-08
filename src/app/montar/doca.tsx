'use client';

import type { Cor } from '@/lib/catalogo';
import type { AreaNaFoto } from '@/lib/molde/tipos';
import { TelaDaPrevia, type ArteDaPrevia, type MudarEnquadramento } from './tela-da-previa';

// A prévia fixa do montador (briefing: "a prévia da peça fica fixa, no topo no
// celular, à esquerda no desktop"). A vista grande e, ao lado, as outras vistas
// pequenas: a pessoa vê sempre a frente e as costas. Embaixo, as cores.

export type Vista = 'perto' | 'inteira' | 'outro' | 'frente' | 'costas';

export type DescricaoDaVista = {
  vista: Vista;
  legenda: string;
  // O que tocar na vista pequena faz, para o leitor de tela ("Ver de perto").
  acao: string;
  base: string;
  area: AreaNaFoto | null;
  arte: ArteDaPrevia | null;
  perto: boolean;
  rotulo: string;
};

export function Doca({
  vistas,
  grande,
  aoVer,
  cores,
  cor,
  aoEscolherCor,
  ajuste,
  descricaoDoAjuste,
  compacta,
}: {
  vistas: DescricaoDaVista[];
  grande: Vista;
  aoVer: (vista: Vista) => void;
  cores: Cor[];
  cor: Cor;
  aoEscolherCor: (slug: string) => void;
  ajuste?: MudarEnquadramento;
  descricaoDoAjuste?: string;
  // Enquanto a pessoa digita no celular, a prévia encolhe para o campo caber na tela.
  compacta: boolean;
}) {
  const principal = vistas.find((v) => v.vista === grande) ?? vistas[0];
  const outras = vistas.filter((v) => v !== principal);
  if (!principal) return null;

  return (
    <div className="mx-auto w-fit">
      <div className="flex items-start justify-center gap-2 sm:gap-3">
        <TelaDaPrevia
          base={principal.base}
          area={principal.area}
          corDaPeca={cor.slug}
          arte={principal.arte}
          perto={principal.perto}
          rotulo={principal.rotulo}
          ajuste={ajuste}
          descricao={descricaoDoAjuste}
          className="w-[calc(var(--altura-da-vista)*0.8)] shrink-0 rounded-2xl transition-[width] duration-200 ease-saida motion-reduce:transition-none"
        />
        {outras.length && !compacta ? (
          <ul
            aria-label="Outras vistas"
            className="flex w-[min(calc((var(--altura-da-vista)-3.5rem)*0.4),7.5rem)] flex-col gap-2"
          >
            {outras.map((v) => (
              <li key={v.vista}>
                <button
                  type="button"
                  onClick={() => aoVer(v.vista)}
                  aria-label={v.acao}
                  className="group block w-full cursor-pointer text-center"
                >
                  <TelaDaPrevia
                    base={v.base}
                    area={v.area}
                    corDaPeca={cor.slug}
                    arte={v.arte}
                    perto={v.perto}
                    rotulo={v.rotulo}
                    className="rounded-xl outline-offset-2 group-hover:outline-1 group-hover:outline-verde group-focus-visible:outline-2 group-focus-visible:outline-verde"
                  />
                  <span className="mt-1 block text-xs leading-4 font-semibold">{v.legenda}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className={`mt-2.5 flex items-center justify-between gap-3 ${compacta ? 'hidden' : ''}`}>
        <fieldset className="flex min-w-0 items-center gap-2">
          <legend className="sr-only">Cor da peça</legend>
          {cores.map((opcao) => (
            <label key={opcao.slug} className="relative flex size-11 cursor-pointer items-center justify-center">
              <input
                type="radio"
                name="cor-da-doca"
                value={opcao.slug}
                checked={opcao.slug === cor.slug}
                onChange={() => aoEscolherCor(opcao.slug)}
                aria-label={opcao.nome}
                className="peer sr-only"
              />
              <span
                className="block size-8 rounded-full border border-verde outline-offset-[3px] peer-checked:outline-2 peer-checked:outline-verde peer-focus-visible:outline-2 peer-focus-visible:outline-verde"
                style={{ backgroundColor: opcao.hex }}
              />
            </label>
          ))}
          <span aria-hidden="true" className="ml-0.5 truncate text-sm leading-5 font-semibold">
            {cor.nome}
          </span>
        </fieldset>
        {/* Toda prévia leva o selo (briefing): fora da imagem, para nunca cobrir a arte. */}
        <span className="shrink-0 rounded-full border border-verde px-2.5 py-1 text-[0.6875rem] leading-4 font-semibold">
          Prévia ilustrativa
        </span>
      </div>
    </div>
  );
}
