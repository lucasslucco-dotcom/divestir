-- Tamanhos da confecção (25/11/2026): a grade dela tem EG (camiseta básica) e XG
-- (oversized, básica feminina e baby look), que a regra antiga do pedido não aceitava
-- (só PP ao GGG): o pedido com um desses tamanhos falhava na hora de gravar.
-- Quem diz quais tamanhos cada peça tem é a coluna tamanhos de pecas, e o servidor já
-- confere o tamanho do pedido contra ela. Aqui fica só a conferência do formato.

alter table public.itens_pedido drop constraint itens_pedido_tamanho_check;

alter table public.itens_pedido
  add constraint itens_pedido_tamanho_check check (tamanho ~ '^[A-Z0-9]{1,5}$');
