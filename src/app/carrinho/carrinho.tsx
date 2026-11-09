'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import type { Catalogo } from '@/lib/catalogo';
import { fotoPendente } from '@/lib/checkout';
import { checarFoto } from '@/lib/foto/checar';
import { abrirVaga, enviarOriginal } from '@/lib/foto/guardar';
import { mensagemDoPrazo, precoDaPeca, precoDoPresente, reais, somar, type Preco } from '@/lib/loja';
import {
  acompanharCarrinho,
  guardarCarrinho,
  lerCarrinhoGuardado,
  lerRecorte,
  prepararEdicao,
  prepararNovaMontagem,
} from '@/lib/montagem/guardar';
import {
  LIMITE_DO_CARTAO,
  type Carrinho as CarrinhoGuardado,
  type FotoDaMontagem,
  type ItemDoCarrinho,
  type Presente,
} from '@/lib/montagem/tipos';
import type { Design } from '@/lib/molde/tipos';
import { nomeDaPeca } from '../montar/estado';
import { IconeAlerta, IconeCarregando, IconePresente } from '../montar/icones';
import { linkDeTexto } from '../montar/passo-foto';
import { TelaDaPrevia } from '../montar/tela-da-previa';

// O carrinho (briefing, "Carrinho e checkout"): cada peça com a miniatura montada,
// o design, a cor, o tamanho e o preço, "Editar" que volta ao montador com tudo
// carregado, a opção de presente peça por peça e "Criar outra Divestir" sempre à
// vista. As peças ficam no próprio navegador até o pedido ser pago.

const minusculo = (texto: string) => texto.toLocaleLowerCase('pt-BR');

export type LinhaDoCarrinho = {
  item: ItemDoCarrinho;
  nome: string;
  detalhes: string;
  preco: Preco | null;
  // Peça, cor ou design que saiu de linha: só dá para tirar do carrinho.
  foraDeLinha: boolean;
  previa: {
    base: string;
    area: { x: number; topo: number; largura: number } | null;
    design: Design | null;
  } | null;
};

// Junta cada peça do carrinho com o catálogo de agora.
export function linhasDoCarrinho(
  itens: ItemDoCarrinho[],
  catalogo: Catalogo,
  designs: Design[],
  modoDeTeste: boolean,
): LinhaDoCarrinho[] {
  return itens.map((item) => {
    const peca = catalogo.pecas.find((p) => p.slug === item.peca);
    const cor = catalogo.cores.find((c) => c.slug === item.cor);
    const design = designs.find((d) => d.slug === item.design) ?? null;
    const base = peca?.fotos[item.cor]?.[item.lado];
    const lado = item.lado === 'costas' ? 'nas costas' : 'na frente';
    return {
      item,
      nome: peca ? nomeDaPeca(peca, catalogo.pecas) : 'Peça',
      detalhes: [cor?.nome, item.tamanho, design ? `${design.nome}, ${lado}` : null].filter(Boolean).join(' · '),
      preco: peca ? precoDaPeca(peca, modoDeTeste) : null,
      foraDeLinha: !peca || !cor || !design || !peca.tamanhos.includes(item.tamanho),
      previa: base ? { base, area: peca?.areas[item.lado]?.previa ?? null, design } : null,
    };
  });
}

// Os recortes das fotos, lidos do armazenamento do navegador.
export function useRecortes(chaves: string[]) {
  const [recortes, setRecortes] = useState<Record<string, string | null>>({});
  const enderecos = useRef(new Map<string, string | null>());
  const juntas = [...new Set(chaves)].sort().join('|');

  useEffect(() => {
    for (const chave of juntas.split('|')) {
      if (!chave || enderecos.current.has(chave)) continue;
      enderecos.current.set(chave, null);
      void lerRecorte(chave).then((arquivo) => {
        const url = arquivo ? URL.createObjectURL(arquivo) : null;
        enderecos.current.set(chave, url);
        setRecortes((antes) => ({ ...antes, [chave]: url }));
      });
    }
  }, [juntas]);

  useEffect(() => {
    const mapa = enderecos.current;
    return () => {
      for (const url of mapa.values()) if (url) URL.revokeObjectURL(url);
    };
  }, []);

  return recortes;
}

