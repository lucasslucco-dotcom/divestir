-- Etapa 6 (carrinho e checkout): o que o pedido precisa guardar além do que já
-- existia desde a Etapa 1, o pacote de envio de cada peça (para cotar o frete) e as
-- duas rotinas que o servidor do site usa para criar o pedido e registrar o
-- pagamento. Pedidos e itens continuam só para a equipe (RLS): o site mexe neles
-- pelo servidor, com a chave secreta (service_role).

-- Pedido -----------------------------------------------------------------
alter table public.pedidos
  add column cpf text constraint pedidos_cpf_digitos check (cpf ~ '^[0-9]{11}$'),
  add column subtotal numeric(10, 2) not null default 0 check (subtotal >= 0),
  add column desconto numeric(10, 2) not null default 0 check (desconto >= 0),
  add column frete_servico jsonb,
  add column prazo_personalizacao text,
  add column termos_aceitos_em timestamptz,
  add column autoriza_divulgacao boolean not null default false,
  add column pagamento_metodo text check (pagamento_metodo in ('pix', 'cartao')),
  add column pagamento_parcelas smallint check (pagamento_parcelas between 1 and 24),
  add column pagamento_situacao text,
  add column pago_em timestamptz,
  add column teste boolean not null default true,
  -- Código de cada tentativa de checkout: o mesmo clique enviado duas vezes não
  -- vira dois pedidos.
  add column chave_do_checkout uuid unique;

comment on column public.pedidos.cpf is 'CPF de quem compra, só os 11 dígitos. O Mercado Pago pede no Pix e a etiqueta de envio também.';
comment on column public.pedidos.frete_servico is 'Frete escolhido no checkout (cotação do Melhor Envio): {"id", "transportadora", "servico", "preco", "prazo_min", "prazo_max"}. Os prazos são só do transporte, em dias úteis.';
comment on column public.pedidos.prazo_personalizacao is 'Prazo de personalização mostrado ao cliente na compra (ex.: "10 a 15 dias úteis").';
comment on column public.pedidos.autoriza_divulgacao is 'Autorização opcional para usar a peça ou a foto em conteúdo da marca (briefing, LGPD). Sem ela, a foto serve só para produzir a peça.';
comment on column public.pedidos.pagamento_situacao is 'Situação do pagamento no Mercado Pago (approved, pending, in_process, rejected...).';
comment on column public.pedidos.teste is 'Pedido feito com o pagamento em modo de teste: não é venda de verdade.';

create index pedidos_pagamento_id_idx on public.pedidos (pagamento_id) where pagamento_id is not null;

-- Itens -------------------------------------------------------------------
alter table public.itens_pedido
  add column lado text not null default 'costas' check (lado in ('frente', 'costas')),
  add column enquadramento jsonb not null default '{}'::jsonb,
  add column marca_no_peito boolean not null default false,
  add column presente jsonb,
  add column preco_presente numeric(10, 2) not null default 0 check (preco_presente >= 0);

comment on column public.itens_pedido.enquadramento is 'Enquadramento da foto no design, em frações do quadro de 4:5: {"x", "y", "zoom"}.';
comment on column public.itens_pedido.presente is 'Presente desta peça: {"mensagem": "..."} (embalagem especial e cartão com a mensagem).';

-- Pacote de envio de cada modelo, para a cotação do frete ---------------------
alter table public.pecas
  add column envio jsonb constraint pecas_envio_objeto check (envio is null or jsonb_typeof(envio) = 'object');

comment on column public.pecas.envio is 'Pacote de uma peça dobrada, para cotar o frete: {"peso_kg", "largura_cm", "altura_cm", "comprimento_cm"}. Estimativa até a operação confirmar.';

-- Criar o pedido: o pedido, as peças e o primeiro status, tudo de uma vez ----------
create or replace function public.criar_pedido(dados jsonb)
returns table (id_do_pedido bigint, numero_do_pedido bigint, token_do_pedido uuid, total_do_pedido numeric)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  novo public.pedidos;
  item jsonb;
