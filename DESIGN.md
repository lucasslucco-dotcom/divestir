---
name: Divestir
description: Merch de ídolo com a foto de quem você ama. Tinta azul sobre papel creme, amarelo só sobre o azul.
colors:
  creme: "#faf5eb"
  azul: "#2954d1"
  azul-escuro: "#2348b4"
  amarelo: "#f5db83"
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
  estampa:
    fontFamily: "Anton, Arial Narrow, sans-serif"
    fontSize: "clamp(5rem, 25vw, 11.5rem)"
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
  disco: "9999px"
spacing:
  margem: "16px"
  grupo: "24px"
  respiro: "40px"
  lista: "48px"
  faixa: "80px"
  faixa-larga: "112px"
components:
  button-primary:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.creme}"
    typography: "{typography.button}"
    rounded: "{rounded.ingresso}"
    padding: "0 40px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.azul-escuro}"
    textColor: "{colors.creme}"
  link-texto:
    textColor: "{colors.azul}"
    typography: "{typography.caption}"
    padding: "12px 0"
  marca:
    textColor: "{colors.azul}"
    typography: "{typography.marca}"
    padding: "8px"
  faixa-azul:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.creme}"
  disco-da-foto:
    backgroundColor: "{colors.creme}"
    textColor: "{colors.azul}"
    rounded: "{rounded.disco}"
    width: "clamp(9.5rem, 42vw, 16.5rem)"
---

# Design System: Divestir

## Overview

**Creative North Star: "O Fã-Clube Impresso"**

A Divestir se comporta como merch de fã-clube impressa: papel creme, uma tinta azul e um amarelo de holofote que só aparece sobre o azul. Quem a pessoa ama é o ídolo, e a interface é o material de divulgação desse ídolo: o ingresso, a carteirinha de membro, a camisa numerada, o adesivo picotado. Tudo é chapado, como uma estampa. Não tem sombra, gradiente nem texto apagado; a profundidade vem de sobreposição e recorte, como o disco da foto que morde o nome.

O site de venda fala alto e com afeto ao mesmo tempo. Os títulos são enormes, em Anton caixa-alta. A frase que toca o coração vem em Instrument Serif itálica, e o texto corrido em Inter, que resolve sem aparecer. A composição é central e vertical, pensada para o polegar: uma ideia por faixa, alternando o papel creme e a faixa azul. O único movimento autoral é a troca de nomes na estampa de exemplo. O resto fica parado.

O sistema rejeita, por decisão do Lucas: poluição visual, cara de template genérico e amarelo sobre o creme. As fontes e a marca escrita são provisórias até o logo definitivo; os papéis de cada fonte ficam.

**Key Characteristics:**
- Papel creme domina, azul estrutura (texto, faixas, botão), amarelo pontua só sobre o azul.
- Uma tinta só: todo texto sobre o creme é azul cheio.
- Anton gigante em caixa-alta para títulos e nomes, Instrument Serif itálica para o afeto, Inter para o resto.
- Ingresso, picote e número de camisa como assinatura.
- Chapado, sem sombra: profundidade por sobreposição e recorte.
- Celular primeiro: coluna central, toque de 44 px, uma ideia por faixa.

## Colors

Duas cores de marca e um papel, na proporção 60/30/10, como uma impressão em duas tintas.

