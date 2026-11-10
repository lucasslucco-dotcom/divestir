---
name: Divestir
description: Roupa com a foto de quem você ama, em designs autorais. Palco verde garrafa, papel creme e rosa elétrico só sobre o verde.
colors:
  verde: "#0d2b17"
  verde-claro: "#1f4d30"
  creme: "#faf5eb"
  rosa: "#ff4fa8"
  rosa-claro: "#ff7dbe"
  estudio: "#e9e9e7"
typography:
  display:
    fontFamily: "Anton, Arial Narrow, sans-serif"
    fontSize: "clamp(3.4rem, 12vw, 6rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "0em"
  headline:
    fontFamily: "Anton, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 9vw, 4.75rem)"
    fontWeight: 400
    lineHeight: 1
  destaque:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(1.5rem, 5.6vw, 2.4rem)"
    fontWeight: 400
    lineHeight: 1.25
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.56
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.1875rem"
    fontWeight: 700
    letterSpacing: "-0.005em"
  marca:
    fontFamily: "Anton, Arial Narrow, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    letterSpacing: "0.06em"
rounded:
  ingresso: "6px"
  foco: "8px"
  miniatura: "12px"
  previa: "16px"
  pilula: "9999px"
spacing:
  margem: "16px"
  vitrine-vao: "8px"
  grupo: "24px"
  respiro: "40px"
  lista: "48px"
  faixa: "80px"
  faixa-larga: "112px"
components:
  button-primary:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    typography: "{typography.button}"
    rounded: "{rounded.ingresso}"
    padding: "0 40px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.verde-claro}"
    textColor: "{colors.creme}"
  button-rosa:
    backgroundColor: "{colors.rosa}"
    textColor: "{colors.verde}"
    typography: "{typography.button}"
    rounded: "{rounded.ingresso}"
    padding: "0 40px"
    height: "56px"
  button-rosa-hover:
    backgroundColor: "{colors.rosa-claro}"
    textColor: "{colors.verde}"
  link-texto:
    textColor: "{colors.verde}"
    typography: "{typography.caption}"
    padding: "12px 0"
  marca:
    textColor: "{colors.creme}"
    typography: "{typography.marca}"
    padding: "8px"
  palco:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
  vitrine-legenda:
    textColor: "{colors.creme}"
    typography: "{typography.label}"
  previa-montador:
    backgroundColor: "{colors.estudio}"
    rounded: "{rounded.previa}"
  vista-pequena:
    backgroundColor: "{colors.estudio}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.miniatura}"
  seletor-peca:
    backgroundColor: "{colors.estudio}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.miniatura}"
  barra-cor:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    size: "32px"
  selo-sim:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  selo-nao:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  botao-zoom:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    rounded: "{rounded.pilula}"
    size: "44px"
  botao-zoom-hover:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
  campo-texto:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.title}"
    rounded: "{rounded.ingresso}"
    padding: "0 16px"
    height: "48px"
  pilula-escolha:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "12px 14px"
  pilula-escolha-ativa:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
  selo-previa:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    rounded: "{rounded.pilula}"
    padding: "4px 10px"
  selo-drop:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    rounded: "{rounded.pilula}"
    padding: "2px 8px"
  carrinho-topo:
    textColor: "{colors.verde}"
    typography: "{typography.caption}"
    size: "44px"
  campo-checkout:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.body}"
    rounded: "{rounded.ingresso}"
    padding: "0 16px"
    height: "48px"
  opcao-frete:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.caption}"
    rounded: "{rounded.miniatura}"
    padding: "14px 16px"
  opcao-frete-ativa:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
  aviso-teste:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.caption}"
    rounded: "{rounded.ingresso}"
    padding: "12px 16px"
  selo-pedido:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
    typography: "{typography.title}"
    rounded: "{rounded.pilula}"
    padding: "8px 16px"
---

# Design System: Divestir

## Overview

**Creative North Star: "O Fã-Clube Impresso"**

A Divestir se comporta como merch de fã-clube impressa: tinta verde garrafa, papel creme e um rosa elétrico que só acende sobre o verde. Quem a pessoa ama é o ídolo, e a interface é o material de divulgação desse ídolo: o ingresso, a camisa numerada, a vitrine da loja. Tudo é chapado, como uma estampa. Não tem sombra decorativa, gradiente de enfeite nem texto apagado.