begin
  -- A mesma tentativa de checkout devolve o pedido que já existe.
  select p.* into novo
  from public.pedidos p
  where p.chave_do_checkout = (dados->>'chave_do_checkout')::uuid;

  if novo.id is null then
    if coalesce(jsonb_array_length(dados->'itens'), 0) = 0 then
      raise exception 'pedido sem peças';
    end if;
    if dados->>'termos_aceitos_em' is null then
      raise exception 'pedido sem o aceite dos termos';
    end if;

    insert into public.pedidos (
      nome, email, whatsapp, cpf, endereco, presente,
      subtotal, desconto, frete, frete_servico, total,
      prazo_personalizacao, termos_aceitos_em, autoriza_divulgacao, teste, chave_do_checkout
    ) values (
      dados->>'nome', dados->>'email', dados->>'whatsapp', dados->>'cpf', dados->'endereco', dados->'presente',
      (dados->>'subtotal')::numeric, coalesce((dados->>'desconto')::numeric, 0), (dados->>'frete')::numeric,
      dados->'frete_servico', (dados->>'total')::numeric,
      dados->>'prazo_personalizacao', (dados->>'termos_aceitos_em')::timestamptz,
      coalesce((dados->>'autoriza_divulgacao')::boolean, false), coalesce((dados->>'teste')::boolean, true),
      (dados->>'chave_do_checkout')::uuid
    )
    returning * into novo;

    for item in select * from jsonb_array_elements(dados->'itens') loop
      insert into public.itens_pedido (
        pedido_id, peca_id, cor_id, tamanho, design_id, foto_id, campos,
        lado, enquadramento, marca_no_peito, presente, preco, preco_presente
      ) values (
        novo.id, (item->>'peca_id')::bigint, (item->>'cor_id')::bigint, item->>'tamanho',
        (item->>'design_id')::bigint, (item->>'foto_id')::uuid, coalesce(item->'campos', '{}'::jsonb),
        item->>'lado', coalesce(item->'enquadramento', '{}'::jsonb),
        coalesce((item->>'marca_no_peito')::boolean, false), item->'presente',
        (item->>'preco')::numeric, coalesce((item->>'preco_presente')::numeric, 0)
      );
    end loop;

    insert into public.status_historico (pedido_id, de, para) values (novo.id, null, novo.status);
  end if;

  return query select novo.id, novo.numero, novo.token_acompanhamento, novo.total;
end;
$$;

comment on function public.criar_pedido(jsonb) is 'Cria o pedido com as peças e o primeiro status numa transação só. Só o servidor do site (service_role) chama.';

-- Registrar o pagamento: o que o Mercado Pago confirmou ------------------------
-- Pagamento aprovado com o valor certo leva o pedido de "aguardando pagamento" a
-- "pago" e, logo depois, a "revisão de arte" (briefing, "Status do pedido").
-- Chamar de novo com o mesmo pagamento não muda nada.
create or replace function public.registrar_pagamento(p_pedido bigint, p_pagamento jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  atual public.pedidos;
  situacao text := p_pagamento->>'situacao';
begin
  select * into atual from public.pedidos where id = p_pedido for update;
  if atual.id is null then
    raise exception 'pedido % não existe', p_pedido;
  end if;

  -- Pagamento aprovado com valor diferente do pedido não confirma nada.
  if situacao = 'approved' and (p_pagamento->>'valor')::numeric is distinct from atual.total then
    situacao := 'valor_divergente';
  end if;

  update public.pedidos set
    pagamento_id = coalesce(p_pagamento->>'id', pagamento_id),
    pagamento_situacao = situacao,
    pagamento_metodo = coalesce(p_pagamento->>'metodo', pagamento_metodo),
    pagamento_parcelas = coalesce((p_pagamento->>'parcelas')::smallint, pagamento_parcelas)
  where id = p_pedido;

  if situacao = 'approved' and atual.status = 'aguardando_pagamento' then
    update public.pedidos set status = 'revisao_arte', pago_em = now() where id = p_pedido;
    insert into public.status_historico (pedido_id, de, para) values
      (p_pedido, 'aguardando_pagamento', 'pago'),
      (p_pedido, 'pago', 'revisao_arte');
    return 'revisao_arte';
  end if;

  return atual.status;
end;
$$;

comment on function public.registrar_pagamento(bigint, jsonb) is 'Registra a situação do pagamento no pedido e, se aprovado com o valor certo, leva o pedido a pago e revisão de arte. Só o servidor do site (service_role) chama.';

-- Só o servidor do site executa as duas rotinas.
revoke all on function public.criar_pedido(jsonb) from public, anon, authenticated;
revoke all on function public.registrar_pagamento(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.criar_pedido(jsonb) to service_role;
grant execute on function public.registrar_pagamento(bigint, jsonb) to service_role;
