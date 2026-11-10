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

-- O Letreiro (letreiro de cinema, conceito Bia & Caio) saiu da linha por decisão do Lucas
-- (10/11/2026). Onde ele já existir no banco, fica encerrado.
update public.designs set status = 'encerrado' where slug = 'letreiro';
