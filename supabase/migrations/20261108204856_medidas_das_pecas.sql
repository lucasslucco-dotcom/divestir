-- Tabela de medidas de cada peça (briefing, "Catálogo de peças, cores e tamanhos":
-- tamanhos PP ao GGG, com tabela de medidas própria por modelo).
-- Fica vazia até as medidas chegarem do fornecedor. O montador só mostra a tabela
-- da peça que tiver medidas. A leitura pública já vem da regra das peças ativas.
alter table public.pecas
  add column medidas jsonb
  constraint pecas_medidas_objeto check (medidas is null or jsonb_typeof(medidas) = 'object');

comment on column public.pecas.medidas is
  'Tabela de medidas do modelo: {"unidade": "cm", "linhas": [{"nome": "Largura", "como_medir": "de uma axila à outra", "valores": {"PP": 48, "P": 50}}]}. Vazia até o fornecedor mandar as medidas.';
