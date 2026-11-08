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
- Konva para a prévia ao vivo no navegador (até a Etapa 4 não foi preciso: o motor do molde desenha direto no canvas do navegador)
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
- Conexão com o Supabase: `src/lib/supabase/client.ts` (navegador), `src/lib/supabase/server.ts` (servidor, com a sessão de quem está logado), `src/lib/supabase/publico.ts` (leituras públicas sem sessão, como o catálogo, que podem ficar guardadas em cache) e `src/lib/supabase/admin.ts` (servidor, com a chave secreta `SUPABASE_SECRET_KEY`, que passa por cima do RLS; usado só pelas rotas que guardam as fotos).
- Catálogo: as fotos de base ficam em `public/catalogo/`, com o nome `peca-cor-lado.jpg` (1440 × 1800, fundo cinza `#E9E9E7`), e passam antes pelo `scripts/preparar-fotos.py catalogo`. Os códigos de cada foto no Higgsfield estão em `docs/fotos-de-base.md`. As peças, cores e fotos iniciais estão em `supabase/seed.sql` (são dados, não estrutura; rodar de novo é seguro). O site lê o catálogo em `src/lib/catalogo.ts` e guarda o resultado por até uma hora (etiqueta `catalogo`); o painel da Etapa 8 vai renovar na hora com `revalidateTag('catalogo')`.
- Tela da foto: `/montar/foto` (`src/app/montar/foto/`), aberta pelo botão "Continuar para a foto" do montador. Ela traz o guia da foto perfeita do briefing, com 8 dicas e um par "assim sim / assim não" por dica, cujas fotos ilustrativas ficam em `public/guia/` (códigos em `docs/fotos-do-guia.md`). A dica "Nada na frente" entrou depois do teste com as fotos reais (decisão do Lucas, 08/11/2026). A checagem da foto roda no próprio aparelho do cliente, sem enviar nada, em `src/lib/foto/checar.ts`: formato, até 20 MB, resolução pelo lado menor (2.000 px perfeita, 1.000 px mínima) e nitidez (limite 80, calibrado em 08/11/2026 com 72 fotos nítidas e borradas). O aviso amarelo do briefing virou ícone e frase, porque a paleta é fechada.
- Enquadramento: com o recorte pronto, o próprio quadro vira o ajuste (`src/app/montar/foto/quadro-do-recorte.tsx`, contas em `src/lib/foto/enquadramento.ts`): arrastar, pinça de dois dedos, botões de zoom (de 50% a 400%), Ctrl + rodinha no computador e teclado. O protagonista é achado pelos pixels opacos do recorte e começa centralizado, ocupando 90% do quadro. O enquadramento é guardado em frações do quadro, para o motor de templates (Etapa 4) reaproveitar. Depois de "Ficou ótimo", o quadro trava e aparece "Ajustar o enquadramento".
- Espaço das fotos dos clientes: bucket privado `fotos` no Supabase Storage (migration `espaco_das_fotos`), que só a equipe logada lê. A rota `src/app/api/fotos/route.ts` cria a linha na tabela `fotos`, com `apagar_em` em 30 dias (regra do briefing para montagens nunca compradas), e uma URL assinada de um arquivo só, que vale 2 horas. O navegador envia a foto original direto para o Supabase (`src/lib/foto/guardar.ts`), sem passar pela Vercel; acima de 20 MB, refaz em JPEG. A rota do recorte guarda o `recorte.webp` ao lado. Caminhos: `<sessao>/<foto>/original.<ext>` e `<sessao>/<foto>/recorte.webp`. A sessão é um código aleatório guardado no navegador (`divestir:sessao`). As colunas `original_url` e `recorte_url` guardam o caminho dentro do espaço, não um endereço público. O recorte guardado é o da prévia (até 4 megapixels); o de impressão sai da original na Etapa 7.
- Motor do molde (Etapa 4): `src/lib/molde/`. Em `tipos.ts`, a configuração de um design; em `desenhar.ts`, o desenho das camadas (texto fixo, anel, nome com arco, foto que vaza do círculo, arte fixa com folga), a tinta pela cor da peça e a aplicação na foto de base com a sombra do tecido; em `recursos.ts`, as fontes da página e as artes pintadas na tinta. A configuração fica na coluna `config` da tabela `designs`, em unidades da arte (1000 de largura; as camadas são pintadas na ordem). As artes fixas ficam em `public/designs/<slug>/`, em SVG de uma tinta só (currentColor). A área de impressão de cada lado fica em `area_impressao_cm` da peça: `previa` diz onde a arte fica na foto de base (centro, topo e largura, em frações da foto); os centímetros chegam com a estamparia. A tela recebe o catálogo e os designs ativos por `/api/montagem` (`src/lib/designs.ts` guarda os designs, etiqueta `designs`). A prévia "Veja como fica", com o nome, a peça, o lado e as 3 cores, fica em `src/app/montar/foto/veja-como-fica.tsx`.
- Banco: migrations em `supabase/migrations/`. Toda mudança no banco vira uma migration nova, nunca edição de uma antiga.
- Teste das regras de acesso do banco: `npm run testar:banco` (roda as migrations num Postgres local e confere quem lê e altera o quê). Rode sempre que mexer no banco.
- Variáveis de ambiente: lista em `.env.example`.
- Projeto no Supabase: `divestir` (ref `hpubkogmfhgabtzrpgxv`), região São Paulo, plano Pro desde 08/11/2026 (o banco não pausa mais por falta de uso).
- Site no ar: https://divestir.vercel.app (projeto `divestir` no time LUCCO da Vercel). Cada envio para a branch `main` do GitHub publica o site sozinho. As funções do site rodam em São Paulo (`gru1`, em `vercel.json`), perto do banco. O time está no plano Pro desde 08/11/2026, que permite uso comercial.
- Recorte de fundo: Photoroom, escolhido pelo Lucas em 08/11/2026, depois do teste com 8 fotos reais. A rota `src/app/api/recorte/route.ts` recebe a foto reduzida pelo celular (`src/lib/foto/recorte.ts`, até 2.048 px, porque a Vercel aceita até 4,5 MB por envio) e devolve o recorte em WebP, já cortado em volta do protagonista. A chave fica só na Vercel (`PHOTOROOM_API_KEY`). Sem `PHOTOROOM_MODO=producao`, roda no modo de teste gratuito do Photoroom: até 100 recortes por dia, com marca d'água. O BiRefNet, que seria a alternativa sem serviço pago, não roda no ambiente de trabalho do Claude: mesmo na versão leve, passa de 6 GB de memória.
- Serviços que ainda faltam (tabela "Stack" do briefing), na ordem em que entram: meio de pagamento (Etapa 6: Mercado Pago, Pagar.me ou Asaas, ainda não escolhido) e Resend para e-mail (Etapa 9). Antes do lançamento, os termos, a política de privacidade e a política de troca passam por um advogado.
- Domínio próprio: já registrado pelo Lucas (08/11/2026). Entra na Vercel na Etapa 10, com e sem "www", e o Resend usa o mesmo domínio para mandar os e-mails. Até lá, o endereço é só `divestir.vercel.app`: com "www" na frente, o navegador mostra o aviso de conexão não particular, porque o certificado da Vercel não cobre esse endereço.
- Avisos ao cliente (decisão do Lucas, 08/11/2026): o e-mail vem primeiro. O WhatsApp não trava nenhuma etapa e entra quando o provedor estiver liberado; até lá, todo aviso vai por e-mail. O WhatsApp do cliente continua sendo pedido no checkout, como no briefing.

