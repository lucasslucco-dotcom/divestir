-- Modelagem de cada peça (pedido do Lucas, 25/11/2026): a camiseta básica feminina e a
-- baby look são só femininas, a camiseta regular e a dry-fit são masculinas, e a
-- oversized, os moletons e a bomber servem para os dois. O montador pergunta a
-- modelagem antes de mostrar as peças e só mostra as que servem.

alter table public.pecas
  add column modelagem text not null default 'unissex'
  constraint pecas_modelagem_valida check (modelagem in ('unissex', 'masculina', 'feminina'));

comment on column public.pecas.modelagem is
  'Para quem a peça é cortada: unissex (aparece para os dois), masculina ou feminina.';
