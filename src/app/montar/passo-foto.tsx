'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Checagem } from '@/lib/foto/checar';
import type { Definicao } from '@/lib/foto/definicao';
import {
  ENQUADRAMENTO_INICIAL,
  PASSO_DO_ZOOM,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ehInicial,
  zoomEm,
} from '@/lib/foto/enquadramento';
import { lerRecorte } from '@/lib/montagem/guardar';
import type { FotoDaMontagem } from '@/lib/montagem/tipos';
import { Guia } from './guia';
import { IconeAlerta, IconeCarregando, IconeMais, IconeMenos, IconeNao, IconeSim } from './icones';
import type { MudarEnquadramento } from './tela-da-previa';

// Passo 2: a foto. Guia da foto perfeita, escolha da foto, checagem no aparelho,
// recorte e o ajuste do enquadramento, que acontece na própria prévia.

export type EnvioDaFoto = {
  id: number;
  url: string;
  checagem: Checagem | null;
  etapa: 'conferindo' | 'recortando' | 'pronta' | 'erro' | 'barrada';
  mensagem?: string;
};

export type FotoReaproveitavel = { foto: FotoDaMontagem; campos: Record<string, string> };

const numero = new Intl.NumberFormat('pt-BR');
const porcentagem = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

export const linkDeTexto =
  'inline-block cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2';

const botaoDeZoom =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-verde hover:bg-verde hover:text-creme disabled:cursor-default disabled:border-dashed disabled:hover:bg-transparent disabled:hover:text-verde';

function Selo({ checagem }: { checagem: Checagem }) {
  if (checagem.nivel === 'perfeita') {
    return (
      <p className="inline-flex items-center gap-1.5 rounded-full bg-verde py-1.5 pr-3.5 pl-2.5 text-sm leading-5 font-semibold text-creme">
        <IconeSim />
        {checagem.titulo}
      </p>
    );
  }
  const Icone = checagem.nivel === 'aviso' ? IconeAlerta : checagem.nivel === 'recebida' ? IconeSim : IconeNao;
  return (
    <p className="flex items-start gap-2 text-base leading-snug font-semibold">
      <Icone className="mt-[3px] shrink-0" />
      {checagem.titulo}
    </p>
  );
}

function ResultadoDaChecagem({ envio }: { envio: EnvioDaFoto }) {
  const [quebrada, setQuebrada] = useState(false);
  const { checagem } = envio;
  return (
    <div className="flex items-start gap-4">
      {quebrada ? (
        <span className="block aspect-[4/5] w-20 shrink-0 rounded-xl bg-estudio" />
      ) : (
        // A foto vem do aparelho da pessoa (um endereço temporário do navegador),
        // então não passa pelo otimizador de imagens do site.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={envio.url}
          alt="A foto que você escolheu"
          onError={() => setQuebrada(true)}
          className="aspect-[4/5] w-20 shrink-0 rounded-xl bg-estudio object-cover"
        />
      )}
      <div className="min-w-0 pt-1">
        {checagem ? (
          <>
            <Selo checagem={checagem} />
            {checagem.mensagens.map((mensagem) => (
              <p key={mensagem} className="mt-2 text-[0.9375rem] leading-snug">
                {mensagem}
              </p>
            ))}
            {checagem.largura && checagem.altura ? (
              <p className="mt-2 text-xs leading-none tabular-nums">
                {numero.format(checagem.largura)} × {numero.format(checagem.altura)} px
              </p>
            ) : null}
          </>
        ) : (
          <p className="flex items-center gap-2 text-base leading-snug font-semibold">
            <IconeCarregando className="shrink-0" />
            Conferindo a foto…
          </p>
        )}
      </div>
    </div>
  );
}

