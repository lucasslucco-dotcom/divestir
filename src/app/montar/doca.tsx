'use client';

import type { Cor } from '@/lib/catalogo';
import type { Definicao } from '@/lib/foto/definicao';
import {
  ENQUADRAMENTO_INICIAL,
  PASSO_DO_ZOOM,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ehInicial,
  zoomEm,
  type Enquadramento,
} from '@/lib/foto/enquadramento';
import type { AreaNaFoto } from '@/lib/molde/tipos';
import { IconeAlerta, IconeMais, IconeMenos } from './icones';
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

// O ajuste da foto, colado na prévia (pedido do Lucas, 10/11/2026, e caminho novo de
// 11/11/2026): o zoom, "Trocar a foto" e "Ficou ótimo" ficam sempre à mão, em qualquer
// passo, porque trocar de design abre o ajuste de novo.
export type AjusteDaDoca = {
  mudar: MudarEnquadramento;
  // O texto que explica o ajuste (id do elemento), para o leitor de tela.
  descricao: string;
  enquadramento: Enquadramento;
  definicao: Definicao['nivel'] | null;
  aoTrocarFoto: () => void;
  aoAprovar: () => void;
};

const porcentagem = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

const botaoDeZoom =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-verde hover:bg-verde hover:text-creme disabled:cursor-default disabled:border-dashed disabled:hover:bg-transparent disabled:hover:text-verde';

// O segundo botão da dupla (ao lado do ingresso): contorno verde, mesma altura.
const botaoDeContorno =
  'inline-flex min-h-14 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border-2 border-verde px-3 text-center text-[1.0625rem] leading-tight font-bold outline-offset-2 transition-colors duration-200 ease-saida hover:bg-verde hover:text-creme focus-visible:outline-2 focus-visible:outline-verde';

const selo = 'shrink-0 rounded-full border border-verde px-2.5 py-1 text-[0.6875rem] leading-4 font-semibold';

function Ajuste({ ajuste }: { ajuste: AjusteDaDoca }) {
  const { zoom } = ajuste.enquadramento;
  const baixa = ajuste.definicao === 'baixa';
  return (
    <div className="mx-auto mt-2 w-full max-w-md pb-2 lg:pb-0">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Diminuir o zoom"
          disabled={zoom <= ZOOM_MINIMO + 1e-6}
          onClick={() => ajuste.mudar((atual) => zoomEm(atual, 1 / PASSO_DO_ZOOM))}
          className={botaoDeZoom}
        >
          <IconeMenos />
        </button>
        <span
          aria-live="polite"
          className="sr-only text-center text-sm leading-none font-semibold tabular-nums min-[400px]:not-sr-only min-[400px]:w-12"
        >
          <span className="sr-only">Zoom de </span>
          {porcentagem.format(zoom)}
        </span>
        <button
          type="button"
          aria-label="Aumentar o zoom"
          disabled={zoom >= ZOOM_MAXIMO - 1e-6}
          onClick={() => ajuste.mudar((atual) => zoomEm(atual, PASSO_DO_ZOOM))}
          className={botaoDeZoom}
        >
          <IconeMais />
        </button>
        <button
          type="button"
          disabled={ehInicial(ajuste.enquadramento)}
          onClick={() => ajuste.mudar(() => ENQUADRAMENTO_INICIAL)}
          className="ml-2 cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2 disabled:invisible"
        >
          Redefinir
        </button>
        <span className={`ml-auto ${selo}`}>Prévia ilustrativa</span>
      </div>
      <div aria-live="polite">
        {ajuste.definicao && ajuste.definicao !== 'boa' ? (
          <p className="mt-1 flex items-start gap-1.5 text-sm leading-snug font-semibold">
            <IconeAlerta className="mt-0.5 shrink-0" />
            {baixa ? 'Essa foto não tem qualidade para a estampa.' : 'Foto no limite da qualidade da estampa.'}
          </p>
        ) : null}
      </div>
      {/* Abaixo da qualidade da estampa, o caminho principal é mandar outra foto. */}
      <div className="mt-2 flex items-stretch gap-2.5">
        <button type="button" onClick={baixa ? ajuste.aoAprovar : ajuste.aoTrocarFoto} className={botaoDeContorno}>
          {baixa ? 'Usar essa mesmo assim' : 'Trocar a foto'}
        </button>
        <button
          type="button"
          onClick={baixa ? ajuste.aoTrocarFoto : ajuste.aoAprovar}
          className="ingresso min-w-0 flex-1 px-3! text-center"
        >
          {baixa ? 'Escolher outra foto' : 'Ficou ótimo'}
        </button>
      </div>
    </div>
  );
}

export function Doca({
  vistas,
  grande,
  aoVer,
  cores,
  cor,
  aoEscolherCor,
  ajuste,
  exemplo,
  compacta,
}: {
  vistas: DescricaoDaVista[];
  grande: Vista;
  aoVer: (vista: Vista) => void;
  cores: Cor[];
  cor: Cor;
  aoEscolherCor: (slug: string) => void;
  // Com a foto esperando o "Ficou ótimo": a prévia vira o ajuste, com os controles embaixo.
  ajuste?: AjusteDaDoca;
  // A prévia está com uma foto de exemplo (a pessoa ainda não mandou a dela).
  exemplo: boolean;
  // Enquanto a pessoa digita no celular, a prévia encolhe para o campo caber na tela.
  compacta: boolean;
}) {
  const principal = vistas.find((v) => v.vista === grande) ?? vistas[0];
  const outras = vistas.filter((v) => v !== principal);
  if (!principal) return null;

  return (
    <>
      <div className="mx-auto w-fit">
        <div className="flex items-start justify-center gap-2 sm:gap-3">
          <TelaDaPrevia
            base={principal.base}
            area={principal.area}
            corDaPeca={cor.slug}
            arte={principal.arte}
            perto={principal.perto}
            rotulo={principal.rotulo}
            ajuste={ajuste?.mudar}
            descricao={ajuste?.descricao}
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

        <div className={`mt-2.5 flex items-center justify-between gap-3 ${compacta || ajuste ? 'hidden' : ''}`}>
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
          {/* Toda prévia leva o selo (briefing): fora da imagem, para nunca cobrir a arte.
              Com a foto de exemplo, o selo diz isso: a única pílula cheia da prévia. */}
          {exemplo ? (
            <span className="shrink-0 rounded-full bg-verde px-2.5 py-1 text-[0.6875rem] leading-4 font-semibold text-creme">
              Foto de exemplo
            </span>
          ) : (
            <span className={selo}>Prévia ilustrativa</span>
          )}
        </div>
      </div>
      {ajuste && !compacta ? <Ajuste ajuste={ajuste} /> : null}
    </>
  );
}
