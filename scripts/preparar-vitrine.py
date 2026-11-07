"""Prepara uma foto de exemplo para a vitrine da home.

Uso: python3 scripts/preparar-vitrine.py <foto-original> <nome-de-saida>
Exemplo: python3 scripts/preparar-vitrine.py ~/Downloads/thor.png exemplo-thor

O que faz:
1. Recorta no formato 4:5 e reduz para 896 x 1120 px.
2. Acerta a luz do fundo da foto para bater com o verde da marca (#0D2B17).
   A correção é suave e de no máximo alguns tons: a peça não muda, só o
   fundo deixa de ter emenda com a faixa verde do site.
3. Salva em public/exemplos/<nome-de-saida>.jpg.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

VERDE = np.array([13, 43, 23], dtype=np.float32)  # #0D2B17
LARGURA, ALTURA = 896, 1120
PASTA = Path(__file__).resolve().parent.parent / 'public' / 'exemplos'


def desfocar(canal: np.ndarray, raio: float) -> np.ndarray:
    return gaussian_filter(canal.astype(np.float32), sigma=raio, mode='nearest')


def recortar_4x5(foto: Image.Image) -> Image.Image:
    w, h = foto.size
    if w / h > LARGURA / ALTURA:
        nova_w = round(h * LARGURA / ALTURA)
        x = (w - nova_w) // 2
        foto = foto.crop((x, 0, x + nova_w, h))
    else:
        nova_h = round(w * ALTURA / LARGURA)
        y = (h - nova_h) // 2
        foto = foto.crop((0, y, w, y + nova_h))
    return foto.resize((LARGURA, ALTURA), Image.LANCZOS)


def acertar_fundo(foto: Image.Image) -> tuple[Image.Image, np.ndarray]:
    px = np.asarray(foto, dtype=np.float32)
    h, w = px.shape[:2]
    r, g, b = px[..., 0], px[..., 1], px[..., 2]
    # Fundo = verde escuro: verde acima do vermelho e do azul, e pouca luz.
    # A peça (preta, branca, creme) e a foto dentro do círculo ficam de fora.
    fundo = ((g > r + 8) & (g > b + 4) & (px.max(axis=-1) < 90)).astype(np.float32)

    # Só a faixa perto das bordas encosta no verde da página: lá a correção é
    # total e some aos poucos até 140 px para dentro. O meio da foto, com a luz
    # e a sombra naturais da peça, fica como está.
    alcance = 140
    yy, xx = np.mgrid[0:h, 0:w]
    distancia = np.minimum.reduce([xx, w - 1 - xx, yy, h - 1 - yy]).astype(np.float32)
    t = np.clip(1 - distancia / alcance, 0, 1)
    faixa = t * t * (3 - 2 * t)

    perto = fundo * (distancia < alcance * 1.5)
    peso = desfocar(perto, 30)
    medio = (px[fundo > 0].mean(axis=0) - VERDE) if fundo.any() else np.zeros(3, np.float32)
    deslocamento = np.zeros_like(px)
    for c in range(3):
        estimado = desfocar(px[..., c] * perto, 30) / np.maximum(peso, 1e-6)
        campo = np.where(peso > 0.05, estimado - VERDE[c], medio[c])
        deslocamento[..., c] = desfocar(campo, 20)

    # Aplicada só nos pixels de fundo, com a beirada da peça suavizada.
    alcance_final = faixa * np.clip(desfocar(fundo, 2), 0, 1)
    aplicado = deslocamento * alcance_final[..., None]
    corrigida = np.clip(px - aplicado, 0, 255).astype(np.uint8)
    return Image.fromarray(corrigida), aplicado


def main() -> None:
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(1)
    origem, nome = Path(sys.argv[1]).expanduser(), sys.argv[2]
    foto = recortar_4x5(Image.open(origem).convert('RGB'))
    foto, deslocamento = acertar_fundo(foto)
    PASTA.mkdir(parents=True, exist_ok=True)
    destino = PASTA / f'{nome}.jpg'
    foto.save(destino, 'JPEG', quality=88, optimize=True, progressive=True)
    bordas = np.concatenate([np.asarray(foto)[:12].reshape(-1, 3), np.asarray(foto)[-12:].reshape(-1, 3)])
    print(f'{destino.name}: correção máxima de {np.abs(deslocamento).max():.1f} tons; '
          f'borda agora #{"".join(f"{round(v):02x}" for v in np.median(bordas, axis=0))}')


if __name__ == '__main__':
    main()
