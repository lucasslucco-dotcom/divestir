'use client';

import { useEffect, useEffectEvent, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  ENQUADRAMENTO_INICIAL,
  PASSO_DO_ZOOM,
  mover,
  zoomEm,
  type Enquadramento,
  type Geometria,
} from '@/lib/foto/enquadramento';
import {
  desenharMarca,
  janelaDaFotoNaTela,
  liberarTelas,
  janelaDePerto,
  prepararArte,
  prepararPeca,
  tintaDaCor,
  type ArtePreparada,
  type PecaPreparada,
  type Tela,
} from '@/lib/molde/desenhar';
import { carregarArte, carregarImagem, fontesDaPagina } from '@/lib/molde/recursos';
import { LARGURA_DA_ARTE, type AreaNaFoto, type Design } from '@/lib/molde/tipos';
import { IconeCarregando } from './icones';

// Uma prévia desenhada: a foto de base da peça e, por cima, o design com a foto e o
// nome do cliente (ou a marca no peito). Serve para a prévia grande, as vistas
// pequenas, as miniaturas dos designs, as cores e o resumo.

export type FotoDaPrevia = { url: string; geometria: Geometria; enquadramento: Enquadramento };

export type ArteDaPrevia =
  | { tipo: 'design'; design: Design; valores: Record<string, string>; foto: FotoDaPrevia | null }
  | { tipo: 'marca'; design: Design };

export type MudarEnquadramento = (mudanca: (atual: Enquadramento) => Enquadramento) => void;

type Props = {
  base: string;
  area: AreaNaFoto | null;
  corDaPeca: string;
  arte: ArteDaPrevia | null;
  // De perto: uma janela em volta da estampa. Sem isso, a peça inteira.
  perto?: boolean;
  rotulo: string;
  // Com isto, a própria prévia vira o ajuste do enquadramento (arrastar e dar zoom).
  ajuste?: MudarEnquadramento;
  // Prévias secundárias esperam um instante e só desenham quando aparecem na tela.
  adiar?: boolean;
  // O texto que explica o ajuste (id do elemento), para o leitor de tela.
  descricao?: string;
  // Forma da moldura (canto e borda).
  className?: string;
};

type Preparo = {
  peca: PecaPreparada;
  arte: ArtePreparada | null;
  marca: Tela | null;
  foto: HTMLImageElement | null;
  telaDaArte: Tela | null;
  // Janela da foto na tela, em frações da tela (para arrastar e dar zoom).
  janelaDaFoto: { x: number; y: number; largura: number; altura: number } | null;
};

// As fotos de base têm 1440 px de largura; a prévia pede a versão do tamanho que
// precisa, já otimizada pelo site (mais leve no celular).
const LARGURAS = [640, 828, 1080];
function fonteDaFoto(url: string, necessaria: number) {
  if (!url.startsWith('/')) return url;
  const largura = LARGURAS.find((l) => l >= necessaria);
  return largura ? `/_next/image?url=${encodeURIComponent(url)}&w=${largura}&q=75` : url;
}

type Ponto = { x: number; y: number };

function liberarPreparo(p: Preparo | null) {
  if (!p) return;
  p.peca.liberar();
  p.arte?.liberar();
  liberarTelas(p.marca, p.telaDaArte);
}

// A janela da foto em pixels da página, para arrastar e dar zoom em cima da prévia.
function janelaNaPagina(preparo: Preparo | null, canvas: HTMLCanvasElement | null) {
  const j = preparo?.janelaDaFoto;
  if (!j || !canvas) return null;
  const r = canvas.getBoundingClientRect();
  return {
    left: r.left + j.x * r.width,
    top: r.top + j.y * r.height,
    width: j.largura * r.width,
    height: j.altura * r.height,
  };
}

function acaoDaTecla(tecla: string, passo: number): ((e: Enquadramento) => Enquadramento) | null {
  switch (tecla) {
    case 'ArrowLeft':
      return (e) => mover(e, -passo, 0);
    case 'ArrowRight':
      return (e) => mover(e, passo, 0);
    case 'ArrowUp':
      return (e) => mover(e, 0, -passo);
    case 'ArrowDown':
      return (e) => mover(e, 0, passo);
    case '+':
    case '=':
      return (e) => zoomEm(e, PASSO_DO_ZOOM);
    case '-':
    case '_':
      return (e) => zoomEm(e, 1 / PASSO_DO_ZOOM);
    case '0':
      return () => ENQUADRAMENTO_INICIAL;
    default:
      return null;
  }
}

