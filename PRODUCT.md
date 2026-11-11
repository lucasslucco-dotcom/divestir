# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Site responsivo, pensado primeiro para o celular: a maioria dos clientes monta a peça pelo telefone. Não há app nativo na v1.

## Users

Dois públicos com o mesmo peso nas decisões de produto e de linguagem (decisão do Lucas, 07/11/2026):

- **Quem compra de presente:** escolhe a peça para dar a alguém, com a foto de quem essa pessoa ama (o pet do amigo, os avós da mãe) ou da própria pessoa presenteada.
- **Quem compra pra si:** quer vestir a foto de quem ama: o próprio pet, alguém da família, um amigo ou um objeto que é a cara dele.

Os dois passam pelo mesmo montador. O presente ganha um caminho próprio no carrinho: embalagem especial, cartão com mensagem e envio direto para quem vai receber.

## Product Purpose

A Divestir vende roupas personalizadas sob demanda com a foto de quem a pessoa ama estampada em designs autorais da marca. O cliente escolhe a peça, envia a foto, escolhe o design, a cor e o tamanho, e vê a peça pronta em tempo real antes de comprar. A peça é feita sob medida e chega em casa.

Sucesso: a pessoa se emociona ao ver a prévia, compra, e volta para criar outra Divestir quando sai um design novo.

## Positioning

A foto de quem você ama vira ídolo, numa peça com cara de merch oficial (fã-clube, turnê, time), e não um "produto com foto". O diferencial é a experiência de montar: a pessoa vê a própria peça nascer na tela, com a foto e o nome dela, antes de pagar. Os designs são templates autorais lançados em drops, com entrada e saída, para dar motivo de voltar.

## Operating Context

- Fluxo do montador: peça → design ("Para quem é?") → foto → nome → cor → tamanho → carrinho (ordem decidida pelo Lucas em 11/11/2026: a foto já é ajustada no design escolhido), numa página só, com a prévia fixa (detalhes em `docs/divestir-briefing.md`, seção "Jornada do cliente e o montador"). O que a pessoa escolhe fica guardado no navegador: fechou a aba, volta de onde parou, com a foto.
- A foto é checada (resolução e nitidez), recortada automaticamente e encaixada no template. Toda prévia é marcada como ilustrativa.
- Compra: carrinho no navegador, com presente por peça (embalagem especial e cartão com a mensagem do cliente) e "Editar" de volta ao montador; checkout numa página só, sem conta (nome, e-mail, WhatsApp e CPF), com busca por CEP, entrega direta para quem vai ganhar o presente e o frete do Melhor Envio já somado ao prazo de personalização (10 a 15 dias úteis); pagamento pelo Mercado Pago, em Pix ou cartão em até 12 vezes, numa página do pedido que serve de confirmação e de acompanhamento pelo link (decisões do Lucas, 08/11/2026).
- Produção, estamparia (DTF) e entrega já são resolvidas pela operação. O site só mostra ao cliente o prazo e o rastreio.
- O cliente acompanha o pedido por e-mail e WhatsApp, sem precisar de conta. A equipe opera um painel interno: revisão de arte, lote de produção, status e avisos.

## Capabilities and Constraints

- Peças da v1: camiseta regular, camiseta oversized, camiseta dry-fit, moletom sem capuz, moletom com capuz e jaqueta bomber (decisão do Lucas, 10/11/2026: a bomber no lugar da college, e a dry-fit a mais). Cores de peça: preto, branco e creme; a bomber só em preto. Tamanhos: PP ao GGG.
- Designs são templates configuráveis (área da foto, campo do nome, tinta por cor de peça), nunca imagens fixas. A arte fixa de cada design sai dos modelos de vetor do Higgsfield e o resto é montado no navegador (decisão do Lucas, 08/11/2026).
- O cliente escolhe se a estampa vai na frente ou nas costas; a jaqueta bomber só aceita costas, por causa do zíper (decisão do Lucas, 10/11/2026). Com a estampa nas costas, a frente leva DIVESTIR pequeno no peito, no lugar do logo até ele ficar pronto (decisão do Lucas, 08/11/2026). Linha inicial: Fã-Clube, Turnê, Futebol Clube, Capa de Revista, Procura-se e Maison.
- Fora da v1: programa de indicação, conta do cliente com histórico e app nativo.
- Fotos de terceiros: o cliente declara ter autorização para usar a imagem, e as fotos são apagadas depois do prazo definido nos termos (LGPD).
- Designs autorais: sem logos, nomes ou símbolos de marcas, bandas, times ou revistas reais.
- Em aberto: preços das peças e do presente (até lá, a loja fica em modo de teste, com preços de teste marcados na tela), desconto no Pix, parcelamento sem juros, tabela de medidas de cada modelo, áreas de impressão em centímetros e política de troca.

