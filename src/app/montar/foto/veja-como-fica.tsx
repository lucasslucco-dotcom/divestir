'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Catalogo, Peca } from '@/lib/catalogo';
import type { Enquadramento, Geometria } from '@/lib/foto/enquadramento';
import { aplicarNaPeca, desenharArte, janelaDePerto, textoDoCampo } from '@/lib/molde/desenhar';
import { carregarArte, carregarImagem, fontesDaPagina } from '@/lib/molde/recursos';
import { LARGURA_DA_ARTE, ladosDaPeca, type AreaNaFoto, type Design, type Lado } from '@/lib/molde/tipos';
import { IconeCarregando } from './icones';

// "Veja como fica": depois do recorte aprovado, a foto entra no design (o motor do
// molde da Etapa 4), com o nome, na peça escolhida, nas 3 cores e no lado escolhido.

export type DadosDaMontagem = { catalogo: Catalogo; designs: Design[] };
export type FotoAprovada = { url: string; geometria: Geometria; enquadramento: Enquadramento };
export type EscolhasDaPrevia = { nome: string; peca: string | null; lado: Lado | null };

let pedidoDaMontagem: Promise<DadosDaMontagem> | null = null;

function buscarMontagem() {
  if (!pedidoDaMontagem) {
    pedidoDaMontagem = fetch('/api/montagem').then(async (resposta) => {
      if (!resposta.ok) throw new Error('A montagem não carregou.');
      return (await resposta.json()) as DadosDaMontagem;
    });
    pedidoDaMontagem.catch(() => {
      pedidoDaMontagem = null;
    });
  }
  return pedidoDaMontagem;
}

// Busca o catálogo e os designs uma vez, quando a prévia vai ser usada.
export function useMontagem(ligado: boolean) {
  const [dados, setDados] = useState<DadosDaMontagem | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    if (!ligado || dados) return;
    let ativo = true;
    buscarMontagem().then(
      (resposta) => ativo && setDados(resposta),
      () => ativo && setErro(true),
    );
    return () => {
      ativo = false;
    };
  }, [ligado, dados, tentativa]);
  return {
    dados,
    erro,
    tentarDeNovo: () => {
      setErro(false);
      setTentativa((t) => t + 1);
    },
  };
}

// A peça que veio do montador (/montar/foto?peca=...).
export function pecaDaUrl() {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('peca');
}

function nomeDaPeca(peca: Peca, pecas: Peca[]) {
  const repetido = pecas.filter((p) => p.nome === peca.nome).length > 1;
  return repetido ? `${peca.nome} ${peca.caimento.toLocaleLowerCase('pt-BR')}` : peca.nome;
}

// Junta as escolhas com o que existe: peça que aceita o design e lado que a peça tem.
function resolver(dados: DadosDaMontagem, escolhas: EscolhasDaPrevia) {
  const design = dados.designs[0];
  if (!design) return null;
  const permitidas = design.config.pecas_permitidas;
  const pecas = dados.catalogo.pecas.filter(
    (p) => ladosDaPeca(p.areas).length > 0 && (!permitidas || permitidas.includes(p.slug)),
  );
  const peca = pecas.find((p) => p.slug === escolhas.peca) ?? pecas[0];
  if (!peca) return null;
  const lados = ladosDaPeca(peca.areas);
  const lado =
    escolhas.lado && lados.includes(escolhas.lado)
      ? escolhas.lado
      : lados.includes(design.config.posicao)
        ? design.config.posicao
        : lados[0];
  return { design, pecas, peca, lados, lado };
}

const opcao =
  'block cursor-pointer rounded-full px-3.5 py-3 text-sm leading-5 font-semibold peer-checked:bg-verde peer-checked:text-creme peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde';