export function TelaDaPrevia({
  base,
  area,
  corDaPeca,
  arte,
  perto = false,
  rotulo,
  ajuste,
  adiar = false,
  descricao,
  className,
}: Props) {
  const moldura = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const preparo = useRef<Preparo | null>(null);
  const toques = useRef(new Map<number, Ponto>());
  const [tamanho, setTamanho] = useState<{ w: number; h: number } | null>(null);
  const [visivel, setVisivel] = useState(!adiar);
  const [versao, setVersao] = useState(0);
  const [situacao, setSituacao] = useState<'montando' | 'pronta' | 'falhou'>('montando');

  const foto = arte?.tipo === 'design' ? arte.foto : null;
  const chave = [
    base,
    area ? `${area.x},${area.topo},${area.largura}` : '-',
    corDaPeca,
    perto ? 'perto' : 'inteira',
    arte?.tipo ?? '-',
    arte ? arte.design.slug : '-',
    arte?.tipo === 'design' ? JSON.stringify(arte.valores) : '',
    foto?.url ?? '-',
  ].join('|');

  // Ao sair da tela, a prévia devolve a memória das telas que preparou.
  useEffect(
    () => () => {
      liberarPreparo(preparo.current);
      preparo.current = null;
    },
    [],
  );

  // O tamanho da tela acompanha a moldura, na densidade da tela do aparelho.
  useEffect(() => {
    const elemento = moldura.current;
    if (!elemento) return;
    const medir = () => {
      const densidade = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.round((elemento.clientWidth || 1) * densidade);
      const h = Math.round(w * 1.25);
      setTamanho((antes) => (antes && antes.w === w && antes.h === h ? antes : { w, h }));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  // Prévias secundárias só desenham quando chegam perto da tela.
  useEffect(() => {
    if (visivel) return;
    const elemento = moldura.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) setVisivel(true);
      },
      { rootMargin: '300px' },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [visivel]);

  // Preparo: a foto de base, as camadas fixas da arte e a sombra do tecido. Lê as
  // escolhas de agora; só roda de novo quando algo que muda o preparo muda (chave).
  const preparar = useEffectEvent(async ({ w, h }: { w: number; h: number }, cancelado: () => boolean) => {
    try {
      const fracao = perto && area ? Math.min(1, area.largura * 1.5) : 1;
      const imagemBase = await carregarImagem(fonteDaFoto(base, w / fracao));
      const tamanhoDaFoto = { largura: imagemBase.naturalWidth, altura: imagemBase.naturalHeight };
      let proporcao = arte?.tipo === 'design' ? arte.design.config.proporcao : 1;
      const janela =
        perto && area
          ? janelaDePerto(area, tamanhoDaFoto, proporcao)
          : { x: 0, y: 0, largura: tamanhoDaFoto.largura, altura: tamanhoDaFoto.altura };
      const larguraDaEstampa = area ? area.largura * tamanhoDaFoto.largura * (w / janela.largura) : 0;

      let artePreparada: ArtePreparada | null = null;
      let marca: Tela | null = null;
      let imagemDaFoto: HTMLImageElement | null = null;
      if (arte && area) {
        const fontes = await fontesDaPagina();
        if (arte.tipo === 'design') {
          [artePreparada, imagemDaFoto] = await Promise.all([
            prepararArte(
              { config: arte.design.config, corDaPeca, valores: arte.valores, fontes, carregarArte },
              larguraDaEstampa / LARGURA_DA_ARTE,
            ),
            arte.foto ? carregarImagem(arte.foto.url) : Promise.resolve(null),
          ]);
        } else {
          const tinta = tintaDaCor(arte.design.config, corDaPeca);
          marca = desenharMarca(fontes, tinta, Math.max(10, larguraDaEstampa / 5));
          proporcao = marca.width / marca.height;
        }
      }
      if (cancelado()) {
        artePreparada?.liberar();
        liberarTelas(marca);
        return;
      }
      liberarPreparo(preparo.current);
      preparo.current = {
        peca: prepararPeca(imagemBase, tamanhoDaFoto, arte ? area : null, proporcao, w, h, janela),
        arte: artePreparada,
        marca,
        foto: imagemDaFoto,
        telaDaArte: null,
        janelaDaFoto:
          arte?.tipo === 'design' && area ? janelaDaFotoNaTela(arte.design.config, area, tamanhoDaFoto, janela) : null,
      };
      setVersao((v) => v + 1);
    } catch {
      if (!cancelado()) setSituacao('falhou');
    }
  });

  useEffect(() => {
    if (!tamanho || !visivel) return;
    let cancelado = false;
    const espera = setTimeout(() => void preparar(tamanho, () => cancelado), adiar ? 150 : 0);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [chave, tamanho, visivel, adiar]);

  // Desenho: rápido, a cada mudança do enquadramento.
  const enquadramento = foto?.enquadramento;
  const geometria = foto?.geometria;
  useEffect(() => {
    if (!versao) return;
    const quadro = requestAnimationFrame(() => {
      // O preparo é lido na hora de desenhar: pode ter acabado de ser trocado.
      const p = preparo.current;
      const canvas = tela.current;
      if (!p || !canvas) return;
      try {
        if (canvas.width !== p.peca.largura) canvas.width = p.peca.largura;
        if (canvas.height !== p.peca.altura) canvas.height = p.peca.altura;
        let arteNaTela: Tela | null = p.marca;
        if (p.arte) {
          const fotoNoMolde =
            p.foto && geometria && enquadramento ? { imagem: p.foto, geometria, enquadramento } : null;
          arteNaTela = p.arte.desenhar(fotoNoMolde, p.telaDaArte ?? undefined);
          p.telaDaArte = arteNaTela;
        }
        p.peca.aplicar(canvas, arteNaTela);
        setSituacao('pronta');
      } catch {
        setSituacao('falhou');
      }
    });
    return () => cancelAnimationFrame(quadro);
  }, [versao, enquadramento, geometria]);

  // Zoom pela rodinha do mouse com Ctrl (ou ⌘) e pela pinça do trackpad.
  useEffect(() => {
    const canvas = tela.current;
    if (!canvas || !ajuste) return;
    const aoRolar = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return;
      const j = janelaNaPagina(preparo.current, canvas);
      if (!j) return;
      evento.preventDefault();
      const passo = evento.deltaMode === 1 ? evento.deltaY * 16 : evento.deltaY;
      const fator = Math.exp(-Math.max(-50, Math.min(50, passo)) * 0.004);
      const px = (evento.clientX - j.left) / j.width;
      const py = (evento.clientY - j.top) / j.height;
      ajuste((e) => zoomEm(e, fator, px, py));
    };
    const esquecerToques = () => toques.current.clear();
    canvas.addEventListener('wheel', aoRolar, { passive: false });
    window.addEventListener('blur', esquecerToques);
    return () => {
      canvas.removeEventListener('wheel', aoRolar);
      window.removeEventListener('blur', esquecerToques);
    };
  }, [ajuste]);

  function aoTocar(evento: PointerEvent<HTMLCanvasElement>) {
    if (!ajuste || (evento.pointerType === 'mouse' && evento.button !== 0)) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    toques.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
  }

  function aoArrastar(evento: PointerEvent<HTMLCanvasElement>) {
    const antes = toques.current.get(evento.pointerId);
    const j = janelaNaPagina(preparo.current, tela.current);
    if (!antes || !ajuste || !j) return;
    const agora = { x: evento.clientX, y: evento.clientY };
    const [primeiro, segundo] = [...toques.current.keys()];

    // Um dedo (ou o mouse): arrasta a foto junto com o dedo.
    if (segundo === undefined) {
      toques.current.set(evento.pointerId, agora);
      const dx = (agora.x - antes.x) / j.width;
      const dy = (agora.y - antes.y) / j.height;
      ajuste((e) => mover(e, dx, dy));
      return;
    }

    // Dois dedos: a pinça dá zoom em volta do meio dos dedos e arrasta junto.
    if (evento.pointerId !== primeiro && evento.pointerId !== segundo) return;
    const outro = toques.current.get(evento.pointerId === primeiro ? segundo : primeiro);
    if (!outro) return;
    toques.current.set(evento.pointerId, agora);
    const distanciaAntes = Math.hypot(antes.x - outro.x, antes.y - outro.y);
    const distanciaAgora = Math.hypot(agora.x - outro.x, agora.y - outro.y);
    const fator = distanciaAntes > 0 ? distanciaAgora / distanciaAntes : 1;
    const px = ((antes.x + outro.x) / 2 - j.left) / j.width;
    const py = ((antes.y + outro.y) / 2 - j.top) / j.height;
    const dx = (agora.x - antes.x) / 2 / j.width;
    const dy = (agora.y - antes.y) / 2 / j.height;
    ajuste((e) => mover(zoomEm(e, fator, px, py), dx, dy));
  }

  function aoSoltar(evento: PointerEvent<HTMLCanvasElement>) {
    toques.current.delete(evento.pointerId);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLCanvasElement>) {
    const acao = ajuste ? acaoDaTecla(evento.key, evento.shiftKey ? 0.1 : 0.02) : null;
    if (!acao || !ajuste) return;
    evento.preventDefault();
    ajuste(acao);
  }

  return (
    <div ref={moldura} className={`relative aspect-[4/5] overflow-hidden bg-estudio ${className ?? ''}`}>
      <canvas
        ref={tela}
        role="img"
        aria-label={rotulo}
        {...(ajuste
          ? {
              tabIndex: 0,
              'aria-roledescription': 'ajuste do enquadramento',
              'aria-describedby': descricao,
              onPointerDown: aoTocar,
              onPointerMove: aoArrastar,
              onPointerUp: aoSoltar,
              onPointerCancel: aoSoltar,
              onLostPointerCapture: aoSoltar,
              onKeyDown: aoTeclar,
            }
          : {})}
        className={`block size-full ${
          ajuste
            ? 'cursor-grab touch-none select-none outline-offset-[-3px] active:cursor-grabbing [-webkit-touch-callout:none]'
            : ''
        }`}
      />
      {situacao !== 'pronta' ? (
        <p className="absolute inset-0 flex items-center justify-center gap-2 p-3 text-center text-sm leading-snug font-semibold">
          {situacao === 'falhou' ? (
            'Não consegui montar essa prévia.'
          ) : (
            <>
              <IconeCarregando className="shrink-0" />
              <span className="sr-only">Montando…</span>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
