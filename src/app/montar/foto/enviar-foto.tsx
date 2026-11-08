'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { checarFoto, type Checagem } from '@/lib/foto/checar';
import { pedirRecorte, prepararParaRecorte } from '@/lib/foto/recorte';
import { IconeAlerta, IconeCarregando, IconeNao, IconeSim } from './icones';

type EstadoDoRecorte =
  | { etapa: 'esperando' }
  | { etapa: 'recortando' }
  | { etapa: 'pronto' | 'aprovado'; url: string; teste: boolean }
  | { etapa: 'erro'; mensagem: string };

type Foto = {
  url: string;
  arquivo: File;
  checagem: Checagem | null;
  recorte: EstadoDoRecorte;
};

const numero = new Intl.NumberFormat('pt-BR');

// Link de texto que abre a escolha de foto (o campo fica na barra de baixo).
const linkDeTexto =
  'inline-block cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2';

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

function ResultadoDaChecagem({ foto }: { foto: Foto }) {
  const [quebrada, setQuebrada] = useState(false);
  const { checagem } = foto;
  return (
    <div className="flex items-start gap-4">
      {quebrada ? (
        <span className="block aspect-[4/5] w-24 shrink-0 rounded-xl bg-estudio sm:w-28" />
      ) : (
        // A foto vem do aparelho da pessoa (um endereço temporário do navegador),
        // então não passa pelo otimizador de imagens do site.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto.url}
          alt="A foto que você escolheu"
          onError={() => setQuebrada(true)}
          className="aspect-[4/5] w-24 shrink-0 rounded-xl bg-estudio object-cover sm:w-28"
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

function Recorte({ recorte, aoTentarDeNovo }: { recorte: EstadoDoRecorte; aoTentarDeNovo: () => void }) {
  if (recorte.etapa === 'esperando') return null;
  return (
    <div className="mt-6 lg:mt-4">
      {/* No computador, o quadro do recorte aparece grande na coluna da esquerda. */}
      <div className="lg:hidden">
        <QuadroDoRecorte recorte={recorte} />
      </div>
      <AcoesDoRecorte recorte={recorte} aoTentarDeNovo={aoTentarDeNovo} />
    </div>
  );
}

function QuadroDoRecorte({ recorte, grande = false }: { recorte: EstadoDoRecorte; grande?: boolean }) {
  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-estudio ${
        grande ? 'max-w-[calc((100dvh_-_8rem)_*_0.8)]' : 'max-w-[22rem]'
      }`}
    >
      {recorte.etapa === 'recortando' ? (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-base font-semibold">
          <IconeCarregando className="shrink-0" />
          Tirando o fundo…
        </p>
      ) : null}
      {recorte.etapa === 'pronto' || recorte.etapa === 'aprovado' ? (
        // O recorte também chega como endereço temporário do navegador.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recorte.url} alt="A sua foto, já sem o fundo" className="absolute inset-0 size-full object-contain" />
      ) : null}
      {recorte.etapa === 'erro' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
          <IconeAlerta tamanho={22} />
          <p className="text-base leading-snug font-semibold">{recorte.mensagem}</p>
        </div>
      ) : null}
    </div>
  );
}

function AcoesDoRecorte({ recorte, aoTentarDeNovo }: { recorte: EstadoDoRecorte; aoTentarDeNovo: () => void }) {
  return (
    <>
      {recorte.etapa === 'pronto' ? (
        <>
          <p className="mt-4 max-w-[36ch] text-[0.9375rem] leading-snug">
            Confere se o recorte pegou tudo: orelhas, cabelo, rabo. Se cortou algo importante, é melhor trocar a foto.
          </p>
          <label htmlFor="foto" className={linkDeTexto}>
            Trocar a foto
          </label>
        </>
      ) : null}
      {recorte.etapa === 'aprovado' ? (
        <p className="mt-4 flex max-w-[36ch] items-start gap-2 text-base leading-snug font-semibold">
          <IconeSim className="mt-[3px] shrink-0" />
          Recorte aprovado! Logo, logo você ajusta o enquadramento aqui.
        </p>
      ) : null}
      {recorte.etapa === 'erro' ? (
        <button type="button" onClick={aoTentarDeNovo} className={`${linkDeTexto} mt-1`}>
          Tentar de novo
        </button>
      ) : null}
      {(recorte.etapa === 'pronto' || recorte.etapa === 'aprovado') && recorte.teste ? (
        <p className="mt-2 text-xs leading-relaxed">
          Modo de teste: o recorte sai com a marca d&apos;água do Photoroom.
        </p>
      ) : null}
    </>
  );
}

export function EnviarFoto({ guia }: { guia: ReactNode }) {
  const [foto, setFoto] = useState<Foto | null>(null);
  const resultado = useRef<HTMLDivElement>(null);
  const urlAtual = foto?.url;
  const urlDoRecorte = foto && 'url' in foto.recorte ? foto.recorte.url : undefined;

  // Libera da memória a foto e o recorte anteriores quando eles mudam ou a pessoa sai da tela.
  useEffect(() => () => void (urlAtual && URL.revokeObjectURL(urlAtual)), [urlAtual]);
  useEffect(() => () => void (urlDoRecorte && URL.revokeObjectURL(urlDoRecorte)), [urlDoRecorte]);

  function mudarRecorte(url: string, recorte: EstadoDoRecorte) {
    setFoto((atual) => (atual?.url === url ? { ...atual, recorte } : atual));
  }

  async function recortar(url: string, arquivo: File) {
    mudarRecorte(url, { etapa: 'recortando' });
    const reduzida = await prepararParaRecorte(url, arquivo);
    if (!reduzida) {
      mudarRecorte(url, {
        etapa: 'erro',
        mensagem: 'Não consegui preparar essa foto. Tenta mandar em JPG?',
      });
      return;
    }
    try {
      const { url: recorte, teste } = await pedirRecorte(reduzida);
      setFoto((atual) => {
        if (atual?.url !== url) {
          URL.revokeObjectURL(recorte);
          return atual;
        }
        return { ...atual, recorte: { etapa: 'pronto', url: recorte, teste } };
      });
    } catch (motivo) {
      const mensagem = motivo instanceof Error ? motivo.message : 'Não consegui tirar o fundo agora.';
      mudarRecorte(url, { etapa: 'erro', mensagem });
    }
  }

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o campo para a mesma foto poder ser escolhida de novo.
    evento.target.value = '';
    if (!arquivo) return;

    const url = URL.createObjectURL(arquivo);
    setFoto({ url, arquivo, checagem: null, recorte: { etapa: 'esperando' } });
    requestAnimationFrame(() => {
      const caixa = resultado.current?.getBoundingClientRect();
      if (caixa && (caixa.top < 0 || caixa.bottom > window.innerHeight)) {
        const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        resultado.current?.scrollIntoView({
          behavior: suave ? 'smooth' : 'auto',
          block: 'start',
        });
      }
    });

    const checagem = await checarFoto(arquivo, url);
    setFoto((atual) => (atual?.url === url ? { ...atual, checagem } : atual));
    // Foto barrada não segue para o recorte. A HEIC que o navegador não abre
    // ("recebida") segue do jeito que está, porque o Photoroom lê HEIC.
    if (checagem.nivel !== 'bloqueio') await recortar(url, arquivo);
  }

  function aprovar() {
    setFoto((atual) =>
      atual && atual.recorte.etapa === 'pronto'
        ? { ...atual, recorte: { ...atual.recorte, etapa: 'aprovado' } }
        : atual,
    );
  }

  const recortePronto = foto?.recorte.etapa === 'pronto';

  return (
    // Celular e tablet: uma coluna (no tablet, centralizada). Computador: o guia
    // à esquerda e, à direita, o título e o botão, que acompanham a rolagem.
    <div className="sm:mx-auto sm:max-w-xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-x-12 xl:gap-x-16">
      <div className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1">
        <h1 className="font-titulo text-[clamp(2.6rem,9vw,4rem)] leading-none uppercase">Manda a foto</h1>
        <p className="mt-3 max-w-[30ch] font-destaque text-[clamp(1.25rem,4.6vw,1.6rem)] leading-tight italic">
          Uma boa foto faz toda a diferença. Quanto melhor ela for, mais incrível fica a sua Divestir.
        </p>

        <div ref={resultado} aria-live="polite" className="scroll-mt-6">
          {foto ? (
            <div className="mt-6 border-t border-verde pt-6">
              <h2 className="sr-only">Sua foto</h2>
              <ResultadoDaChecagem key={foto.url} foto={foto} />
              <Recorte recorte={foto.recorte} aoTentarDeNovo={() => void recortar(foto.url, foto.arquivo)} />
            </div>
          ) : null}
        </div>

        {/* Celular: presa no pé da tela, sempre a um toque. Computador: logo abaixo do resultado. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-verde bg-creme px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] lg:static lg:mt-8 lg:border-0 lg:p-0">
          <div className="relative mx-auto max-w-xl lg:max-w-none">
            <input id="foto" type="file" accept="image/*,.heic,.heif" onChange={aoEscolher} className="peer sr-only" />
            {recortePronto ? (
              <button type="button" onClick={aprovar} className="ingresso w-full lg:w-auto">
                Ficou ótimo
              </button>
            ) : (
              <label
                htmlFor="foto"
                className="ingresso w-full cursor-pointer select-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[5px] peer-focus-visible:outline-verde lg:w-auto"
              >
                {foto ? 'Trocar a foto' : 'Escolher a foto'}
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 lg:col-start-1 lg:row-start-1 lg:mt-0">
        {foto && foto.recorte.etapa !== 'esperando' ? (
          <div className="mb-14 hidden lg:block" aria-live="polite">
            <QuadroDoRecorte recorte={foto.recorte} grande />
          </div>
        ) : null}
        {guia}
      </div>
    </div>
  );
}
