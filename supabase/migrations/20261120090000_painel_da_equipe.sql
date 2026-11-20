-- Painel da equipe (Etapa 8, primeira parte): pedidos, tela do pedido e equipe.
--
-- O painel lê e mexe nos pedidos por rotinas do banco, chamadas com a sessão de quem
-- está logado. Todas são "security invoker": quem decide o que cada pessoa enxerga
-- continuam sendo as regras de acesso (RLS) das tabelas, que só liberam a equipe.
-- Quem não é da equipe chama e recebe vazio (ou "sem permissão", nas que alteram).

-- ---------------------------------------------------------------------
-- Um recado em cada mudança de status (ex.: por que a foto não serviu).
-- ---------------------------------------------------------------------

alter table public.status_historico
  add column nota text constraint status_historico_nota_curta check (char_length(nota) <= 500);
comment on column public.status_historico.nota is 'Recado de quem mudou o status (ex.: o que há de errado com a foto).';

-- A equipe enxerga os colegas (o nome de quem mexeu em cada pedido aparece no
-- histórico). Gerenciar a equipe continua sendo só do admin.
create policy "equipe: ver os colegas"
  on public.equipe for select
  to authenticated
  using ((select privado.e_equipe()));

-- ---------------------------------------------------------------------
-- Quem sou eu no painel
-- ---------------------------------------------------------------------

create function public.painel_eu()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object('nome', e.nome, 'papel', e.papel)
  from public.equipe e
  where e.user_id = (select auth.uid());
$$;
comment on function public.painel_eu() is 'Painel: o nome e o papel de quem está logado (vazio se não for da equipe).';

-- ---------------------------------------------------------------------
-- A lista de pedidos (quadro e lista com busca)
-- ---------------------------------------------------------------------

-- p_status: vazio = os pedidos em andamento (pagos e não cancelados);
-- 'todos' = todos, inclusive os que aguardam pagamento e os cancelados;
-- ou um status só.
create function public.painel_pedidos(
  p_busca text default null,
  p_status text default null,
  p_peca text default null,
  p_design text default null,
  p_de date default null,
  p_ate date default null,
  p_limite integer default 300
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with busca as (
    select nullif(btrim(coalesce(p_busca, '')), '') as texto,
           nullif(regexp_replace(coalesce(p_busca, ''), '\D', '', 'g'), '') as digitos
  ),
  achados as (
    select p.*
    from public.pedidos p, busca b
    where case
        when p_status is null or p_status = '' then p.status not in ('aguardando_pagamento', 'cancelado')
        when p_status = 'todos' then true
        else p.status = p_status
      end
      and (p_de is null or p.criado_em >= p_de::timestamp at time zone 'America/Sao_Paulo')
      and (p_ate is null or p.criado_em < (p_ate + 1)::timestamp at time zone 'America/Sao_Paulo')
      and (
        b.texto is null
        or p.nome ilike '%' || b.texto || '%'
        or p.email ilike '%' || b.texto || '%'
        or (b.digitos is not null and (p.numero::text = b.digitos or p.whatsapp like '%' || b.digitos || '%'))
      )
      and (
        (p_peca is null and p_design is null)
        or exists (
          select 1
          from public.itens_pedido i
          join public.pecas pc on pc.id = i.peca_id
          join public.designs d on d.id = i.design_id
          where i.pedido_id = p.id
            and (p_peca is null or pc.slug = p_peca)
            and (p_design is null or d.slug = p_design)
        )
      )
    order by p.criado_em desc
    limit greatest(1, least(coalesce(p_limite, 300), 1000))
  )
  select coalesce(jsonb_agg(linha order by (linha->>'criado_em') desc), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'numero', p.numero,
      'nome', p.nome,
      'status', p.status,
      'total', p.total,
      'teste', p.teste,
      'criado_em', p.criado_em,
      'pago_em', p.pago_em,
      'rastreio', p.rastreio,
      'mudou_em', coalesce((select max(h.criado_em) from public.status_historico h where h.pedido_id = p.id), p.criado_em),
      'presente', exists (select 1 from public.itens_pedido i where i.pedido_id = p.id and i.presente is not null),
      'pecas', coalesce((
        select jsonb_agg(jsonb_build_object(
          'peca', pc.nome,
          'cor', c.nome,
          'hex', c.hex,
          'design', d.nome,
          'tamanho', i.tamanho,
          'nome', i.campos->>'nome'
        ) order by i.id)
        from public.itens_pedido i
        join public.pecas pc on pc.id = i.peca_id
        join public.cores c on c.id = i.cor_id
        join public.designs d on d.id = i.design_id
        where i.pedido_id = p.id
      ), '[]'::jsonb)
    ) as linha
    from achados p
  ) linhas;