export function MiniaturaDaPeca({
  linha,
  recorte,
  className = 'w-24 sm:w-28',
}: {
  linha: LinhaDoCarrinho;
  recorte: string | null | undefined;
  className?: string;
}) {
  const { item, previa } = linha;
  const nomeNaArte = (item.campos.nome ?? '').toLocaleUpperCase('pt-BR');
  return (
    <div className={`shrink-0 ${className}`}>
      {previa && previa.area && previa.design && recorte ? (
        <TelaDaPrevia
          base={previa.base}
          area={previa.area}
          corDaPeca={item.cor}
          arte={{
            tipo: 'design',
            design: previa.design,
            valores: item.campos,
            foto: { url: recorte, geometria: item.foto.geometria, enquadramento: item.foto.enquadramento },
          }}
          perto
          rotulo={`Prévia ilustrativa: ${previa.design.nome} com o nome ${nomeNaArte}, ${minusculo(linha.nome)}`}
          adiar
          className="rounded-xl"
        />
      ) : previa ? (
        <Image
          src={previa.base}
          alt={linha.nome}
          width={1440}
          height={1800}
          sizes="112px"
          className="h-auto w-full rounded-xl bg-estudio"
        />
      ) : (
        <div className="aspect-[4/5] w-full rounded-xl bg-estudio" />
      )}
    </div>
  );
}

