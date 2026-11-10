#!/usr/bin/env python3
"""Desenha as artes fixas dos designs que são só geometria, em SVG de uma tinta só.

A cor vem de currentColor: o motor do molde (src/lib/molde) pinta cada arte na tinta
da peça. As artes saem em public/designs/<design>/.

Uso: python3 scripts/desenhar-artes.py

  turne-mundial/raios.svg   os raios e as estrelas atrás da foto
  turne-mundial/fita.svg    a fita onde vai "Turnê Mundial 2026"
  ao-vivo/pontos.svg        o círculo de pontos (retícula) atrás da foto
  em-cartaz/louros.svg      a coroa de louros dos selos
  letreiro/letreiro.svg     o letreiro de cinema com as lâmpadas
"""
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent / 'public' / 'designs'


def n(valor: float) -> str:
    return f'{valor:.1f}'.rstrip('0').rstrip('.')


def salvar(caminho: str, largura: float, altura: float, descricao: str, corpo: str):
    destino = RAIZ / caminho
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n(largura)} {n(altura)}" '
        f'width="{n(largura)}" height="{n(altura)}"><!-- {descricao} Feita pelo scripts/desenhar-artes.py; '
        f'a cor vem de "color" (currentColor). --><g fill="currentColor">{corpo}</g></svg>\n',
        encoding='utf-8',
    )
    print('salvo', destino.relative_to(RAIZ.parent.parent))


def ponto(cx: float, cy: float, raio: float, graus: float):
    """Ponto no círculo; 0 grau é para cima, e cresce no sentido horário."""
    a = math.radians(graus)
    return cx + math.sin(a) * raio, cy - math.cos(a) * raio


def poligono(pontos) -> str:
    return '<path d="M' + 'L'.join(f'{n(x)} {n(y)}' for x, y in pontos) + 'Z"/>'


def estrela(cx: float, cy: float, raio: float, giro: float = 0) -> str:
    pontos = [ponto(cx, cy, raio if i % 2 == 0 else raio * 0.42, giro + i * 36) for i in range(10)]
    return poligono(pontos)


def raios():
    """Raios em leque na metade de cima e nos lados (embaixo fica a fita), com 2 estrelas."""
    cx = cy = 500
    partes = []
    estrelas = {-75: (440, 30), 75: (440, 30)}
    passo = 7.5
    graus = -112.5
    i = 0
    while graus <= 112.5 + 0.01:
        if round(graus) in estrelas:
            raio, tamanho = estrelas[round(graus)]
            partes.append(estrela(*ponto(cx, cy, raio, graus), tamanho, graus))
        else:
            longo = i % 2 == 0
            r1, r2 = 268, 496 if longo else 430
            m1, m2 = (2.2, 6.5) if longo else (1.8, 4.6)
            a = math.radians(graus)
            tx, ty = math.cos(a), math.sin(a)  # tangente
            x1, y1 = ponto(cx, cy, r1, graus)
            x2, y2 = ponto(cx, cy, r2, graus)
            partes.append(
                poligono(
                    [
                        (x1 - tx * m1, y1 - ty * m1),
                        (x2 - tx * m2, y2 - ty * m2),
                        (x2 + tx * m2, y2 + ty * m2),
                        (x1 + tx * m1, y1 + ty * m1),
                    ]
                )
            )
        graus += passo
        i += 1
    salvar('turne-mundial/raios.svg', 1000, 1000, 'Raios e estrelas do design Turnê Mundial.', ''.join(partes))


def fita():
    """Fita reta com as pontas dobradas para trás e cortadas em V."""
    L, A = 1000, 132
    faixa = 104  # altura da faixa da frente
    borda = 96  # onde a faixa começa (a ponta fica antes)
    desce = 28  # quanto a ponta de trás fica abaixo da faixa
    partes = [poligono([(borda, 0), (L - borda, 0), (L - borda, faixa), (borda, faixa)])]
    for lado in (1, -1):
        x = (lambda v: v) if lado == 1 else (lambda v: L - v)
        # A ponta de trás, com o corte em V.
        partes.append(poligono([(x(0), desce), (x(borda - 9), desce), (x(borda - 9), A), (x(0), A), (x(34), (desce + A) / 2)]))
        # A dobra, embaixo do canto da faixa.
        partes.append(poligono([(x(borda), faixa + 7), (x(borda + 30), faixa + 7), (x(borda), A)]))
    salvar('turne-mundial/fita.svg', L, A, 'Fita do design Turnê Mundial.', ''.join(partes))


def pontos():
    """Círculo de pontos: grandes no meio, pequenos na borda (retícula de pôster)."""
    cx = cy = 500
    passo = 31
    partes = []
    alcance = int(1000 / passo) + 2
    for i in range(-alcance, alcance + 1):
        for j in range(-alcance, alcance + 1):
            # Grade girada 45 graus.
            x = cx + (i - j) * passo / math.sqrt(2)
            y = cy + (i + j) * passo / math.sqrt(2)
            d = math.hypot(x - cx, y - cy) / 500
            if d >= 0.985:
                continue
            raio = 12.2 * (1 - d**2.2) ** 0.75
            if raio < 1.6:
                continue
            partes.append(f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(raio)}"/>')
    salvar('ao-vivo/pontos.svg', 1000, 1000, 'Círculo de pontos do design Ao Vivo.', ''.join(partes))