// O aviso da definição: foto pequena, quem aparece pequeno nela ou muito zoom dão
// poucos pontos para a peça impressa. O tamanho e a qualidade da estampa são os da
// Divestir: quem se adapta é a foto, então o aviso pede uma foto melhor (decisão do
// Lucas, 09/11/2026). Quando ele aparece, o selo "Foto perfeita" sai de cena.
function AvisoDaDefinicao({ nivel, zoom }: { nivel: Definicao['nivel']; zoom: number }) {
  if (nivel === 'boa') return null;
  const comZoom = zoom > 1.001;
  return (
    <p className="mt-3 flex max-w-[38ch] items-start gap-2 text-[0.9375rem] leading-snug font-semibold">
      <IconeAlerta className="mt-[3px] shrink-0" />
      {nivel === 'media'
        ? comZoom
          ? 'Com esse zoom, a foto fica no limite da qualidade da nossa estampa. Para aproximar assim, manda uma foto tirada mais de perto.'
          : 'Essa foto está no limite da qualidade da nossa estampa. Se tiver uma maior ou tirada mais de perto, manda ela.'
        : comZoom
          ? 'Com esse zoom, a foto não tem qualidade para a nossa estampa. Para aproximar assim, manda uma foto tirada mais de perto.'
          : 'Essa foto não tem qualidade para a nossa estampa. Manda uma maior ou tirada mais de perto.'}
    </p>
  );
}

function ControlesDoAjuste({
  foto,
  definicao,
  aoEnquadrar,
  idDaDica,
}: {
  foto: FotoDaMontagem;
  definicao: Definicao['nivel'] | null;
  aoEnquadrar: MudarEnquadramento;
  idDaDica: string;
}) {
  const { zoom } = foto.enquadramento;
  return (
    <div>
      <p id={idDaDica} className="max-w-[38ch] text-[0.9375rem] leading-snug">
        <span className="pointer-coarse:hidden">
          Ajuste na própria prévia: arraste a foto para mover e use os botões para dar zoom.
        </span>
        <span className="hidden pointer-coarse:inline">
          Ajuste na própria prévia: arraste a foto para mover e use dois dedos para dar zoom.
        </span>
        <span className="sr-only"> No teclado, use as setas para mover e as teclas + e − para o zoom.</span>
      </p>
      <div className="mt-2 flex items-center gap-1">
        <button
          type="button"
          aria-label="Diminuir o zoom"
          disabled={zoom <= ZOOM_MINIMO + 1e-6}
          onClick={() => aoEnquadrar((atual) => zoomEm(atual, 1 / PASSO_DO_ZOOM))}
          className={botaoDeZoom}
        >
          <IconeMenos />
        </button>
        <span aria-live="polite" className="w-14 text-center text-sm leading-none font-semibold tabular-nums">
          <span className="sr-only">Zoom de </span>
          {porcentagem.format(zoom)}
        </span>
        <button
          type="button"
          aria-label="Aumentar o zoom"
          disabled={zoom >= ZOOM_MAXIMO - 1e-6}
          onClick={() => aoEnquadrar((atual) => zoomEm(atual, PASSO_DO_ZOOM))}
          className={botaoDeZoom}
        >
          <IconeMais />
        </button>
        <button
          type="button"
          disabled={ehInicial(foto.enquadramento)}
          onClick={() => aoEnquadrar(() => ENQUADRAMENTO_INICIAL)}
          className={`ml-auto disabled:invisible ${linkDeTexto}`}
        >
          Redefinir
        </button>
      </div>
      <div aria-live="polite">{definicao ? <AvisoDaDefinicao nivel={definicao} zoom={zoom} /> : null}</div>
    </div>
  );
}

// Uma foto que a pessoa já mandou (está numa peça do carrinho), para reaproveitar.
function FotoGuardada({ item, aoUsar }: { item: FotoReaproveitavel; aoUsar: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let ativo = true;
    let criada: string | null = null;
    void lerRecorte(item.foto.chave).then((recorte) => {
      if (!ativo || !recorte) return;
      criada = URL.createObjectURL(recorte);
      setUrl(criada);
    });
    return () => {
      ativo = false;
      if (criada) URL.revokeObjectURL(criada);
    };
  }, [item.foto.chave]);
  const nome = item.campos.nome?.trim();
  return (
    <li className="w-24 shrink-0">
      <button type="button" onClick={aoUsar} className="group block w-full cursor-pointer text-left">
        <span className="block aspect-[4/5] overflow-hidden rounded-xl bg-estudio outline-offset-2 group-hover:outline-1 group-hover:outline-verde group-focus-visible:outline-2 group-focus-visible:outline-verde">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-contain" />
          ) : null}
        </span>
        <span className="mt-1.5 block truncate text-sm leading-5 font-semibold">
          {nome ? nome.toLocaleUpperCase('pt-BR') : 'Sem nome'}
        </span>
        <span className="block text-xs leading-4">Usar esta foto</span>
      </button>
    </li>
  );
}

