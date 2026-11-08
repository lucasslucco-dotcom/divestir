-- Catálogo inicial da Divestir: 5 peças, 3 cores e as 30 fotos de base.
-- São dados, não estrutura: rodar de novo é seguro (atualiza o que já existe).
-- As fotos ficam em public/catalogo/ com o nome peca-cor-lado.jpg.
-- Preço e área de impressão ainda estão em aberto no briefing, então ficam vazios.

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
