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


def gravar(design: str, parte: str, itens, corte, descricao: str, folga: float = 6, base: bool = False, ate_y=None, caixa=None):
    """Grava a parte e devolve onde ela entra na arte (x do centro, topo e largura).

    Com "ate_y" (em medidas do vetor), a parte é cortada reta nessa altura: o que
    passar dali para baixo não entra.

    Com "caixa" (x0, y0, x1, y1, em medidas do vetor), só aparece o que cai dentro
    dela: serve para tirar um pedaço de uma forma que veio inteira.

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
    if caixa is not None:
        x0, y0, x1, y1 = caixa
    formas = []
    for i in itens:
        if i['tipo'] == 'C':
            cx, cy, r = i['texto'][1:].split()
            formas.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>')
        else:
            formas.append(f'<path d="{i["texto"][1:]}" fill="{"#fff" if i["tipo"] == "W" else "#000"}"/>')
    retangulo = f'x="{n(x0)}" y="{n(y0)}" width="{n(x1 - x0)}" height="{n(y1 - y0)}"'
    destino = SAIDA / design / f'{parte}.svg'
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x0)} {n(y0)} {n(x1 - x0)} {n(y1 - y0)}" '
        f'width="{n(x1 - x0)}" height="{n(y1 - y0)}"><!-- {descricao} Arte do Higgsfield, vetorizada pelo Ideogram '
        f'Vector e montada pelo scripts/montar-artes.py. A cor vem de "color" (currentColor); o preto da máscara é furo. -->'
        f'<defs><mask id="m" maskUnits="userSpaceOnUse" {retangulo} style="mask-type:luminance">{"".join(formas)}</mask></defs>'
        f'<rect {retangulo} fill="currentColor" mask="url(#m)"/></svg>\n',
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


def sua_majestade():
    print('Sua Majestade')
    itens = ler('sua-majestade')
    corte = (36, 50, 1284)
    coroa = [i for i in itens if i['caixa'][3] < 300]
    titulo = [i for i in itens if 300 <= i['caixa'][1] and i['caixa'][3] < 380]
    linha = [i for i in itens if i['caixa'][1] > 1860]
    meio = [i for i in itens if i not in coroa and i not in titulo and i not in linha]
    # A fita (com as pontas e o ornamento de baixo) fica na frente da foto; a moldura
    # oval e os louros, atrás. A fita é a forma grande que começa em 1467: o que tem o
    # centro dentro dela, ou abaixo dela, é da fita.
    fita = next(i for i in meio if i['tipo'] == 'W' and i['caixa'][2] - i['caixa'][0] > 1000 and i['caixa'][1] > 1400 and i['caixa'][3] < 1750)
    def da_fita(i):
        x, y = centro(i)
        return i is fita or y > 1600 or (i['caixa'][1] >= fita['caixa'][1] - 12 and dentro((x, y), fita['pontos']))
    frente = [i for i in meio if da_fita(i)]
    moldura = [i for i in meio if i not in frente]
    gravar('sua-majestade', 'coroa', coroa, corte, 'A coroa.')
    gravar('sua-majestade', 'titulo', titulo, corte, 'A linha "Sua Majestade".')
    gravar('sua-majestade', 'moldura', moldura, corte, 'Moldura oval e louros (atrás da foto).')
    gravar('sua-majestade', 'frente', frente, corte, 'A fita, lisa, com o ornamento (na frente da foto; o texto da fita é do site).', base=True)
    gravar('sua-majestade', 'linha', linha, corte, 'A linha "Trono: o sofá · Reinado absoluto · Súditos fiéis".')
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def mapa_astral():
    print('Mapa Astral')
    itens = ler('mapa-astral')
    corte = (32, 100, 1306)
    topo = [i for i in itens if i['caixa'][3] < 300]
    linhas = [i for i in itens if i['caixa'][1] > 1615]
    roda = [i for i in itens if i not in topo and i not in linhas]
    gravar('mapa-astral', 'topo', topo, corte, 'O arco "O mapa astral de".')
    gravar('mapa-astral', 'roda', roda, corte, 'A roda do zodíaco, a lua, o sol e as estrelas (atrás da foto).')
    gravar('mapa-astral', 'linhas', linhas, corte, 'As linhas "Sol em preguiça", "Lua em petisco" e "Ascendente em bagunça".')
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def o_brabo():
    print('O Brabo')
    itens = ler('o-brabo')
    corte = (69, 125, 1221)
    tracos = [i for i in itens if i['caixa'][3] < 1300]
    corrente = [i for i in itens if i['caixa'][1] > 1722]
    fita = [i for i in itens if i not in tracos and i not in corrente]
    gravar('o-brabo', 'tracos', tracos, corte, 'Os traços dos blocos de texto dos lados.', folga=2)
    gravar('o-brabo', 'frente', fita, corte, 'A fita "Late mas não morde" (na frente da foto).', base=True)
    gravar('o-brabo', 'corrente', corrente, corte, 'A corrente de baixo.')
    for t in sorted(tracos, key=lambda i: (i['caixa'][1], i['caixa'][0])):
        c = t['caixa']
        print('  traço: x', na_arte(corte, x=c[0]), 'a', na_arte(corte, x=c[2]), ' y', na_arte(corte, y=c[1]), 'a', na_arte(corte, y=c[3]))
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def grandes_sucessos():
    print('Grandes Sucessos')
    itens = ler('grandes-sucessos')
    corte = (33, 196, 1294)
    # O título são as duas réguas e "Grandes Sucessos" entre elas (acabam em 820); a
    # barra de baixo começa em 1740. No meio, o disco são os anéis (formas grandes, uma
    # dentro da outra) e o resto são as faixas, dos dois lados.
    titulo = [i for i in itens if i['caixa'][3] < 823]
    barra = [i for i in itens if i['caixa'][1] > 1735]
    meio = [i for i in itens if i not in titulo and i not in barra]
    disco = [i for i in meio if i['caixa'][2] - i['caixa'][0] > 250 and i['caixa'][3] - i['caixa'][1] > 250]
    gravar('grandes-sucessos', 'titulo', titulo, corte, 'As duas réguas e "Grandes Sucessos".')
    gravar('grandes-sucessos', 'disco', disco, corte, 'O disco de vinil (atrás da foto).')
    gravar('grandes-sucessos', 'frente', barra, corte, 'A barra "Edição de colecionador ★ Volume único" (na frente da foto).', base=True)
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))
    # As faixas do disco vêm de uma arte só delas, maior (grandes-sucessos-faixas): na
    # arte inteira as letras eram pequenas demais para o vetor sair limpo (um "A" de
    # "casaco" veio fechado). São duas colunas: a da esquerda encosta à direita em 190 e
    # a da direita começa em 794, as duas a partir de 585, na mesma escala: ficam fora do
    # disco, para os anéis não aparecerem em pedaços entre as linhas.
    faixas = ler('grandes-sucessos-faixas')
    esquerda = [i for i in faixas if centro(i)[0] < 1024]
    direita = [i for i in faixas if i not in esquerda]
    def caixa_de(grupo):
        return (min(i['caixa'][0] for i in grupo), min(i['caixa'][1] for i in grupo), max(i['caixa'][2] for i in grupo), max(i['caixa'][3] for i in grupo))
    ce, cd = caixa_de(esquerda), caixa_de(direita)
    k = 400 / (cd[3] - cd[1])  # a coluna da direita (três faixas de três linhas) tem 400 de altura
    topo = min(ce[1], cd[1])
    gravar('grandes-sucessos', 'faixas-esquerda', esquerda, (ce[2] - 190 / k, topo - 585 / k, 1000 / k), 'As faixas 1 a 3 do disco (na frente da foto).', folga=4)
    gravar('grandes-sucessos', 'faixas-direita', direita, (cd[0] - 794 / k, topo - 585 / k, 1000 / k), 'As faixas 4 a 6 do disco (na frente da foto).', folga=4)


def melhor_mae():
    print('Melhor Mãe')
    itens = ler('melhor-mae')
    corte = (153, 91, 1099)
    # Só o topo vem da arte: os louros, "Vencedora · Melhor mãe · Do mundo" e as cinco
    # estrelas. As duas linhas de baixo são do site, por causa do ano e de quem é o júri
    # ("os filhos", "a filha", "o filho"...).
    topo = [i for i in itens if i['caixa'][3] < 600]
    gravar('melhor-mae', 'topo', topo, corte, 'Os louros, "Vencedora · Melhor mãe · Do mundo" e as estrelas.')
    print('  fim do topo:', na_arte(corte, y=max(i['caixa'][3] for i in topo)))


def capa_de_revista():
    print('Capa de Revista')
    itens = ler('capa-de-revista')
    corte = (31, 60, 1287)
    # A linha de cima acaba em 142 (a cedilha); o til de "Mãe" começa logo abaixo, em 146.
    topo = [i for i in itens if i['caixa'][3] < 144]
    titulo = [i for i in itens if i['caixa'][1] >= 144 and i['caixa'][3] < 720]
    chamadas = [i for i in itens if i['caixa'][1] >= 720 and i['caixa'][3] < 1400]
    frase = [i for i in itens if i['caixa'][1] > 1600]
    gravar('capa-de-revista', 'topo', topo, corte, 'A linha "Edição especial · Nº 1".')
    gravar('capa-de-revista', 'titulo', titulo, corte, 'O nome da revista, "Mãe" (atrás da foto).')
    gravar('capa-de-revista', 'chamadas', chamadas, corte, 'As chamadas de capa, dos dois lados (na frente da foto).')
    gravar('capa-de-revista', 'frase', frase, corte, 'A frase "a mulher da minha vida".')
    print('  fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def figurinha_rara():
    print('Figurinha Rara')
    itens = ler('figurinha-rara')
    # A moldura do cartão (de 54 a 1306) toma a largura da arte, com uma margem de 10 de
    # cada lado; o topo dela cai em 524, logo abaixo do nome, que o site escreve entre a
    # faixa e o cartão.
    corte = (41, 560 - 524 / (1000 / 1278), 1278)
    faixa = [i for i in itens if i['caixa'][3] < 200]
    linha = [i for i in itens if i['caixa'][1] > 1860]
    # O selo "Nº 01" é o disco do canto de cima, à direita, e o que está dentro dele.
    disco = next(i for i in itens if i['tipo'] == 'W' and 1000 < i['caixa'][0] < 1060 and i['caixa'][1] < 560)
    selo = [i for i in itens if dentro(centro(i), [(disco['caixa'][0], disco['caixa'][1]), (disco['caixa'][2], disco['caixa'][1]), (disco['caixa'][2], disco['caixa'][3]), (disco['caixa'][0], disco['caixa'][3])])]
    cartao = [i for i in itens if i not in faixa and i not in linha and i not in selo]
    gravar('figurinha-rara', 'faixa', faixa, corte, 'A faixa "★ Figurinha rara ★".')
    gravar('figurinha-rara', 'cartao', cartao, corte, 'A moldura do cartão, os raios e a tabela das notas (atrás da foto).')
    gravar('figurinha-rara', 'frente', selo, corte, 'O selo "Nº 01" (na frente da foto).', base=True)
    gravar('figurinha-rara', 'linha', linha, corte, 'A linha "Edição limitada · Não tem repetida".')
    print('  topo da tabela:', na_arte(corte, y=1360), ' fim da arte:', na_arte(corte, y=max(i['caixa'][3] for i in itens)))


def tocando_agora():
    print('Tocando Agora')
    itens = ler('tocando-agora')
    # A moldura da capa (de 172 a 1184) fica com 842 de largura, no meio da arte, com o
    # topo em 103, logo abaixo da linha "Tocando agora".
    corte = (172 - 79 / (842 / 1012), 174 - 103 / (842 / 1012), 1012 / 0.842)
    topo = [i for i in itens if i['caixa'][3] < 160]
    moldura = [i for i in itens if i['caixa'][1] >= 160 and i['caixa'][3] < 1083]
    # O título vem logo abaixo da moldura (que acaba em 1082): o acento do "Á" começa
    # na mesma altura, então quem decide é onde a forma acaba.
    titulo = [i for i in itens if 1090 < i['caixa'][3] < 1240]
    controles = [i for i in itens if 1540 < i['caixa'][1] and i['caixa'][3] < 1860]
    gravar('tocando-agora', 'topo', topo, corte, 'A linha "Tocando agora".')
    gravar('tocando-agora', 'moldura', moldura, corte, 'A capa: a moldura de cantos redondos e as ondas (atrás da foto).')
    gravar('tocando-agora', 'titulo', titulo, corte, 'O título da faixa, "Áudio de 7 minutos".')
    gravar('tocando-agora', 'controles', controles, corte, 'A barra do tempo (0:12 e 7:04) e os botões do player.')
    # A linha de baixo ("No repete desde 2012") é escrita pelo site, por causa do ano.
    print('  dentro da moldura:', na_arte(corte, x=194), na_arte(corte, x=1162), ' base:', na_arte(corte, y=1061), ' canto:', na_arte(corte, tamanho=130))


def alto_em():
    print('Alto Em')
    itens = ler('alto-em')
    # Os três rótulos (de 40 a 1320) tomam a largura da arte.
    corte = (33, 63, 1294)
    topo = [i for i in itens if i['caixa'][3] < 160]
    disco = [i for i in itens if 400 < i['caixa'][1] and i['caixa'][3] < 1640]
    # Cada ponto do disco veio do vetor como um contorno de curvas; vira um círculo de
    # verdade (centro e raio), que pesa quatro vezes menos no arquivo e sai mais redondo.
    pontos = []
    for i in disco:
        x0, y0, x1, y1 = i['caixa']
        if i['tipo'] == 'W' and abs((x1 - x0) - (y1 - y0)) <= 3:
            cx, cy, r = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0 + y1 - y0) / 4
            i = {'tipo': 'C', 'texto': f'C{n(cx)} {n(cy)} {n(r)}', 'caixa': i['caixa']}
        pontos.append(i)
    disco = pontos
    rotulos = [i for i in itens if 1640 <= i['caixa'][1] and i['caixa'][3] < 1870]
    linha = [i for i in itens if i['caixa'][1] > 1870]
    gravar('alto-em', 'topo', topo, corte, 'A linha "Advertência".')
    gravar('alto-em', 'disco', disco, corte, 'O disco de pontos (atrás da foto).')
    gravar('alto-em', 'frente', rotulos, corte, 'Os três rótulos de lupa: "Alto em fofoca", "Alto em drama" e "Alto em parceria" (na frente da foto e do disco).', base=True)
    gravar('alto-em', 'linha', linha, corte, 'A linha "Contém amiga de verdade".')


def grande_premio():
    print('Grande Prêmio')
    itens = ler('grande-premio')
    # A faixa "Pole position na piada ruim" (de 43 a 1323) toma a largura da arte, com
    # uma margem de 10 de cada lado.
    corte = (33, 40, 1294)
    bandeiras = [i for i in itens if i['caixa'][3] < 245]
    titulo = [i for i in itens if 245 <= i['caixa'][1] and i['caixa'][3] < 340]
    # O rastro de velocidade: os riscos à esquerda do nome, que o site escreve inclinado
    # logo depois deles.
    rastro = [i for i in itens if 340 <= i['caixa'][1] and i['caixa'][3] < 760 and i['caixa'][2] < 380]
    # O selo "10" é o disco à direita do círculo, e o que está dentro dele.
    disco = next(i for i in itens if i['tipo'] == 'W' and 880 < i['caixa'][0] < 940 and 780 < i['caixa'][1] < 860)
    a, b, c, d = disco['caixa']
    selo = [i for i in itens if dentro(centro(i), [(a, b), (c, b), (c, d), (a, d)]) and i['caixa'][2] <= c + 2 and i['caixa'][0] >= a - 2]
    circulo = [i for i in itens if 600 < i['caixa'][1] and i['caixa'][3] < 1612 and i not in selo and i not in rastro]
    faixa = [i for i in itens if 1612 <= i['caixa'][1] and i['caixa'][3] < 1775]
    base = [i for i in itens if i['caixa'][1] >= 1775]
    gravar('grande-premio', 'bandeiras', bandeiras, corte, 'As duas bandeiras quadriculadas.')
    gravar('grande-premio', 'titulo', titulo, corte, 'A linha "Grande Prêmio da Resenha".')
    # O rastro anda com o nome (o molde põe à esquerda dele, na altura da letra): sai
    # justo, sem folga, e o que importa é a proporção (largura dividida pela altura).
    lugar = gravar('grande-premio', 'rastro', rastro, corte, 'O rastro de velocidade, que anda com o nome.', folga=0)
    x0, y0 = min(i['caixa'][0] for i in rastro), min(i['caixa'][1] for i in rastro)
    x1, y1 = max(i['caixa'][2] for i in rastro), max(i['caixa'][3] for i in rastro)
    pontas = sorted(rastro, key=lambda i: i['caixa'][1])
    print(f'  rastro: proporção {(x1 - x0) / (y1 - y0):.3f}; inclinação {(pontas[0]["caixa"][2] - pontas[-1]["caixa"][2]) / (pontas[-1]["caixa"][3] - pontas[0]["caixa"][1]):.3f}')
    gravar('grande-premio', 'circulo', circulo, corte, 'O círculo com as faixas de velocidade (atrás da foto).')
    gravar('grande-premio', 'selo', selo, corte, 'O selo "10" (na frente da foto).', base=True)
    gravar('grande-premio', 'faixa', faixa, corte, 'A faixa "Pole position na piada ruim" (na frente da foto).', base=True)
    gravar('grande-premio', 'base', base, corte, 'A fita quadriculada e a linha "Piloto oficial do rolê · Temporada 2026".')


def mestre_da_brasa():
    print('Mestre da Brasa')
    itens = ler('mestre-da-brasa')
    # A fita "Churrasqueiro oficial" (de 38 a 1322) toma a largura da arte, com uma
    # margem de 8 de cada lado.
    corte = (30, 66, 1300)
    topo = [i for i in itens if i['caixa'][3] < 300]
    emblema = [i for i in itens if 300 <= i['caixa'][1] < 1500]
    fita = [i for i in itens if 1500 <= i['caixa'][1] and i['caixa'][3] < 1822]
    linha = [i for i in itens if i['caixa'][1] >= 1822]
    gravar('mestre-da-brasa', 'topo', topo, corte, 'O arco "Mestre da Brasa", com uma chama de cada lado.')
    gravar('mestre-da-brasa', 'emblema', emblema, corte, 'O emblema: o círculo, as chamas e os dois garfos cruzados (atrás da foto).')
    gravar('mestre-da-brasa', 'fita', fita, corte, 'A fita "Churrasqueiro oficial" (na frente da foto).', base=True)
    gravar('mestre-da-brasa', 'linha', linha, corte, 'A linha "Carne no ponto ★ Cerveja gelada ★ Resenha garantida".')
    # A linha de baixo ("No comando da grelha desde 2005") é escrita pelo site, por causa do ano.


if __name__ == '__main__':
    turne_mundial()
    ao_vivo()
    em_cartaz()
    torcida()
    bar_do()
    o_lendario()
    sua_majestade()
    mapa_astral()
    o_brabo()
    grandes_sucessos()
    melhor_mae()
    capa_de_revista()
    figurinha_rara()
    tocando_agora()
    alto_em()
    grande_premio()
    mestre_da_brasa()