export function PassoFoto({
  envio,
  foto,
  temRecorte,
  definicao,
  aviso,
  reaproveitaveis,
  aoEscolherArquivo,
  aoTentarDeNovo,
  aoAprovar,
  aoAjustar,
  aoEnquadrar,
  aoReaproveitar,
  idDaDica,
}: {
  envio: EnvioDaFoto | null;
  foto: FotoDaMontagem | null;
  temRecorte: boolean;
  definicao: Definicao['nivel'] | null;
  aviso: string | null;
  reaproveitaveis: FotoReaproveitavel[];
  aoEscolherArquivo: (arquivo: File) => void;
  aoTentarDeNovo: () => void;
  aoAprovar: () => void;
  aoAjustar: () => void;
  aoEnquadrar: MudarEnquadramento;
  aoReaproveitar: (item: FotoReaproveitavel) => void;
  idDaDica: string;
}) {
  const campo = useRef<HTMLInputElement>(null);
  // Os botões abrem o seletor de fotos do aparelho (álbum ou câmera).
  const escolher = () => campo.current?.click();

  function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o campo para a mesma foto poder ser escolhida de novo.
    evento.target.value = '';
    if (arquivo) aoEscolherArquivo(arquivo);
  }

  const processando = envio?.etapa === 'conferindo' || envio?.etapa === 'recortando';
  const ajustando = !!foto && !foto.aprovada && temRecorte && !processando;
  const aprovada = !!foto?.aprovada && temRecorte && !processando;
  const semFoto = !foto && !envio;

  return (
    <div>
      <input
        ref={campo}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={aoEscolher}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />

      {aviso ? (
        <p className="mb-5 flex max-w-[38ch] items-start gap-2 text-[0.9375rem] leading-snug font-semibold">
          <IconeAlerta className="mt-[3px] shrink-0" />
          {aviso}
        </p>
      ) : null}

      {semFoto || envio?.etapa === 'barrada' ? (
        <>
          {semFoto ? (
            <>
              {reaproveitaveis.length ? (
                <div className="mb-8">
                  <h3 className="text-base leading-snug font-semibold">Usar uma foto que você já mandou</h3>
                  <ul className="vitrine -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                    {reaproveitaveis.map((item) => (
                      <FotoGuardada key={item.foto.chave} item={item} aoUsar={() => aoReaproveitar(item)} />
                    ))}
                  </ul>
                  <p className="mt-6 text-base leading-snug font-semibold">Ou manda uma foto nova:</p>
                </div>
              ) : null}
              <p className="mb-5 max-w-[34ch] font-destaque text-[1.35rem] leading-tight italic">
                Uma boa foto faz toda a diferença. Quanto melhor ela for, mais incrível fica a sua Divestir.
              </p>
              <Guia />
            </>
          ) : null}
        </>
      ) : null}

      {envio && envio.etapa !== 'pronta' ? (
        <div aria-live="polite" className={semFoto ? 'mt-8' : ''}>
          <ResultadoDaChecagem key={envio.id} envio={envio} />
          {envio.etapa === 'recortando' ? (
            <p className="mt-5 flex items-center gap-2 text-base leading-snug font-semibold">
              <IconeCarregando className="shrink-0" />
              Tirando o fundo…
            </p>
          ) : null}
          {envio.etapa === 'erro' ? (
            <div className="mt-5">
              <p className="flex max-w-[38ch] items-start gap-2 text-base leading-snug font-semibold">
                <IconeAlerta className="mt-[3px] shrink-0" />
                {envio.mensagem ?? 'Não consegui tirar o fundo agora.'}
              </p>
              <div className="flex flex-wrap gap-x-6">
                <button type="button" onClick={aoTentarDeNovo} className={linkDeTexto}>
                  Tentar de novo
                </button>
                <button type="button" onClick={escolher} className={linkDeTexto}>
                  Trocar a foto
                </button>
              </div>
            </div>
          ) : null}
          {envio.etapa === 'barrada' && foto ? (
            <p className="mt-4 max-w-[38ch] text-[0.9375rem] leading-snug">
              A foto anterior continua na prévia enquanto você escolhe outra.
            </p>
          ) : null}
        </div>
      ) : null}

      {ajustando && foto ? (
        <div>
          {/* O veredito da foto, curto: a foto em si já aparece na prévia. */}
          {envio?.checagem &&
          !(
            definicao &&
            definicao !== 'boa' &&
            (envio.checagem.nivel === 'perfeita' || /definição/.test(envio.checagem.titulo))
          ) ? (
            <div aria-live="polite" className="mb-5">
              <Selo checagem={envio.checagem} />
              {envio.checagem.nivel !== 'perfeita'
                ? envio.checagem.mensagens.map((mensagem) => (
                    <p key={mensagem} className="mt-2 max-w-[38ch] text-[0.9375rem] leading-snug">
                      {mensagem}
                    </p>
                  ))
                : null}
            </div>
          ) : null}
          <ControlesDoAjuste foto={foto} definicao={definicao} aoEnquadrar={aoEnquadrar} idDaDica={idDaDica} />
          {definicao === 'baixa' ? (
            // Abaixo da qualidade da estampa, o caminho principal é mandar outra foto.
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1">
              <button type="button" onClick={escolher} className="ingresso w-full cursor-pointer sm:w-auto">
                Escolher outra foto
              </button>
              <button type="button" onClick={aoAprovar} className={linkDeTexto}>
                Usar essa mesmo assim
              </button>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1">
              <button type="button" onClick={aoAprovar} className="ingresso w-full sm:w-auto">
                Ficou ótimo
              </button>
              <button type="button" onClick={escolher} className={linkDeTexto}>
                Trocar a foto
              </button>
            </div>
          )}
          <p className="mt-1 max-w-[38ch] text-[0.9375rem] leading-snug">
            Confere se o recorte pegou tudo: orelhas, cabelo, rabo. Se cortou algo importante, é melhor trocar a foto.
          </p>
        </div>
      ) : null}

      {aprovada && foto && !envio ? (
        <div className="flex flex-wrap gap-x-6">
          <button type="button" onClick={aoAjustar} className={linkDeTexto}>
            Ajustar o enquadramento
          </button>
          <button type="button" onClick={escolher} className={linkDeTexto}>
            Trocar a foto
          </button>
        </div>
      ) : null}

      {foto && !temRecorte && !envio ? (
        <p className="flex items-center gap-2 text-base leading-snug font-semibold">
          <IconeCarregando className="shrink-0" />
          Trazendo a sua foto…
        </p>
      ) : null}

      {(ajustando || aprovada) && foto?.teste ? (
        <p className="mt-2 text-xs leading-relaxed">
          Modo de teste: o recorte sai com a marca d&apos;água do Photoroom.
        </p>
      ) : null}

      {semFoto || envio?.etapa === 'barrada' ? (
        <div className="mt-7">
          <button type="button" onClick={escolher} className="ingresso w-full cursor-pointer select-none sm:w-auto">
            {envio?.etapa === 'barrada' ? 'Escolher outra foto' : 'Escolher a foto'}
          </button>
          <p className="mt-3 text-[0.9375rem] leading-snug">Pode ser do álbum ou tirada na hora.</p>
          <p className="mt-2 max-w-[42ch] text-sm leading-snug">
            A foto serve só para fazer a sua peça e fica guardada com segurança. Se você não comprar, ela é apagada em
            30 dias.
          </p>
        </div>
      ) : null}
    </div>
  );
}
