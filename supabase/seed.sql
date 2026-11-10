-- Catálogo inicial da Divestir: 5 peças, 3 cores, as 30 fotos de base, a área de
-- impressão de cada lado e o primeiro design (Fã-Clube).
-- São dados, não estrutura: rodar de novo é seguro (atualiza o que já existe).
-- As fotos ficam em public/catalogo/ com o nome peca-cor-lado.jpg.
-- Preço ainda está em aberto no briefing, então fica vazio. Da área de impressão,
-- por enquanto só existe a posição na foto de base (previa); os centímetros chegam
-- quando a estamparia confirmar.

insert into public.pecas (slug, nome, caimento, ordem) values
  ('camiseta-regular', 'Camiseta', 'Regular', 1),
  ('camiseta-oversized', 'Camiseta', 'Oversized', 2),
  ('moletom', 'Moletom', 'Sem capuz', 3),
  ('moletom-capuz', 'Moletom', 'Com capuz', 4),
  ('jaqueta-college', 'Jaqueta college', 'Mangas contrastantes', 5)
on conflict (slug) do update set
  nome = excluded.nome,
  caimento = excluded.caimento,
  ordem = excluded.ordem;

insert into public.cores (slug, nome, hex, ordem) values
  ('preto', 'Preto', '#141414', 1),
  ('branco', 'Branco', '#FFFFFF', 2),
  ('creme', 'Creme', '#EFE6D3', 3)
on conflict (slug) do update set
  nome = excluded.nome,
  hex = excluded.hex,
  ordem = excluded.ordem;

insert into public.peca_imagens (peca_id, cor_id, lado, url)
select p.id, c.id, l.lado, format('/catalogo/%s-%s-%s.jpg', p.slug, c.slug, l.lado)
from public.pecas p
cross join public.cores c
cross join (values ('frente'), ('costas')) as l (lado)
where p.slug in ('camiseta-regular', 'camiseta-oversized', 'moletom', 'moletom-capuz', 'jaqueta-college')
  and c.slug in ('preto', 'branco', 'creme')
on conflict (peca_id, cor_id, lado) do update set url = excluded.url;

-- Área de impressão de cada lado, em frações da foto de base: centro (x), topo e
-- largura (a altura sai da proporção do molde). O cliente escolhe frente ou costas;
-- a jaqueta college só tem costas (decisão do Lucas, 08/11/2026). "peito" é o lugar
-- da marca no peito, na foto da frente, do lado esquerdo de quem veste: com a
-- estampa nas costas, a frente leva DIVESTIR em Anton até o logo ficar pronto
-- (decisão do Lucas, 08/11/2026).
-- "grande", nas costas, é a área dos designs de estampa grande (os de turnê): a estampa
-- toma mais da peça, como nos mockups aprovados (pedido do Lucas, 10/11/2026). O tamanho
-- em centímetros depende do que a estamparia consegue imprimir e prensar.
update public.pecas as p set area_impressao_cm = a.area
from (values
  ('camiseta-regular', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.205, "largura": 0.3}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.185, "largura": 0.31, "grande": {"largura": 0.4, "topo": 0.175}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.215, "largura": 0.11}}}'::jsonb),
  ('camiseta-oversized', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.218, "largura": 0.326}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.177, "largura": 0.326, "grande": {"largura": 0.42, "topo": 0.165}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.225, "largura": 0.11}}}'::jsonb),
  ('moletom', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.2, "largura": 0.31}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.185, "largura": 0.32, "grande": {"largura": 0.4, "topo": 0.175}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.225, "largura": 0.11}}}'::jsonb),
  ('moletom-capuz', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.305, "largura": 0.2}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.325, "largura": 0.36, "grande": {"largura": 0.42}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.655, "topo": 0.275, "largura": 0.1}}}'::jsonb),
  ('jaqueta-college', '{"costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.17, "largura": 0.3, "grande": {"largura": 0.38, "topo": 0.16}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.64, "topo": 0.23, "largura": 0.1}}}'::jsonb)
) as a (slug, area)
where p.slug = a.slug;

