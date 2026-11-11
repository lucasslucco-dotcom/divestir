#!/usr/bin/env python3
"""Prepara as fotos de exemplo do montador (public/designs/exemplos/).

Antes de a pessoa mandar a foto dela, as miniaturas dos designs e a prévia usam uma
foto de exemplo do tema ("Para quem é?"). Cada exemplo é um recorte sem fundo (PNG
transparente), como o que o Photoroom devolve. Este script reduz cada recorte, grava
em WebP e mostra onde está quem aparece (a "geometria"), para colar em
src/lib/molde/exemplos.ts.

Uso: python3 scripts/preparar-exemplos.py <pasta com os PNG>

Os arquivos da pasta têm o nome do exemplo (mae.png, pai.png, pet.png...). Um JPG
com o final "-inteira" (casal-inteira.jpg) é a mesma foto com o fundo original, no
mesmo quadro do recorte: é o que o design Em Cartaz usa.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ALTURA = 1250  # o bastante para a prévia grande do computador
SAIDA = Path(__file__).resolve().parent.parent / "public" / "designs" / "exemplos"


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    origem = Path(sys.argv[1])
    SAIDA.mkdir(parents=True, exist_ok=True)
    for arquivo in sorted(origem.glob("*.png")):
        imagem = Image.open(arquivo).convert("RGBA")
        if imagem.height > ALTURA:
            largura = round(imagem.width * ALTURA / imagem.height)
            imagem = imagem.resize((largura, ALTURA), Image.LANCZOS)
        # Quem aparece: os pixels opacos, como o site mede o recorte do cliente.
        opaco = np.asarray(imagem)[..., 3] >= 240
        linhas = np.where(opaco.any(axis=1))[0]
        colunas = np.where(opaco.any(axis=0))[0]
        x, y = int(colunas[0]), int(linhas[0])
        caixa = {"x": x, "y": y, "largura": int(colunas[-1]) - x + 1, "altura": int(linhas[-1]) - y + 1}
        destino = SAIDA / f"{arquivo.stem}.webp"
        imagem.save(destino, "WEBP", quality=84, method=6)
        print(
            f"{arquivo.stem}: {destino.stat().st_size // 1024} KB  "
            f"geometria: {{ largura: {imagem.width}, altura: {imagem.height}, "
            f"caixa: {{ x: {caixa['x']}, y: {caixa['y']}, largura: {caixa['largura']}, altura: {caixa['altura']} }} }}"
        )
    for arquivo in sorted(origem.glob("*-inteira.jpg")):
        imagem = Image.open(arquivo).convert("RGB")
        if imagem.height > ALTURA:
            imagem = imagem.resize((round(imagem.width * ALTURA / imagem.height), ALTURA), Image.LANCZOS)
        destino = SAIDA / arquivo.name
        imagem.save(destino, "JPEG", quality=84, optimize=True, progressive=True)
        print(f"{arquivo.stem}: {destino.stat().st_size // 1024} KB  {imagem.width} x {imagem.height}")


if __name__ == "__main__":
    main()