O verde garrafa é o palco. É o verde exato do fundo das fotos do Fã-Clube (decisão do Lucas, 07/11/2026), então as peças aparecem soltas na página, sem moldura, como se estivessem penduradas na loja. O creme é o papel, onde a pessoa lê e monta. O rosa é a vida: ele marca o ingresso e os nomes, e mais nada. O site fala alto e com afeto ao mesmo tempo: títulos enormes em Anton caixa-alta, a frase do coração em Instrument Serif itálica, o resto em Inter. A composição é central e vertical, pensada para o polegar.

O sistema rejeita, por decisão do Lucas: poluição visual, cara de template genérico, rosa sobre o creme e qualquer cor fora da paleta. A paleta e as fontes estão fechadas (decisão do Lucas, 07/11/2026); só a marca escrita é provisória até o logo definitivo.

**Key Characteristics:**
- Palco verde garrafa para mostrar, papel creme para ler e montar.
- Fotos de exemplo com o fundo no verde exato da página: a peça flutua, sem moldura.
- Uma tinta só por superfície: creme cheio sobre o verde, verde cheio sobre o creme.
- Rosa elétrico só sobre o verde, no ingresso e nos nomes.
- Anton gigante em caixa-alta para títulos, Instrument Serif itálica para o afeto, Inter para o resto.
- Celular primeiro: coluna central, toque de 44px, a peça já aparece na primeira tela.

## Colors

Uma cor de marca, um papel e um acento, como uma impressão em duas tintas com uma cor especial.