## Pendências técnicas

- Etapa 8 (painel): reorganizar as regras de leitura de `pecas`, `cores`, `peca_imagens`, `designs` e `equipe` para uma regra por papel e por ação. O Supabase avisa que hoje há duas regras de leitura para usuários logados nessas tabelas (aviso só de desempenho). A mudança precisa de DROP POLICY, então pede confirmação.
- Preço de cada peça ainda está em aberto no briefing (`preco` vazio no banco). Da área de impressão, `area_impressao_cm` só tem a posição da arte na foto de base (`previa`, um primeiro chute); os centímetros de cada lado dependem da estamparia e entram antes do arquivo de impressão (Etapa 7).
- Antes de ligar o modo pago do Photoroom (`PHOTOROOM_MODO=producao` e o plano Basic, a partir de US$ 20 por mês com 1.000 fotos) e antes do lançamento: limitar o uso de `/api/recorte` e de `/api/fotos` por visitante. Hoje as rotas só recusam pedidos de outros sites; no modo pago cada recorte custa, e cada vaga aceita até 20 MB no espaço das fotos.
- A rotina diária que apaga as fotos vencidas (`apagar_em`, briefing "Segurança desde o primeiro dia") ainda não existe. Ela precisa apagar os arquivos pelo Storage do Supabase, não direto na tabela, e entra antes do lançamento, junto com o prazo dos termos para fotos de pedidos entregues.

