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
      {"tipo": "foto", "formato": "circulo", "x": 500, "y": 884, "raio": 399, "vaza_acima": 70},
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