### Primary
- **Verde Garrafa** (#0D2B17): a cor principal da marca, tirada do fundo das fotos do Fã-Clube. É o palco do topo, da vitrine e do rodapé, e a tinta de todo texto sobre o creme. Contraste de 14:1 com o creme, nos dois sentidos.
- **Verde Garrafa Aceso** (#1F4D30): só para o ingresso verde em hover e no toque. Não aparece parado na tela.

### Secondary
- **Rosa Elétrico** (#FF4FA8): o acento que dá vida ao verde, vindo do Electric Fuchsia, cor-chave de 2026 da WGSN e da Coloro. Sobre o verde tem 5:1 de contraste: vale para o ingresso, os nomes da vitrine e a seleção de texto.
- **Rosa Aceso** (#FF7DBE): só para o ingresso rosa em hover e no toque.

### Neutral
- **Papel Creme** (#FAF5EB): o papel das superfícies de ler e de montar, e o texto sobre o verde. Ele conversa com o Cloud Dancer, a cor do ano 2026 da Pantone.
- **Cinza do Estúdio** (#E9E9E7): não é cor de marca. É o fundo das fotos de base do catálogo, e aparece só atrás de fotos: na moldura da prévia, das vistas pequenas e das miniaturas do montador e nas fotos do guia, para a moldura ter a cor da foto enquanto ela carrega. Nunca é fundo de texto corrido nem de faixa.

### Named Rules
**A Regra da Tinta Única.** Cada superfície tem uma tinta só, cheia: creme sobre o verde, verde sobre o creme. Nada de texto com transparência para recuar. A hierarquia vem do tamanho, do peso e da fonte.

**A Regra do Rosa no Verde.** O rosa só existe sobre o verde. Sobre o creme ele some (2.8:1), então lá ele nunca entra, nem como texto, nem como fundo, nem como ícone. Ele marca o que importa e nunca vira fundo grande.

**A Regra do Palco.** O verde é para mostrar: topo, vitrine de peças e rodapé. O creme é para ler e fazer: como funciona, montador, carrinho e checkout. Toda foto no palco tem o fundo no verde exato da página, acertado pelo script `scripts/preparar-fotos.py` (modo vitrine), para a peça flutuar sem emenda. As fotos de base do montador seguem a mesma lógica no papel: fundo no Cinza do Estúdio, acertado pelo mesmo script no modo catálogo.

## Typography

**Display Font:** Anton (com Arial Narrow)
**Body Font:** Inter variável (com system-ui)
**Destaque Font:** Instrument Serif, regular e itálica (com Georgia)

**Character:** Anton condensada e em caixa-alta tem o grito do pôster de show. A Instrument Serif itálica é a voz de quem ama, e a Inter cuida de explicar sem disputar atenção.

### Hierarchy
- **Display** (Anton 400, de 3.4rem no celular a 6rem, entrelinha 1.12, caixa-alta, linhas balanceadas): o título do topo. A entrelinha deixa o acento de "VOCÊ" livre da linha de cima.
- **Headline** (Anton 400, de 2.6rem a 4.75rem, entrelinha 1, caixa-alta): o título de cada faixa, como "Como funciona".
- **Destaque** (Instrument Serif itálica, de 1.5rem a 2.4rem, entrelinha 1.25, até 22ch): a frase logo abaixo do título. Na home, a frase é "Uma foto DIVESTIR.", com o nome da marca em Anton no meio da linha (lê-se "de vestir").
- **Title** (Inter 600, 1.125rem): o título de cada passo ou item.
- **Body** (Inter 400, 1rem, entrelinha 1.625): o texto corrido. Parágrafos quebram sem palavra sozinha na última linha.
- **Caption** (Inter 400, 0.9375rem, até 34ch): legendas e links de apoio.
- **Label** (Inter 400, 0.875rem): a legenda de cada peça da vitrine, com o nome em 600 e em rosa.
- **Button** (Inter 700, 1.1875rem, -0.005em): o texto do ingresso.
- **Marca** (Anton 400, 1.25rem, +0.06em, caixa-alta): o nome Divestir no topo, até o logo chegar.

### Named Rules
**A Regra do Teto de 6rem.** Título nenhum passa de 6rem. O impacto vem da Anton e do contraste, não de tamanho sem limite.

**A Regra da Caixa-Alta da Anton.** Caixa-alta é só da Anton: títulos e marca. Inter e Instrument Serif ficam em caixa normal, e o navegador nunca inventa negrito ou itálico que a fonte não tem.

## Layout

Coluna única e centralizada, celular primeiro. A margem lateral é de 16px e o texto vai até 64rem. O topo e a vitrine formam um palco verde contínuo: título, frase, ingresso e, logo abaixo, as peças, que já aparecem na primeira tela do celular. Depois vem o papel creme com "Como funciona", e o rodapé fecha em verde.

A vitrine desliza com o dedo no celular: cada peça ocupa 78% da largura, com 8px entre elas, e a próxima aparece pela metade, convidando a deslizar. A partir de 640px são duas peças e meia; a partir de 1024px, quatro colunas fixas até 72rem. Com uma peça só, ela fica sozinha no centro, com até 28rem.

No celular, cada faixa respira 80px em cima e embaixo; a partir de 640px, 112px. Grupos ficam apertados e grupos diferentes ficam bem separados: 24px entre o título e a frase, 40px antes do ingresso, 48px antes da vitrine. Sempre há mais espaço acima de um título do que abaixo dele.

O carrinho, o checkout e a página do pedido são telas de trabalho no creme, com o título em Anton e até 64rem de largura. No celular, uma coluna só: no carrinho, as peças e depois o resumo; no checkout, os quatro passos numerados e, antes do botão, o resumo com o total. A partir de 1024px, o conteúdo fica à esquerda e o resumo à direita, numa coluna de 22rem que acompanha a rolagem. O papel creme vai sempre até o fim da tela, mesmo em página curta: o verde só aparece quando a tela estica além do conteúdo.

O montador é uma página só e uma tela de trabalho, toda no creme (briefing: "a prévia da peça fica fixa, no topo no celular, à esquerda no desktop, e os passos rolam ao lado"). No celular: a marca, o título e, presa no alto da tela, a prévia (a vista grande, as vistas pequenas ao lado e as cores embaixo), separada dos passos por um fio verde; os 7 passos rolam por baixo dela. A vista grande tem 35% da altura da tela (de 200 a 304px) e nunca passa da largura disponível. Enquanto a pessoa digita no celular, a prévia encolhe e o campo para logo abaixo dela. De 640px a 1023px, a mesma coluna fica centralizada com até 36rem, para a prévia não engolir a tela do tablet. A partir de 1024px, a prévia vai para a esquerda e acompanha a rolagem, e o título e os passos ficam à direita, numa coluna de 26rem. A prévia nunca passa da altura da janela, nem em notebook baixo.

## Elevation & Depth

O sistema é chapado: a interface não tem sombra. A única profundidade é a das próprias fotos, com a luz de estúdio e a sombra natural da peça sobre o fundo verde. As fotos se fundem à página por um esfumado de 6% em cima e embaixo, que existe só para esconder a emenda e não aparece como efeito.

### Named Rules
**A Regra do Impresso.** Se não dá para imprimir com as tintas da marca, não entra: nada de sombra, brilho, vidro ou gradiente de enfeite na interface.

## Shapes

A forma vem do papel de fã. O botão principal é um ingresso: retângulo com canto de 6px e dois furos de 10px de raio nas laterais, recortados por máscara. O contorno de foco segue o ingresso com canto de 8px. Os números dos passos são vazados, como a numeração de uma camisa de time ou de uma jaqueta college. As fotos da vitrine não têm forma nenhuma: sem canto, sem borda e sem moldura. No montador é diferente, porque ali a foto é ferramenta e não palco: a prévia fica numa moldura de Cinza do Estúdio com canto de 16px, e as miniaturas, com canto de 12px. As escolhas que se alternam (Nas costas e Na frente) e os tamanhos são pílulas.

### Named Rules
**A Regra do Picote.** Furo e picote são a assinatura da Divestir: estão no ingresso e no ícone do site. Eles dizem "isso é seu", e nunca viram textura de fundo ou enfeite solto.

## Components

### Buttons
O ingresso é a ação principal, firme e única por tela.
- **Shape:** ingresso, retângulo de canto suave (6px) com dois furos laterais.
- **Primary (sobre o creme):** fundo Verde Garrafa, texto Papel Creme em Inter 700, altura mínima de 56px e 40px de respiro nas laterais.
- **Rosa (sobre o verde):** fundo Rosa Elétrico com texto Verde Garrafa. É o ingresso do topo da home.
- **Hover / Focus:** com mouse, o hover acende o fundo (Verde Garrafa Aceso ou Rosa Aceso) em 200ms, com saída exponencial. No toque, o botão também acende e desce 1px, e o quadrado cinza do navegador fica desligado. Pelo teclado, o foco ganha um contorno de 2px na cor do próprio ingresso, a 5px de distância e com canto de 8px.
- **Secondary:** link de texto sublinhado, com sublinhado de 1px a 0.3em do texto, que engrossa para 2px no hover. A área de toque tem 44px de altura.

### Navigation
- **Style:** a marca, centralizada no topo, em Anton caixa-alta com 0.06em de espaçamento: creme sobre o palco verde e verde sobre o creme. A área de toque tem 44px de altura. Ainda não há menu.
- **Carrinho no topo:** quando tem peça no carrinho, aparece à direita uma sacola desenhada (traço de 2px) com o número de peças em Inter 600 e números tabulares, na tinta da superfície, alinhada com a largura do conteúdo da página. Sem peça no carrinho, e na própria página do carrinho, ela não aparece: a marca fica sozinha.

### Palco verde
- **Style:** bloco de largura total em Verde Garrafa com texto Papel Creme. No celular, a barra do navegador fica verde na home e creme nas telas de trabalho.

### Vitrine de exemplos (signature)
A vitrine mostra a peça pronta antes de a pessoa ter a sua. Cada foto mostra as costas de uma peça com o design Fã-Clube, no fundo verde exato, sem moldura, e embaixo vem a legenda: o nome em Rosa Elétrico e a peça em Papel Creme ("Thor · Camiseta oversized preta"). Abaixo de tudo, uma legenda diz que são exemplos. Toda foto nova passa pelo `scripts/preparar-fotos.py` no modo vitrine, que recorta em 4:5 (896 × 1120px) e acerta só o fundo perto das bordas, sem tocar na peça. A primeira foto carrega com prioridade; as outras, quando chegam perto da tela.

### Montador
A página onde a pessoa monta a peça e vê na hora como ela fica: a prévia fixa e os 7 passos do briefing (peça, foto, nome, design, cor, tamanho e carrinho). Toda escolha é feita com botões de opção de verdade no código (o leitor de tela anuncia "Peça", "Cor da peça", "Design", "Tamanho"), e a prévia é lida em voz alta quando muda. Tudo fica guardado no navegador: fechou a aba, volta de onde parou, com a foto.
- **Prévia fixa (signature):** a vista grande, em 4:5, na moldura de Cinza do Estúdio com canto de 16px e nenhum botão por cima, e, ao lado, as outras vistas em miniatura (canto de 12px, legenda em Inter 600 de 12px), que viram a grande ao toque. Antes da foto, as vistas são a frente e as costas da peça; com a foto, "De perto" (uma janela em volta da estampa, que mostra a arte grande sem perder o tecido), o lado da estampa inteiro e o outro lado. A luz e a sombra da foto de base passam por cima da tinta. Nada pisca: enquanto uma vista nova é montada, fica a anterior.
- **Cores:** embaixo da vista grande, bolinhas de 32px com contorno verde fino e área de toque de 44px; a escolhida ganha um anel verde de 2px a 3px de distância, e o nome dela aparece ao lado em Inter 600. À direita, o selo "Prévia ilustrativa", fora da imagem para nunca cobrir a arte.
- **Marca no peito:** com a estampa nas costas, a frente leva DIVESTIR em Anton caixa-alta com 0,06em, pequenininho, do lado esquerdo de quem veste e na tinta do design (decisão do Lucas, 08/11/2026, até o logo chegar).
- **Passos:** a lista numerada (abaixo), com o título em Inter 600 e, quando o passo está resolvido, um visto e o resumo da escolha ("Camiseta oversized", "Fã-Clube, nas costas"). Um fio verde separa um passo do outro. Ao ir para um passo, ele para logo abaixo da prévia.
- **1. A peça:** miniaturas da peça na cor escolhida, com nome em Inter 600, caimento em Inter 400 e "a partir de" com o preço, quando houver. A escolhida ganha borda Verde Garrafa de 2px. No celular, a fila desliza com o dedo; no computador, vira uma grade de três colunas.
- **2. A foto:** a frase em Instrument Serif itálica, o guia da foto perfeita (abaixo) e o ingresso "Escolher a foto" ("Pode ser do álbum ou tirada na hora."), com o aviso em Inter 14px de que a foto serve só para fazer a peça e é apagada em 30 dias se a pessoa não comprar. As fotos que a pessoa já mandou (das peças no carrinho) aparecem antes do guia, em miniatura com o nome, para reaproveitar.
- **3. O nome:** rótulo em Inter 600 ("Como ele(a) se chama?"), caixa de 48px de altura, contorno Verde Garrafa de 1px, canto de 6px, texto em Inter 600 caixa-alta com 0,04em. Sem texto de exemplo dentro da caixa: o exemplo vem embaixo, em Inter 400 ("Até 10 letras, como Thor, Vó Cida ou Duda."). O nome entra na prévia enquanto a pessoa digita. Emoji e símbolos não existem na fonte da estampa (confirmado pelo Lucas, 10/11/2026): eles nem entram na caixa, e um aviso com o ícone de alerta explica ("Emoji e símbolos não saem na estampa: o nome vai só com letras e números."). O aviso fica até a pessoa voltar à caixa.
- **4. O design:** miniaturas de cada design já com a foto e o nome do cliente (canto de 12px, borda verde de 2px no escolhido), o nome do design em Inter 600 e, nos designs de drop, o selo "Novo" ou "Últimos dias" (pílula Verde Garrafa cheia, texto creme de 11px). Embaixo, "Prévias ilustrativas, com a sua foto e o nome." Depois, "Onde vai a estampa?" com a pílula "Nas costas / Na frente" (a jaqueta college troca a pílula pela frase "Nessa peça, a estampa vai nas costas.") e, com a estampa nas costas, o aviso do DIVESTIR no peito. Antes da foto, o passo só explica que os designs aparecem ali com ela. Design que pede mais um texto (o ano do Em Cartaz e do Letreiro) mostra o campo logo abaixo das miniaturas, igual ao do nome: rótulo em Inter 600 em forma de pergunta ("Desde que ano?"), caixa de 48px e, embaixo, "Vai na estampa. Por exemplo: 2019." O valor aparece na prévia enquanto a pessoa digita e entra no resumo.
- **Os designs (estampas):** cada design é uma tinta só (creme na peça preta, Verde Garrafa na branca e na creme) mais a foto. A arte fixa de cada design nasce no Higgsfield (arte chapada a partir do mockup aprovado, vetorizada pelo Ideogram Vector), nunca desenhada no código: é ela que dá a riqueza de estampa de verdade (fita, raios, louros, letreiro, letras de pôster). O que o site escreve (o nome e o ano do cliente) usa Anton para nomes e faixas, Instrument Serif para o tom de assinatura e, só nas estampas de cinema, Bodoni Moda (a serifada de pôster de filme; não é fonte do site). Formas chapadas: faixa cheia com o texto vazado (aparece o tecido), contorno, retícula de pontos. A única transparência é a sombra na base da foto do Em Cartaz, para o nome ler por cima. Quando um texto passa por cima da foto, ganha um respiro em volta das letras. Hoje: Fã-Clube, Turnê Mundial, Ao Vivo, Em Cartaz e Letreiro.
- **5. A cor:** as três cores lado a lado, já com a estampa na tinta de cada uma (de perto), com o nome embaixo e borda verde de 2px na escolhida.
- **6. O tamanho:** pílulas de 44px de altura (PP ao GGG) com contorno verde de 1px; a escolhida fica Verde Garrafa com texto creme. "Tabela de medidas" é link de texto e abre a tabela ali mesmo, só nas peças que têm medidas: tamanho em Inter 600, valores em números tabulares, fio verde entre as linhas e, embaixo, como medir.
- **7. Sua Divestir:** a miniatura de perto com o selo embaixo e o resumo em duas colunas (rótulo em Inter 400, valor em Inter 600). Se faltar algo, a frase diz o quê, com um link para cada passo. O ingresso é "Adicionar ao carrinho"; com a peça guardada, aparecem "Prontinho, sua Divestir está no carrinho!", o ingresso "Finalizar compra" e o link "Criar outra Divestir". Se a pessoa mudar alguma coisa depois de adicionar, a peça continua sendo a mesma: uma frase avisa ("Essa peça já está no carrinho, e você mudou alguma coisa nela."), o ingresso vira "Atualizar a peça do carrinho" e o link de texto "Adicionar como outra peça" serve para quem quer as duas.

### Passo da foto: guia, checagem e enquadramento
- **Par certo e errado (signature):** cada dica mostra a mesma foto feita do jeito certo e do jeito errado, lado a lado, com canto de 12px. As duas fotos têm o mesmo protagonista (o mesmo cachorro, a mesma moça), para a diferença ser só o erro. Embaixo de cada par vêm o nome da dica em Inter 600 e uma linha em Inter 400. As dicas deslizam com o dedo numa fila só, a próxima aparecendo na beirada, e a dica de ouro fecha a fila: título em Anton, a frase em Instrument Serif itálica e o mesmo detalhe de uma foto antes e depois de passar pelo WhatsApp.
- **Selos "Assim sim" e "Assim não":** pílulas pequenas no canto de baixo da foto. "Assim sim" é Verde Garrafa com texto creme e um visto; "Assim não" é creme com contorno verde de 1px e um xis. O sentido nunca depende só da cor: o ícone e a palavra dizem o mesmo.
- **Resultado da checagem:** a miniatura da foto escolhida (canto de 12px) e, ao lado, o veredito. "Foto perfeita" é a única pílula verde cheia, com um visto. Aviso e bloqueio são frase em Inter 600 com ícone: um círculo de alerta no aviso e um xis no bloqueio. O briefing pede aviso amarelo, mas a paleta é fechada, então a diferença entre aviso e bloqueio vem do ícone, da frase e do botão, nunca de uma cor nova. Embaixo, a mensagem e o tamanho da foto em números tabulares. Depois vem "Tirando o fundo…".
- **Enquadramento (signature):** com o recorte pronto, a própria prévia vira o ajuste, já com o design: a vista grande fica "De perto" e a foto se move junto com o dedo. Arrastar move; a pinça de dois dedos dá zoom em volta dos dedos; no computador, a rodinha com Ctrl (ou a pinça do trackpad) faz o mesmo, e sem Ctrl a página rola normalmente. Pelo teclado, a prévia recebe foco: as setas movem, + e − dão zoom e 0 redefine. No passo, o veredito fica curto, uma linha diz como ajustar (o texto muda entre toque e mouse) e vêm os botões de zoom: círculos de 44px com contorno Verde Garrafa de 1px, que acendem em verde com texto creme no hover; no limite do zoom, o contorno fica tracejado em vez de apagar, porque a tinta é única. Entre os botões, a porcentagem em Inter 600 com números tabulares; "Redefinir" é link de texto e só aparece quando há algo para desfazer. Logo depois, o ingresso "Ficou ótimo" e o link "Trocar a foto". O zoom vai de 50% a 400%, e o centro do protagonista nunca sai do quadro. Depois de "Ficou ótimo", a prévia trava e aparece "Ajustar o enquadramento".
- **Definição da estampa:** embaixo dos botões de zoom, um aviso em Inter 600 com o ícone de alerta aparece quando a foto tem poucos pontos para o tamanho impresso, contando só quem aparece e o zoom. É a foto que se adapta à estampa, não o contrário (decisão do Lucas, 10/11/2026): o aviso pede uma foto melhor ("Essa foto está no limite da qualidade da nossa estampa. Se tiver uma maior ou tirada mais de perto, manda ela."; com zoom, "Para aproximar assim, manda uma foto tirada mais de perto."). No aviso forte ("Essa foto não tem qualidade para a nossa estampa."), o ingresso vira "Escolher outra foto" e seguir com a mesma foto vira link de texto ("Usar essa mesmo assim"). Ele muda ao vivo com o zoom e, enquanto aparece, a pílula "Foto perfeita" sai de cena.
- **O nome e a cabeça (Fã-Clube):** a base do nome acompanha o círculo da foto, e a foto chega com a cabeça encostando na base das letras, sem cobrir. Nome curto (ZÉ, LU, THOR) fica no meio, quase reto. A cedilha, que desce para dentro do círculo, é pintada de novo por cima da foto, com um respiro em volta, para PAÇOCA nunca virar PACOCA.
- **Ícones:** desenhados em SVG, com traço de 2px e pontas redondas, na cor do texto. Nunca emoji.

### Carrinho, checkout e pedido
A compra continua no papel creme, com as mesmas peças do montador: lista com fio verde entre os itens, número vazado nos passos, ingresso como ação única e link de texto para o resto. Nada de cartão em volta de cartão.
- **Peça no carrinho:** a miniatura de perto já com a foto e o nome (canto de 12px), o nome da peça em Inter 600 e o preço à direita (com "preço de teste" embaixo, em 14px, enquanto a loja estiver em teste), a cor, o tamanho e o design numa linha, o nome da estampa em Anton caixa-alta e os links "Editar" e "Tirar do carrinho". Tirar uma peça mostra "Você tirou THOR do carrinho." com "Desfazer", em vez de pedir confirmação.
- **Presente:** caixa de marcar nativa, verde, com a sacola de presente desenhada e "É presente" em Inter 600; embaixo, o que vem junto e o preço. Marcada, abre a "Mensagem do cartão" (caixa de texto com contorno verde de 1px e canto de 6px) com o contador de letras em números tabulares.
- **Foto que não chegou:** ícone de alerta e frase em Inter 600 ("A foto desta peça não chegou até a gente."), a explicação e o link "Mandar a foto de novo". Enquanto a foto não chega, "Finalizar compra" explica o que falta em vez de seguir. Foto que ainda está subindo não trava nada: a pessoa segue para o checkout, e o ingresso "Ir para o pagamento" espera por ela ("Esperando a sua foto chegar…").
- **Resumo:** rótulo à esquerda e valor à direita, em números tabulares; um fio verde separa o total, em Inter 600. Embaixo do ingresso vem a mensagem de prazo do briefing: a primeira frase em Instrument Serif itálica ("Cada Divestir é feita sob medida pra você.") e o resto em Inter.
- **Campos do checkout:** rótulo em Inter 600 sempre visível em cima, caixa de 48px com contorno verde de 1px, canto de 6px e texto em Inter 16px (o celular não dá zoom), ajuda embaixo em Inter 15px. Com erro, a caixa ganha um segundo contorno por dentro (fica com 2px, sem mudar de tamanho) e a ajuda vira a frase do erro em Inter 600 com o ícone de alerta; o foco vai para o primeiro campo com problema. Erro só aparece depois que a pessoa sai do campo ou tenta seguir. CPF, WhatsApp e CEP ganham máscara enquanto a pessoa digita, e o CEP preenche rua, bairro, cidade e estado.
- **Opções de frete:** cartões de 12px com contorno verde de 1px: o serviço em Inter 600, "Chega em X a Y dias úteis" (o prazo de fazer a peça já somado) e, menor, quanto é de produção e quanto é de entrega; o preço à direita. A escolhida fica verde cheia com texto creme, como a pílula escolhida.
- **Aviso de teste:** enquanto a loja estiver em modo de teste, um quadro com contorno tracejado verde de 1px e canto de 6px diz que os preços são de teste e nada é cobrado. Tracejado é o "ainda não é de verdade" da marca, como no limite do zoom.
- **Pagamento:** o formulário do Mercado Pago entra na página com as cores da marca (base e textos verde garrafa, fundo e campos creme, botão verde com texto creme, cantos de 6px e 12px). Recusa vira frase com ícone de alerta acima do formulário, dizendo o motivo e o que fazer.
- **Pix:** título em Anton ("Falta só o Pix"), o QR, o "Pix copia e cola" num campo de leitura e o ingresso "Copiar o código Pix" (que vira "Código copiado!" com um visto), a hora em que o código vence e "Esperando o Pix…" com o ícone girando. A página muda sozinha quando o Pix cai.
- **Confirmação (signature):** "Valeu, Lucas!" em Instrument Serif itálica, "Recebemos seu pedido!" em Anton gigante, "Agora é com a gente." e o selo do pedido: pílula verde cheia com texto creme, visto e "Pedido nº 1001". As prévias das peças compradas aparecem com o nome em Inter 600; no computador, ficam à direita do texto. Depois vêm "E agora?", os valores e o link do pedido para guardar.

### Páginas de erro
No papel creme, com a marca no topo: título em Anton ("Essa página saiu de cena", "Ops, travou aqui"), uma frase em Instrument Serif itálica, um ingresso (voltar a montar ou tentar de novo) e um link de texto. Nenhuma tela padrão do navegador ou em inglês.

### Imagem do link
A imagem que aparece quando o site é compartilhado (1200 × 630): fundo Verde Garrafa, "Crie sua Divestir" em Anton creme, a frase principal em Instrument Serif itálica ("Aquela foto merece virar roupa.") e três peças da vitrine saindo pela base. É gerada pelo `scripts/gerar-imagem-do-link.mjs` a partir das fotos da vitrine e das fontes da marca.

### Lista numerada (signature)
- **Style:** números vazados em Anton de 48px, com contorno verde de 1.5px, numa coluna de 28px. Ao lado vêm o título em Inter 600 e o texto em Inter 400. A lista é numerada de verdade no código, e o número desenhado é só visual.

### Superfícies do navegador
- **Style:** a seleção de texto é rosa com texto verde. O cursor de digitação e os controles nativos (caixa de marcar, opção) são verdes, e a barra de rolagem é um verde-sálvia. Ao esticar a tela no celular, aparece o verde. Nada fica com a cara padrão do navegador.

## Do's and Don'ts

### Do:
- **Do** use Verde Garrafa cheio em todo texto sobre o Papel Creme (14:1), e creme cheio sobre o verde.
- **Do** use o Rosa Elétrico só sobre o verde: no ingresso, nos nomes da vitrine e na seleção.
- **Do** passe toda foto da vitrine pelo `scripts/preparar-fotos.py vitrine`, e toda foto de base do catálogo pelo `scripts/preparar-fotos.py catalogo`, antes de publicar.
- **Do** mostre na vitrine pet, gente e peças e cores diferentes, sempre com o mesmo fundo verde.
- **Do** mantenha todo título em até 6rem e o ingresso como ação principal, um por tela.
- **Do** garanta 44px de área de toque em tudo que é clicável.

### Don't:
- **Don't** coloque rosa sobre o creme (2.8:1).
- **Don't** use texto com transparência para criar hierarquia.
- **Don't** ponha moldura, canto arredondado ou sombra nas fotos da vitrine.
- **Don't** use o Cinza do Estúdio fora da moldura de uma foto.
- **Don't** use sombra, brilho, vidro ou gradiente de enfeite na interface.
- **Don't** coloque um rótulo pequeno em caixa-alta em cima de um título.
- **Don't** encha a tela: nada de poluição visual ou cara de template genérico.