$$;
comment on function public.painel_pedidos(text, text, text, text, date, date, integer) is 'Painel: a lista de pedidos, com busca (número, nome, e-mail ou WhatsApp) e filtros por status, peça, design e data.';

-- ---------------------------------------------------------------------
-- Um pedido inteiro (tela do pedido)
-- ---------------------------------------------------------------------

create function public.painel_pedido(p_numero bigint)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'numero', p.numero,
    'status', p.status,
    'teste', p.teste,
    'criado_em', p.criado_em,
    'pago_em', p.pago_em,
    'nome', p.nome,
    'email', p.email,
    'whatsapp', p.whatsapp,
    'cpf', p.cpf,
    'endereco', p.endereco,
    'presente', p.presente,
    'subtotal', p.subtotal,
    'frete', p.frete,
    'total', p.total,
    'frete_servico', p.frete_servico,
    'prazo_personalizacao', p.prazo_personalizacao,
    'autoriza_divulgacao', p.autoriza_divulgacao,
    'pagamento', jsonb_build_object(
      'id', p.pagamento_id,
      'situacao', p.pagamento_situacao,
      'metodo', p.pagamento_metodo,
      'parcelas', p.pagamento_parcelas
    ),
    'rastreio', p.rastreio,
    'token', p.token_acompanhamento,
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', i.id,
        'tamanho', i.tamanho,
        'lado', i.lado,
        'campos', i.campos,
        'enquadramento', i.enquadramento,
        'marca_no_peito', i.marca_no_peito,
        'presente', i.presente,
        'preco', i.preco,
        'preco_presente', i.preco_presente,
        'peca', jsonb_build_object('slug', pc.slug, 'nome', pc.nome, 'areas', pc.area_impressao_cm),
        'cor', jsonb_build_object('slug', c.slug, 'nome', c.nome, 'hex', c.hex),
        'design', jsonb_build_object('slug', d.slug, 'nome', d.nome, 'config', d.config),
        'base', (
          select im.url from public.peca_imagens im
          where im.peca_id = i.peca_id and im.cor_id = i.cor_id and im.lado = i.lado
        ),
        'foto', (
          select jsonb_build_object(
            'id', f.id,
            'original', f.original_url,
            'recorte', f.recorte_url,
            'largura', f.largura,
            'altura', f.altura,
            'nitidez', f.nitidez
          )
          from public.fotos f where f.id = i.foto_id
        )
      ) order by i.id)
      from public.itens_pedido i
      join public.pecas pc on pc.id = i.peca_id
      join public.cores c on c.id = i.cor_id
      join public.designs d on d.id = i.design_id
      where i.pedido_id = p.id
    ), '[]'::jsonb),
    'historico', coalesce((
      select jsonb_agg(jsonb_build_object(
        'de', h.de,
        'para', h.para,
        'nota', h.nota,
        'quando', h.criado_em,
        'por', (select e.nome from public.equipe e where e.user_id = h.por_usuario)
      ) order by h.criado_em, h.id)
      from public.status_historico h
      where h.pedido_id = p.id
    ), '[]'::jsonb),
    'avisos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'canal', n.canal,
        'tipo', n.tipo,
        'enviado_em', n.enviado_em,
        'erro', n.erro
      ) order by n.criado_em, n.id)
      from public.notificacoes n
      where n.pedido_id = p.id
    ), '[]'::jsonb)
  )
  from public.pedidos p
  where p.numero = p_numero;