function OpcaoDePresente({
  item,
  preco,
  aoMudar,
}: {
  item: ItemDoCarrinho;
  preco: Preco | null;
  aoMudar: (presente: Presente | null) => void;
}) {
  const id = useId();
  const mensagem = item.presente?.mensagem ?? '';
  return (
    <div className="mt-5">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={!!item.presente}
          onChange={(evento) => aoMudar(evento.target.checked ? { mensagem } : null)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer"
        />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-base leading-snug font-semibold">
            <IconePresente tamanho={18} className="shrink-0" />É presente
          </span>
          <span className="mt-0.5 block text-[0.9375rem] leading-snug">
            Embalagem especial e um cartão com a sua mensagem
            {preco ? `, por mais ${reais.format(preco.valor)}${preco.teste ? ' (preço de teste)' : ''}` : ''}. Na
            entrega, dá para mandar direto para quem vai ganhar.
          </span>
        </span>
      </label>
      {item.presente ? (
        <div className="mt-4 pl-8">
          <label htmlFor={`${id}-mensagem`} className="block text-base leading-snug font-semibold">
            Mensagem do cartão
          </label>
          <textarea
            id={`${id}-mensagem`}
            value={mensagem}
            onChange={(evento) => aoMudar({ mensagem: evento.target.value.slice(0, LIMITE_DO_CARTAO) })}
            maxLength={LIMITE_DO_CARTAO}
            rows={3}
            aria-describedby={`${id}-ajuda`}
            className="mt-2 block w-full resize-y rounded-md border border-verde bg-creme px-4 py-3 text-base leading-relaxed outline-offset-2 focus-visible:outline-2 focus-visible:outline-verde"
          />
          <p id={`${id}-ajuda`} className="mt-1.5 flex justify-between gap-4 text-sm leading-5">
            <span>O pacote vai sem o valor impresso.</span>
            <span className="shrink-0 tabular-nums">
              {mensagem.length}/{LIMITE_DO_CARTAO}
            </span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

// A foto original não chegou ao espaço privado: sem ela, não sai o arquivo de
// impressão. A pessoa manda a mesma foto de novo, e a peça segue como estava.
function ReenvioDaFoto({ aoEnviar }: { aoEnviar: (foto: Pick<FotoDaMontagem, 'id' | 'sessao' | 'original'>) => void }) {
  const id = useId();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(arquivo: File) {
    setEnviando(true);
    setErro(null);
    const url = URL.createObjectURL(arquivo);
    try {
      const checagem = await checarFoto(arquivo, url);
      if (checagem.nivel === 'bloqueio') {
        setErro(checagem.mensagens[0] ?? 'Essa foto não dá. Tenta outra?');
        return;
      }
      const aberta = await abrirVaga(arquivo, url, {
        largura: checagem.largura,
        altura: checagem.altura,
        nitidez: checagem.nitidez,
      });
      if (!aberta) {
        setErro('Não consegui preparar o envio agora. Tenta de novo em instantes?');
        return;
      }
      if (!(await enviarOriginal(aberta.vaga, aberta.original))) {
        setErro('A foto não chegou. Confere a internet e tenta de novo?');
        return;
      }
      aoEnviar({ id: aberta.vaga.id, sessao: aberta.vaga.sessao, original: 'enviada' });
    } finally {
      URL.revokeObjectURL(url);
      setEnviando(false);
    }
  }

  return (
    <div role="group" aria-labelledby={`${id}-titulo`} className="mt-5">
      <p id={`${id}-titulo`} className="flex items-start gap-2 text-base leading-snug font-semibold">
        <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />A foto desta peça não chegou até a gente.
      </p>
      <p className="mt-1 max-w-[46ch] pl-[26px] text-[0.9375rem] leading-snug">
        É dela que sai a estampa impressa. Manda a mesma foto de novo, que a peça continua como está.
      </p>
      <div className="pl-[26px]">
        <input
          id={`${id}-arquivo`}
          type="file"
          accept="image/*,.heic,.heif"
          className="peer sr-only"
          disabled={enviando}
          onChange={(evento) => {
            const arquivo = evento.target.files?.[0];
            evento.target.value = '';
            if (arquivo) void enviar(arquivo);
          }}
        />
        <label
          htmlFor={`${id}-arquivo`}
          className={`${linkDeTexto} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-verde ${enviando ? 'pointer-events-none' : ''}`}
        >
          {enviando ? (
            <span className="flex items-center gap-2 no-underline">
              <IconeCarregando /> Enviando a foto…
            </span>
          ) : (
            'Mandar a foto de novo'
          )}
        </label>
        {erro ? (
          <p role="alert" className="text-[0.9375rem] leading-snug font-semibold">
            {erro}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function AvisoDeTeste({ className = '' }: { className?: string }) {
  return (
    <p className={`rounded-md border border-dashed border-verde px-4 py-3 text-[0.9375rem] leading-snug ${className}`}>
      <span className="font-semibold">Loja em modo de teste.</span> Os preços são de teste e nenhum pagamento é cobrado
      de verdade.
    </p>
  );
}

export function MensagemDoPrazo({ className = '' }: { className?: string }) {
  const [abertura, ...resto] = mensagemDoPrazo().split('. ');
  return (
    <div className={className}>
      <p className="font-destaque text-[1.375rem] leading-tight italic">{abertura}.</p>
      <p className="mt-2 text-[0.9375rem] leading-relaxed">{resto.join('. ')}</p>
    </div>
  );
}

export function Carrinho({
  catalogo,
  designs,
  modoDeTeste,
}: {
  catalogo: Catalogo;
  designs: Design[];
  modoDeTeste: boolean;
}) {
  const [carrinho, setCarrinho] = useState<CarrinhoGuardado | null>(null);
  const [removida, setRemovida] = useState<{ item: ItemDoCarrinho; indice: number; nome: string } | null>(null);
  const [avisoDoBotao, setAvisoDoBotao] = useState<string | null>(null);
  const recortes = useRecortes(carrinho?.itens.map((i) => i.foto.chave) ?? []);

  // O carrinho mora no navegador: lido depois de a página abrir, e acompanhado se
  // outra aba mexer nele.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o navegador só é lido depois de a página abrir
    setCarrinho(lerCarrinhoGuardado());
    return acompanharCarrinho(() => setCarrinho(lerCarrinhoGuardado()));
  }, []);

  function mudar(mudanca: (itens: ItemDoCarrinho[]) => ItemDoCarrinho[]) {
    const novo: CarrinhoGuardado = { versao: 1, itens: mudanca(lerCarrinhoGuardado().itens) };
    guardarCarrinho(novo);
    setCarrinho(novo);
    setAvisoDoBotao(null);
  }

  if (!carrinho) {
    return <div aria-busy="true" aria-label="Carregando o carrinho" className="mt-10 h-40" />;
  }

  const linhas = linhasDoCarrinho(carrinho.itens, catalogo, designs, modoDeTeste);
  const presente = precoDoPresente(modoDeTeste);
  const presentes = carrinho.itens.filter((item) => item.presente).length;
  const subtotal = somar(...linhas.map((l) => l.preco?.valor ?? 0));
  const total = somar(subtotal, presentes * (presente?.valor ?? 0));
  const pendentes = linhas.filter((l) => fotoPendente(l.item));
  const travas = [
    ...(linhas.some((l) => l.foraDeLinha) ? ['tirar do carrinho a peça que saiu de linha'] : []),
    ...(linhas.some((l) => !l.preco) ? ['esperar o preço das peças que ainda não estão à venda'] : []),
    ...(pendentes.length
      ? [pendentes.length === 1 ? 'mandar de novo a foto de uma peça' : 'mandar de novo as fotos de algumas peças']
      : []),
  ];

  const desfazer = removida ? (
    <p role="status" className="mt-6 flex flex-wrap items-center gap-x-4 text-[0.9375rem] leading-snug">
      <span>Você tirou {removida.nome} do carrinho.</span>
      <button
        type="button"
        className={linkDeTexto}
        onClick={() => {
          const { item, indice } = removida;
          mudar((itens) => [...itens.slice(0, indice), item, ...itens.slice(indice)]);
          setRemovida(null);
        }}
      >
        Desfazer
      </button>
    </p>
  ) : null;

  if (!linhas.length) {
    return (
      <>
        {desfazer}
        <div className="mt-10 max-w-md">
          <p className="font-destaque text-[1.75rem] leading-tight italic">Seu carrinho está vazio.</p>
          <p className="mt-2 leading-relaxed">Monta a sua Divestir com a foto de quem você ama, e ela aparece aqui.</p>
          <Link href="/montar" className="ingresso mt-8">
            Criar minha Divestir
          </Link>
        </div>
      </>
    );
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-14">
      <div>
        {desfazer}
        <ul className="mt-6">
          {linhas.map((linha) => {
            const { item } = linha;
            const nome = (item.campos.nome ?? '').toLocaleUpperCase('pt-BR');
            return (
              <li
                key={item.id}
                id={`peca-${item.id}`}
                className="scroll-mt-6 border-t border-verde py-6 first:border-t-0 first:pt-2"
              >
                <div className="flex gap-4">
                  <MiniaturaDaPeca linha={linha} recorte={recortes[item.foto.chave]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-x-4">
                      <h2 className="min-w-0 text-lg leading-snug font-semibold">{linha.nome}</h2>
                      <div className="shrink-0 text-right">
                        <p className="text-lg leading-snug font-semibold tabular-nums">
                          {linha.preco ? reais.format(linha.preco.valor) : 'Em breve'}
                        </p>
                        {linha.preco?.teste ? <p className="text-sm leading-5">preço de teste</p> : null}
                      </div>
                    </div>
                    <p className="mt-1 text-[0.9375rem] leading-snug">{linha.detalhes}</p>
                    {nome ? (
                      <p className="mt-1 font-titulo text-xl leading-tight tracking-[0.02em] uppercase">{nome}</p>
                    ) : null}
                    {linha.foraDeLinha ? (
                      <p className="mt-2 flex items-start gap-2 text-[0.9375rem] leading-snug font-semibold">
                        <IconeAlerta className="mt-0.5 shrink-0" />
                        Essa peça saiu de linha. Tira do carrinho e monta outra?
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap gap-x-6">
                      {!linha.foraDeLinha ? (
                        <Link href="/montar" onClick={() => prepararEdicao(item)} className={linkDeTexto}>
                          Editar
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className={linkDeTexto}
                        onClick={() => {
                          const indice = carrinho.itens.findIndex((i) => i.id === item.id);
                          setRemovida({ item, indice, nome: nome ? `${nome} · ${linha.nome}` : linha.nome });
                          mudar((itens) => itens.filter((i) => i.id !== item.id));
                        }}
                      >
                        Tirar do carrinho
                      </button>
                    </div>
                  </div>
                </div>
                {fotoPendente(item) && !linha.foraDeLinha ? (
                  <ReenvioDaFoto
                    aoEnviar={(foto) =>
                      mudar((itens) =>
                        itens.map((i) => (i.id === item.id ? { ...i, foto: { ...i.foto, ...foto } } : i)),
                      )
                    }
                  />
                ) : null}
                {!linha.foraDeLinha && (presente || item.presente) ? (
                  <OpcaoDePresente
                    item={item}
                    preco={presente}
                    aoMudar={(novo) =>
                      mudar((itens) => itens.map((i) => (i.id === item.id ? { ...i, presente: novo } : i)))
                    }
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="border-t border-verde pt-2 lg:hidden">
          <Link href="/montar" onClick={prepararNovaMontagem} className={linkDeTexto}>
            Criar outra Divestir
          </Link>
        </div>
      </div>

      <aside
        aria-labelledby="resumo-do-carrinho"
        className="mt-6 border-t border-verde pt-6 lg:sticky lg:top-6 lg:mt-8 lg:border-t-0 lg:pt-0"
      >
        <h2 id="resumo-do-carrinho" className="text-lg leading-snug font-semibold">
          Resumo
        </h2>
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 text-[0.9375rem] leading-snug">
          <dt>{linhas.length === 1 ? '1 peça' : `${linhas.length} peças`}</dt>
          <dd className="text-right tabular-nums">{reais.format(subtotal)}</dd>
          {presentes ? (
            <>
              <dt>{presentes === 1 ? '1 presente' : `${presentes} presentes`}</dt>
              <dd className="text-right tabular-nums">{reais.format(presentes * (presente?.valor ?? 0))}</dd>
            </>
          ) : null}
          <dt>Frete</dt>
          <dd className="text-right">no próximo passo</dd>
          <div className="col-span-2 mt-2 grid grid-cols-subgrid border-t border-verde pt-3 text-base font-semibold">
            <dt>Total sem o frete</dt>
            <dd className="text-right tabular-nums">{reais.format(total)}</dd>
          </div>
        </dl>

        <div className="mt-6">
          {travas.length ? (
            <button
              type="button"
              className="ingresso w-full"
              onClick={() => {
                setAvisoDoBotao(`Antes de finalizar, falta ${travas.join(' e ')}.`);
                const primeira = linhas.find((l) => l.foraDeLinha || !l.preco || fotoPendente(l.item));
                if (primeira) document.getElementById(`peca-${primeira.item.id}`)?.scrollIntoView({ block: 'start' });
              }}
            >
              Finalizar compra
            </button>
          ) : (
            <Link href="/checkout" className="ingresso w-full">
              Finalizar compra
            </Link>
          )}
          {avisoDoBotao ? (
            <p role="alert" className="mt-3 text-[0.9375rem] leading-snug font-semibold">
              {avisoDoBotao}
            </p>
          ) : null}
          <div className="hidden lg:block">
            <Link href="/montar" onClick={prepararNovaMontagem} className={linkDeTexto}>
              Criar outra Divestir
            </Link>
          </div>
        </div>

        <MensagemDoPrazo className="mt-8" />
        {modoDeTeste ? <AvisoDeTeste className="mt-6" /> : null}
      </aside>
    </div>
  );
}