### Primary
- **Azul Tinta** (#2954D1): a tinta da marca. Todo texto sobre o creme, o botão principal, as faixas de largura total e o rodapé. Contraste de 5.89:1 com o creme, nos dois sentidos.
- **Azul Tinta Funda** (#2348B4): derivado do azul (86% azul, 14% preto). Só para o botão em hover e no toque. Não é cor de marca e não aparece parado na tela.

### Secondary
- **Amarelo Holofote** (#F5DB83): o destaque. Mora só sobre o azul (4.67:1): o nome do design na prévia e a seleção de texto. É o 10% da marca.

### Neutral
- **Papel Creme** (#FAF5EB): o fundo dominante, o 60%. É também o texto e o disco da foto quando estão sobre o azul.

### Named Rules
**A Regra da Tinta Única.** Texto sobre o creme é sempre azul cheio, sem transparência. A hierarquia vem do tamanho, do peso e da fonte. Se um texto precisa de azul apagado para recuar, ele precisa de outro tamanho ou de outra fonte.

**A Regra do Holofote.** O amarelo só existe sobre o azul. Sobre o creme ele some (1.26:1), então lá ele nunca entra, nem como texto, nem como fundo, nem como ícone.

## Typography

**Display Font:** Anton (com Arial Narrow)
**Body Font:** Inter variável (com system-ui)
**Destaque Font:** Instrument Serif, regular e itálica (com Georgia)

**Character:** Anton condensada e em caixa-alta tem o grito do pôster de show e faz o nome virar estrela. A Instrument Serif itálica é a voz de quem ama, e a Inter cuida de explicar sem disputar atenção.

### Hierarchy
- **Display** (Anton 400, de 3.4rem no celular a 6rem, entrelinha 1.12, caixa-alta, linhas balanceadas): o título do topo. A entrelinha de 1.12 deixa espaço para o acento de "VOCÊ" e "VÓ" não encostar na linha de cima.
- **Headline** (Anton 400, de 2.6rem a 4.75rem, entrelinha 1, caixa-alta): o título de cada faixa, como "Como funciona".
- **Estampa** (Anton 400, de 5rem a 11.5rem, entrelinha 1, caixa-alta): só o nome dentro da prévia de design. É a arte da peça, não um título da página.
- **Destaque** (Instrument Serif itálica, de 1.5rem a 2.4rem, entrelinha 1.25, até 22ch): a frase logo abaixo do título, e "Membro Oficial" e "Fã-Clube" na estampa.
- **Title** (Inter 600, 1.125rem): o título de cada passo ou item.
- **Body** (Inter 400, 1rem, entrelinha 1.625): o texto corrido. Parágrafos quebram sem palavra sozinha na última linha.
- **Caption** (Inter 400, 0.9375rem, até 34ch): legendas e links de apoio.
- **Button** (Inter 700, 1.1875rem, -0.005em): o texto do ingresso.
- **Marca** (Anton 400, 1.25rem, +0.06em, caixa-alta): o nome Divestir no topo, até o logo chegar.

### Named Rules
**A Regra do Teto de 6rem.** Título nenhum passa de 6rem. Só a estampa, o nome dentro da prévia do design, pode ser maior, porque ela é a peça, não a página.

**A Regra da Caixa-Alta da Anton.** Caixa-alta é só da Anton: títulos, nomes e marca. Inter e Instrument Serif ficam em caixa normal, e o navegador nunca inventa negrito ou itálico que a fonte não tem.

## Layout

Coluna única e centralizada, celular primeiro. A margem lateral é de 16px e o conteúdo vai até 64rem; listas param em 48rem e ganham duas colunas a partir de 640px. As faixas alternam o papel creme e o azul, e cada faixa carrega uma ideia só. No celular, cada faixa respira 80px em cima e embaixo; a partir de 640px, 112px. O topo começa mais perto (56px no celular, 96px no largo) para o botão aparecer na primeira tela junto com o começo da faixa azul.

Grupos ficam apertados e grupos diferentes ficam bem separados: 24px entre o título e a frase, 40px antes do botão, 48px entre o título da faixa e a lista. Sempre há mais espaço acima de um título do que abaixo dele.

## Elevation & Depth

O sistema é totalmente chapado: zero sombras. A profundidade vem de sobreposição e recorte, como na serigrafia. O disco da foto sobe por cima da parte de baixo do nome e é cercado por um contorno da cor da faixa (0.55rem de azul), que morde as letras e separa o disco do nome sem usar sombra.

### Named Rules
**A Regra do Impresso.** Se não dá para imprimir com as tintas da marca, não entra: nada de sombra, brilho, vidro, desfoque decorativo ou gradiente.

## Shapes

A forma vem do papel de fã. O botão principal é um ingresso: retângulo com canto de 6px e dois furos de 10px de raio nas laterais, recortados por máscara. A área da foto é um círculo perfeito com um picote de 72 furos redondos por dentro, como adesivo de destacar. O contorno de foco segue o ingresso com canto de 8px. Os números dos passos são vazados, como a numeração de uma camisa de time ou de uma jaqueta college.

### Named Rules
**A Regra do Picote.** Furo e picote são a assinatura da Divestir. Eles dizem "isso é seu" ou "a sua foto entra aqui". Nunca viram textura de fundo ou enfeite solto.

## Components

### Buttons
O ingresso é a ação principal, firme e única por tela.
- **Shape:** ingresso, retângulo de canto suave (6px) com dois furos laterais.
- **Primary:** fundo Azul Tinta, texto Papel Creme em Inter 700, altura mínima de 56px e 40px de respiro nas laterais.
- **Hover / Focus:** com mouse, o hover escurece para Azul Tinta Funda em 200ms, com saída exponencial. No toque, o botão também escurece e desce 1px, e o quadrado cinza do navegador fica desligado. Pelo teclado, o foco ganha um contorno azul de 2px a 5px de distância, com canto de 8px.
- **Secondary:** link de texto sublinhado, com sublinhado de 1px a 0.3em do texto, que engrossa para 2px no hover. A área de toque tem 44px de altura.

### Navigation
- **Style:** só a marca, centralizada no topo, em Anton caixa-alta com 0.06em de espaçamento. A área de toque tem 44px de altura. Ainda não há menu.

### Faixa azul
- **Style:** bloco de largura total em Azul Tinta com texto Papel Creme. É o palco da prévia de design e o rodapé.

### Prévia da estampa (signature)
A carteirinha do Fã-Clube mostra o produto antes de existir foto. De cima para baixo vêm "Membro Oficial" em Instrument Serif itálica, o nome em Anton gigante e o disco creme com picote e "sua foto aqui", que morde o nome. Por último, o nome do design em Amarelo Holofote itálico. O nome se troca a cada 2,5s entre pet, gente e apelido (Thor, Vó Cida, Duda, Mel). Cada nome entra subindo e ganhando foco em 0,4s, com saída exponencial, fica 1,7s parado e sai acelerando em 0,4s. Com movimento reduzido, fica parado no primeiro nome.

### Lista numerada (signature)
- **Style:** números vazados em Anton de 48px, com contorno azul de 1.5px, numa coluna de 28px. Ao lado vêm o título em Inter 600 e o texto em Inter 400. A lista é numerada de verdade no código, e o número desenhado é só visual.

### Superfícies do navegador
- **Style:** a seleção de texto é amarela com texto azul, o cursor de digitação e os controles nativos (caixa de marcar, opção) são azuis, e a barra de rolagem é azul suave. O destaque de toque é azul a 14%. Nada fica com a cara padrão do navegador.

## Do's and Don'ts

### Do:
- **Do** use Azul Tinta cheio em todo texto sobre o Papel Creme (5.89:1).
- **Do** use o Amarelo Holofote só sobre o azul, em um elemento por faixa.
- **Do** mantenha todo título em até 6rem; só o nome da estampa passa disso.
- **Do** use o ingresso para a ação principal, um por tela.
- **Do** teste a estampa com pet, gente e objeto, com nomes curtos, longos e acentuados.
- **Do** garanta 44px de área de toque em tudo que é clicável.

### Don't:
- **Don't** coloque amarelo sobre o creme (1.26:1).
- **Don't** use azul transparente em texto para criar hierarquia.
- **Don't** use sombra, gradiente, vidro ou brilho.
- **Don't** coloque um rótulo pequeno em caixa-alta em cima de um título.
- **Don't** encha a tela: nada de poluição visual ou cara de template genérico.
- **Don't** crie um segundo movimento na mesma página; a troca de nomes é o momento.