$$;
comment on function public.painel_pedido(bigint) is 'Painel: um pedido inteiro, com as peças, as fotos, o histórico de status e os avisos enviados.';

-- ---------------------------------------------------------------------
-- Mudar o status de um pedido
-- ---------------------------------------------------------------------

-- Só deixa passar os caminhos que fazem sentido (briefing, "Status do pedido"), guarda
-- quem mudou e, na ida para "enviado", exige o código de rastreio. Cancelar é só do
-- admin. Chamar com o mesmo status "enviado" só corrige o rastreio.
create function public.painel_mover_pedido(
  p_numero bigint,
  p_para text,
  p_rastreio text default null,
  p_nota text default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  atual public.pedidos;
  permitido text[];
  rastreio_novo text := nullif(btrim(coalesce(p_rastreio, '')), '');
begin
  if not (select privado.e_equipe()) then
    raise exception 'sem permissão' using errcode = '42501';
  end if;

  select * into atual from public.pedidos where numero = p_numero for update;
  if atual.id is null then
    raise exception 'pedido % não existe', p_numero;
  end if;

  if rastreio_novo is not null and char_length(rastreio_novo) > 60 then
    raise exception 'rastreio comprido demais';
  end if;

  -- Só corrigir o rastreio de um pedido que já saiu.
  if atual.status = 'enviado' and p_para = 'enviado' then
    if rastreio_novo is null then
      raise exception 'falta o rastreio';
    end if;
    update public.pedidos set rastreio = rastreio_novo where id = atual.id;
    return 'enviado';
  end if;

  permitido := case atual.status
    when 'aguardando_pagamento' then array['cancelado']
    when 'pago' then array['revisao_arte', 'cancelado']
    when 'revisao_arte' then array['em_producao', 'ajuste_foto', 'cancelado']
    when 'ajuste_foto' then array['revisao_arte', 'cancelado']
    when 'em_producao' then array['enviado', 'revisao_arte', 'cancelado']
    when 'enviado' then array['entregue', 'em_producao']
    when 'entregue' then array['enviado']
    else array[]::text[]
  end;
  if p_para is null or not (p_para = any (permitido)) then
    raise exception 'mudança não permitida: de % para %', atual.status, p_para;
  end if;

  if p_para = 'cancelado' and not (select privado.e_admin()) then
    raise exception 'só o administrador cancela um pedido' using errcode = '42501';
  end if;
  if p_para = 'enviado' and coalesce(rastreio_novo, atual.rastreio) is null then
    raise exception 'falta o rastreio';
  end if;

  update public.pedidos
  set status = p_para,
      rastreio = case when p_para = 'enviado' then coalesce(rastreio_novo, rastreio) else rastreio end
  where id = atual.id;

  insert into public.status_historico (pedido_id, de, para, por_usuario, nota)
  values (atual.id, atual.status, p_para, (select auth.uid()), nullif(btrim(coalesce(p_nota, '')), ''));

  return p_para;
end;
$$;
comment on function public.painel_mover_pedido(bigint, text, text, text) is 'Painel: muda o status de um pedido pelos caminhos permitidos, guarda quem mudou e exige o rastreio na ida para "enviado".';

-- ---------------------------------------------------------------------
-- Quem pode chamar: só quem está logado (e as regras de acesso filtram a equipe).
-- ---------------------------------------------------------------------

revoke all on function public.painel_eu() from public, anon;
revoke all on function public.painel_pedidos(text, text, text, text, date, date, integer) from public, anon;
revoke all on function public.painel_pedido(bigint) from public, anon;
revoke all on function public.painel_mover_pedido(bigint, text, text, text) from public, anon;

grant execute on function public.painel_eu() to authenticated, service_role;
grant execute on function public.painel_pedidos(text, text, text, text, date, date, integer) to authenticated, service_role;
grant execute on function public.painel_pedido(bigint) to authenticated, service_role;
grant execute on function public.painel_mover_pedido(bigint, text, text, text) to authenticated, service_role;