export function ControlesDaPrevia({
  dados,
  escolhas,
  mudar,
}: {
  dados: DadosDaMontagem | null;
  escolhas: EscolhasDaPrevia;
  mudar: (mudanca: Partial<EscolhasDaPrevia>) => void;
}) {
  const id = useId();
  const resolvido = dados ? resolver(dados, escolhas) : null;
  const campo = resolvido?.design.config.campos.find((c) => c.chave === 'nome');
  const max = campo?.max ?? 10;

  return (
    <section aria-labelledby={`${id}-titulo`} className="mt-8 border-t border-verde pt-6">
      <h2 id={`${id}-titulo`} className="font-titulo text-[clamp(1.75rem,6.5vw,2.25rem)] leading-none uppercase">
        Veja como fica
      </h2>

      <label htmlFor={`${id}-nome`} className="mt-5 block text-base leading-snug font-semibold">
        Como ele(a) se chama?
      </label>
      <input
        id={`${id}-nome`}
        type="text"
        value={escolhas.nome}
        onChange={(evento) => mudar({ nome: evento.target.value.slice(0, max) })}
        maxLength={max}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="done"
        aria-describedby={`${id}-ajuda`}
        className="mt-2 h-12 w-full max-w-[22rem] rounded-md border border-verde bg-creme px-4 text-lg leading-none font-semibold tracking-[0.04em] uppercase outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde"
      />
      <p id={`${id}-ajuda`} className="mt-2 text-[0.9375rem] leading-snug">
        Até {max} letras, como Thor, Vó Cida ou Duda.
      </p>

      {resolvido ? (
        <>
          <fieldset className="mt-6">
            <legend className="text-base leading-snug font-semibold">Peça</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {resolvido.pecas.map((peca) => (
                <label key={peca.slug} className="relative rounded-full border border-verde">
                  <input
                    type="radio"
                    name={`${id}-peca`}
                    value={peca.slug}
                    checked={peca.slug === resolvido.peca.slug}
                    onChange={() => mudar({ peca: peca.slug })}
                    className="peer sr-only"
                  />
                  <span className={opcao}>{nomeDaPeca(peca, resolvido.pecas)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="text-base leading-snug font-semibold">Onde vai a estampa</legend>
            {resolvido.lados.length > 1 ? (
              <div className="mt-2 inline-flex rounded-full border border-verde p-1">
                {resolvido.lados.map((lado) => (
                  <label key={lado} className="relative">
                    <input
                      type="radio"
                      name={`${id}-lado`}
                      value={lado}
                      checked={lado === resolvido.lado}
                      onChange={() => mudar({ lado })}
                      className="peer sr-only"
                    />
                    <span className={opcao}>{lado === 'frente' ? 'Frente' : 'Costas'}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[0.9375rem] leading-snug">
                Nessa peça, a estampa vai {resolvido.lado === 'costas' ? 'nas costas' : 'na frente'}.
              </p>
            )}
          </fieldset>
        </>
      ) : null}
    </section>
  );
}

function PreviaNaPeca({
  urlDaPeca,
  area,
  design,
  corDaPeca,
  nome,
  foto,
  perto,
  rotulo,
}: {
  urlDaPeca: string;
  area: AreaNaFoto;
  design: Design;
  corDaPeca: string;
  nome: string;
  foto: FotoAprovada;
  perto: boolean;
  rotulo: string;
}) {
  const tela = useRef<HTMLCanvasElement>(null);
  const [pronta, setPronta] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const canvas = tela.current;
      if (!canvas) return;
      const densidade = Math.min(2, window.devicePixelRatio || 1);
      const largura = Math.round((canvas.clientWidth || 300) * densidade);
      const altura = Math.round(largura * 1.25);
      const [fontes, base, imagem] = await Promise.all([
        fontesDaPagina(),
        carregarImagem(urlDaPeca),
        carregarImagem(foto.url),
      ]);
      // De perto, a tela mostra uma janela em volta da estampa; senão, a peça inteira.
      const tamanho = { largura: base.naturalWidth, altura: base.naturalHeight };
      const { proporcao } = design.config;
      const janela = perto
        ? janelaDePerto(area, tamanho, proporcao)
        : { x: 0, y: 0, largura: tamanho.largura, altura: tamanho.altura };
      const escala = (area.largura * tamanho.largura * (largura / janela.largura)) / LARGURA_DA_ARTE;
      const arte = await desenharArte(
        {
          config: design.config,
          corDaPeca,
          valores: { nome },
          foto: { imagem, geometria: foto.geometria, enquadramento: foto.enquadramento },
          fontes,
          carregarArte,
        },
        escala,
      );
      if (cancelado) return;
      const pronto = document.createElement('canvas');
      pronto.width = largura;
      pronto.height = altura;
      aplicarNaPeca(pronto, base, tamanho, area, arte, proporcao, janela);
      if (cancelado) return;
      canvas.width = largura;
      canvas.height = altura;
      canvas.getContext('2d')?.drawImage(pronto, 0, 0);
      setPronta(true);
      setFalhou(false);
    })().catch(() => {
      if (!cancelado) setFalhou(true);
    });
    return () => {
      cancelado = true;
    };
  }, [urlDaPeca, area, design, corDaPeca, nome, foto, perto]);

  return (
    <div className="relative">
      <canvas ref={tela} role="img" aria-label={rotulo} className="block aspect-[4/5] w-full rounded-2xl bg-estudio" />
      {!pronta && !falhou ? (
        <p className="absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold">
          <IconeCarregando className="shrink-0" />
          Montando…
        </p>
      ) : null}
      {falhou ? (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-semibold">
          Não consegui montar essa prévia.
        </p>
      ) : null}
    </div>
  );
}

export function PreviasDoMolde({
  dados,
  erro,
  tentarDeNovo,
  escolhas,
  foto,
}: {
  dados: DadosDaMontagem | null;
  erro: boolean;
  tentarDeNovo: () => void;
  escolhas: EscolhasDaPrevia;
  foto: FotoAprovada;
}) {
  // De perto mostra a arte grande; peça inteira mostra o tamanho da estampa na peça.
  const [perto, setPerto] = useState(true);
  if (erro) {
    return (
      <div role="alert" className="mb-14">
        <p className="text-base leading-snug font-semibold">Não consegui carregar os designs agora.</p>
        <button
          type="button"
          onClick={tentarDeNovo}
          className="inline-block cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2"
        >
          Tentar de novo
        </button>
      </div>
    );
  }
  const resolvido = dados ? resolver(dados, escolhas) : null;
  if (dados && !resolvido) return null;

  return (
    <section aria-label="Prévia do design na peça" className="mb-14">
      <div
        role="radiogroup"
        aria-label="Como ver a prévia"
        className="mb-4 inline-flex rounded-full border border-verde p-1"
      >
        {(
          [
            ['perto', 'De perto'],
            ['inteira', 'Peça inteira'],
          ] as const
        ).map(([valor, rotulo]) => (
          <label key={valor} className="relative">
            <input
              type="radio"
              name="modo-da-previa"
              value={valor}
              checked={(valor === 'perto') === perto}
              onChange={() => setPerto(valor === 'perto')}
              className="peer sr-only"
            />
            <span className={opcao}>{rotulo}</span>
          </label>
        ))}
      </div>
      <ul className="vitrine -mx-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:gap-4">
        {dados && resolvido
          ? dados.catalogo.cores.map((cor) => {
              const url = resolvido.peca.fotos[cor.slug]?.[resolvido.lado];
              const area = resolvido.peca.areas[resolvido.lado]?.previa;
              if (!url || !area) return null;
              const nome = textoDoCampo(resolvido.design.config, 'nome', { nome: escolhas.nome });
              const peca = nomeDaPeca(resolvido.peca, resolvido.pecas).toLocaleLowerCase('pt-BR');
              const lugar = resolvido.lado === 'frente' ? 'na frente' : 'nas costas';
              return (
                <li key={cor.slug} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <PreviaNaPeca
                    urlDaPeca={url}
                    area={area}
                    design={resolvido.design}
                    corDaPeca={cor.slug}
                    nome={escolhas.nome}
                    foto={foto}
                    perto={perto}
                    rotulo={`Prévia ilustrativa: ${resolvido.design.nome} com o nome ${nome}, ${peca} na cor ${cor.nome.toLocaleLowerCase('pt-BR')}, estampa ${lugar}`}
                  />
                  {/* O selo fica embaixo da prévia, para nunca cobrir a arte. */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm leading-5 font-semibold">{cor.nome}</p>
                    <span className="rounded-full border border-verde px-2.5 py-1 text-[0.6875rem] leading-4 font-semibold">
                      Prévia ilustrativa
                    </span>
                  </div>
                </li>
              );
            })
          : [0, 1, 2].map((i) => (
              <li key={i} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <div className="flex aspect-[4/5] items-center justify-center gap-2 rounded-2xl bg-estudio text-sm font-semibold">
                  <IconeCarregando className="shrink-0" />
                  Montando…
                </div>
                <p className="mt-2 text-sm leading-[1.625rem] font-semibold">&nbsp;</p>
              </li>
            ))}
      </ul>
    </section>
  );
}
