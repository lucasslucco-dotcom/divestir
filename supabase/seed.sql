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
update public.pecas as p set area_impressao_cm = a.area
from (values
  ('camiseta-regular', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.205, "largura": 0.3}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.185, "largura": 0.31}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.215, "largura": 0.11}}}'::jsonb),
  ('camiseta-oversized', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.218, "largura": 0.326}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.177, "largura": 0.326}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.225, "largura": 0.11}}}'::jsonb),
  ('moletom', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.2, "largura": 0.31}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.185, "largura": 0.32}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.635, "topo": 0.225, "largura": 0.11}}}'::jsonb),
  ('moletom-capuz', '{"frente": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.305, "largura": 0.2}}, "costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.325, "largura": 0.36}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.655, "topo": 0.275, "largura": 0.1}}}'::jsonb),
  ('jaqueta-college', '{"costas": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.5, "topo": 0.17, "largura": 0.3}}, "peito": {"largura_cm": null, "altura_cm": null, "previa": {"x": 0.64, "topo": 0.23, "largura": 0.1}}}'::jsonb)
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
-- As artes fixas deles são geometria pura, desenhada pelo scripts/desenhar-artes.py.
-- "drop_entrada" liga o selo "Novo" nas duas primeiras semanas; rodar de novo não mexe nas datas.

