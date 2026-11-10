#!/usr/bin/env python3
"""Monta as artes fixas dos designs a partir dos vetores que vieram do Higgsfield.

Como nasce cada arte (decisão do Lucas, 10/11/2026): o conceito aprovado vira uma
arte chapada no gerador de imagem do Higgsfield (branco sobre preto, sem a foto e sem
o nome), essa arte é vetorizada pelo Ideogram Vector, e o vetor fica guardado em
scripts/artes-fonte/<design>.txt, num formato compacto:

  linha 1: a caixa do desenho (viewBox)
  W<caminho>: forma de tinta      K<caminho>: forma vazada (o fundo)
  C<cx cy r>: ponto da retícula (círculo de tinta)

Este script separa cada arte nas partes que o molde precisa (o que fica atrás da foto,
o que fica na frente) e grava em public/designs/<design>/ um SVG por parte, de uma
tinta só: a cor vem de currentColor, e o que era preto vira furo (aparece o tecido).
No fim, mostra onde cada parte entra na arte do design (x, topo e largura, em
unidades da arte: 1000 de largura), para conferir com o supabase/seed.sql.

Uso: python3 scripts/montar-artes.py
"""
import math
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FONTE = RAIZ / 'artes-fonte'
SAIDA = RAIZ.parent / 'public' / 'designs'


def ler(arquivo: str):
    linhas = (FONTE / f'{arquivo}.txt').read_text(encoding='utf-8').split('\n')
    itens = []
    for texto in linhas[2:]:  # a linha 2 é o fundo preto inteiro
        if not texto:
            continue
        if texto[0] == 'C':
            cx, cy, r = (float(v) for v in texto[1:].split())
            itens.append({'tipo': 'C', 'texto': texto, 'caixa': (cx - r, cy - r, cx + r, cy + r), 'pontos': []})
        else:
            n = [float(v) for v in re.findall(r'-?\d+\.?\d*', texto[1:])]
            pontos = list(zip(n[0::2], n[1::2]))
            xs, ys = n[0::2], n[1::2]
            itens.append({'tipo': texto[0], 'texto': texto, 'caixa': (min(xs), min(ys), max(xs), max(ys)), 'pontos': pontos})
    return itens


def centro(item):
    a, b, c, d = item['caixa']
    return (a + c) / 2, (b + d) / 2


def dentro(ponto, poligono) -> bool:
    x, y = ponto
    dentro_ = False
    for (x1, y1), (x2, y2) in zip(poligono, poligono[1:] + poligono[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            dentro_ = not dentro_
    return dentro_


def n(valor: float) -> str:
    return f'{valor:.1f}'.rstrip('0').rstrip('.')


def gravar(design: str, parte: str, itens, corte, descricao: str, folga: float = 6, base: bool = False, ate_y=None):
    """Grava a parte e devolve onde ela entra na arte (x do centro, topo e largura).

    Com "ate_y" (em medidas do vetor), a parte é cortada reta nessa altura: o que
    passar dali para baixo não entra.

    Com "base", grava também <parte>-base.svg: a mesma parte sem os furos (a faixa
    inteira, sem as letras vazadas). O molde apaga a foto embaixo dessa base antes
    de pintar a parte, para as letras vazadas mostrarem o tecido, e não a foto.
    """
    x0 = min(i['caixa'][0] for i in itens) - folga
    y0 = min(i['caixa'][1] for i in itens) - folga
    x1 = max(i['caixa'][2] for i in itens) + folga
    y1 = max(i['caixa'][3] for i in itens) + folga
    if ate_y is not None:
        y1 = min(y1, ate_y)
    formas = []
    for i in itens:
        if i['tipo'] == 'C':
            cx, cy, r = i['texto'][1:].split()
            formas.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>')
        else:
            formas.append(f'<path d="{i["texto"][1:]}" fill="{"#fff" if i["tipo"] == "W" else "#000"}"/>')
    caixa = f'x="{n(x0)}" y="{n(y0)}" width="{n(x1 - x0)}" height="{n(y1 - y0)}"'
    destino = SAIDA / design / f'{parte}.svg'
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x0)} {n(y0)} {n(x1 - x0)} {n(y1 - y0)}" '
        f'width="{n(x1 - x0)}" height="{n(y1 - y0)}"><!-- {descricao} Arte do Higgsfield, vetorizada pelo Ideogram '
        f'Vector e montada pelo scripts/montar-artes.py. A cor vem de "color" (currentColor); o preto da máscara é furo. -->'
        f'<defs><mask id="m" maskUnits="userSpaceOnUse" {caixa} style="mask-type:luminance">{"".join(formas)}</mask></defs>'
        f'<rect {caixa} fill="currentColor" mask="url(#m)"/></svg>\n',
        encoding='utf-8',
    )
    if base:
        cheias = ''.join(f for f, i in zip(formas, itens) if i['tipo'] != 'K')
        (SAIDA / design / f'{parte}-base.svg').write_text(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x0)} {n(y0)} {n(x1 - x0)} {n(y1 - y0)}" '
            f'width="{n(x1 - x0)}" height="{n(y1 - y0)}"><!-- {descricao} Só a base, sem os furos: o molde usa '
            f'para apagar a foto embaixo. -->{cheias}</svg>\n',
            encoding='utf-8',
        )
    cx0, cy0, largura = corte
    k = 1000 / largura
    lugar = {'x': round(((x0 + x1) / 2 - cx0) * k, 1), 'topo': round((y0 - cy0) * k, 1), 'largura': round((x1 - x0) * k, 1)}
    print(f'  {design}/{parte}.svg  {len(itens)} formas  ->  {lugar}')
    return lugar


