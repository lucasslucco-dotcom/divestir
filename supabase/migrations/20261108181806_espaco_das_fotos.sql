-- Espaço privado das fotos dos clientes (Supabase Storage), Etapa 3.
--
-- Regra do projeto: "Fotos dos clientes ficam em bucket privado, com upload por URL assinada."
--   * O espaço "fotos" é privado: ninguém de fora lê, lista, grava nem apaga.
--   * O cliente envia a foto original por uma URL assinada, criada pelo servidor do
--     site com a chave secreta. Cada URL vale para um único arquivo e expira em 2 horas.
--   * O servidor guarda ali também o recorte feito pelo Photoroom.
--   * A equipe (logada) lê as fotos, para a revisão de arte e o arquivo de impressão.
--
-- Caminho de cada arquivo:
--   <sessao>/<id da foto>/original.<extensão>
--   <sessao>/<id da foto>/recorte.webp

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "equipe: ver as fotos dos clientes no espaco privado"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'fotos' and (select privado.e_equipe()));

-- A nota de nitidez medida no aparelho do cliente passa de 999 nas fotos nítidas
-- (calibração de 08/11/2026: de 199 a 5.600), e o campo só aceitava até 999,999.
alter table public.fotos alter column nitidez type numeric(8, 1);

comment on column public.fotos.original_url is
  'Caminho da foto original no espaço privado "fotos" (não é endereço público).';
comment on column public.fotos.recorte_url is
  'Caminho do recorte sem fundo (WebP) no espaço privado "fotos".';
comment on column public.fotos.nitidez is
  'Nota de nitidez medida no aparelho do cliente. Abaixo de 80, a foto recebe o aviso de tremida.';
comment on column public.fotos.apagar_em is
  'Quando a foto deve ser apagada. Montagem nunca comprada: 30 dias depois do envio (briefing).';