-- Design Turnê Mundial: camiseta de turnê. "NOME" em arco, a foto solta sobre os raios,
-- a fita "Turnê Mundial {ano}" (o ano entra sozinho), as "datas" e o selo.
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('turne-mundial', 'Turnê Mundial', 'ativo', 2, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.6369,
    "posicao": "costas",
    "camadas": [
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/raios.svg", "x": 500, "topo": 312, "largura": 900, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 60, "largura_maxima": 940, "altura_no_centro": 232, "arco": 1, "compressao_maxima": 0.75, "curva": 60},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 302, "largura": 940, "altura": 743, "janela": {"largura": 940, "altura": 790, "y": 697}},
      {"tipo": "arte", "arquivo": "/designs/turne-mundial/fita.svg", "x": 500, "topo": 985, "largura": 940, "folga": 12},
      {"tipo": "texto", "texto": "TURNÊ MUNDIAL {ano}", "fonte": "titulo", "x": 500, "base": 1066, "largura": 650, "altura": 60, "espaco": 0.04, "vazado": true},
      {"tipo": "texto", "texto": "12 JAN · SALA DE ESTAR", "fonte": "titulo", "x": 105, "base": 1215, "largura": 410, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "texto", "texto": "08 FEV · ALMOÇO DE DOMINGO", "fonte": "titulo", "x": 105, "base": 1273, "largura": 410, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "texto", "texto": "21 MAR · CHURRASCO", "fonte": "titulo", "x": 105, "base": 1331, "largura": 410, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "texto", "texto": "30 ABR · SOFÁ", "fonte": "titulo", "x": 565, "base": 1215, "largura": 340, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "texto", "texto": "10 MAI · COZINHA", "fonte": "titulo", "x": 565, "base": 1273, "largura": 340, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "texto", "texto": "TODO DIA · MEU CORAÇÃO", "fonte": "titulo", "x": 565, "base": 1331, "largura": 340, "altura": 31, "espaco": 0.07, "alinhar": "esquerda"},
      {"tipo": "forma", "x": 500, "y": 1478, "largura": 440, "altura": 134, "raio": 12, "contorno": 7, "giro": {"graus": -5, "x": 500, "y": 1478}},
      {"tipo": "forma", "x": 500, "y": 1478, "largura": 410, "altura": 104, "raio": 6, "contorno": 2.5, "giro": {"graus": -5, "x": 500, "y": 1478}},
      {"tipo": "texto", "texto": "INGRESSOS", "fonte": "titulo", "x": 500, "base": 1469, "largura": 360, "altura": 33, "espaco": 0.14, "giro": {"graus": -5, "x": 500, "y": 1478}},
      {"tipo": "texto", "texto": "ESGOTADOS", "fonte": "titulo", "x": 500, "base": 1515, "largura": 360, "altura": 33, "espaco": 0.14, "giro": {"graus": -5, "x": 500, "y": 1478}}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 12, "caixa": "alta"}],
    "tintas": {"preto": "creme", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Ao Vivo: pôster de show. "NOME" grande, a foto solta sobre o círculo de pontos
-- e a faixa inclinada "Turnê {ano}".
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('ao-vivo', 'Ao Vivo', 'ativo', 3, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.6897,
    "posicao": "costas",
    "camadas": [
      {"tipo": "forma", "x": 150, "y": 62, "largura": 224, "altura": 70, "raio": 9, "contorno": 6},
      {"tipo": "texto", "texto": "AO VIVO", "fonte": "titulo", "x": 150, "base": 79, "largura": 180, "altura": 34, "espaco": 0.08},
      {"tipo": "arte", "arquivo": "/designs/ao-vivo/pontos.svg", "x": 500, "topo": 405, "largura": 850, "folga": 0},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 122, "largura_maxima": 960, "altura_no_centro": 340, "arco": 1.35, "compressao_maxima": 0.8, "folga": 9},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 398, "largura": 960, "altura": 787, "janela": {"largura": 960, "altura": 920, "y": 850}},
      {"tipo": "forma", "x": 500, "y": 1185, "largura": 920, "altura": 132, "giro": {"graus": -4, "x": 500, "y": 1185}},
      {"tipo": "texto", "texto": "TURNÊ {ano}", "fonte": "titulo", "x": 500, "base": 1228, "largura": 800, "altura": 86, "espaco": 0.03, "vazado": true, "giro": {"graus": -4, "x": 500, "y": 1185}},
      {"tipo": "texto", "texto": "SALA ★ SOFÁ ★ QUINTAL ★ PRAIA ★ MEU CORAÇÃO", "fonte": "titulo", "x": 500, "base": 1400, "largura": 900, "altura": 30, "espaco": 0.1}
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

-- Design Em Cartaz: pôster de cinema. A foto entra com o fundo original ("fundo"), o nome
-- passa por cima da borda dela e o cliente diz o ano ("desde").
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('em-cartaz', 'Em Cartaz', 'ativo', 4, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.5814,
    "posicao": "costas",
    "camadas": [
      {"tipo": "texto", "texto": "UMA HISTÓRIA DE AMOR", "fonte": "destaque", "x": 500, "base": 72, "largura": 840, "altura": 30, "espaco": 0.3},
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 110, "largura": 840, "altura": 1050, "fundo": true},
      {"tipo": "forma", "x": 500, "y": 635, "largura": 840, "altura": 1050, "contorno": 6},
      {"tipo": "nome", "campo": "nome", "fonte": "destaque", "x": 500, "topo": 1085, "largura_maxima": 780, "altura_no_centro": 150, "arco": 1, "compressao_maxima": 0.72, "folga": 14},
      {"tipo": "texto", "texto": "EM CARTAZ DESDE {desde}", "fonte": "destaque", "x": 500, "base": 1324, "largura": 840, "altura": 30, "espaco": 0.3},
      {"tipo": "arte", "arquivo": "/designs/em-cartaz/louros.svg", "x": 310, "topo": 1366, "largura": 300, "folga": 0},
      {"tipo": "arte", "arquivo": "/designs/em-cartaz/louros.svg", "x": 690, "topo": 1366, "largura": 300, "folga": 0},
      {"tipo": "texto", "texto": "SUCESSO", "fonte": "destaque", "x": 310, "base": 1464, "largura": 168, "altura": 21, "espaco": 0.08},
      {"tipo": "texto", "texto": "DE PÚBLICO", "fonte": "destaque", "x": 310, "base": 1498, "largura": 168, "altura": 21, "espaco": 0.08},
      {"tipo": "texto", "texto": "★★★★★", "fonte": "destaque", "x": 690, "base": 1464, "largura": 168, "altura": 21, "espaco": 0.2},
      {"tipo": "texto", "texto": "5 ESTRELAS", "fonte": "destaque", "x": 690, "base": 1498, "largura": 168, "altura": 21, "espaco": 0.08},
      {"tipo": "texto", "texto": "DIREÇÃO O DESTINO  ·  ROTEIRO A VIDA  ·  TRILHA SONORA MUITAS RISADAS", "fonte": "titulo", "x": 500, "base": 1652, "largura": 880, "altura": 23, "espaco": 0.1},
      {"tipo": "texto", "texto": "PRODUÇÃO MUITO AMOR  ·  ELENCO {nome}", "fonte": "titulo", "x": 500, "base": 1696, "largura": 880, "altura": 23, "espaco": 0.1}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 16, "caixa": "alta"}, {"chave": "desde", "rotulo": "Desde que ano?", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;

-- Design Letreiro: letreiro de cinema com o nome, a foto solta embaixo e o ano ("desde").
insert into public.designs (slug, nome, status, ordem, drop_entrada, config) values
  ('letreiro', 'Letreiro', 'ativo', 5, '2026-11-10', '{
    "versao": 1,
    "proporcao": 0.6757,
    "posicao": "costas",
    "camadas": [
      {"tipo": "foto", "formato": "quadro", "x": 500, "topo": 470, "largura": 960, "altura": 850, "janela": {"largura": 960, "altura": 900, "y": 920}},
      {"tipo": "arte", "arquivo": "/designs/letreiro/letreiro.svg", "x": 500, "topo": 30, "largura": 920, "folga": 0},
      {"tipo": "texto", "texto": "EM CARTAZ", "fonte": "titulo", "x": 500, "base": 280, "largura": 600, "altura": 40, "espaco": 0.16},
      {"tipo": "nome", "campo": "nome", "fonte": "titulo", "x": 500, "topo": 322, "largura_maxima": 700, "altura_no_centro": 94, "arco": 1, "compressao_maxima": 0.72},
      {"tipo": "texto", "texto": "★ ★   DESDE {desde}  ·  SESSÃO TODOS OS DIAS   ★ ★", "fonte": "titulo", "x": 500, "base": 1412, "largura": 900, "altura": 32, "espaco": 0.1}
    ],
    "campos": [{"chave": "nome", "rotulo": "Nome", "max": 16, "caixa": "alta"}, {"chave": "desde", "rotulo": "Desde que ano?", "max": 4, "caixa": "alta", "exemplo": "2019"}],
    "tintas": {"preto": "creme", "branco": "verde-escuro", "creme": "verde-escuro"},
    "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "moletom", "moletom-capuz", "jaqueta-college"],
    "logo_peito": true
  }'::jsonb)
on conflict (slug) do update set
  nome = excluded.nome,
  status = excluded.status,
  ordem = excluded.ordem,
  config = excluded.config;
