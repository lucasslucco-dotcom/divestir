-- Catálogo da Divestir: 6 peças, 3 cores, as fotos de base, a área de impressão de
-- cada lado e os designs.
-- São dados, não estrutura: rodar de novo é seguro (atualiza o que já existe).
-- As fotos ficam em public/catalogo/ com o nome peca-cor-lado.jpg.
-- Preço ainda está em aberto no briefing, então fica vazio. Da área de impressão,
-- por enquanto só existe a posição na foto de base (previa); os centímetros chegam
-- quando a estamparia confirmar.

insert into public.pecas (slug, nome, caimento, ordem) values
  ('camiseta-regular', 'Camiseta', 'Regular', 1),
  ('camiseta-oversized', 'Camiseta', 'Oversized', 2),
  ('camiseta-dry-fit', 'Camiseta', 'Dry-fit', 3),
  ('moletom', 'Moletom', 'Sem capuz', 4),
  ('moletom-capuz', 'Moletom', 'Com capuz', 5),
  ('jaqueta-bomber', 'Jaqueta bomber', 'Só na cor preta', 6)
on conflict (slug) do update set
  nome = excluded.nome,
  caimento = excluded.caimento,
  ordem = excluded.ordem;

-- A jaqueta college saiu do catálogo e deu lugar à bomber (decisão do Lucas,
-- 10/11/2026). Num banco que já tinha a college, ela fica guardada, fora da loja, por
-- causa dos pedidos de teste feitos com ela.
update public.pecas set ativo = false where slug = 'jaqueta-college';

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
where (
    p.slug in ('camiseta-regular', 'camiseta-oversized', 'camiseta-dry-fit', 'moletom', 'moletom-capuz')
    and c.slug in ('preto', 'branco', 'creme')
  )
  -- A bomber só existe em preto: a cor que não tem foto não aparece para a peça.
  or (p.slug = 'jaqueta-bomber' and c.slug = 'preto')
on conflict (peca_id, cor_id, lado) do update set url = excluded.url;

