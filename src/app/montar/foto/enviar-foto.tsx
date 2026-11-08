'use client';

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { checarFoto, type Checagem } from '@/lib/foto/checar';
import { IconeAlerta, IconeCarregando, IconeNao, IconeSim } from './icones';

type Foto = { url: string; checagem: Checagem | null };

const numero = new Intl.NumberFormat('pt-BR');

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

function Resultado({ foto }: { foto: Foto }) {
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
            {checagem.nivel !== 'bloqueio' ? (
              <p className="mt-3 text-[0.9375rem] leading-snug">Logo, logo o recorte do fundo entra aqui.</p>
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

export function EnviarFoto({ guia }: { guia: ReactNode }) {
  const [foto, setFoto] = useState<Foto | null>(null);
  const resultado = useRef<HTMLDivElement>(null);
  const urlAtual = foto?.url;

  // Libera da memória a foto anterior quando a pessoa troca de foto ou sai da tela.
  useEffect(() => {
    return () => {
      if (urlAtual) URL.revokeObjectURL(urlAtual);
    };
  }, [urlAtual]);

  async function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o campo para a mesma foto poder ser escolhida de novo.
    evento.target.value = '';
    if (!arquivo) return;

    const url = URL.createObjectURL(arquivo);
    setFoto({ url, checagem: null });
    requestAnimationFrame(() => {
      const caixa = resultado.current?.getBoundingClientRect();
      if (caixa && (caixa.top < 0 || caixa.bottom > window.innerHeight)) {
        const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        resultado.current?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
      }
    });

    const checagem = await checarFoto(arquivo, url);
    setFoto((atual) => (atual?.url === url ? { url, checagem } : atual));
  }

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
              <Resultado key={foto.url} foto={foto} />
            </div>
          ) : null}
        </div>

        {/* Celular: presa no pé da tela, sempre a um toque. Computador: logo abaixo do título. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-verde bg-creme px-4 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] lg:static lg:mt-8 lg:border-0 lg:p-0">
          <div className="relative mx-auto max-w-xl lg:max-w-none">
            <input
              id="foto"
              type="file"
              accept="image/*,.heic,.heif"
              onChange={aoEscolher}
              className="peer sr-only"
            />
            <label
              htmlFor="foto"
              className="ingresso w-full cursor-pointer select-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[5px] peer-focus-visible:outline-verde lg:w-auto"
            >
              {foto ? 'Trocar a foto' : 'Escolher a foto'}
            </label>
          </div>
        </div>
      </div>

      <div className="mt-10 lg:col-start-1 lg:row-start-1 lg:mt-0">{guia}</div>
    </div>
  );
}
