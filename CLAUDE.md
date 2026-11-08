# Divestir

Loja online de roupas personalizadas sob demanda: o cliente envia a foto de quem ama (pet, família, amigo ou objeto), escolhe a peça, um design da marca, a cor e o tamanho, e vê a peça sendo montada em tempo real antes de comprar. O projeto tem duas partes: o site público com o montador e o painel interno da equipe.

O briefing completo está em `docs/divestir-briefing.md`. Ele é a fonte da verdade do produto: leia antes de cada etapa e siga o que está lá. Se algo do briefing parecer errado ou incompleto, pergunte antes de decidir sozinho.

## Como trabalhar comigo

- Eu não sou programador. Explique o que vai fazer e o que fez em português simples, sem jargão.
- Trabalhe uma etapa do roteiro por vez (seção "Roteiro de construção" do briefing). Não adiante etapas futuras.
- No fim de cada etapa, me diga exatamente como testar: o que abrir, onde clicar e o que eu devo ver.
- Faça commit no GitHub ao fim de cada etapa concluída e testada, com mensagem clara em português.
- Quando eu precisar fazer algo fora do código (criar conta, copiar uma chave, configurar um serviço), me guie passo a passo.
- Antes de instalar uma biblioteca nova ou mudar a estrutura do banco, me avise e explique o porquê.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase: Postgres, Auth, Storage e Row Level Security
- Konva para a prévia ao vivo no navegador
- sharp no servidor para gerar o arquivo de impressão
- Vercel para hospedagem

## Regras que valem sempre

- Mobile first: a maioria dos clientes vai montar a peça pelo celular.
- Todo texto que o cliente vê é em português do Brasil, com tom próximo, leve e caloroso.
- Visual premium, limpo e moderno. Nada de poluição visual ou cara de template genérico.
- RLS ativo em todas as tabelas desde a criação. O público só lê catálogo e designs ativos; pedidos e fotos só a equipe.
- Fotos dos clientes ficam em bucket privado, com upload por URL assinada.
- Nenhuma chave secreta no código do navegador. Segredos só em variáveis de ambiente do servidor.
- Webhooks de pagamento sempre validados por assinatura.
- Os designs são templates configuráveis (seção "Sistema de templates" do briefing), nunca imagens fixas no código.

## Onde fica cada coisa

- Identidade visual: cores e papel de cada fonte em `src/app/globals.css`; arquivos de fonte em `src/app/fontes/`. Mudanças de identidade acontecem só nesses dois lugares e são registradas em `DESIGN.md`.
  - Cores oficiais da marca (decisão do Lucas, 07/11): verde garrafa `#0D2B17` (cor principal, o verde exato do fundo das fotos do Fã-Clube), creme `#FAF5EB` (o papel) e rosa elétrico `#FF4FA8` (o acento, cor-chave WGSN 2026). Rosa só aparece sobre o verde: sobre o creme ele some (contraste 2.8:1). Sobre o creme, o botão é verde com texto creme; sobre o verde, rosa com texto verde.
  - Regra do palco: o verde é para mostrar (topo, vitrine de peças, rodapé) e o creme é para ler e fazer (como funciona, montador, checkout).
  - Tinta única: sobre o creme, todo texto é verde cheio; sobre o verde, creme cheio. Sem transparência; a hierarquia vem do tamanho, do peso e da fonte.
  - Fotos da vitrine ficam em `public/exemplos/` e passam antes pelo `scripts/preparar-fotos.py vitrine`, que deixa o fundo da foto no verde exato da página.
  - Fontes oficiais (decisão do Lucas, 07/11): Anton nos títulos, Instrument Serif no destaque e Inter no texto. Paleta e fontes estão fechadas; só o logo ainda está em produção.