-- Área de impressão de cada lado, em frações da foto de base: centro (x), topo e
-- largura (a altura sai da proporção do molde). O cliente escolhe frente ou costas;
-- a jaqueta bomber só tem costas, por causa do zíper (decisão do Lucas, 10/11/2026). "peito" é o lugar
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
  ('camiseta-dry-fit', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.205, "largura": 0.3}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.185, "largura": 0.31, "grande": {"largura": 0.4, "topo": 0.175}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.215, "largura": 0.11}}}'::jsonb),
  ('jaqueta-bomber', '{"costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.2, "largura": 0.3, "grande": {"largura": 0.38, "topo": 0.185}}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.645, "topo": 0.255, "largura": 0.1}}}'::jsonb)
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
  ('camiseta-dry-fit', '{"peso_kg": 0.2, "largura_cm": 25, "altura_cm": 4, "comprimento_cm": 30}'::jsonb),
  ('jaqueta-bomber', '{"peso_kg": 0.8, "largura_cm": 35, "altura_cm": 10, "comprimento_cm": 40}'::jsonb)
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Sua Majestade: retrato de realeza, estampa grande, para pets. A arte vem do Higgsfield
-- (a coroa, "Sua Majestade", a moldura oval com louros, a fita lisa com o ornamento e a linha de
-- baixo); o site põe o nome na letra de inscrição (Cinzel), a foto dentro do oval, com a cabeça
-- passando por cima da moldura, e o texto da fita, que o cliente escolhe: "Rainha da casa" ou
-- "Rei da casa".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('sua-majestade', 'Sua Majestade', 'ativo', 8, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.662,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/sua-majestade/coroa.svg", "x": 501.6, "topo": 1.6, "largura": 284.7, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/sua-majestade/titulo.svg", "x": 503.1, "topo": 197.8, "largura": 752.3, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/sua-majestade/moldura.svg", "x": 501.2, "topo": 478.0, "largura": 943.1, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "realeza", "x": 500, "topo": 258, "largura_maxima": 900, "altura_no_centro": 242, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1, "folga": 9, "acento_dentro": true},
      {"tipo": "foto", "formato": "circulo", "x": 496.5, "y": 836, "raio": 305, "raio_y": 319, "vaza_acima": 120, "janela": {"escala": 1.22, "desce": -6}},
      {"tipo": "arte", "arquivo": "/designs/sua-majestade/frente.svg", "x": 500.0, "topo": 1150.9, "largura": 996.9, "folga": 0, "base": "/designs/sua-majestade/frente-base.svg"},
      {"tipo": "nome", "campo": "titulo", "fonte": "cinema-forte", "x": 500, "topo": 1198, "largura_maxima": 640, "altura_no_centro": 56, "arco": 1, "compressao_maxima": 0.72, "curva": 41, "vazado": true},
      {"tipo": "arte", "arquivo": "/designs/sua-majestade/linha.svg", "x": 500.8, "topo": 1465.6, "largura": 956.4, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}, {"chave": "titulo", "rotulo": "Rainha ou rei?", "resumo": "Na fita", "max": 14, "caixa": "alta", "opcoes": ["RAINHA DA CASA", "REI DA CASA"]}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["pets"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Mapa Astral: carta celeste, estampa grande, para pets. A arte vem do Higgsfield (o arco
-- "O mapa astral de", a roda do zodíaco com a lua, o sol e as estrelas, e as três linhas de baixo);
-- o site põe o nome na letra com floreios (Cinzel Decorative) e a foto por cima da roda, cortada
-- embaixo pelo círculo de fora.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('mapa-astral', 'Mapa Astral', 'ativo', 9, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.664,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/mapa-astral/topo.svg", "x": 496.2, "topo": 4.2, "largura": 804.7, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/mapa-astral/roda.svg", "x": 499.8, "topo": 383.6, "largura": 996.6, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "astral", "x": 500, "topo": 116, "largura_maxima": 900, "altura_no_centro": 238, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1, "folga": 9, "acento_dentro": true},
      {"tipo": "foto", "formato": "circulo", "x": 492, "y": 852, "raio": 396, "vaza_acima": 120, "janela": {"escala": 0.9, "desce": 6}},
      {"tipo": "arte", "arquivo": "/designs/mapa-astral/linhas.svg", "x": 496.7, "topo": 1333.1, "largura": 882.5, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["pets"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design O Brabo: camiseta de rua, estampa grande, para pets. A arte vem do Higgsfield (os traços
-- dos blocos, a fita "Late mas não morde" e a corrente); o site põe o nome enorme na letra gótica
-- (Grenze Gotisch), em arco, a foto e os dois blocos de texto: "O brabo da rua" ou "A braba da
-- rua", que o cliente escolhe, e "Desde {ano}".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('o-brabo', 'O Brabo', 'ativo', 10, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.732,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "nome", "campo": "nome", "fonte": "gotica", "x": 500, "topo": 8, "largura_maxima": 960, "altura_no_centro": 415, "arco": 1, "compressao_maxima": 0.55, "expansao_maxima": 1.25, "curva": 70, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 250, "largura": 780, "altura": 900, "janela": {"largura": 800, "altura": 900, "y": 730}},
      {"tipo": "arte", "arquivo": "/designs/o-brabo/tracos.svg", "x": 500.2, "topo": 725.8, "largura": 815.8, "folga": 7},
      {"tipo": "texto", "texto": "{papel}", "fonte": "titulo", "x": 168, "base": 832, "largura": 250, "altura": 68, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "DA RUA", "fonte": "titulo", "x": 168, "base": 922, "largura": 250, "altura": 68, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "DESDE", "fonte": "titulo", "x": 832.7, "base": 832, "largura": 250, "altura": 68, "espaco": 0.02, "folga": 7},
      {"tipo": "texto", "texto": "{desde}", "fonte": "titulo", "x": 832.7, "base": 922, "largura": 250, "altura": 68, "espaco": 0.02, "folga": 7},
      {"tipo": "arte", "arquivo": "/designs/o-brabo/frente.svg", "x": 500.3, "topo": 1049.1, "largura": 997.0, "folga": 0, "base": "/designs/o-brabo/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/o-brabo/corrente.svg", "x": 499.9, "topo": 1305.9, "largura": 964.9, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 8, "caixa": "alta"}, {"chave": "papel", "rotulo": "O brabo ou a braba?", "resumo": "Apelido", "max": 8, "caixa": "alta", "opcoes": ["O BRABO", "A BRABA"]}, {"chave": "desde", "rotulo": "Desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["pets"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Grandes Sucessos: capa de disco, estampa grande, para mães e avós. A arte vem do
-- Higgsfield (as réguas com "Grandes Sucessos", o disco de vinil, as seis faixas, que são as
-- frases de mãe, e a barra "Edição de colecionador ★ Volume único"); o site põe o nome enorme
-- na letra de pôster (Anton, engrossada) e a foto solta por cima do disco.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('grandes-sucessos', 'Grandes Sucessos', 'ativo', 11, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.775,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/grandes-sucessos/titulo.svg", "x": 500.2, "topo": 379.4, "largura": 950.9, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/grandes-sucessos/disco.svg", "x": 500, "topo": 478, "largura": 600, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 58, "largura_maxima": 950, "altura_no_centro": 312, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.15, "engrossa": 5},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 486, "largura": 1000, "altura": 706, "janela": {"largura": 1000, "altura": 900, "y": 905}},
      {"tipo": "arte", "arquivo": "/designs/grandes-sucessos/faixas-esquerda.svg", "x": 97.3, "topo": 593.5, "largura": 188.2, "folga": 7},
      {"tipo": "arte", "arquivo": "/designs/grandes-sucessos/faixas-direita.svg", "x": 896.3, "topo": 583.7, "largura": 207.3, "folga": 7},
      {"tipo": "arte", "arquivo": "/designs/grandes-sucessos/frente.svg", "x": 500, "topo": 1188.9, "largura": 1000, "folga": 0, "base": "/designs/grandes-sucessos/frente-base.svg"}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["maes", "avos-ela"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Melhor Mãe: prêmio de festival de cinema, estampa grande, para mães. A arte vem do
-- Higgsfield (os louros, "Vencedora · Melhor mãe · Do mundo" e as estrelas); o site põe o nome
-- na letra de cinema (Bodoni Moda 900, estreitada), com a base em arco, a foto grande e as
-- duas linhas de baixo: "Por unanimidade · Júri: {os filhos, a filha, o filho, as filhas}", que
-- o cliente escolhe, e "Todos os anos desde {ano}".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('melhor-mae', 'Melhor Mãe', 'ativo', 12, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.667,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/melhor-mae/topo.svg", "x": 500, "topo": 0, "largura": 880, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "cinema-preta", "x": 500, "topo": 350, "largura_maxima": 1000, "altura_no_centro": 268, "arco": 1.38, "compressao_maxima": 0.5, "expansao_maxima": 1, "engrossa": 4, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 430, "largura": 1000, "altura": 950, "janela": {"largura": 1120, "altura": 1120, "y": 1060}},
      {"tipo": "forma", "x": 500, "y": 1385, "largura": 940, "altura": 5},
      {"tipo": "texto", "texto": "POR UNANIMIDADE · JÚRI: {juri}", "fonte": "cinema", "x": 500, "base": 1436, "largura": 940, "altura": 28, "espaco": 0.28},
      {"tipo": "texto", "texto": "TODOS OS ANOS DESDE {desde}", "fonte": "cinema-forte", "x": 500, "base": 1492, "largura": 940, "altura": 31, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}, {"chave": "juri", "rotulo": "Quem é o júri?", "resumo": "Júri", "max": 9, "caixa": "alta", "opcoes": ["OS FILHOS", "A FILHA", "O FILHO", "AS FILHAS"]}, {"chave": "desde", "rotulo": "Mãe desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "1995"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["maes"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Capa de Revista: capa de revista de moda, estampa grande, para mães. A arte vem do
-- Higgsfield (a linha "Edição especial · Nº 1", o nome da revista, "Mãe", as chamadas de capa
-- "Ela tinha razão (de novo)" e "Colo aberto 24 horas", e a frase "a mulher da minha vida");
-- o site põe a foto por cima do nome da revista, a régua e o nome embaixo (Anton, alargada).
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('capa-de-revista', 'Capa de Revista', 'ativo', 13, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.73,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/capa-de-revista/topo.svg", "x": 500, "topo": 0, "largura": 760, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/capa-de-revista/titulo.svg", "x": 500, "topo": 48, "largura": 960, "folga": 0},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 250, "largura": 1000, "altura": 812, "janela": {"largura": 1060, "altura": 1000, "y": 812}},
      {"tipo": "arte", "arquivo": "/designs/capa-de-revista/chamadas.svg", "x": 500, "topo": 570, "largura": 1000, "folga": 7},
      {"tipo": "forma", "x": 500, "y": 1065, "largura": 940, "altura": 5},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 1088, "largura_maxima": 940, "altura_no_centro": 205, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.45, "acento_dentro": true},
      {"tipo": "arte", "arquivo": "/designs/capa-de-revista/frase.svg", "x": 500, "topo": 1305, "largura": 780, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["maes"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Figurinha Rara: figurinha de álbum, estampa grande, para amigas. A arte vem do
-- Higgsfield (a faixa "★ Figurinha rara ★", a moldura do cartão com os raios, o selo "Nº 01", a
-- tabela das notas, "Fofoca 99, Conselho 100, Pontualidade 12, Parceria 100", e a linha "Edição
-- limitada · Não tem repetida"); o site põe o nome enorme (Anton, alargada e engrossada) entre a
-- faixa e o cartão, e a foto dentro do cartão, com a cabeça passando por cima do nome.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('figurinha-rara', 'Figurinha Rara', 'ativo', 14, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.623,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/figurinha-rara/faixa.svg", "x": 500.2, "topo": 0, "largura": 936.2, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/figurinha-rara/cartao.svg", "x": 499.6, "topo": 519.7, "largura": 989.0, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 126, "largura_maxima": 980, "altura_no_centro": 388, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 2, "engrossa": 4, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 300, "largura": 930, "altura": 846, "janela": {"largura": 1150, "altura": 1500, "y": 1085}},
      {"tipo": "arte", "arquivo": "/designs/figurinha-rara/frente.svg", "x": 861.5, "topo": 492.3, "largura": 193.3, "folga": 0, "base": "/designs/figurinha-rara/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/figurinha-rara/linha.svg", "x": 500.4, "topo": 1540.0, "largura": 987.5, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigas"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Tocando Agora: tela de player de música, estampa grande, para amigas. A arte vem
-- do Higgsfield (a linha "Tocando agora", a capa de cantos redondos com as ondas, o título "Áudio de 7
-- minutos", a barra do tempo e os botões); o site põe a foto dentro da capa, com os cantos de baixo
-- redondos e a cabeça passando por cima da moldura, o nome (Anton, alargada) e a linha "No repete
-- desde {ano}", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('tocando-agora', 'Tocando Agora', 'ativo', 15, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.621,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/tocando-agora/topo.svg", "x": 500, "topo": 0, "largura": 874.0, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/tocando-agora/moldura.svg", "x": 500, "topo": 98.0, "largura": 851.2, "folga": 0},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 36, "largura": 805.4, "altura": 805, "canto_de_baixo": 108, "janela": {"largura": 1150, "altura": 1500, "y": 760}},
      {"tipo": "arte", "arquivo": "/designs/tocando-agora/titulo.svg", "x": 500, "topo": 868, "largura": 985, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 1012, "largura_maxima": 985, "altura_no_centro": 262, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.5, "engrossa": 3, "acento_dentro": true},
      {"tipo": "arte", "arquivo": "/designs/tocando-agora/controles.svg", "x": 500, "topo": 1306, "largura": 985, "folga": 0},
      {"tipo": "texto", "texto": "NO REPETE DESDE {desde}", "fonte": "texto", "x": 500, "base": 1596, "largura": 960, "altura": 27, "espaco": 0.42}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}, {"chave": "desde", "rotulo": "Amigas desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2012"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigas"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Alto Em: os rótulos de advertência das embalagens, estampa grande, para amigas. A
-- arte vem do Higgsfield (a linha "Advertência", o disco de pontos, os três rótulos de lupa, "Alto em
-- fofoca", "Alto em drama" e "Alto em parceria", e a linha "Contém amiga de verdade"); o site põe o
-- nome enorme na letra geométrica de embalagem (Poppins Black) e a foto por cima do disco.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('alto-em', 'Alto Em', 'ativo', 16, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.757,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/alto-em/topo.svg", "x": 500, "topo": 0, "largura": 690, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/alto-em/disco.svg", "x": 500, "topo": 342, "largura": 882, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "geometrica", "x": 500, "topo": 62, "largura_maxima": 820, "altura_no_centro": 352, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.85, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 150, "largura": 1000, "altura": 944, "janela": {"largura": 1000, "altura": 1400, "y": 960}},
      {"tipo": "arte", "arquivo": "/designs/alto-em/frente.svg", "x": 500, "topo": 1100, "largura": 998.5, "folga": 0, "base": "/designs/alto-em/frente-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/alto-em/linha.svg", "x": 500, "topo": 1282, "largura": 956.3, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigas"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Grande Prêmio: pôster de corrida, estampa grande, para amigos. A arte vem do Higgsfield
-- (as bandeiras quadriculadas, "Grande Prêmio da Resenha", o círculo com as faixas de
-- velocidade, o selo "10", a faixa "Pole position na piada ruim", a fita quadriculada e a linha
-- "Piloto oficial do rolê · Temporada 2026"); o site põe o nome enorme e inclinado (Anton,
-- engrossada), com o rastro de velocidade saindo da primeira letra, e a foto na frente do círculo.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('grande-premio', 'Grande Prêmio', 'ativo', 17, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.661,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/grande-premio/bandeiras.svg", "x": 500, "topo": 0, "largura": 300, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/grande-premio/titulo.svg", "x": 500, "topo": 146, "largura": 900, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/grande-premio/circulo.svg", "x": 488.4, "topo": 527.0, "largura": 738.0, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 240, "largura_maxima": 990, "altura_no_centro": 285, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.6, "engrossa": 4, "acento_dentro": true, "inclina": 0.32, "rastro": {"arquivo": "/designs/grande-premio/rastro.svg", "proporcao": 0.805, "respiro": 8}},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 300, "largura": 1000, "altura": 1035, "janela": {"largura": 1100, "altura": 1100, "y": 960}},
      {"tipo": "arte", "arquivo": "/designs/grande-premio/selo.svg", "x": 814.7, "topo": 658.3, "largura": 287.1, "folga": 0, "base": "/designs/grande-premio/selo-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/grande-premio/faixa.svg", "x": 502.3, "topo": 1273.5, "largura": 998.5, "folga": 0, "base": "/designs/grande-premio/faixa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/grande-premio/base.svg", "x": 504.8, "topo": 1407.9, "largura": 993.4, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Mestre da Brasa: emblema de churrasqueiro, estampa grande, para amigos. A arte vem do
-- Higgsfield (o arco "Mestre da Brasa" com as chamas, o emblema com os garfos cruzados, a fita
-- "Churrasqueiro oficial" e a linha "Carne no ponto ★ Cerveja gelada ★ Resenha garantida"); o
-- site põe o nome na letra de placa (Alfa Slab One), a foto na frente do emblema e a linha
-- "No comando da grelha desde {ano}", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('mestre-da-brasa', 'Mestre da Brasa', 'ativo', 18, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.635,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/mestre-da-brasa/topo.svg", "x": 500, "topo": 2.7, "largura": 893.1, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/mestre-da-brasa/emblema.svg", "x": 498.7, "topo": 450.0, "largura": 857.3, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "bloco", "x": 500, "topo": 212, "largura_maxima": 880, "altura_no_centro": 235, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.15, "engrossa": 2},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 280, "largura": 1000, "altura": 1050, "janela": {"largura": 1100, "altura": 1150, "y": 930}},
      {"tipo": "arte", "arquivo": "/designs/mestre-da-brasa/fita.svg", "x": 500, "topo": 1241.6, "largura": 996.2, "folga": 0, "base": "/designs/mestre-da-brasa/fita-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/mestre-da-brasa/linha.svg", "x": 498.3, "topo": 1447.0, "largura": 980.4, "folga": 0},
      {"tipo": "texto", "texto": "NO COMANDO DA GRELHA DESDE {desde}", "fonte": "texto", "x": 500, "base": 1562, "largura": 960, "altura": 27, "espaco": 0.36}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta"}, {"chave": "desde", "rotulo": "Na grelha desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2005"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["amigos", "pais", "avos-ele", "irmaos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Destino: GPS, estampa grande, para casal. A arte vem do Higgsfield ("Rota finalizada", o
-- mapa com a rota tracejada, o alfinete com o coração, a faixa "Você chegou ao seu destino" e
-- "Tempo de viagem: pra sempre"); o site põe o nome do casal (Poppins Black, engrossada), a foto um
-- pouco à esquerda, com o alfinete na frente dela, e a linha "Juntos desde {ano} · Sem recalcular a
-- rota", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('destino', 'Destino', 'ativo', 20, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.707,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/destino/topo.svg", "x": 499.2, "topo": 3.4, "largura": 884.3, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/destino/mapa.svg", "x": 500.4, "topo": 363.8, "largura": 964.2, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "geometrica", "x": 500, "topo": 100, "largura_maxima": 985, "altura_no_centro": 255, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.3, "engrossa": 4, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 440, "topo": 230, "largura": 1120, "altura": 975, "janela": {"largura": 900, "altura": 1000, "y": 790}},
      {"tipo": "arte", "arquivo": "/designs/destino/pino.svg", "x": 768.8, "topo": 358.8, "largura": 218.0, "folga": 0, "base": "/designs/destino/pino-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/destino/faixa.svg", "x": 500.6, "topo": 1135.8, "largura": 995.1, "folga": 0, "base": "/designs/destino/faixa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/destino/linha.svg", "x": 499.6, "topo": 1286.5, "largura": 882.8, "folga": 0},
      {"tipo": "texto", "texto": "JUNTOS DESDE {desde} · SEM RECALCULAR A ROTA", "fonte": "texto", "x": 500, "base": 1400, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 20, "caixa": "alta"}, {"chave": "desde", "rotulo": "Juntos desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["casal"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Previsão do Tempo: aplicativo de clima, estampa grande, para casal. A arte vem do Higgsfield
-- ("Previsão do tempo", o sol com a nuvem, a faixa "100% de chance de grude" e a semana com um
-- coração por dia); o site põe o nome do casal na letra gorda de cantos redondos (Lilita One), a foto
-- na frente do sol e a linha "Sensação térmica: quentinho · Desde {ano}", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('previsao-do-tempo', 'Previsão do Tempo', 'ativo', 21, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.677,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/previsao-do-tempo/topo.svg", "x": 500.6, "topo": 8.5, "largura": 883.5, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/previsao-do-tempo/sol.svg", "x": 507.7, "topo": 334.2, "largura": 883.8, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "redonda", "x": 500, "topo": 80, "largura_maxima": 985, "altura_no_centro": 245, "arco": 1.1, "compressao_maxima": 0.5, "expansao_maxima": 1.4, "engrossa": 5, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 230, "largura": 1000, "altura": 940, "janela": {"largura": 1050, "altura": 950, "y": 770}},
      {"tipo": "arte", "arquivo": "/designs/previsao-do-tempo/faixa.svg", "x": 499.8, "topo": 1106.9, "largura": 996.5, "folga": 0, "base": "/designs/previsao-do-tempo/faixa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/previsao-do-tempo/semana.svg", "x": 501.0, "topo": 1271.2, "largura": 909.6, "folga": 0},
      {"tipo": "texto", "texto": "SENSAÇÃO TÉRMICA: QUENTINHO · DESDE {desde}", "fonte": "texto", "x": 500, "base": 1462, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 20, "caixa": "alta"}, {"chave": "desde", "rotulo": "Juntos desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["casal"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Conexão Surreal: rede de Wi-Fi, estampa grande, para casal. A arte vem do Higgsfield ("Rede
-- disponível", o símbolo de Wi-Fi gigante, a faixa "Conexão surreal" e a linha "Sinal cheio | Senha:
-- só a gente sabe"); o site põe o nome do casal em Anton, com a base em arco, a foto na frente do
-- Wi-Fi e a linha "Conectados automaticamente desde {ano}", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('conexao-surreal', 'Conexão Surreal', 'ativo', 22, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.678,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/conexao-surreal/topo.svg", "x": 502.9, "topo": 0, "largura": 741.8, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/conexao-surreal/wifi.svg", "x": 499.2, "topo": 379.3, "largura": 986.8, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 62, "largura_maxima": 985, "altura_no_centro": 270, "arco": 1.3, "compressao_maxima": 0.5, "expansao_maxima": 1.5, "engrossa": 3, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 240, "largura": 1000, "altura": 990, "janela": {"largura": 1050, "altura": 1000, "y": 800}},
      {"tipo": "arte", "arquivo": "/designs/conexao-surreal/faixa.svg", "x": 500.2, "topo": 1148.7, "largura": 994.2, "folga": 0, "base": "/designs/conexao-surreal/faixa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/conexao-surreal/linha.svg", "x": 502.1, "topo": 1326.9, "largura": 942.2, "folga": 0},
      {"tipo": "texto", "texto": "CONECTADOS AUTOMATICAMENTE DESDE {desde}", "fonte": "texto", "x": 500, "base": 1458, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 20, "caixa": "alta"}, {"chave": "desde", "rotulo": "Juntos desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["casal"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Modo Casal: fliperama em pixel, estampa grande, para casal. A arte vem do Higgsfield (a
-- moldura de pixel com "Player 1 + Player 2", o coração de pixels, a barra "Modo casal: ativado" e
-- a linha "Vidas ♥♥♥ · Fase: pra sempre"); o site põe o nome do casal na letra de pixel (Handjet
-- Black), a foto na frente do coração e a linha "Jogando juntos desde {ano} · Continue? Sempre".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('modo-casal', 'Modo Casal', 'ativo', 19, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.679,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/modo-casal/moldura.svg", "x": 499.8, "topo": 0, "largura": 999.6, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "pixel", "x": 500, "topo": 100, "largura_maxima": 900, "altura_no_centro": 235, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.9, "engrossa": 3, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 240, "largura": 1000, "altura": 930, "janela": {"largura": 1050, "altura": 950, "y": 770}},
      {"tipo": "arte", "arquivo": "/designs/modo-casal/barra.svg", "x": 499.8, "topo": 1108.7, "largura": 984.7, "folga": 0, "base": "/designs/modo-casal/barra-base.svg"},
      {"tipo": "texto", "texto": "JOGANDO JUNTOS DESDE {desde} · CONTINUE? SEMPRE", "fonte": "pixel", "x": 500, "base": 1397, "largura": 880, "altura": 27, "espaco": 0.12}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 20, "caixa": "alta"}, {"chave": "desde", "rotulo": "Juntos desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["casal"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Obra-Prima: quadro de museu, estampa grande, para filhos (quem veste é o pai, a mãe, a avó...). A
-- arte vem do Higgsfield ("Minha obra-prima", a moldura de museu, a placa "Valor incalculável" e a linha
-- "Técnica: amor e noites sem dormir"); o site põe o nome na letra de cinema (Bodoni Moda 900), a foto
-- dentro da moldura, com a cabeça passando por cima da borda, e a linha "Acervo da família · Desde {ano}".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('obra-prima', 'Obra-Prima', 'ativo', 23, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.66,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/obra-prima/topo.svg", "x": 499.8, "topo": 0.4, "largura": 890.1, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/obra-prima/moldura.svg", "x": 497.7, "topo": 345, "largura": 983.2, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "cinema-preta", "x": 500, "topo": 78, "largura_maxima": 970, "altura_no_centro": 258, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.25, "engrossa": 3, "folga": 9, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 499.2, "topo": 420, "largura": 747, "altura": 710, "janela": {"largura": 820, "altura": 1000, "y": 905}},
      {"tipo": "arte", "arquivo": "/designs/obra-prima/placa.svg", "x": 499.8, "topo": 1234.9, "largura": 994.3, "folga": 0, "base": "/designs/obra-prima/placa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/obra-prima/linha.svg", "x": 500.0, "topo": 1401.9, "largura": 933.4, "folga": 0},
      {"tipo": "texto", "texto": "ACERVO DA FAMÍLIA · DESDE {desde}", "fonte": "cinema-forte", "x": 500, "base": 1501, "largura": 930, "altura": 27, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 14, "caixa": "alta"}, {"chave": "desde", "rotulo": "Nasceu em que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["filhos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Família Coruja: a coruja de asas abertas, estampa grande, para filhos. A arte vem do Higgsfield
-- (o arco "Com muito orgulho", a coruja e a fita lisa); o site põe o nome na letra de placa (Alfa Slab
-- One), a foto na frente da coruja, o texto da fita, que o cliente escolhe ("Mãe coruja", "Pai coruja",
-- "Vó coruja", "Vô coruja", "Tia", "Tio", "Dinda" ou "Dindo"), e a linha "Corujando desde {ano} · Não
-- tem cura", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('familia-coruja', 'Família Coruja', 'ativo', 24, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.672,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/familia-coruja/topo.svg", "x": 499.8, "topo": 0.4, "largura": 878.0, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/familia-coruja/coruja.svg", "x": 500.0, "topo": 338, "largura": 993.8, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "bloco", "x": 500, "topo": 128, "largura_maxima": 900, "altura_no_centro": 212, "arco": 1, "compressao_maxima": 0.5, "expansao_maxima": 1.2, "engrossa": 2, "folga": 9, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 420, "largura": 790, "altura": 802, "janela": {"largura": 780, "altura": 1000, "y": 1030}},
      {"tipo": "arte", "arquivo": "/designs/familia-coruja/fita.svg", "x": 499.2, "topo": 1157.5, "largura": 985.3, "folga": 0, "base": "/designs/familia-coruja/fita-base.svg"},
      {"tipo": "nome", "campo": "titulo", "fonte": "bloco", "x": 500, "topo": 1250, "largura_maxima": 640, "altura_no_centro": 98, "arco": 1, "compressao_maxima": 0.55, "curva": -14, "vazado": true, "acento_dentro": true},
      {"tipo": "texto", "texto": "CORUJANDO DESDE {desde} · NÃO TEM CURA", "fonte": "texto", "x": 500, "base": 1463, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 14, "caixa": "alta"}, {"chave": "titulo", "rotulo": "Quem é coruja?", "resumo": "Na fita", "max": 12, "caixa": "alta", "opcoes": ["MÃE CORUJA", "PAI CORUJA", "VÓ CORUJA", "VÔ CORUJA", "TIA CORUJA", "TIO CORUJA", "DINDA CORUJA", "DINDO CORUJA"]}, {"chave": "desde", "rotulo": "Nasceu em que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["filhos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Chefe da Casa: crachá, estampa grande, para filhos. A arte vem do Higgsfield (o cordão do
-- crachá, "Quem manda aqui", o crachá com as listras, a faixa "Chefe da casa" e a linha "Cargo: dono de
-- tudo | Expediente: 24 horas"); o site põe o nome enorme (Anton, alargada), com a base em arco, a foto
-- na frente do crachá e a linha "No comando desde {ano} · Equipe: a família inteira", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('chefe-da-casa', 'Chefe da Casa', 'ativo', 25, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.609,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/chefe-da-casa/cordao.svg", "x": 500.0, "topo": 0, "largura": 200, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/chefe-da-casa/frase.svg", "x": 497.2, "topo": 195, "largura": 888.8, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/chefe-da-casa/cracha.svg", "x": 500.2, "topo": 540, "largura": 993.5, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 288, "largura_maxima": 985, "altura_no_centro": 280, "arco": 1.15, "compressao_maxima": 0.5, "expansao_maxima": 1.9, "engrossa": 4, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 470, "largura": 1000, "altura": 840, "janela": {"largura": 900, "altura": 1000, "y": 990}},
      {"tipo": "arte", "arquivo": "/designs/chefe-da-casa/faixa.svg", "x": 500.2, "topo": 1302.1, "largura": 993.5, "folga": 0, "base": "/designs/chefe-da-casa/faixa-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/chefe-da-casa/linha.svg", "x": 502.6, "topo": 1526.3, "largura": 912.6, "folga": 0},
      {"tipo": "texto", "texto": "NO COMANDO DESDE {desde} · EQUIPE: A FAMÍLIA INTEIRA", "fonte": "texto", "x": 500, "base": 1633, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 14, "caixa": "alta"}, {"chave": "desde", "rotulo": "Nasceu em que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["filhos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Centro do Universo: órbitas e planetas, estampa grande, para filhos. A arte vem do Higgsfield
-- ("O mundo gira em torno de", as órbitas com os planetas, a lua e as estrelas, e a faixa "Centro do meu
-- universo"); o site põe o nome enorme (Anton, alargada), com a base em arco, a foto na frente das
-- órbitas e a linha "Em órbita desde {ano} · Amor infinito", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('centro-do-universo', 'Centro do Universo', 'ativo', 26, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.757,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/centro-do-universo/topo.svg", "x": 500.2, "topo": 2.5, "largura": 882.1, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/centro-do-universo/orbitas.svg", "x": 489.5, "topo": 440, "largura": 980.7, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 78, "largura_maxima": 985, "altura_no_centro": 300, "arco": 1.2, "compressao_maxima": 0.5, "expansao_maxima": 1.7, "engrossa": 4, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 300, "largura": 1000, "altura": 812, "janela": {"largura": 980, "altura": 1020, "y": 815}},
      {"tipo": "arte", "arquivo": "/designs/centro-do-universo/faixa.svg", "x": 500.0, "topo": 1100, "largura": 993.4, "folga": 0, "base": "/designs/centro-do-universo/faixa-base.svg"},
      {"tipo": "texto", "texto": "EM ÓRBITA DESDE {desde} · AMOR INFINITO", "fonte": "texto", "x": 500, "base": 1304, "largura": 960, "altura": 26, "espaco": 0.3}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 14, "caixa": "alta"}, {"chave": "desde", "rotulo": "Nasceu em que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["filhos"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Mãe com Açúcar: rótulo de doce antigo, estampa grande, para avós. A arte vem do Higgsfield
-- ("Receita original", o selo oval de borda ondulada com os raios, a fita "Mãe com açúcar" e a linha
-- "Extra doce · Sem contraindicação"); o site põe o nome na letra gorda de rótulo de doce (Bagel Fat
-- One), a foto na frente do selo e a linha "Adoçando a vida desde {ano}", em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('mae-com-acucar', 'Mãe com Açúcar', 'ativo', 27, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.669,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/mae-com-acucar/topo.svg", "x": 500.9, "topo": 20.7, "largura": 808.1, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/mae-com-acucar/selo.svg", "x": 497.0, "topo": 416.9, "largura": 923.1, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "doce", "x": 500, "topo": 96, "largura_maxima": 900, "altura_no_centro": 365, "arco": 1.08, "compressao_maxima": 0.5, "expansao_maxima": 1.2, "engrossa": 4, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 250, "largura": 800, "altura": 985, "janela": {"largura": 840, "altura": 1000, "y": 870}},
      {"tipo": "arte", "arquivo": "/designs/mae-com-acucar/fita.svg", "x": 500.2, "topo": 1125.0, "largura": 994.3, "folga": 0, "base": "/designs/mae-com-acucar/fita-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/mae-com-acucar/linha.svg", "x": 499.8, "topo": 1390, "largura": 862.4, "folga": 0},
      {"tipo": "texto", "texto": "ADOÇANDO A VIDA DESDE {desde}", "fonte": "texto", "x": 500, "base": 1481, "largura": 900, "altura": 24, "espaco": 0.42}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}, {"chave": "desde", "rotulo": "Desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "1998"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["avos-ela"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Cinco Estrelas: avaliação de restaurante, estampa grande, para avós. A arte vem do Higgsfield
-- ("Avaliação dos netos", as cinco estrelas em arco com o selo "5,0", o balão "Comi três vezes e ainda
-- levei pote" e a linha "Cozinha afetiva · Porção: sempre mais um pouquinho"); o site põe o nome enorme
-- (Anton, alargada), com a base em arco, e a foto na frente das estrelas. Não pede o ano.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('cinco-estrelas', 'Cinco Estrelas', 'ativo', 28, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.67,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/cinco-estrelas/topo.svg", "x": 501.9, "topo": 18.4, "largura": 822.3, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/cinco-estrelas/estrelas.svg", "x": 539.9, "topo": 430.8, "largura": 839.6, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 96, "largura_maxima": 880, "altura_no_centro": 350, "arco": 1.22, "compressao_maxima": 0.5, "expansao_maxima": 1.6, "engrossa": 4, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 330, "largura": 940, "altura": 976, "janela": {"largura": 900, "altura": 1080, "y": 976}},
      {"tipo": "arte", "arquivo": "/designs/cinco-estrelas/balao.svg", "x": 499.6, "topo": 1216.5, "largura": 994.0, "folga": 0, "base": "/designs/cinco-estrelas/balao-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/cinco-estrelas/linha.svg", "x": 497.0, "topo": 1440, "largura": 908.9, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["avos-ela"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Feita à Mão: toalhinha de crochê, estampa grande, para avós. A arte vem do Higgsfield ("Feita
-- à mão", a toalhinha, a etiqueta costurada "Colo sob medida" e a linha "Modo de usar: abraçar sem
-- moderação"); o site põe o nome na letra de cinema (Bodoni Moda 900, estreitada), com a base em arco
-- forte, acompanhando a toalhinha, e a foto na frente dela. Não pede o ano.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('feita-a-mao', 'Feita à Mão', 'ativo', 29, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.648,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/feita-a-mao/topo.svg", "x": 500.0, "topo": 17.2, "largura": 682.6, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/feita-a-mao/toalha.svg", "x": 501.2, "topo": 345, "largura": 940, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "cinema-preta", "x": 500, "topo": 100, "largura_maxima": 900, "altura_no_centro": 255, "arco": 1.65, "compressao_maxima": 0.5, "expansao_maxima": 1.15, "engrossa": 1, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 360, "largura": 900, "altura": 990, "janela": {"largura": 860, "altura": 1080, "y": 971}},
      {"tipo": "arte", "arquivo": "/designs/feita-a-mao/etiqueta.svg", "x": 500.0, "topo": 1280, "largura": 993.7, "folga": 0, "base": "/designs/feita-a-mao/etiqueta-base.svg"},
      {"tipo": "arte", "arquivo": "/designs/feita-a-mao/linha.svg", "x": 500.4, "topo": 1484.5, "largura": 941.4, "folga": 0}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["avos-ela"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Casa da Vó: a casinha, estampa grande, para avós. A arte vem do Higgsfield ("Bem-vindo à casa
-- da", a casinha com a fumaça em coração e a faixa "Aqui pode tudo"); o site põe o nome na letra gorda
-- de cantos redondos (Lilita One), a foto na frente da casinha e a linha "Porta aberta desde {ano}",
-- em Inter.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('casa-da-vo', 'Casa da Vó', 'ativo', 30, '2026-11-11', '{
    "versao": 1,
    "proporcao": 0.668,
    "posicao": "costas",
    "tamanho": "grande",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/casa-da-vo/topo.svg", "x": 500.8, "topo": 18.0, "largura": 906.4, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/casa-da-vo/casa.svg", "x": 509.0, "topo": 446.5, "largura": 893.7, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "redonda", "x": 500, "topo": 105, "largura_maxima": 930, "altura_no_centro": 330, "arco": 1.06, "compressao_maxima": 0.5, "expansao_maxima": 1.25, "engrossa": 4, "folga": 10, "acento_dentro": true},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 380, "largura": 1000, "altura": 958, "janela": {"largura": 980, "altura": 980, "y": 1010}},
      {"tipo": "arte", "arquivo": "/designs/casa-da-vo/faixa.svg", "x": 500.0, "topo": 1262.3, "largura": 993.9, "folga": 0, "base": "/designs/casa-da-vo/faixa-base.svg"},
      {"tipo": "texto", "texto": "PORTA ABERTA DESDE {desde}", "fonte": "texto", "x": 500, "base": 1484, "largura": 900, "altura": 24, "espaco": 0.42}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}, {"chave": "desde", "rotulo": "Desde que ano?", "resumo": "Desde", "max": 4, "caixa": "alta", "exemplo": "1998"}],
    "tintas": {"preto": "creme-quente", "branco": "verde-escuro", "creme": "verde-escuro"},
    "temas": ["avos-ela"],
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"],
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