## Brand Commitments

- Nome: Divestir (divertir + vestir). Marca própria e independente, sem ligação visível com outras marcas do Lucas (decisão do Lucas, 07/11/2026).
- Cores oficiais, paleta fechada (decisão do Lucas, 07/11/2026): verde garrafa `#0D2B17` como cor principal (o verde exato do fundo da foto de referência do Fã-Clube), creme `#FAF5EB` e rosa elétrico `#FF4FA8` como acento. Substituem o azul e o amarelo da primeira versão.
- Fontes oficiais (decisão do Lucas, 07/11/2026): Anton nos títulos, Instrument Serif no destaque e Inter no texto.
- Frase de topo (decisão do Lucas, 10/11/2026): "Aquela foto merece virar roupa.", com a linha "Uma foto DIVESTIR." embaixo (lê-se "de vestir"). Fora de uso: "merch", que pouca gente entende, e a ideia de "fã/ídolo" como frase da marca.
- O logo definitivo ainda está em produção pelo Lucas; até lá, a marca é o nome escrito em Anton.
- Voz: português do Brasil, próxima, leve e calorosa.

## Evidence on Hand

- Briefing completo do produto: `docs/divestir-briefing.md`.
- 30 fotos de base das peças em `public/catalogo/`, geradas no Higgsfield em 07/11/2026 (manequim invisível, fundo cinza de estúdio; 5 peças × 3 cores × frente e costas). A versão preta de frente de cada peça foi a matriz das outras, para a silhueta não mudar ao trocar de cor. Os códigos de cada foto estão em `docs/fotos-de-base.md`. São fotos geradas, não fotos de produto real.
- Mockups de conceito dos designs, gerados no Higgsfield com pets de exemplo. São ilustrações, não fotos de clientes.
- 9 fotos de exemplo do montador em `public/designs/exemplos/` (mãe, pai, avô, avó, criança, casal, amiga, amigo e pet), geradas no Higgsfield: aparecem nas miniaturas dos designs e na prévia antes de a pessoa mandar a foto dela, sempre com o selo "Foto de exemplo". Ninguém nelas é de verdade.
- Vitrine da home com 8 exemplos ilustrativos em `public/exemplos/`: um para cada design (Fã-Clube, Capa de Revista, Futebol Clube, Turnê, Maison, Procura-se), com pets, pessoas e um objeto, em peças e cores diferentes. O Thor veio da foto de referência enviada pelo Lucas; os outros foram gerados no Higgsfield no mesmo estilo, com o mesmo fundo verde. Na home, aparecem sempre como exemplos ilustrativos.
- 18 fotos ilustrativas do guia da foto perfeita em `public/guia/`, geradas no Higgsfield em 08/11/2026: um par "assim sim / assim não" para cada uma das 8 dicas, com o mesmo protagonista nas duas fotos, e o par da dica de ouro. A tela avisa que são exemplos. Códigos em `docs/fotos-do-guia.md`.
- Ainda não existem e não devem ser inventados: depoimentos, clientes, números de vendas, fotos reais de produto e preços.

## Product Principles

1. A prévia é o produto: o cliente vê a peça pronta, com a foto e o nome dele, antes de pagar.
2. Pet, gente e objeto cabem em todo design: nenhum template funciona só com cachorro.
3. Celular primeiro: montar a peça com uma mão precisa ser simples.
4. Poucos designs, sempre fortes, lançados em drops: a novidade traz o cliente de volta.
5. Foto ruim é barrada cedo: a qualidade da estampa protege a marca.