- Design com o Impeccable (skill em `.claude/skills/impeccable`): a verdade do produto fica em `PRODUCT.md` e o sistema visual em `DESIGN.md`, com os componentes em `.impeccable/design.json`. Leia os dois antes de qualquer tela nova e atualize o `DESIGN.md` quando o sistema mudar. Os guias são lidos direto da pasta `reference/` da skill (o launcher, que baixa um programa, não é usado).
- Conexão com o Supabase: `src/lib/supabase/client.ts` (navegador), `src/lib/supabase/server.ts` (servidor, com a sessão de quem está logado) e `src/lib/supabase/publico.ts` (leituras públicas sem sessão, como o catálogo, que podem ficar guardadas em cache).
- Catálogo: as fotos de base ficam em `public/catalogo/`, com o nome `peca-cor-lado.jpg` (1440 × 1800, fundo cinza `#E9E9E7`), e passam antes pelo `scripts/preparar-fotos.py catalogo`. Os códigos de cada foto no Higgsfield estão em `docs/fotos-de-base.md`. As peças, cores e fotos iniciais estão em `supabase/seed.sql` (são dados, não estrutura; rodar de novo é seguro). O site lê o catálogo em `src/lib/catalogo.ts` e guarda o resultado por até uma hora (etiqueta `catalogo`); o painel da Etapa 8 vai renovar na hora com `revalidateTag('catalogo')`.
- Tela da foto: `/montar/foto` (`src/app/montar/foto/`), aberta pelo botão "Continuar para a foto" do montador. Ela traz o guia da foto perfeita do briefing, com um par "assim sim / assim não" por dica, cujas fotos ilustrativas ficam em `public/guia/` (códigos em `docs/fotos-do-guia.md`). A checagem da foto roda no próprio aparelho do cliente, sem enviar nada, em `src/lib/foto/checar.ts`: formato, até 20 MB, resolução pelo lado menor (2.000 px perfeita, 1.000 px mínima) e nitidez (limite 80, calibrado em 08/11/2026 com 72 fotos nítidas e borradas). O aviso amarelo do briefing virou ícone e frase, porque a paleta é fechada.
- Banco: migrations em `supabase/migrations/`. Toda mudança no banco vira uma migration nova, nunca edição de uma antiga.
- Teste das regras de acesso do banco: `npm run testar:banco` (roda as migrations num Postgres local e confere quem lê e altera o quê). Rode sempre que mexer no banco.
- Variáveis de ambiente: lista em `.env.example`.
- Projeto no Supabase: `divestir` (ref `hpubkogmfhgabtzrpgxv`), região São Paulo, plano Pro desde 08/11/2026 (o banco não pausa mais por falta de uso).
- Site no ar: https://divestir.vercel.app (projeto `divestir` no time LUCCO da Vercel). Cada envio para a branch `main` do GitHub publica o site sozinho. As funções do site rodam em São Paulo (`gru1`, em `vercel.json`), perto do banco. O time está no plano Pro desde 08/11/2026, que permite uso comercial.
- Serviços que ainda faltam (tabela "Stack" do briefing), na ordem em que entram: API de remoção de fundo (Etapa 3, ainda não escolhida), meio de pagamento (Etapa 6: Mercado Pago, Pagar.me ou Asaas, ainda não escolhido) e Resend para e-mail (Etapa 9). Antes do lançamento, os termos, a política de privacidade e a política de troca passam por um advogado.
- Domínio próprio: já registrado pelo Lucas (08/11/2026). Entra na Vercel na Etapa 10, e o Resend usa o mesmo domínio para mandar os e-mails.
- Avisos ao cliente (decisão do Lucas, 08/11/2026): o e-mail vem primeiro. O WhatsApp não trava nenhuma etapa e entra quando o provedor estiver liberado; até lá, todo aviso vai por e-mail. O WhatsApp do cliente continua sendo pedido no checkout, como no briefing.

## Pendências técnicas

- Etapa 8 (painel): reorganizar as regras de leitura de `pecas`, `cores`, `peca_imagens`, `designs` e `equipe` para uma regra por papel e por ação. O Supabase avisa que hoje há duas regras de leitura para usuários logados nessas tabelas (aviso só de desempenho). A mudança precisa de DROP POLICY, então pede confirmação.
- Preço de cada peça e área de impressão ainda estão em aberto no briefing: no banco, `preco` e `area_impressao_cm` das peças estão vazios.

## Etapa atual

Etapa 3: Foto (envio, checagem de resolução e nitidez, remoção de fundo e ajuste de enquadramento). Feito em 08/11/2026: o guia da foto perfeita e a checagem no aparelho, em `/montar/foto`. Falta o envio da foto para o espaço privado do Supabase, o recorte de fundo e o ajuste de enquadramento. A API de recorte ainda não foi escolhida. O BiRefNet completo não roda no ambiente de trabalho do Claude, porque passa de 6 GB de memória; o teste do recorte vai usar as 10 fotos reais do Lucas.

Etapas concluídas: Etapa 1 (base do projeto), aprovada em 07/11/2026, com o logo definitivo ainda com o Lucas, que entra quando ficar pronto. Etapa 2 (catálogo), aprovada em 08/11/2026: o montador em `/montar` troca a foto certa por peça, cor e lado. As 30 fotos de base foram geradas de novo no Higgsfield, porque as originais não foram encontradas.
