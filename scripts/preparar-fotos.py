"""Prepara as fotos do site: as de exemplo da vitrine e as de base do catálogo.

Uso:
  python3 scripts/preparar-fotos.py vitrine  <foto-original> <nome-de-saida>
  python3 scripts/preparar-fotos.py catalogo <foto-original> <nome-de-saida>

Exemplos:
  python3 scripts/preparar-fotos.py vitrine ~/Downloads/thor.png exemplo-thor
  python3 scripts/preparar-fotos.py catalogo ~/Downloads/x.png camiseta-regular-preto-frente

O que faz:
1. Recorta no formato 4:5 e reduz para o tamanho do uso.
2. Acerta a luz do fundo perto das bordas para bater com a cor certa: o verde
   da marca (#0D2B17) na vitrine e o cinza das fotos de base (#E9E9E7) no
   catálogo. A correção é suave e só mexe no fundo; a peça não muda.
3. Salva em public/exemplos/ (vitrine) ou public/catalogo/ (catálogo).
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

RAIZ = Path(__file__).resolve().parent.parent / 'public'

MODOS = {
    # Vitrine: fundo verde da marca, foto menor (a vitrine mostra até ~420 px).
    'vitrine': {'fundo': (13, 43, 23), 'tamanho': (896, 1120), 'pasta': RAIZ / 'exemplos'},
    # Catálogo: fundo cinza das fotos de base, foto maior (a prévia do montador é grande).
    'catalogo': {'fundo': (233, 233, 231), 'tamanho': (1440, 1800), 'pasta': RAIZ / 'catalogo'},
}


def desfocar(canal: np.ndarray, raio: float) -> np.ndarray:
    return gaussian_filter(canal.astype(np.float32), sigma=raio, mode='nearest')


def recortar_4x5(foto: Image.Image, tamanho: tuple[int, int]) -> Image.Image:
    largura, altura = tamanho
    w, h = foto.size
    if w / h > largura / altura:
        nova_w = round(h * largura / altura)
        x = (w - nova_w) // 2
        foto = foto.crop((x, 0, x + nova_w, h))
    else:
        nova_h = round(w * altura / largura)
        y = (h - nova_h) // 2
        foto = foto.crop((0, y, w, y + nova_h))
    return foto.resize((largura, altura), Image.LANCZOS)


def mascara_de_fundo(px: np.ndarray, modo: str) -> np.ndarray:
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    if modo == 'vitrine':
        # Verde escuro: verde acima do vermelho e do azul, e pouca luz.
        return (g > r + 8) & (g > b + 4) & (px.max(axis=-1) < 90)
    # Cinza claro: quase sem cor e com a luz perto do cinza de fundo.
    luz = px.mean(axis=-1)
    return ((px.max(axis=-1) - px.min(axis=-1)) < 10) & (np.abs(luz - 232) < 14)


def acertar_fundo(foto: Image.Image, modo: str) -> tuple[Image.Image, np.ndarray]:
    alvo = np.array(MODOS[modo]['fundo'], dtype=np.float32)
    px = np.asarray(foto, dtype=np.float32)
    h, w = px.shape[:2]
    fundo = mascara_de_fundo(px, modo).astype(np.float32)

    # Só a faixa perto das bordas encosta na página: lá a correção é total e
    # some aos poucos para dentro. O meio da foto, com a luz e a sombra
    # naturais da peça, fica como está.
    alcance = round(140 * w / 896)
    yy, xx = np.mgrid[0:h, 0:w]
    distancia = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    t = np.clip(1 - distancia / alcance, 0, 1)
    faixa = t * t * (3 - 2 * t)

    perto = fundo * (distancia < alcance * 1.5)
    peso = desfocar(perto, 30)
    medio = (px[fundo > 0].mean(axis=0) - alvo) if fundo.any() else np.zeros(3, np.float32)
    deslocamento = np.zeros_like(px)
    for c in range(3):
        estimado = desfocar(px[..., c] * perto, 30) / np.maximum(peso, 1e-6)
        campo = np.where(peso > 0.05, estimado - alvo[c], medio[c])
        deslocamento[..., c] = desfocar(campo, 20)

    # Aplicada só nos pixels de fundo, com a beirada da peça suavizada.
    alcance_final = faixa * np.clip(desfocar(fundo, 2), 0, 1)
    aplicado = deslocamento * alcance_final[..., None]
    corrigida = np.clip(px - aplicado, 0, 255).astype(np.uint8)
    return Image.fromarray(corrigida), aplicado


def main() -> None:
    if len(sys.argv) != 4 or sys.argv[1] not in MODOS:
        print(__doc__)
        sys.exit(1)
    modo, origem, nome = sys.argv[1], Path(sys.argv[2]).expanduser(), sys.argv[3]
    config = MODOS[modo]
    foto = recortar_4x5(Image.open(origem).convert('RGB'), config['tamanho'])
    foto, aplicado = acertar_fundo(foto, modo)
    config['pasta'].mkdir(parents=True, exist_ok=True)
    destino = config['pasta'] / f'{nome}.jpg'
    foto.save(destino, 'JPEG', quality=88, optimize=True, progressive=True)
    bordas = np.concatenate([np.asarray(foto)[:12].reshape(-1, 3), np.asarray(foto)[-12:].reshape(-1, 3)])
    print(f'{destino.name}: correção máxima de {np.abs(aplicado).max():.1f} tons; '
          f'borda agora #{"".join(f"{round(v):02x}" for v in np.median(bordas, axis=0))}')


if __name__ == '__main__':
    main()