## Etapa atual

Etapa 5: Montador completo (os 7 passos numa página só, prévia fixa, frente e costas, miniaturas de design com a foto do cliente, estado salvo; briefing, "Jornada do cliente e o montador"). Ainda não começou. Teste do briefing: montar uma peça do zero no celular.

- Ponto de partida: o montador de `/montar` (peça, cor e lado da foto de base), a tela `/montar/foto` (guia, checagem, recorte, enquadramento) e a prévia "Veja como fica" (motor do molde). Na Etapa 5 elas viram uma página só, e o enquadramento passa a ser feito em cima do próprio design.
- Faltam do Lucas, sem travar o começo: o preço de cada peça (o card mostra "a partir de"; o checkout da Etapa 6 precisa dele) e, mais adiante, os outros 5 designs da linha de lançamento.

Etapas concluídas: Etapa 1 (base do projeto), aprovada em 07/11/2026, com o logo definitivo ainda com o Lucas, que entra quando ficar pronto. Etapa 2 (catálogo), aprovada em 08/11/2026: o montador em `/montar` troca a foto certa por peça, cor e lado. As 30 fotos de base foram geradas de novo no Higgsfield, porque as originais não foram encontradas. Etapa 3 (foto), aprovada em 08/11/2026: em `/montar/foto`, o guia da foto perfeita, a checagem no aparelho, o recorte pelo Photoroom (modo de teste), o ajuste de enquadramento e a foto original e o recorte guardados no espaço privado do Supabase. O recorte foi testado com 8 fotos reais do Lucas: leva de 1 a 3 segundos e acerta pelo, cabelo e pessoas, inclusive casais e amigas juntas, mas leva junto o que encosta no protagonista (o carrinho do menino, a mesa do senhor, a perna na frente do cachorro, as asas pintadas na parede atrás do rapaz). Para isso existem o enquadramento, a dica "Nada na frente" e a revisão de arte da equipe. O Lucas testou o fluxo completo no site e aprovou ("ficou ótimo"). Foto de objeto ainda não entrou em nenhum teste. Etapa 4 (motor de templates), aprovada em 08/11/2026: o motor do molde em `src/lib/molde/` lê a configuração do design no banco, encaixa a foto e o nome e troca a tinta pela cor da peça; o Fã-Clube está cadastrado e aparece em "Veja como fica", em `/montar/foto`, nas 3 cores, em qualquer peça, na frente ou nas costas (a jaqueta college só nas costas), de perto ou com a peça inteira. O Lucas testou com fotos reais e aprovou ("ficou perfeito, todas as funcionalidades").

Como nasce um molde (decisão do Lucas, 08/11/2026, no lugar do Illustrator do briefing): as partes fixas da arte saem dos modelos de vetor do Higgsfield (Recraft V4.1 ou Ideogram Vector), em SVG, e são limpas para uma tinta só; o que muda a cada pedido (nome, foto, tinta) é montado no código. O Higgsfield continua sendo onde nascem o conceito e os mockups de cada design.

Fã-Clube: a letra "Fã-Clube" é a opção 1 do Recraft V4.1 (trabalho `153a1848-f6b4-459a-8741-458add71daf9`), escolhida pelo Lucas, e fica em `public/designs/fa-clube/letra.svg`; "Membro Oficial" em Instrument Serif itálica; o nome em Anton, até 10 letras, com o topo reto e a base descendo nas pontas (arco); o anel em volta da foto; e uma folga em volta da letra "Fã-Clube" onde ela passa por cima da foto. Tinta creme na peça preta e verde garrafa na branca e na creme. O quadro de 4:5 do enquadramento vira uma janela com a largura do diâmetro do círculo e o mesmo centro; na metade de cima, a foto pode passar do círculo até `vaza_acima` (70 unidades), e dali um círculo maior corta, para o nome nunca sumir. Se a cabeça aparecer cortada, é zoom demais: ajustar o enquadramento resolve.

Frente ou costas (decisão do Lucas, 08/11/2026): o cliente escolhe onde vai a estampa; a jaqueta college só aceita costas (a área dela só tem o lado `costas`). No moletom com capuz, a frente fica entre o fim dos cordões e o bolso, então a estampa da frente é menor.
