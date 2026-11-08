'use client';

import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  ENQUADRAMENTO_INICIAL,
  PASSO_DO_ZOOM,
  ZOOM_MAXIMO,
  ZOOM_MINIMO,
  ehInicial,
  mover,
  posicaoNoQuadro,
  zoomEm,
  type Enquadramento,
} from '@/lib/foto/enquadramento';
import type { EstadoDoRecorte, MudarEnquadramento } from './estado';
import { IconeAlerta, IconeCarregando, IconeMais, IconeMenos } from './icones';

const porcentagem = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

const botaoDeZoom =
  'inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-verde hover:bg-verde hover:text-creme disabled:cursor-default disabled:border-dashed disabled:hover:bg-transparent disabled:hover:text-verde';

type Ponto = { x: number; y: number };

// Teclado: setas movem (com Shift, um passo maior), + e − dão zoom, 0 redefine.
function acaoDaTecla(tecla: string, passo: number): ((atual: Enquadramento) => Enquadramento) | null {
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

// O quadro do recorte (4:5, Cinza do Estúdio). Com o recorte pronto, ele vira o
// ajuste de enquadramento: arrastar move, a pinça (ou os botões) dá zoom.
export function QuadroDoRecorte({
  recorte,
  grande = false,
  aoEnquadrar,
}: {
  recorte: EstadoDoRecorte;
  grande?: boolean;
  aoEnquadrar?: MudarEnquadramento;
}) {
  const quadro = useRef<HTMLDivElement>(null);
  const toques = useRef(new Map<number, Ponto>());
  const dica = useId();
  const temRecorte = recorte.etapa === 'pronto' || recorte.etapa === 'aprovado';
  const mudar = recorte.etapa === 'pronto' ? aoEnquadrar : undefined;

  // Zoom pela rodinha do mouse com Ctrl (ou ⌘) e pela pinça do trackpad, que
  // chega como rodinha com Ctrl. Sem Ctrl, a página rola normalmente.
  useEffect(() => {
    const elemento = quadro.current;
    if (!elemento || !mudar) return;
    const aoRolar = (evento: WheelEvent) => {
      if (!evento.ctrlKey && !evento.metaKey) return;
      evento.preventDefault();
      const caixa = elemento.getBoundingClientRect();
      const passo = evento.deltaMode === 1 ? evento.deltaY * 16 : evento.deltaY;
      const fator = Math.exp(-Math.max(-50, Math.min(50, passo)) * 0.004);
      const px = (evento.clientX - caixa.left) / caixa.width;
      const py = (evento.clientY - caixa.top) / caixa.height;
      mudar((atual) => zoomEm(atual, fator, px, py));
    };
    // Se a janela perde o foco no meio do gesto, o próximo toque começa do zero.
    const esquecerToques = () => toques.current.clear();
    elemento.addEventListener('wheel', aoRolar, { passive: false });
    window.addEventListener('blur', esquecerToques);
    return () => {
      elemento.removeEventListener('wheel', aoRolar);
      window.removeEventListener('blur', esquecerToques);
    };
  }, [mudar]);

  function aoTocar(evento: PointerEvent<HTMLDivElement>) {
    if (!mudar || (evento.pointerType === 'mouse' && evento.button !== 0)) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    toques.current.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
  }

  function aoArrastar(evento: PointerEvent<HTMLDivElement>) {
    const antes = toques.current.get(evento.pointerId);
    if (!antes || !mudar || !quadro.current) return;
    const caixa = quadro.current.getBoundingClientRect();
    const agora = { x: evento.clientX, y: evento.clientY };
    const [primeiro, segundo] = [...toques.current.keys()];

    // Um dedo (ou o mouse): arrasta.
    if (segundo === undefined) {
      toques.current.set(evento.pointerId, agora);
      const dx = (agora.x - antes.x) / caixa.width;
      const dy = (agora.y - antes.y) / caixa.height;
      mudar((atual) => mover(atual, dx, dy));
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
    const px = ((antes.x + outro.x) / 2 - caixa.left) / caixa.width;
    const py = ((antes.y + outro.y) / 2 - caixa.top) / caixa.height;
    const dx = (agora.x - antes.x) / 2 / caixa.width;
    const dy = (agora.y - antes.y) / 2 / caixa.height;
    mudar((atual) => mover(zoomEm(atual, fator, px, py), dx, dy));
  }

  function aoSoltar(evento: PointerEvent<HTMLDivElement>) {
    toques.current.delete(evento.pointerId);
  }

  function aoTeclar(evento: KeyboardEvent<HTMLDivElement>) {
    const acao = mudar ? acaoDaTecla(evento.key, evento.shiftKey ? 0.1 : 0.02) : null;
    if (!acao || !mudar) return;
    evento.preventDefault();
    mudar(acao);
  }

  const enquadramento = temRecorte ? recorte.enquadramento : ENQUADRAMENTO_INICIAL;
  const posicao = temRecorte ? posicaoNoQuadro(recorte.geometria, recorte.enquadramento) : null;

  return (
    // No computador, o quadro e os botões de zoom cabem juntos na altura da janela.
    <div className={`w-full ${grande ? 'max-w-[calc((100dvh_-_14rem)_*_0.8)]' : 'max-w-[22rem]'}`}>
      <div
        ref={quadro}
        {...(mudar
          ? {
              tabIndex: 0,
              role: 'group',
              'aria-label': 'Enquadramento da foto',
              'aria-describedby': dica,
              onPointerDown: aoTocar,
              onPointerMove: aoArrastar,
              onPointerUp: aoSoltar,
              onPointerCancel: aoSoltar,
              onLostPointerCapture: aoSoltar,
              onKeyDown: aoTeclar,
            }
          : {})}
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-estudio ${
          mudar ? 'cursor-grab touch-none select-none active:cursor-grabbing [-webkit-touch-callout:none]' : ''
        }`}
      >
        {recorte.etapa === 'recortando' ? (
          <p className="absolute inset-0 flex items-center justify-center gap-2 text-base font-semibold">
            <IconeCarregando className="shrink-0" />
            Tirando o fundo…
          </p>
        ) : null}
        {temRecorte && posicao ? (
          // O recorte chega como endereço temporário do navegador, então não passa
          // pelo otimizador de imagens do site.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={recorte.url}
            alt="A sua foto, já sem o fundo"
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              left: `${posicao.esquerda}%`,
              top: `${posicao.topo}%`,
              width: `${posicao.largura}%`,
              height: `${posicao.altura}%`,
            }}
          />
        ) : null}
        {recorte.etapa === 'erro' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <IconeAlerta tamanho={22} />
            <p className="text-base leading-snug font-semibold">{recorte.mensagem}</p>
          </div>
        ) : null}
      </div>

      {mudar ? (
        <div className="mt-3">
          <p id={dica} className="text-[0.9375rem] leading-snug">
            <span className="pointer-coarse:hidden">Arraste para mover e use os botões para dar zoom.</span>
            <span className="hidden pointer-coarse:inline">Arraste para mover e use dois dedos para dar zoom.</span>
            <span className="sr-only"> No teclado, use as setas para mover e as teclas + e − para o zoom.</span>
          </p>
          <div className="mt-2 flex items-center gap-1">
            <button
              type="button"
              aria-label="Diminuir o zoom"
              disabled={enquadramento.zoom <= ZOOM_MINIMO + 1e-6}
              onClick={() => mudar((atual) => zoomEm(atual, 1 / PASSO_DO_ZOOM))}
              className={botaoDeZoom}
            >
              <IconeMenos />
            </button>
            {/* O quadro fica dentro de uma área que avisa as mudanças ao leitor de tela. */}
            <span className="w-14 text-center text-sm leading-none font-semibold tabular-nums">
              <span className="sr-only">Zoom de </span>
              {porcentagem.format(enquadramento.zoom)}
            </span>
            <button
              type="button"
              aria-label="Aumentar o zoom"
              disabled={enquadramento.zoom >= ZOOM_MAXIMO - 1e-6}
              onClick={() => mudar((atual) => zoomEm(atual, PASSO_DO_ZOOM))}
              className={botaoDeZoom}
            >
              <IconeMais />
            </button>
            <button
              type="button"
              disabled={ehInicial(enquadramento)}
              onClick={() => mudar(() => ENQUADRAMENTO_INICIAL)}
              className="ml-auto inline-block cursor-pointer py-3 text-[0.9375rem] leading-5 underline decoration-1 underline-offset-[0.3em] hover:decoration-2 disabled:invisible"
            >
              Redefinir
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
