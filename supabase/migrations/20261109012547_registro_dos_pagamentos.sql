-- Etapa 6: a rotina que registra o pagamento fica mais cuidadosa com tentativas
-- antigas e com cobrança em dobro, e a foto de um pedido pago deixa de vencer em
-- 30 dias.
--
-- Um mesmo pedido pode ter mais de uma tentativa de pagamento (um cartão recusado
-- e depois um Pix, por exemplo). O pedido guarda a tentativa atual. Regras:
--   * O site, ao criar uma tentativa nova, marca "novo": ela vira a atual.
--   * Aviso atrasado de uma tentativa antiga (o Pix que venceu depois do cartão
--     recusado) não apaga a atual. Só um pagamento aprovado passa na frente.
--   * Pedido já pago: só o próprio pagamento muda a situação (um estorno, por
--     exemplo). Outro pagamento aprovado para o mesmo pedido é cobrança em dobro:
--     a rotina devolve 'pago_em_dobro', sem mexer no pedido, e o site avisa a
--     equipe para devolver o dinheiro.
--   * Pagamento aprovado com valor diferente do pedido não confirma nada.
--
-- Quando o pedido é pago, as fotos dele deixam de vencer em 30 dias (o prazo das
-- montagens nunca compradas); o prazo de pedido entregue vem com os termos.

create or replace function public.registrar_pagamento(p_pedido bigint, p_pagamento jsonb)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  atual public.pedidos;
  pagamento text := p_pagamento->>'id';
  aprovado boolean := (p_pagamento->>'situacao') = 'approved';
  situacao text := p_pagamento->>'situacao';
  novo boolean := coalesce((p_pagamento->>'novo')::boolean, false);
begin
  select * into atual from public.pedidos where id = p_pedido for update;
  if atual.id is null then
    raise exception 'pedido % não existe', p_pedido;
  end if;

  -- Pedido já pago.
  if atual.pago_em is not null then
    if pagamento is not distinct from atual.pagamento_id then
      update public.pedidos set pagamento_situacao = situacao where id = p_pedido;
      return atual.status;
    end if;
    return case when aprovado then 'pago_em_dobro' else atual.status end;
  end if;

  -- Aviso de uma tentativa antiga que não foi aprovada: fica de fora.
  if not novo and not aprovado and atual.pagamento_id is not null and pagamento is distinct from atual.pagamento_id then
    return atual.status;
  end if;

  if aprovado and (p_pagamento->>'valor')::numeric is distinct from atual.total then
    situacao := 'valor_divergente';
  end if;

  update public.pedidos set
    pagamento_id = coalesce(pagamento, pagamento_id),
    pagamento_situacao = situacao,
    pagamento_metodo = coalesce(p_pagamento->>'metodo', pagamento_metodo),
    pagamento_parcelas = coalesce((p_pagamento->>'parcelas')::smallint, pagamento_parcelas)
  where id = p_pedido;

  if situacao = 'approved' and atual.status = 'aguardando_pagamento' then
    update public.pedidos set status = 'revisao_arte', pago_em = now() where id = p_pedido;
    insert into public.status_historico (pedido_id, de, para) values
      (p_pedido, 'aguardando_pagamento', 'pago'),
      (p_pedido, 'pago', 'revisao_arte');
    update public.fotos set apagar_em = null
    where id in (select i.foto_id from public.itens_pedido i where i.pedido_id = p_pedido and i.foto_id is not null);
    return 'revisao_arte';
  end if;

  return atual.status;
end;
$$;

comment on function public.registrar_pagamento(bigint, jsonb) is 'Registra a situação do pagamento no pedido e, se aprovado com o valor certo, leva o pedido a pago e revisão de arte. Ignora avisos atrasados de tentativas antigas e devolve pago_em_dobro quando outro pagamento é aprovado para um pedido já pago. Só o servidor do site (service_role) chama.';

-- "create or replace" mantém as permissões; repetidas aqui para ficar explícito.
revoke all on function public.registrar_pagamento(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.registrar_pagamento(bigint, jsonb) to service_role;