def na_arte(corte, x=None, y=None, tamanho=None):
    """Converte medidas do vetor para unidades da arte do design."""
    cx0, cy0, largura = corte
    k = 1000 / largura
    saida = []
    if x is not None:
        saida.append(round((x - cx0) * k, 1))
    if y is not None:
        saida.append(round((y - cy0) * k, 1))
    if tamanho is not None:
        saida.append(round(tamanho * k, 1))
    return saida


def turne_mundial():
    print('Turnê Mundial')
    itens = ler('turne-mundial')
    corte = (40, 70, 1280)  # x e y onde a arte do design começa no vetor, e a largura que vira 1000
    # A fita começa em 1104; o que começa acima disso são os raios da primeira arte
    # (com um círculo vazio no meio), que não entram mais.
    frente = [i for i in itens if i['caixa'][1] >= 1100]
    # As datas (entre a fita, que acaba em 1336, e o selo, que começa em 1575) ficam
    # numa parte só delas: a fita e o selo levam o desgaste de estampa antiga, e a
    # letra pequena das datas fica inteira, para ler.
    datas = [i for i in frente if 1338 <= i['caixa'][1] < 1555]
    fita = [i for i in frente if i not in datas]
    gravar('turne-mundial', 'frente', fita, corte, 'Fita "Turnê Mundial 2026" e selo (na frente da foto).', base=True)
    gravar('turne-mundial', 'datas', datas, corte, 'As datas da turnê.')
    print('  fita: topo', na_arte(corte, y=1104), ' fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))

    # Os raios vêm de uma arte só deles (pedido do Lucas, 10/11/2026): saem do meio e
    # passam por trás da foto, como no mockup. O centro do vetor (1024, 1024) cai no
    # meio da foto, e os raios são cortados na altura da fita, que cobre o corte.
    raios = ler('turne-mundial-raios')
    pequeno = lambda i: i['caixa'][2] - i['caixa'][0] < 140 and i['caixa'][3] - i['caixa'][1] < 140
    estrelas = [i for i in raios if pequeno(i)]
    so_raios = [i for i in raios if not pequeno(i)]
    largura = 1000 / RAIO_NA_ARTE * 890  # o raio comprido tem 890 no vetor
    corte_dos_raios = (1024 - CENTRO_DOS_RAIOS[0] * largura / 1000, 1024 - CENTRO_DOS_RAIOS[1] * largura / 1000, largura)
    gravar(
        'turne-mundial', 'raios', so_raios, corte_dos_raios, 'Raios (atrás da foto e do nome).',
        ate_y=corte_dos_raios[1] + RAIOS_ATE * largura / 1000,
    )
    # A estrela é uma peça só, que o molde põe três vezes (em cima e dos lados).
    estrela = min(estrelas, key=lambda i: i['caixa'][1])
    gravar('turne-mundial', 'estrela', [estrela], (estrela['caixa'][0], estrela['caixa'][1], 1000), 'Estrela.', folga=2)


# Onde os raios da Turnê Mundial ficam na arte (unidades da arte): o centro, o tamanho
# do raio comprido e até onde eles descem.
CENTRO_DOS_RAIOS = (500, 545)
RAIO_NA_ARTE = 420
RAIOS_ATE = 885


def ao_vivo():
    print('Ao Vivo')
    itens = ler('ao-vivo')
    corte = (55, 60, 1250)
    faixa = max(itens, key=lambda i: (i['caixa'][2] - i['caixa'][0]) * (i['tipo'] == 'W'))
    poligono = faixa['pontos']
    base_da_faixa = faixa['caixa'][3]
    selo, frente, pontos = [], [], []
    for i in itens:
        cx, cy = centro(i)
        if cy < 220:
            selo.append(i)
        elif i is faixa or dentro((cx, cy), poligono) or cy > base_da_faixa - 20 and i['tipo'] != 'C':
            frente.append(i)
        else:
            pontos.append(i)
    gravar('ao-vivo', 'selo', selo, corte, 'Etiqueta "Ao Vivo".')
    gravar('ao-vivo', 'pontos', pontos, corte, 'Círculo de pontos (atrás da foto).')
    gravar('ao-vivo', 'frente', frente, corte, 'Faixa "Turnê 2026" e a linha de lugares (na frente da foto).', base=True)
    so_pontos = [i for i in pontos if i['tipo'] == 'C']
    x0 = min(i['caixa'][0] for i in so_pontos)
    x1 = max(i['caixa'][2] for i in so_pontos)
    y0 = min(i['caixa'][1] for i in so_pontos)
    print('  círculo de pontos (x, topo, raio):', na_arte(corte, (x0 + x1) / 2, y0, (x1 - x0) / 2))
    print('  faixa: de', na_arte(corte, y=faixa['caixa'][1]), 'a', na_arte(corte, y=base_da_faixa), ' fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def em_cartaz():
    print('Em Cartaz')
    itens = ler('em-cartaz')
    corte = (110, 110, 1140)
    moldura = [i for i in itens if i['caixa'][2] - i['caixa'][0] > 900 and i['caixa'][3] - i['caixa'][1] > 900]
    # As duas linhas de letra serifada ("Uma história de amor" e "Em cartaz") saem do
    # site, por causa do ano que o cliente escolhe; a arte fica com a moldura, os
    # louros e os créditos.
    embaixo = [i for i in itens if i['caixa'][1] > 1470]
    gravar('em-cartaz', 'moldura', moldura, corte, 'Moldura do pôster (a foto aparece por dentro).', folga=2)
    gravar('em-cartaz', 'creditos', embaixo, corte, 'Louros e créditos do pôster.')
    a, b, c, d = moldura[1]['caixa'] if moldura[1]['tipo'] == 'K' else moldura[0]['caixa']
    print('  janela da foto (x do centro, topo, largura, altura):', na_arte(corte, (a + c) / 2, b, c - a), na_arte(corte, tamanho=d - b))
    linha1 = [i for i in itens if i['caixa'][3] < 200]
    linha2 = [i for i in itens if 1370 < i['caixa'][1] and i['caixa'][3] < 1470]
    for nome, linha in (('linha de cima', linha1), ('linha "em cartaz"', linha2)):
        print(f'  {nome}: base', na_arte(corte, y=max(i["caixa"][3] for i in linha)), 'altura da letra', na_arte(corte, tamanho=max(i['caixa'][3] - i['caixa'][1] for i in linha)))
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def torcida():
    print('Torcida Organizada')
    itens = ler('torcida')
    corte = (40, 110, 1280)
    topo = [i for i in itens if i['caixa'][3] < 300]
    linha = [i for i in itens if i['caixa'][1] > 1825]
    meio = [i for i in itens if i not in topo and i not in linha]
    # A faixa "Campeão do meu coração" é a forma larga de baixo; ela e o que está na
    # altura dela vão na frente da foto. O escudo e as estrelas ficam atrás.
    faixa = max((i for i in meio if i['tipo'] == 'W'), key=lambda i: (i['caixa'][2] - i['caixa'][0]) * (i['caixa'][3] - i['caixa'][1] < 300))
    frente = [i for i in meio if centro(i)[1] > faixa['caixa'][1]]
    atras = [i for i in meio if i not in frente]
    estrelas = [i for i in atras if i['caixa'][3] < 680]
    escudo = [i for i in atras if i not in estrelas]
    gravar('torcida', 'topo', topo, corte, 'A linha "Torcida Organizada".')
    gravar('torcida', 'estrelas', estrelas, corte, 'As três estrelas em cima do escudo.')
    gravar('torcida', 'escudo', escudo, corte, 'Escudo de listras (atrás da foto).')
    gravar('torcida', 'frente', frente, corte, 'Faixa "Campeão do meu coração" (na frente da foto).', base=True)
    gravar('torcida', 'linha', linha, corte, 'A linha de baixo.')
    print('  faixa: de', na_arte(corte, y=faixa['caixa'][1]), 'a', na_arte(corte, y=faixa['caixa'][3]), ' fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def bar_do():
    print('Bar do')
    itens = ler('bar-do')
    corte = (38, 92, 1284)
    topo = [i for i in itens if i['caixa'][3] < 300]
    selo = [i for i in itens if i['caixa'][1] > 1675]
    linha = [i for i in itens if 1590 < i['caixa'][1] <= 1675]
    meio = [i for i in itens if i not in topo and i not in selo and i not in linha]
    # A fita "Aberto todo dia" começa em 1284; o oval e as espigas ficam acima dela.
    frente = [i for i in meio if i['caixa'][1] >= 1280]
    atras = [i for i in meio if i not in frente]
    gravar('bar-do', 'topo', topo, corte, 'A letra "Bar do".')
    gravar('bar-do', 'oval', atras, corte, 'Placa oval e espigas (atrás da foto).')
    gravar('bar-do', 'frente', frente, corte, 'Fita "Aberto todo dia" (na frente da foto).', base=True)
    gravar('bar-do', 'linha', linha, corte, 'A linha "Cerveja gelada · Petisco · Resenha".')
    gravar('bar-do', 'selo', selo, corte, 'O carimbo "Fiado só amanhã".')
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def o_lendario():
    print('O Lendário')
    itens = ler('o-lendario')
    corte = (55, 180, 1250)
    topo = [i for i in itens if i['caixa'][3] < 460]
    barra = [i for i in itens if i['caixa'][1] > 1700]
    meio = [i for i in itens if i not in topo and i not in barra]
    # No meio ficam os quatro traços dos blocos de texto dos lados (o texto dos blocos
    # é do site, por causa do ano e de "pai", "avô", "tio"...) e o arco de estrelas da
    # arte, que ficou de fora: o Lucas preferiu a foto maior, sem elas (10/11/2026).
    tracos = [i for i in meio if i['caixa'][3] - i['caixa'][1] < 20]
    gravar('o-lendario', 'topo', topo, corte, 'As linhas "Uma noite só · Todo domingo" e "O Lendário".')
    gravar('o-lendario', 'tracos', tracos, corte, 'Os traços dos blocos de texto dos lados.', folga=2)
    gravar('o-lendario', 'frente', barra, corte, 'A barra "Churrasco ★ Conselhos ★ Piada ruim" (na frente da foto).', base=True)
    for t in sorted(tracos, key=lambda i: (i['caixa'][1], i['caixa'][0])):
        c = t['caixa']
        print('  traço: x', na_arte(corte, x=c[0]), 'a', na_arte(corte, x=c[2]), ' y', na_arte(corte, y=c[1]), 'a', na_arte(corte, y=c[3]))
    print('  fim de "O Lendário":', na_arte(corte, y=max(i['caixa'][3] for i in topo)), ' fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


if __name__ == '__main__':
    turne_mundial()
    ao_vivo()
    em_cartaz()
    torcida()
    bar_do()
    o_lendario()
