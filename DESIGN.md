---
name: Divestir
description: Merch de ídolo com a foto de quem você ama. Palco verde garrafa, papel creme e rosa elétrico só sobre o verde.
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
  chave-lado:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.pilula}"
    padding: "12px 16px"
  chave-lado-ativa:
    backgroundColor: "{colors.verde}"
    textColor: "{colors.creme}"
  seletor-peca:
    backgroundColor: "{colors.estudio}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    rounded: "{rounded.miniatura}"
  barra-cor:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.verde}"
    typography: "{typography.label}"
    padding: "12px 16px"
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
- **Cinza do Estúdio** (#E9E9E7): não é cor de marca. É o fundo das fotos de base do catálogo, e aparece só atrás delas: na moldura da prévia e das miniaturas do montador, para a moldura ter a cor da foto enquanto ela carrega. Nunca é fundo de texto nem de faixa.

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
- **Destaque** (Instrument Serif itálica, de 1.5rem a 2.4rem, entrelinha 1.25, até 22ch): a frase logo abaixo do título.
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

O montador é uma tela de trabalho, toda no creme. No celular, é uma coluna só: título, prévia grande, a fila de peças que desliza com o dedo e, presa no pé da tela, a barra de cor. De 640px a 1023px, a mesma coluna fica centralizada com até 36rem, para a prévia não engolir a tela do tablet. A partir de 1024px, a prévia vai para a esquerda e acompanha a rolagem, e as escolhas ficam à direita numa coluna de 25rem, juntas no alto. A prévia nunca passa da altura da janela, nem em notebook baixo.

## Elevation & Depth

O sistema é chapado: a interface não tem sombra. A única profundidade é a das próprias fotos, com a luz de estúdio e a sombra natural da peça sobre o fundo verde. As fotos se fundem à página por um esfumado de 6% em cima e embaixo, que existe só para esconder a emenda e não aparece como efeito.

### Named Rules
**A Regra do Impresso.** Se não dá para imprimir com as tintas da marca, não entra: nada de sombra, brilho, vidro ou gradiente de enfeite na interface.

## Shapes

A forma vem do papel de fã. O botão principal é um ingresso: retângulo com canto de 6px e dois furos de 10px de raio nas laterais, recortados por máscara. O contorno de foco segue o ingresso com canto de 8px. Os números dos passos são vazados, como a numeração de uma camisa de time ou de uma jaqueta college. As fotos da vitrine não têm forma nenhuma: sem canto, sem borda e sem moldura. No montador é diferente, porque ali a foto é ferramenta e não palco: a prévia fica numa moldura de Cinza do Estúdio com canto de 16px, e as miniaturas, com canto de 12px. As escolhas que se alternam (Frente e Costas) são pílulas.

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
- **Style:** só a marca, centralizada no topo, em Anton caixa-alta com 0.06em de espaçamento: creme sobre o palco verde e verde sobre o creme. A área de toque tem 44px de altura. Ainda não há menu.

### Palco verde
- **Style:** bloco de largura total em Verde Garrafa com texto Papel Creme. No celular, a barra do navegador fica verde na home e creme nas telas de trabalho.

### Vitrine de exemplos (signature)
A vitrine mostra a peça pronta antes de a pessoa ter a sua. Cada foto mostra as costas de uma peça com o design Fã-Clube, no fundo verde exato, sem moldura, e embaixo vem a legenda: o nome em Rosa Elétrico e a peça em Papel Creme ("Thor · Camiseta oversized preta"). Abaixo de tudo, uma legenda diz que são exemplos. Toda foto nova passa pelo `scripts/preparar-fotos.py` no modo vitrine, que recorta em 4:5 (896 × 1120px) e acerta só o fundo perto das bordas, sem tocar na peça. A primeira foto carrega com prioridade; as outras, quando chegam perto da tela.

### Montador
A tela onde a pessoa escolhe a peça e vê na hora como ela fica. Tudo é escolha única, feita com botões de opção de verdade no código (o leitor de tela anuncia "Peça", "Cor da peça" e "Lado da peça"), e o resumo da escolha é lido em voz alta quando muda.
- **Prévia (signature):** foto de base grande em 4:5, na moldura de Cinza do Estúdio com canto de 16px, sem nenhum botão por cima: a peça aparece inteira. Todas as cores e os dois lados da peça escolhida já ficam carregados e empilhados; trocar de cor ou de lado só acende a foto certa, num esmaecer de 300ms com saída exponencial. Nada pisca: enquanto a foto chega, aparece o cinza da própria foto.
- **Frente e Costas:** pílula com contorno Verde Garrafa de 1px, ao lado das cores. A opção escolhida fica Verde Garrafa com texto creme. Cada opção tem 44px de altura.
- **Seletor de peça:** miniaturas da peça na cor escolhida, com nome em Inter 600 e caimento em Inter 400 embaixo. A escolhida ganha borda Verde Garrafa de 2px. No celular, a fila desliza com o dedo e mostra a próxima peça pela metade; no computador, vira uma grade de três colunas.
- **Barra de cor:** no celular, presa no pé da tela com um fio verde em cima, para a cor e o lado estarem sempre ao alcance do polegar, mesmo com a prévia rolada. Bolinhas de 40px com contorno verde fino, nome embaixo e área de toque de 44px; a escolhida ganha um anel verde de 2px a 3px de distância. À direita, a pílula Frente e Costas. A barra tem uma linha só até nos celulares de 360px. O resumo da escolha ("Jaqueta college · Mangas contrastantes, cor creme, de frente") não aparece na tela, mas é lido pelo leitor de tela a cada troca. No computador, a barra deixa de ser presa e entra na coluna das escolhas, com as cores e o lado lado a lado.

### Tela da foto: guia da foto perfeita
O passo "Manda a foto" (`/montar/foto`) mostra o guia antes do botão de enviar, como pede o briefing. A tela segue o desenho do montador: no celular, uma coluna com o botão "Escolher a foto" preso no pé da tela; no tablet, a coluna centralizada; no computador, o guia à esquerda e, à direita, o título, o resultado e o botão, que acompanham a rolagem.
- **Par certo e errado (signature):** cada dica mostra a mesma foto feita do jeito certo e do jeito errado, lado a lado, com canto de 12px. As duas fotos têm o mesmo protagonista (o mesmo cachorro, a mesma moça), para a diferença ser só o erro. Embaixo de cada par vêm o nome da dica em Inter 600 e uma linha em Inter 400. No celular, as dicas deslizam com o dedo e a próxima aparece na beirada; a partir de 640px, viram uma grade de duas colunas.
- **Selos "Assim sim" e "Assim não":** pílulas pequenas no canto de baixo da foto. "Assim sim" é Verde Garrafa com texto creme e um visto; "Assim não" é creme com contorno verde de 1px e um xis. O sentido nunca depende só da cor: o ícone e a palavra dizem o mesmo.
- **Dica de ouro:** depois das dicas, com um fio verde em cima, o título em Anton, a frase em Instrument Serif itálica e o mesmo detalhe de uma foto antes e depois de passar pelo WhatsApp.
- **Resultado da checagem:** a miniatura da foto escolhida (canto de 12px) e, ao lado, o veredito. "Foto perfeita" é a única pílula verde cheia, com um visto. Aviso e bloqueio são frase em Inter 600 com ícone: um círculo de alerta no aviso e um xis no bloqueio. O briefing pede aviso amarelo, mas a paleta é fechada, então a diferença entre aviso e bloqueio vem do ícone, da frase e do botão, nunca de uma cor nova. Embaixo, a mensagem e o tamanho da foto em números tabulares.
- **Ícones:** desenhados em SVG, com traço de 2px e pontas redondas, na cor do texto. Nunca emoji.

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
- **Don't** use o Cinza do Estúdio fora da moldura das fotos de base.
- **Don't** use sombra, brilho, vidro ou gradiente de enfeite na interface.
- **Don't** coloque um rótulo pequeno em caixa-alta em cima de um título.
- **Don't** encha a tela: nada de poluição visual ou cara de template genérico.
