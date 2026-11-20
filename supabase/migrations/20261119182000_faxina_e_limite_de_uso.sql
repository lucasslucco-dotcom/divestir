-- Faxina diária e limite de uso por visitante (pedido do Lucas, 19/11/2026).
--
-- 1. Faxina, chamada uma vez por dia pelo site (rota /api/faxina):
--    * fotos vencidas (apagar_em no passado: montagens nunca compradas, 30 dias depois):
--      o site apaga os arquivos no espaço das fotos e, depois, as linhas daqui;
--    * pedidos que nunca foram pagos: viram "cancelado" depois de alguns dias;
--    * contagens antigas do limite de uso.
-- 2. Limite de uso: uma tabela pequena que conta, por visitante e por rota, quantas
--    vezes ele chamou num intervalo. O visitante é guardado como um código embaralhado
--    do endereço de internet dele, nunca o endereço em si.
--
-- Nada aqui é lido ou gravado pelo navegador: só o servidor do site (service_role).

-- ---------------------------------------------------------------------
-- Limite de uso
-- ---------------------------------------------------------------------

create table public.uso (
  chave text not null,
  janela timestamptz not null,
  quantidade integer not null default 0 check (quantidade >= 0),
  primary key (chave, janela)
);
comment on table public.uso is 'Contagem de chamadas por visitante (código embaralhado) e por rota, para o limite de uso. Só o servidor do site usa; a faxina apaga as contagens antigas.';
create index uso_janela_idx on public.uso (janela);

-- RLS ligado e nenhuma regra: visitante e equipe não leem nem gravam; o servidor do
-- site (service_role) passa por cima do RLS.
alter table public.uso enable row level security;
revoke all on table public.uso from anon, authenticated;
grant select, insert, update, delete on table public.uso to service_role;

-- Conta mais uma chamada e diz se ainda está dentro do limite do intervalo.
create function public.contar_uso(p_chave text, p_limite integer, p_segundos integer)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  inicio timestamptz := to_timestamp(floor(extract(epoch from now()) / p_segundos) * p_segundos);
  total integer;
begin
  insert into public.uso as u (chave, janela, quantidade)
  values (p_chave, inicio, 1)
  on conflict (chave, janela) do update set quantidade = u.quantidade + 1
  returning u.quantidade into total;
  return total <= p_limite;
end;
$$;
comment on function public.contar_uso(text, integer, integer) is 'Conta mais uma chamada da chave no intervalo atual (de p_segundos) e devolve se ainda cabe no limite. Só o servidor do site (service_role) chama.';

create function public.limpar_uso()
returns integer
language sql
security invoker
set search_path = ''
as $$
  with apagadas as (
    delete from public.uso where janela < now() - interval '2 days' returning 1
  )
  select count(*)::integer from apagadas;
$$;
comment on function public.limpar_uso() is 'Faxina: apaga as contagens do limite de uso com mais de 2 dias.';

-- ---------------------------------------------------------------------
-- Fotos vencidas
-- ---------------------------------------------------------------------

-- As fotos cujo prazo venceu, com o caminho dos arquivos, para o site apagar os
-- arquivos no espaço das fotos antes de apagar as linhas. Fica de fora a foto de um
-- pedido que ainda pode ser pago (qualquer pedido que não esteja cancelado): ela só
-- sai depois que a faxina cancelar o pedido.
create function public.foto_em_pedido_vivo(p_foto uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.itens_pedido i
    join public.pedidos p on p.id = i.pedido_id
    where i.foto_id = p_foto and p.status <> 'cancelado'
  );
$$;
comment on function public.foto_em_pedido_vivo(uuid) is 'Faxina: diz se a foto está num pedido que não foi cancelado (e por isso não pode ser apagada).';

create function public.fotos_vencidas(p_limite integer default 200)
returns table (id uuid, original_url text, recorte_url text)
language sql
stable
security invoker
set search_path = ''
as $$
  select f.id, f.original_url, f.recorte_url
  from public.fotos f
  where f.apagar_em is not null and f.apagar_em < now() and not public.foto_em_pedido_vivo(f.id)
  order by f.apagar_em
  limit greatest(1, least(p_limite, 1000));
