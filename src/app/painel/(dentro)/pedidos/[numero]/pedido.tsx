'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { ENQUADRAMENTO_INICIAL, medirRecorte, type Geometria } from '@/lib/foto/enquadramento';
import { reais } from '@/lib/loja';
import { baixar, gerarEstampa, gerarMarcaNoPeito, MARCA_NO_PEITO_CM, tamanhoDaEstampaCm } from '@/lib/molde/impressao';
import { NOME_DO_AVISO, nomeDoStatus, type Status } from '@/lib/painel/status';
import type { FotosDoItem, ItemDoPedido, PedidoInteiro } from '@/lib/painel/tipos';
import { IconeAlerta, IconeCarregando, IconeCopiar, IconePresente, IconeSim } from '../../../../montar/icones';
import { TelaDaPrevia } from '../../../../montar/tela-da-previa';
import { moverPedido } from '../../../acoes';
import { botao, dataEHora, etiqueta, etiquetaCheia, link } from '../../../estilo';
import { PerguntaDaFoto, PerguntaDoCancelamento, PerguntaDoRastreio } from '../../perguntas';

// --- As fotos de uma peça ---

type FotoPronta = { url: string; geometria: Geometria };

// O recorte e a foto original chegam por endereços assinados do espaço privado. O
// painel baixa cada um uma vez e desenha a prévia com o mesmo motor do site.
function useFotos(enderecos: FotosDoItem, comFundo: boolean) {
  const [recorte, setRecorte] = useState<FotoPronta | null | 'falhou'>(null);
  const [inteira, setInteira] = useState<string | null>(null);

  useEffect(() => {
    if (!enderecos.recorte) return;
    let vivo = true;
    let url: string | null = null;
    fetch(enderecos.recorte)
      .then((resposta) => (resposta.ok ? resposta.blob() : Promise.reject(new Error(String(resposta.status)))))
      .then(async (arquivo) => {
        url = URL.createObjectURL(arquivo);
        const geometria = await medirRecorte(url);
        if (vivo) setRecorte({ url, geometria });
      })
      .catch(() => {
        if (vivo) setRecorte('falhou');
      });
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [enderecos.recorte]);

  // Só o design que usa a foto com o fundo (o pôster de cinema) precisa da original.
  useEffect(() => {
    if (!comFundo || !enderecos.original) return;
    let vivo = true;
    let url: string | null = null;
    fetch(enderecos.original)
      .then((resposta) => (resposta.ok ? resposta.blob() : Promise.reject(new Error(String(resposta.status)))))
      .then((arquivo) => {
        url = URL.createObjectURL(arquivo);
        if (vivo) setInteira(url);
      })
      .catch(() => {});
    return () => {
      vivo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [comFundo, enderecos.original]);

  return { recorte: enderecos.recorte ? recorte : ('falhou' as const), inteira };
}

const LADO = { frente: 'na frente', costas: 'nas costas' } as const;

// "30 × 46 cm": o tamanho da estampa impressa, arredondado.
const emCm = (cm: number) => String(Math.round(cm));
// Um pedaço de nome de arquivo: sem acento, sem espaço.
const noNome = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// O recorte guardado é WebP; para a confecção, vai em PNG.
async function recorteEmPng(url: string) {
  const imagem = new window.Image();
  imagem.src = url;
  await imagem.decode();
  const tela = document.createElement('canvas');
  tela.width = imagem.naturalWidth;
  tela.height = imagem.naturalHeight;
  tela.getContext('2d')?.drawImage(imagem, 0, 0);
  const arquivo = await new Promise<Blob | null>((pronto) => tela.toBlob(pronto, 'image/png'));
  tela.width = tela.height = 0;
  if (!arquivo) throw new Error('recorte');
  return arquivo;
}

type Arquivo = 'estampa' | 'marca' | 'recorte';

function Peca({
  item,
  fotos,
  indice,
  total,
  numero,
  ano,
  recorteDeTeste,
}: {
  item: ItemDoPedido;
  fotos: FotosDoItem;
  indice: number;
  total: number;
  numero: number;
  ano: number;
  recorteDeTeste: boolean;
}) {
  const [gerando, setGerando] = useState<Arquivo | null>(null);
  const [erroDoArquivo, setErroDoArquivo] = useState<string | null>(null);
  const config = item.design.config;
  const comFundo = config.camadas.some((camada) => camada.tipo === 'foto' && 'fundo' in camada && camada.fundo);
  const { recorte, inteira } = useFotos(fotos, comFundo);
  const area = item.peca.areas?.[item.lado]?.previa ?? null;
  const nome = (item.campos.nome ?? '').toLocaleUpperCase('pt-BR');
  const enquadramento = { ...ENQUADRAMENTO_INICIAL, ...item.enquadramento };
  const pronta = recorte && recorte !== 'falhou' ? recorte : null;
  const arte = pronta
    ? ({
        tipo: 'design',
        design: item.design,
        valores: item.campos,
        foto: { url: pronta.url, geometria: pronta.geometria, enquadramento, inteira },
      } as const)
    : null;
  const outros = config.campos.filter((campo) => campo.chave !== 'nome' && item.campos[campo.chave]);
  const heic = /\.hei[cf]$/i.test(item.foto?.original ?? '');

  // Os arquivos para a confecção: a estampa no tamanho real, a marca do peito e o recorte.
  const estampaCm = tamanhoDaEstampaCm(item.peca.areas, item.lado, config);
  const inicio = `divestir-pedido-${numero}${total > 1 ? `-peca-${indice + 1}` : ''}`;
  const daPeca = [item.design.slug, item.peca.slug, item.cor.slug, item.tamanho].map(noNome).join('-');
  async function baixarArquivo(qual: Arquivo) {
    if (gerando || !pronta) return;
    setGerando(qual);
    setErroDoArquivo(null);
    try {
      if (qual === 'estampa') {
        const arquivo = await gerarEstampa({
          config,
          corDaPeca: item.cor.slug,
          valores: item.campos,
          recorte: { url: pronta.url, geometria: pronta.geometria, enquadramento },
          larguraCm: estampaCm.largura,
          ano,
        });
        baixar(arquivo, `${inicio}-estampa-${daPeca}-${emCm(estampaCm.largura)}x${emCm(estampaCm.altura)}cm.png`);
      } else if (qual === 'marca') {
        baixar(
          await gerarMarcaNoPeito(config, item.cor.slug),
          `${inicio}-marca-no-peito-${noNome(item.cor.slug)}-${MARCA_NO_PEITO_CM}cm.png`,
        );
      } else {
        baixar(await recorteEmPng(pronta.url), `${inicio}-recorte.png`);
      }
    } catch (motivo) {
      console.error('painel: não consegui gerar o arquivo', motivo);
      setErroDoArquivo(
        'Não consegui gerar esse arquivo aqui. Se estiver no celular, abra o pedido no computador: a estampa no tamanho real é grande demais para o navegador do celular.',
      );
    } finally {
      setGerando(null);
    }
  }

  return (
    <li className="border-t border-verde py-8 first:border-t-0 first:pt-0">
      <h3 className="text-lg leading-snug font-semibold">
        {total > 1 ? `Peça ${indice + 1} de ${total}: ` : ''}
        {item.design.nome}
        {nome ? ` · ${nome}` : ''}
      </h3>
      <p className="mt-1 leading-snug">
        {item.peca.nome} · {item.cor.nome} · tamanho <span className="font-semibold">{item.tamanho}</span> · estampa{' '}
        {LADO[item.lado]}
        {item.marca_no_peito ? ', com a marca no peito' : ''}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(['perto', 'inteira'] as const).map((vista) => (
          <figure key={vista}>
            {item.base && area && arte ? (
              <TelaDaPrevia
                base={item.base}
                area={area}
                corDaPeca={item.cor.slug}
                arte={arte}
                perto={vista === 'perto'}
                rotulo={`Prévia: ${item.design.nome} com o nome ${nome}, ${vista === 'perto' ? 'de perto' : 'na peça inteira'}`}
                className="rounded-xl"
              />
            ) : item.base ? (
              <Image
                src={item.base}
                alt={item.peca.nome}
                width={1440}
                height={1800}
                sizes="(min-width: 1024px) 18rem, 50vw"
                className="h-auto w-full rounded-xl bg-estudio"
              />
            ) : (
              <div className="aspect-[4/5] w-full rounded-xl bg-estudio" />
            )}
            <figcaption className="mt-2 text-[0.8125rem] leading-snug">
              {vista === 'perto' ? 'A estampa de perto' : 'Na peça'}
              {recorte === null && fotos.recorte ? ' (montando…)' : ''}
            </figcaption>
          </figure>
        ))}
        <figure>
          {pronta ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto privada, por endereço assinado
            <img
              src={pronta.url}
              alt="Recorte da foto do cliente"
              className="aspect-[4/5] w-full rounded-xl bg-estudio object-contain"
            />
          ) : (
            <div className="aspect-[4/5] w-full rounded-xl bg-estudio" />
          )}
          <figcaption className="mt-2 text-[0.8125rem] leading-snug">O recorte</figcaption>
        </figure>
        <figure>
          {fotos.original && !heic ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto privada, por endereço assinado
            <img
              src={fotos.original}
              alt="Foto original do cliente"
              loading="lazy"
              className="aspect-[4/5] w-full rounded-xl bg-estudio object-contain"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl bg-estudio p-4 text-center text-[0.8125rem] leading-snug">
              {fotos.original ? 'Foto do iPhone (HEIC): abra para ver.' : 'A foto original não está guardada.'}
            </div>
          )}
          <figcaption className="mt-2 text-[0.8125rem] leading-snug">
            A foto original
            {item.foto?.largura && item.foto.altura ? ` · ${item.foto.largura} × ${item.foto.altura} px` : ''}
            {fotos.original ? (
              <>
                {' · '}
                <a
                  href={fotos.original}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-[0.3em]"
                >
                  Abrir no tamanho real
                </a>
              </>
            ) : null}
          </figcaption>
        </figure>
      </div>

      {recorte === 'falhou' ? (
        <p className="mt-4 flex items-start gap-2 leading-snug font-semibold">
          <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />O recorte desta peça não está guardado: a prévia não
          pôde ser montada aqui.
        </p>
      ) : null}

      {pronta ? (
        <div className="mt-6">
          <h4 className="leading-snug font-semibold">Arquivos para a confecção</h4>
          <p className="mt-1 max-w-[64ch] text-[0.9375rem] leading-relaxed">
            A estampa sai em PNG de fundo transparente, a 300 pontos por polegada, com{' '}
            <span className="font-semibold">
              {emCm(estampaCm.largura)} × {emCm(estampaCm.altura)} cm
            </span>
            : já no tamanho de impressão, com a foto e o nome no lugar.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" className={botao} disabled={!!gerando} onClick={() => baixarArquivo('estampa')}>
              {gerando === 'estampa' ? (
                <>
                  <IconeCarregando tamanho={18} />
                  Gerando a estampa…
                </>
              ) : (
                'Baixar a estampa pronta'
              )}
            </button>
            {item.marca_no_peito ? (
              <button type="button" className={botao} disabled={!!gerando} onClick={() => baixarArquivo('marca')}>
                {gerando === 'marca' ? 'Gerando…' : `Baixar a marca do peito (${MARCA_NO_PEITO_CM} cm)`}
              </button>
            ) : null}
            <button type="button" className={botao} disabled={!!gerando} onClick={() => baixarArquivo('recorte')}>
              {gerando === 'recorte' ? 'Gerando…' : 'Baixar só o recorte'}
            </button>
          </div>
          {recorteDeTeste ? (
            <p className="mt-3 flex max-w-[64ch] items-start gap-2 text-[0.9375rem] leading-relaxed">
              <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
              <span>
                O recorte de fundo ainda está no modo de teste: a foto sai com a marca d’água do serviço e no tamanho da
                prévia. Serve para conferir a arte, ainda não para imprimir.
              </span>
            </p>
          ) : null}
          {erroDoArquivo ? (
            <p role="alert" className="mt-3 flex max-w-[64ch] items-start gap-2 leading-snug font-semibold">
              <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
              {erroDoArquivo}
            </p>
          ) : null}
        </div>
      ) : null}

      {outros.length || item.presente ? (
        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {outros.map((campo) => (
            <div key={campo.chave}>
              <dt className="text-[0.8125rem] leading-snug">{campo.resumo ?? campo.rotulo.replace(/\?$/, '')}</dt>
              <dd className="leading-snug font-semibold">{item.campos[campo.chave]}</dd>
            </div>
          ))}
          {item.presente ? (
            <div className="sm:col-span-2">
              <dt className="flex items-center gap-1.5 text-[0.8125rem] leading-snug">
                <IconePresente tamanho={16} />É presente: embalagem especial e cartão
              </dt>
              <dd className="mt-1 max-w-[52ch] leading-relaxed font-semibold whitespace-pre-line">
                {item.presente.mensagem?.trim() ? `“${item.presente.mensagem.trim()}”` : 'Cartão sem mensagem.'}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </li>
  );
}

// --- O que fazer agora ---

type Pergunta = 'rastreio' | 'foto' | 'cancelar' | null;

const AGORA: Record<string, { titulo: string; texto: string }> = {
  aguardando_pagamento: {
    titulo: 'Esperando o pagamento',
    texto: 'O pedido entra na fila sozinho quando o pagamento cair. Sem pagamento em 3 dias, é cancelado.',
  },
  pago: { titulo: 'Pagamento confirmado', texto: 'O pedido está indo para a revisão de arte.' },
  revisao_arte: {
    titulo: 'Confira a arte de cada peça',
    texto:
      'Olhe a estampa de perto: o rosto inteiro, nada cortado, o nome certo. Se estiver bom, aprove; se a foto não servir, peça outra.',
  },
  ajuste_foto: {
    titulo: 'Esperando uma foto melhor',
    texto:
      'O cliente já recebeu o seu recado por e-mail. Chame no WhatsApp para receber a foto nova; quando ela estiver certa, volte para a revisão.',
  },
  em_producao: {
    titulo: 'Na estamparia',
    texto: 'Quando a peça sair, informe o código de rastreio: o pedido vai para “Enviado”.',
  },
  enviado: { titulo: 'A caminho', texto: 'Quando a transportadora entregar, marque como entregue.' },
  entregue: { titulo: 'Entregue', texto: 'Pedido concluído.' },
  cancelado: { titulo: 'Pedido cancelado', texto: 'Este pedido não anda mais.' },
};

const PAGAMENTO: Record<string, string> = {
  approved: 'aprovado',
  pending: 'aguardando',
  in_process: 'em análise',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'devolvido',
  charged_back: 'contestado',
  valor_divergente: 'valor diferente do pedido',
};

const soDigitos = (texto: string) => texto.replace(/\D/g, '');

function mascaraDoWhatsapp(texto: string) {
  const d = soDigitos(texto);
  return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : texto;
}

function mascaraDoCpf(texto: string) {
  const d = soDigitos(texto);
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : texto;
}

function Dado({ nome, children }: { nome: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[0.8125rem] leading-snug">{nome}</dt>
      <dd className="leading-snug font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

export function PedidoDoPainel({
  pedido,
  fotos,
  admin,
  recorteDeTeste,
}: {
  pedido: PedidoInteiro;
  fotos: Record<number, FotosDoItem>;
  admin: boolean;
  // O recorte de fundo ainda está no modo de teste (com marca d'água).
  recorteDeTeste: boolean;
}) {
  const router = useRouter();
  const [pergunta, setPergunta] = useState<Pergunta>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [movendo, comecar] = useTransition();

  const status = pedido.status;
  const agora = AGORA[status] ?? { titulo: nomeDoStatus(status), texto: '' };
  const e = pedido.endereco ?? {};
  const presente = pedido.presente ?? {};
  const recado = [...pedido.historico].reverse().find((h) => h.para === 'ajuste_foto')?.nota ?? null;
  const whatsapp = soDigitos(pedido.whatsapp);
  const primeiroNome = pedido.nome.trim().split(/\s+/)[0] ?? '';

  function mover(para: Status, extras: { rastreio?: string; nota?: string } = {}) {
    setAviso(null);
    comecar(async () => {
      const retorno = await moverPedido(pedido.numero, para, extras);
      if (retorno && 'erro' in retorno) setAviso(retorno.erro);
      router.refresh();
    });
  }

  const linkDoPedido = () => `${window.location.origin}/pedido/${pedido.token}`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkDoPedido());
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setAviso('Não consegui copiar o link. Abra a página do cliente e copie o endereço.');
    }
  }

  function abrirWhatsapp() {
    const mensagem =
      status === 'ajuste_foto'
        ? `Oi, ${primeiroNome}! Aqui é da Divestir, sobre o seu pedido nº ${pedido.numero}. ${recado ?? 'A gente precisa de uma foto melhor para a sua peça ficar perfeita.'}`
        : `Oi, ${primeiroNome}! Aqui é da Divestir, sobre o seu pedido nº ${pedido.numero}.`;
    window.open(`https://wa.me/55${whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
  }

  const principal = 'ingresso w-full sm:w-auto';

  return (
    <>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
        <h1 className="font-titulo text-[clamp(2.25rem,9vw,4rem)] leading-none uppercase">Pedido nº {pedido.numero}</h1>
        <span className={status === 'cancelado' ? etiqueta : etiquetaCheia}>{nomeDoStatus(status)}</span>
        {pedido.teste ? <span className={etiqueta}>Teste</span> : null}
      </div>
      <p className="mt-3 text-[0.9375rem] leading-snug">
        {pedido.nome} · feito em {dataEHora(pedido.criado_em)}
        {pedido.pago_em ? ` · pago em ${dataEHora(pedido.pago_em)}` : ''}
      </p>

      <section aria-labelledby="agora" className="mt-8 rounded-xl border border-verde p-5 sm:p-6">
        <h2 id="agora" className="text-lg leading-snug font-semibold">
          {agora.titulo}
        </h2>
        <p className="mt-1 max-w-[62ch] leading-relaxed">{agora.texto}</p>
        {status === 'ajuste_foto' && recado ? (
          <p className="mt-3 max-w-[62ch] leading-relaxed">
            Recado para o cliente: <span className="font-semibold">“{recado}”</span>
          </p>
        ) : null}
        {status === 'enviado' || (status === 'entregue' && pedido.rastreio) ? (
          <p className="mt-3 leading-relaxed">
            Rastreio: <span className="font-semibold tabular-nums">{pedido.rastreio ?? 'não informado'}</span>
          </p>
        ) : null}

        {aviso ? (
          <p role="alert" className="mt-4 flex items-start gap-2 leading-snug font-semibold">
            <IconeAlerta tamanho={18} className="mt-0.5 shrink-0" />
            {aviso}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
          {status === 'revisao_arte' ? (
            <>
              <button type="button" disabled={movendo} onClick={() => mover('em_producao')} className={principal}>
                Aprovar a arte
              </button>
              <button type="button" disabled={movendo} onClick={() => setPergunta('foto')} className={botao}>
                Pedir outra foto
              </button>
            </>
          ) : null}
          {status === 'ajuste_foto' ? (
            <>
              <button type="button" disabled={movendo} onClick={() => mover('revisao_arte')} className={principal}>
                Voltar para a revisão
              </button>
              <button type="button" onClick={abrirWhatsapp} className={botao}>
                Chamar no WhatsApp
              </button>
            </>
          ) : null}
          {status === 'em_producao' ? (
            <>
              <button type="button" disabled={movendo} onClick={() => setPergunta('rastreio')} className={principal}>
                Informar o rastreio
              </button>
              <button type="button" disabled={movendo} onClick={() => mover('revisao_arte')} className={botao}>
                Voltar para a revisão
              </button>
            </>
          ) : null}
          {status === 'enviado' ? (
            <>
              <button type="button" disabled={movendo} onClick={() => mover('entregue')} className={principal}>
                Marcar como entregue
              </button>
              <button type="button" disabled={movendo} onClick={() => setPergunta('rastreio')} className={botao}>
                Corrigir o rastreio
              </button>
              <button type="button" disabled={movendo} onClick={() => mover('em_producao')} className={botao}>
                Voltar para a produção
              </button>
            </>
          ) : null}
          {status === 'entregue' ? (
            <button type="button" disabled={movendo} onClick={() => mover('enviado')} className={botao}>
              Voltar para “Enviado”
            </button>
          ) : null}
          {status !== 'aguardando_pagamento' && status !== 'cancelado' ? (
            <button type="button" onClick={() => void copiarLink()} className={botao}>
              {copiado ? <IconeSim tamanho={16} /> : <IconeCopiar tamanho={16} />}
              {copiado ? 'Link copiado' : 'Copiar o link do cliente'}
            </button>
          ) : null}
        </div>
        <p className="mt-5 max-w-[62ch] text-[0.8125rem] leading-snug">
          Cada mudança de etapa avisa o cliente por e-mail, sozinha. Os arquivos para a confecção ficam logo abaixo, em
          cada peça.
        </p>
      </section>

      <section aria-labelledby="pecas" className="mt-12">
        <h2 id="pecas" className="font-titulo text-3xl leading-none uppercase">
          {pedido.itens.length === 1 ? 'A peça' : `As ${pedido.itens.length} peças`}
        </h2>
        <ul className="mt-6">
          {pedido.itens.map((item, indice) => (
            <Peca
              key={item.id}
              item={item}
              fotos={fotos[item.id] ?? { original: null, recorte: null }}
              indice={indice}
              total={pedido.itens.length}
              numero={pedido.numero}
              ano={new Date(pedido.criado_em).getFullYear()}
              recorteDeTeste={recorteDeTeste}
            />
          ))}
        </ul>
      </section>

      <div className="mt-12 grid gap-x-12 gap-y-12 lg:grid-cols-2">
        <section aria-labelledby="cliente">
          <h2 id="cliente" className="font-titulo text-3xl leading-none uppercase">
            Cliente e entrega
          </h2>
          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Dado nome="Nome">{pedido.nome}</Dado>
            <Dado nome="WhatsApp">
              {mascaraDoWhatsapp(pedido.whatsapp)}{' '}
              <button type="button" onClick={abrirWhatsapp} className="font-normal underline underline-offset-[0.3em]">
                Chamar
              </button>
            </Dado>
            <Dado nome="E-mail">{pedido.email}</Dado>
            {pedido.cpf ? <Dado nome="CPF">{mascaraDoCpf(pedido.cpf)}</Dado> : null}
            <div className="sm:col-span-2">
              <dt className="text-[0.8125rem] leading-snug">
                {presente.destinatario ? 'Entregar para (presente, direto para quem vai ganhar)' : 'Entregar em'}
              </dt>
              <dd className="leading-relaxed font-semibold">
                {presente.destinatario ? <span className="block">{presente.destinatario}</span> : null}
                {[e.rua, e.numero].filter(Boolean).join(', ')}
                {e.complemento ? `, ${e.complemento}` : ''}
                <span className="block">
                  {[e.bairro, [e.cidade, e.uf].filter(Boolean).join(' / ')].filter(Boolean).join(' · ')}
                </span>
                {e.cep ? <span className="block tabular-nums">CEP {e.cep}</span> : null}
              </dd>
            </div>
            {pedido.frete_servico ? (
              <Dado nome="Frete">
                {[pedido.frete_servico.transportadora, pedido.frete_servico.servico].filter(Boolean).join(' · ')}
              </Dado>
            ) : null}
            {pedido.prazo_personalizacao ? (
              <Dado nome="Prazo prometido para fazer a peça">{pedido.prazo_personalizacao}</Dado>
            ) : null}
            <Dado nome="Pode aparecer nas redes da marca?">
              {pedido.autoriza_divulgacao ? 'Sim, autorizou' : 'Não'}
            </Dado>
          </dl>
        </section>

        <section aria-labelledby="pagamento">
          <h2 id="pagamento" className="font-titulo text-3xl leading-none uppercase">
            Pagamento
          </h2>
          <dl className="mt-6 grid max-w-sm gap-y-2">
            {[
              ['Peças e presente', pedido.subtotal],
              ['Frete', pedido.frete],
            ].map(([nome, valor]) => (
              <div key={nome} className="flex justify-between gap-6">
                <dt>{nome}</dt>
                <dd className="tabular-nums">{reais.format(Number(valor))}</dd>
              </div>
            ))}
            <div className="mt-2 flex justify-between gap-6 border-t border-verde pt-3 font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{reais.format(pedido.total)}</dd>
            </div>
          </dl>
          <p className="mt-4 leading-relaxed">
            {pedido.pagamento.metodo === 'pix'
              ? 'Pix'
              : pedido.pagamento.metodo === 'cartao'
                ? `Cartão de crédito${pedido.pagamento.parcelas && pedido.pagamento.parcelas > 1 ? ` em ${pedido.pagamento.parcelas} vezes` : ''}`
                : 'Sem pagamento ainda'}
            {pedido.pagamento.situacao ? `, ${PAGAMENTO[pedido.pagamento.situacao] ?? pedido.pagamento.situacao}` : ''}
            {pedido.teste ? '. Pedido de teste: não é venda de verdade.' : '.'}
          </p>
          {pedido.pagamento.id ? (
            <p className="mt-1 text-[0.8125rem] leading-snug [overflow-wrap:anywhere]">
              Código no meio de pagamento: {pedido.pagamento.id}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="historico">
          <h2 id="historico" className="font-titulo text-3xl leading-none uppercase">
            Histórico
          </h2>
          {pedido.historico.length ? (
            <ol className="mt-6 grid gap-4">
              {pedido.historico.map((passo, indice) => (
                <li key={indice} className="leading-snug">
                  <span className="font-semibold">{nomeDoStatus(passo.para)}</span>
                  <span className="block text-[0.9375rem]">
                    {dataEHora(passo.quando)} · {passo.por ?? 'pelo site'}
                  </span>
                  {passo.nota ? <span className="mt-1 block max-w-[52ch] text-[0.9375rem]">“{passo.nota}”</span> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-6 leading-relaxed">Nada ainda: o pedido foi criado e espera o pagamento.</p>
          )}
        </section>

        <section aria-labelledby="avisos">
          <h2 id="avisos" className="font-titulo text-3xl leading-none uppercase">
            Avisos ao cliente
          </h2>
          {pedido.avisos.length ? (
            <ul className="mt-6 grid gap-3">
              {pedido.avisos.map((aviso, indice) => (
                <li key={indice} className="leading-snug">
                  <span className="font-semibold">“{NOME_DO_AVISO[aviso.tipo] ?? aviso.tipo}”</span> por{' '}
                  {aviso.canal === 'email' ? 'e-mail' : 'WhatsApp'}
                  <span className="block text-[0.9375rem]">
                    {aviso.erro
                      ? `Não chegou: ${aviso.erro}`
                      : aviso.enviado_em
                        ? dataEHora(aviso.enviado_em)
                        : 'Na fila'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 max-w-[48ch] leading-relaxed">
              Nenhum aviso enviado ainda. O cliente recebe um e-mail a cada etapa: pagamento confirmado, em produção,
              enviado e entregue (e quando a foto precisa ser trocada).
            </p>
          )}
        </section>
      </div>

      {admin && status !== 'cancelado' && status !== 'entregue' && status !== 'enviado' ? (
        <p className="mt-12 border-t border-verde pt-6">
          <button type="button" disabled={movendo} onClick={() => setPergunta('cancelar')} className={link}>
            Cancelar este pedido
          </button>
        </p>
      ) : null}

      {pergunta === 'rastreio' ? (
        <PerguntaDoRastreio
          numero={pedido.numero}
          atual={pedido.rastreio ?? ''}
          aoFechar={() => setPergunta(null)}
          aoConfirmar={(rastreio) => {
            setPergunta(null);
            mover('enviado', { rastreio });
          }}
        />
      ) : null}
      {pergunta === 'foto' ? (
        <PerguntaDaFoto
          numero={pedido.numero}
          aoFechar={() => setPergunta(null)}
          aoConfirmar={(nota) => {
            setPergunta(null);
            mover('ajuste_foto', { nota });
          }}
        />
      ) : null}
      {pergunta === 'cancelar' ? (
        <PerguntaDoCancelamento
          numero={pedido.numero}
          pago={!!pedido.pago_em}
          aoFechar={() => setPergunta(null)}
          aoConfirmar={(nota) => {
            setPergunta(null);
            mover('cancelado', { nota });
          }}
        />
      ) : null}
    </>
  );
}