-- Pacote de uma peça dobrada, para cotar o frete no Melhor Envio (Etapa 6). É uma
-- estimativa até a operação pesar e medir as embalagens de verdade.
update public.pecas as p set envio = e.envio
from (values
  ('camiseta-regular', '{"peso_kg": 0.3, "largura_cm": 25, "altura_cm": 4, "comprimento_cm": 30}'::jsonb),
  ('camiseta-oversized', '{"peso_kg": 0.35, "largura_cm": 25, "altura_cm": 5, "comprimento_cm": 30}'::jsonb),
  ('moletom', '{"peso_kg": 0.7, "largura_cm": 30, "altura_cm": 8, "comprimento_cm": 35}'::jsonb),
  ('moletom-capuz', '{"peso_kg": 0.8, "largura_cm": 30, "altura_cm": 10, "comprimento_cm": 35}'::jsonb),
  ('jaqueta-college', '{"peso_kg": 1.0, "largura_cm": 35, "altura_cm": 10, "comprimento_cm": 40}'::jsonb)
) as e (slug, envio)
where p.slug = e.slug;

-- Design Fã-Clube: "Membro Oficial / NOME / Fã-Clube". As medidas estão em
-- unidades da arte (1000 de largura) e as camadas são pintadas nesta ordem.
-- A letra "Fã-Clube" foi gerada no Recraft V4.1 (Higgsfield) e limpa para uma tinta só.
insert into public.designs (slug, nome, status, ordem, config) values
  ('fa-clube', 'Fã-Clube', 'ativo', 1, '{
    "versao": 1,
    "proporcao": 0.601,
    "posicao": "costas",
    "camadas": [
      {"tipo": "anel", "x": 500, "y": 884, "raio": 405, "espessura": 12},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 206, "largura_maxima": 975, "altura_no_centro": 300, "arco": 1.45, "compressao_maxima": 0.8},
      {"tipo": "foto", "formato": "circulo", "x": 500, "y": 884, "raio": 399, "vaza_acima": 70, "janela": {"escala": 0.92, "desce": 10}},
      {"tipo": "arte", "arquivo": "/designs/fa-clube/letra.svg", "x": 500, "topo": 1214, "largura": 920, "folga": 16},
      {"tipo": "texto", "texto": "Membro Oficial", "fonte": "destaque-italico", "x": 500, "base": 128, "largura": 640}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Os designs de 10/11/2026 (escolhidos pelo Lucas entre os conceitos do Higgsfield).
-- A arte fixa de cada um nasce no Higgsfield (imagem chapada a partir do mockup aprovado,
-- vetorizada pelo Ideogram Vector) e é montada pelo scripts/montar-artes.py, que também
-- mostra onde cada parte entra (x, topo e largura abaixo). A tinta na peça preta é o
-- creme quente dos mockups. "temas" diz para quem o design foi feito (sem temas, serve
-- para todo mundo).
-- "drop_entrada" liga o selo "Novo" nas duas primeiras semanas; rodar de novo não mexe nas datas.

-- Design Turnê Mundial: camiseta de turnê antiga, estampa grande. A arte vem do Higgsfield:
-- os raios (que saem do meio e passam por trás da foto), a estrela, a fita "Turnê Mundial
-- 2026", as datas e o selo. O site põe o nome em arco, na letra gorda de turnê (Shrikhand),
-- engrossada, e a foto solta no meio dos raios. Tudo liso, sem desgaste (pedido do Lucas).
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('turne-mundial', 'Turnê Mundial', 'ativo', 2, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.7012,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/raios.svg", "x": 500.3, "topo": 135.2, "largura": 816.8, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/estrela.svg", "x": 152, "topo": 548, "largura": 54, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/estrela.svg", "x": 848, "topo": 548, "largura": 54, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "vintage", "x": 500, "topo": 12, "largura_maxima": 900, "altura_no_centro": 192, "arco": 1.85, "compressao_maxima": 0.5, "expansao_maxima": 1, "curva": 40, "folga": 10, "acento_dentro": true, "engrossa": 9},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/estrela.svg", "x": 500, "topo": 206, "largura": 54, "folga": 0},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 215, "largura": 960, "altura": 661, "janela": {"largura": 980, "altura": 940, "y": 702}},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/frente.svg", "x": 499.9, "topo": 808.7, "largura": 972.4, "folga": 8, "base": "/designs/turne-mundial/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/datas.svg", "x": 517.5, "topo": 1002.1, "largura": 923.4, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Ao Vivo: pôster de show, estampa grande. A arte (etiqueta, círculo de pontos, faixa
-- "Turnê 2026" e a linha de lugares) vem do Higgsfield; o site põe o nome enorme, de ponta a
-- ponta, na letra grossa de pôster (Passion One), com a base em arco, e a foto solta por cima
-- do círculo.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('ao-vivo', 'Ao Vivo', 'ativo', 3, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.6601,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/ao-vivo/selo.svg", "x": 201.9, "topo": 13.9, "largura": 301.5, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/ao-vivo/pontos.svg", "x": 490.8, "topo": 411.7, "largura": 883.4, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "show", "x": 500, "topo": 114, "largura_maxima": 900, "altura_no_centro": 325, "arco": 1.55, "compressao_maxima": 0.62, "folga": 9, "expansao_maxima": 1.5, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 400, "largura": 960, "altura": 865, "janela": {"largura": 1000, "altura": 1090, "y": 965}},
      {"tipo": "arte", "arquivo": "/designs/ao-vivo/frente.svg", "x": 498.4, "topo": 1105.8, "largura": 971.1, "folga": 0, "base": "/designs/ao-vivo/frente-base.svg"}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Em Cartaz: pôster de cinema. A foto entra com o fundo original e escurece na base,