$$;
comment on function public.fotos_vencidas(integer) is 'Faxina: as fotos com o prazo vencido (apagar_em no passado), para o site apagar os arquivos.';

-- Apaga as linhas das fotos, só as que continuam vencidas (uma foto de um pedido que
-- acabou de ser pago perde o prazo e fica).
create function public.apagar_fotos(p_ids uuid[])
returns integer
language sql
security invoker
set search_path = ''
as $$
  with apagadas as (
    delete from public.fotos f
    where f.id = any (p_ids) and f.apagar_em is not null and f.apagar_em < now()
      and not public.foto_em_pedido_vivo(f.id)
    returning 1
  )
  select count(*)::integer from apagadas;
$$;
comment on function public.apagar_fotos(uuid[]) is 'Faxina: apaga as linhas das fotos vencidas, depois de o site apagar os arquivos.';

-- ---------------------------------------------------------------------
-- Pedidos que nunca foram pagos
-- ---------------------------------------------------------------------

-- Pedido parado em "aguardando pagamento" há mais de p_dias vira "cancelado". Fica de
-- fora o pedido com cartão em análise (in_process): esse ainda pode ser aprovado.
create function public.cancelar_pedidos_nao_pagos(p_dias integer default 3)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total integer;
begin
  with cancelados as (
    update public.pedidos p
    set status = 'cancelado'
    where p.status = 'aguardando_pagamento'
      and p.pago_em is null
      and p.criado_em < now() - make_interval(days => greatest(p_dias, 1))
      and p.pagamento_situacao is distinct from 'in_process'
    returning p.id
  ),
  historico as (
    insert into public.status_historico (pedido_id, de, para)
    select c.id, 'aguardando_pagamento', 'cancelado' from cancelados c
    returning 1
  )
  select count(*)::integer into total from historico;
  return total;
end;
$$;
comment on function public.cancelar_pedidos_nao_pagos(integer) is 'Faxina: cancela os pedidos que ficaram sem pagamento por mais de p_dias dias (menos os que têm cartão em análise).';

-- Um pagamento aprovado que chega para um pedido já cancelado pela faxina (um cartão
-- que ficou dias em análise, por exemplo) traz o pedido de volta: o cliente pagou.
-- O resto da rotina é o mesmo da migration registro_dos_pagamentos.
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

  if situacao = 'approved' and atual.status in ('aguardando_pagamento', 'cancelado') then
    update public.pedidos set status = 'revisao_arte', pago_em = now() where id = p_pedido;
    insert into public.status_historico (pedido_id, de, para) values
      (p_pedido, atual.status, 'pago'),
      (p_pedido, 'pago', 'revisao_arte');
    update public.fotos set apagar_em = null
    where id in (select i.foto_id from public.itens_pedido i where i.pedido_id = p_pedido and i.foto_id is not null);
    return 'revisao_arte';
  end if;

  return atual.status;
end;
$$;

-- ---------------------------------------------------------------------
-- Quem pode chamar: só o servidor do site.
-- ---------------------------------------------------------------------

revoke all on function public.contar_uso(text, integer, integer) from public, anon, authenticated;
revoke all on function public.limpar_uso() from public, anon, authenticated;
revoke all on function public.fotos_vencidas(integer) from public, anon, authenticated;
revoke all on function public.foto_em_pedido_vivo(uuid) from public, anon, authenticated;
revoke all on function public.apagar_fotos(uuid[]) from public, anon, authenticated;
revoke all on function public.cancelar_pedidos_nao_pagos(integer) from public, anon, authenticated;
revoke all on function public.registrar_pagamento(bigint, jsonb) from public, anon, authenticated;

grant execute on function public.contar_uso(text, integer, integer) to service_role;
grant execute on function public.limpar_uso() to service_role;
grant execute on function public.fotos_vencidas(integer) to service_role;
grant execute on function public.foto_em_pedido_vivo(uuid) to service_role;
grant execute on function public.apagar_fotos(uuid[]) to service_role;
grant execute on function public.cancelar_pedidos_nao_pagos(integer) to service_role;
grant execute on function public.registrar_pagamento(bigint, jsonb) to service_role;