def louros():
    """Coroa de louros aberta em cima: dois ramos de folhas, um de cada lado."""
    L, A = 300, 236
    cx, cy, raio = 150, 112, 100
    partes = []

    def folha(x, y, direcao, comprimento, largura):
        a = math.radians(direcao)
        ux, uy = math.sin(a), -math.cos(a)
        px, py = -uy, ux
        ponta = (x + ux * comprimento, y + uy * comprimento)
        meio = (x + ux * comprimento * 0.45, y + uy * comprimento * 0.45)
        c1 = (meio[0] + px * largura, meio[1] + py * largura)
        c2 = (meio[0] - px * largura, meio[1] - py * largura)
        return (
            f'<path d="M{n(x)} {n(y)}Q{n(c1[0])} {n(c1[1])} {n(ponta[0])} {n(ponta[1])}'
            f'Q{n(c2[0])} {n(c2[1])} {n(x)} {n(y)}Z"/>'
        )

    for lado in (1, -1):
        for k in range(9):
            graus = 168 - k * 15.5  # do pé da coroa (embaixo) até perto do topo
            x, y = ponto(cx, cy, raio, lado * graus)
            tamanho = 40 - k * 1.4
            # Uma folha para fora e outra para dentro, alternadas, apontando para cima.
            fora = lado * (graus - 90 + (38 if k % 2 == 0 else -6))
            partes.append(folha(x, y, fora, tamanho, 12.5))
            if k < 8:
                x2, y2 = ponto(cx, cy, raio - 4, lado * (graus - 7.5))
                partes.append(folha(x2, y2, lado * (graus - 7.5 - 90 - 44), tamanho * 0.82, 10.5))
        # O ramo.
        inicio = ponto(cx, cy, raio, lado * 172)
        fim = ponto(cx, cy, raio, lado * 40)
        partes.append(
            f'<path d="M{n(inicio[0])} {n(inicio[1])}A{raio} {raio} 0 0 {0 if lado == 1 else 1} {n(fim[0])} {n(fim[1])}" '
            f'fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>'
        )
    salvar('em-cartaz/louros.svg', L, A, 'Coroa de louros do design Em Cartaz.', ''.join(partes))


def letreiro():
    """Letreiro de cinema: moldura de lâmpadas com o painel vazio no meio e a coroa em cima."""
    L, A = 1000, 506
    topo = 150
    x0, x1, y0, y1 = 30, 970, topo, 496  # a moldura por fora
    banda = 54
    ix0, ix1, iy0, iy1 = x0 + banda, x1 - banda, y0 + banda, y1 - banda  # o painel

    def caixa(a, b, c, d, r):
        return (
            f'M{a + r} {b}H{c - r}A{r} {r} 0 0 1 {c} {b + r}V{d - r}A{r} {r} 0 0 1 {c - r} {d}'
            f'H{a + r}A{r} {r} 0 0 1 {a} {d - r}V{b + r}A{r} {r} 0 0 1 {a + r} {b}Z'
        )

    def bolinha(x, y, r=10.5):
        return f'M{n(x - r)} {n(y)}a{r} {r} 0 1 0 {2 * r} 0a{r} {r} 0 1 0 {-2 * r} 0Z'

    furos = []
    meio = banda / 2
    quantas = 22
    for k in range(quantas):
        x = x0 + meio + k * (x1 - x0 - banda) / (quantas - 1)
        furos += [bolinha(x, y0 + meio), bolinha(x, y1 - meio)]
    nos_lados = 6
    for k in range(1, nos_lados + 1):
        y = y0 + meio + k * (y1 - y0 - banda) / (nos_lados + 1)
        furos += [bolinha(x0 + meio, y), bolinha(x1 - meio, y)]
    partes = [f'<path fill-rule="evenodd" d="{caixa(x0, y0, x1, y1, 26)}{caixa(ix0, iy0, ix1, iy1, 6)}{"".join(furos)}"/>']
    # Um fio por dentro do painel.
    partes.append(
        f'<path d="{caixa(ix0 + 13, iy0 + 13, ix1 - 13, iy1 - 13, 4)}" fill="none" stroke="currentColor" stroke-width="4"/>'
    )
    # A coroa: dois degraus e um leque.
    partes.append(f'<path d="{caixa(236, topo - 30, 764, topo - 7, 6)}"/>')
    partes.append(f'<path d="{caixa(300, topo - 60, 700, topo - 37, 6)}"/>')
    cx, cy = 500, topo - 67
    petalas = 7
    for k in range(petalas):
        a0 = -90 + k * 180 / petalas + 2.2
        a1 = -90 + (k + 1) * 180 / petalas - 2.2
        dentro, fora = 26, 84
        p = [ponto(cx, cy, dentro, a0), ponto(cx, cy, fora, a0), ponto(cx, cy, fora, a1), ponto(cx, cy, dentro, a1)]
        partes.append(
            f'<path d="M{n(p[0][0])} {n(p[0][1])}L{n(p[1][0])} {n(p[1][1])}A{fora} {fora} 0 0 1 {n(p[2][0])} {n(p[2][1])}'
            f'L{n(p[3][0])} {n(p[3][1])}A{dentro} {dentro} 0 0 0 {n(p[0][0])} {n(p[0][1])}Z"/>'
        )
    partes.append(f'<path d="M{cx - 17} {cy}A17 17 0 0 1 {cx + 17} {cy}Z"/>')
    salvar('letreiro/letreiro.svg', L, A, 'Letreiro de cinema do design Letreiro.', ''.join(partes))


if __name__ == '__main__':
    raios()
    fita()
    pontos()
    louros()
    letreiro()