-- com o nome em itálico por cima (Instrument Serif); moldura, louros e créditos vêm do
-- Higgsfield; o cliente diz o ano ("desde").
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('em-cartaz', 'Em Cartaz', 'ativo', 4, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.641,
    "posicao": "costas",
    "camadas": [
      {"tipo": "texto", "texto": "UMA HISTÓRIA DE AMOR", "fonte": "cinema-forte", "x": 500, "base": 60, "largura": 860, "altura": 27, "espaco": 0.34},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 92, "largura": 881, "altura": 1005, "fundo": true, "sombra": 0.42},
      {"tipo": "arte", "arquivo": "/designs/em-cartaz/moldura.svg", "x": 500, "topo": 83, "largura": 898.9, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "destaque-italico", "x": 500, "topo": 888, "largura_maxima": 830, "altura_no_centro": 150, "arco": 1, "compressao_maxima": 0.75, "tinta": "creme-quente"},
      {"tipo": "texto", "texto": "EM CARTAZ DESDE {desde}", "fonte": "cinema-forte", "x": 500, "base": 1167, "largura": 880, "altura": 29, "espaco": 0.34},
      {"tipo": "arte", "arquivo": "/designs/em-cartaz/creditos.svg", "x": 502.1, "topo": 1200.9, "largura": 982.4, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 16, "caixa": "alta"}, {"chave": "desde", "rotulo": "Desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["casal"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Torcida ("Torcida Organizada"): camisa de torcida, estampa grande, para pais, avôs e amigos. A
-- arte vem do Higgsfield (a linha de cima, as estrelas, o escudo de listras, a faixa
-- "Campeão do meu coração" e a linha de baixo); o site põe o nome na letra de camisa de
-- time (Graduate, engrossada), com a base em arco, e a foto solta na frente do escudo.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('torcida', 'Torcida', 'ativo', 5, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.7143,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/torcida/topo.svg", "x": 497.0, "topo": 4.5, "largura": 699.1, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/torcida/estrelas.svg", "x": 499.9, "topo": 344.9, "largura": 293.3, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/torcida/escudo.svg", "x": 498.6, "topo": 433.1, "largura": 768.4, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "colegial", "x": 500, "topo": 116, "largura_maxima": 900, "altura_no_centro": 225, "arco": 1.55, "compressao_maxima": 0.6, "expansao_maxima": 1.5, "curva": 0, "folga": 10, "acento_dentro": true, "engrossa": 18},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 380, "largura": 960, "altura": 880, "janela": {"largura": 960, "altura": 900, "y": 870}},
      {"tipo": "arte", "arquivo": "/designs/torcida/frente.svg", "x": 499.9, "topo": 1177.9, "largura": 986.2, "folga": 6, "base": "/designs/torcida/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/torcida/linha.svg", "x": 501.6, "topo": 1340.4, "largura": 941.6, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["pais", "avos-ele", "amigos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Boteco ("Bar do"): placa de boteco, estampa grande, para amigos, pais e avôs. A arte vem do
-- Higgsfield (a letra "Bar do", a placa oval com as espigas, a fita "Aberto todo dia", a
-- linha e o carimbo "Fiado só amanhã"); o site põe o nome na letra de placa (Alfa Slab One)
-- e a foto solta dentro da placa.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('bar-do', 'Boteco', 'ativo', 6, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.6964,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/bar-do/topo.svg", "x": 499.5, "topo": 3.7, "largura": 685.4, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/bar-do/oval.svg", "x": 499.1, "topo": 358.1, "largura": 930.1, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "bloco", "x": 500, "topo": 170, "largura_maxima": 900, "altura_no_centro": 215, "arco": 1.42, "compressao_maxima": 0.6, "expansao_maxima": 1.2, "curva": 0, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 372, "largura": 940, "altura": 650, "janela": {"largura": 940, "altura": 800, "y": 770}},
      {"tipo": "arte", "arquivo": "/designs/bar-do/frente.svg", "x": 499.6, "topo": 923.9, "largura": 992.3, "folga": 6, "base": "/designs/bar-do/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/bar-do/linha.svg", "x": 499.6, "topo": 1165.8, "largura": 877.4, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/bar-do/selo.svg", "x": 502.4, "topo": 1234.0, "largura": 741.9, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigos", "pais", "avos-ele"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design O Lendário: pôster de luta, estampa grande, para pais e avôs. A arte vem do Higgsfield
-- (as linhas de cima, "O Lendário", os traços dos blocos e a barra de baixo); o site põe o
-- nome enorme (Passion One), a foto grande, que passa por trás dos blocos, e os dois blocos
-- de texto: "Invicto desde {ano}" e "Campeão mundial de {pai, avô, tio...}", que o cliente
-- escolhe.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('o-lendario', 'O Lendário', 'ativo', 7, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.7508,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/o-lendario/topo.svg", "x": 507.3, "topo": 4.9, "largura": 939.8, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "show", "x": 500, "topo": 232, "largura_maxima": 940, "altura_no_centro": 310, "arco": 1.36, "compressao_maxima": 0.6, "expansao_maxima": 1.4, "folga": 9, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 440, "largura": 960, "altura": 820, "janela": {"largura": 1160, "altura": 1200, "y": 1070}},
      {"tipo": "arte", "arquivo": "/designs/o-lendario/tracos.svg", "x": 500.1, "topo": 669.1, "largura": 939.5, "folga": 7},
      {"tipo": "texto", "texto": "INVICTO", "fonte": "titulo", "x": 133.3, "base": 765, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "DESDE", "fonte": "titulo", "x": 133.3, "base": 851, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "{desde}", "fonte": "titulo", "x": 133.3, "base": 937, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "CAMPEÃO", "fonte": "titulo", "x": 866.8, "base": 765, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "MUNDIAL", "fonte": "titulo", "x": 866.8, "base": 851, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "DE {papel}", "fonte": "titulo", "x": 866.8, "base": 937, "largura": 200, "altura": 64, "espaco": 0.02, "folga": 7},
      {"tipo": "arte", "arquivo": "/designs/o-lendario/frente.svg", "x": 500.3, "topo": 1220.6, "largura": 989.0, "folga": 0, "base": "/designs/o-lendario/frente-base.svg"}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}, {"chave": "desde", "rotulo": "Invicto desde que ano?", "resumo": "Invicto desde", "max": 4, "caixa": "alta", "exemplo": "1995"}, {"chave": "papel", "rotulo": "Campeão mundial de…", "resumo": "Campeão de", "max": 10, "caixa": "alta", "opcoes": ["PAI", "AVÔ", "TIO", "PADRINHO", "SOGRO", "PADRASTO"]}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["pais", "avos-ele"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- O Letreiro (letreiro de cinema, conceito Bia & Caio) saiu da linha por decisão do Lucas
-- (10/11/2026). Onde ele já existir no banco, fica encerrado.
update public.designs set status = 'encerrado' where slug = 'letreiro';
