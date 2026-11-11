# Divestir — Briefing do site e do montador

Versão de 7 de novembro de 2026.

## Visão e escopo da v1

A Divestir vende roupa sob demanda com a foto de quem a pessoa ama estampada, dentro de designs autorais da marca, num site onde o cliente monta a peça e vê o resultado em tempo real. O diferencial não é a estampa: é a experiência de montar, e o momento em que a vó, o cachorro ou o melhor amigo vira ídolo numa peça com cara de merch.

**Para quem:** quem compra para presentear e quem compra para si. Os dois passam pelo mesmo montador; o presente ganha um caminho próprio no carrinho.

**O que entra na v1**

- Site institucional + montador + carrinho + checkout com pagamento
- Todas as peças de uma vez: camiseta regular, camiseta oversized, camiseta dry-fit, moletom sem capuz, moletom com capuz, jaqueta bomber
- Cores preto, branco e creme; tamanhos PP ao GGG
- Linha inicial de designs, com estrutura de drops (entrada, selo de novo, saída)
- Opção de presente no carrinho
- Painel da equipe para revisar arte, acompanhar status e disparar avisos ao cliente
- E-mail e WhatsApp automáticos a cada mudança de status

**Fora da v1:** programa de indicação, conta do cliente com histórico, app nativo. Produção, estamparia e logística de entrega já estão resolvidas pela operação e não entram no site além do que o cliente precisa ver (prazo e rastreio).

## Jornada do cliente e o montador

O montador é uma página só: a prévia da peça fica fixa (no topo no celular, à esquerda no desktop) e os passos rolam ao lado. Cada escolha atualiza a prévia na hora, sem recarregar. O cliente sempre vê frente e costas e pode voltar a qualquer passo sem perder o que já fez.

1. **Escolher a peça.** Cards com foto de cada modelo: camiseta regular, camiseta oversized, camiseta dry-fit, moletom, moletom com capuz, jaqueta bomber. Preço "a partir de" em cada card. A prévia já aparece em preto, a cor padrão.
2. **Escolher o design.** Primeiro, "Para quem é?" (Mães, Pais, Avôs, Avós, Filhos, Irmãos, Casal, Amigas, Amigos, Pets ou Todos). Depois, o carrossel de miniaturas dos designs. Antes de a pessoa mandar a foto, cada miniatura mostra uma foto de exemplo do tema escolhido, marcada como exemplo; depois da foto, a foto e o nome do cliente. É aqui que a pessoa se apaixona. Selo "Novo" ou "Últimos dias" nos designs de drop.
3. **Enviar a foto.** Upload por arquivo ou câmera do celular. Antes do botão, o guia da foto perfeita em formato visual. Ao subir, o sistema confere resolução e nitidez, remove o fundo automaticamente e mostra a foto já no design escolhido. O cliente ajusta o enquadramento ali mesmo (arrastar e dar zoom), com os botões "Trocar a foto" e "Ficou ótimo" colados na prévia. Se trocar de design depois, o ajuste abre de novo no design novo, e o que já foi aprovado em cada design fica guardado.
4. **Dar nome.** Um campo: "Como ele(a) se chama?" (THOR, VÓ CIDA, DUDA), com o limite de caracteres do design escolhido, e os outros textos que o design pedir (o ano, por exemplo). O texto entra na prévia enquanto a pessoa digita.
5. **Escolher a cor.** Preto, branco e creme, sempre trocáveis numa barra fixa. A tinta do design muda junto com a cor da peça.
6. **Escolher o tamanho.** PP ao GGG, com tabela de medidas por modelo (regular e oversized vestem diferente). Fica no fim porque não muda a prévia e pedido de tamanho logo de cara é atrito.
7. **Adicionar ao carrinho.** Botões: "Finalizar compra" e "Criar outra Divestir". Ao criar outra, a foto enviada fica disponível para reaproveitar.

A ordem "design antes da foto" foi decidida pelo Lucas em 11/11/2026, depois de testar a ordem antiga (peça, foto, nome, design): a foto era ajustada num design e deixava de servir ao trocar para outro, e o nome era digitado antes de a pessoa saber quantas letras cabiam.

**Regras do montador**

- O estado da montagem fica salvo no navegador: se a pessoa fechar a aba, volta de onde parou.
- Toda prévia mostra um selo discreto "Prévia ilustrativa" para alinhar expectativa de cor de tela. Enquanto a prévia está com uma foto de exemplo, o selo diz "Foto de exemplo".
- Sem cadastro para montar: login só é pedido no checkout (e pode ser como convidado, só e-mail e WhatsApp).

## Guia da foto perfeita

Foto boa é 80% da peça bonita, então o guia aparece antes do upload, com exemplos visuais de certo e errado lado a lado. Texto pronto para o site:

> **Uma boa foto faz toda a diferença.** Quanto melhor a foto, mais incrível fica a sua Divestir.
>
> **Luz natural.** Perto de uma janela, de dia. Nada de flash ou contra a luz.
> **Foco nítido.** Sem tremido, sem desfoque.
> **Rosto inteiro.** Nada cortado, coberto ou de óculos escuros.
> **Só ele(a) na foto.** Se tiver mais gente, a gente recorta, mas o protagonista precisa estar bem visível.
> **Sem filtro.** Nada de efeito, moldura ou figurinha.
> **Na altura dos olhos.** Pets ficam muito mais expressivos assim.
>
> Dica de ouro: a foto original do celular é sempre melhor que a que passou pelo WhatsApp.

**Especificações técnicas (checagem automática no upload)**

| Critério | Regra | O que o cliente vê |
| --- | --- | --- |
| Formato | JPG, PNG, HEIC ou WEBP | Outros formatos são recusados com aviso |
| Tamanho do arquivo | Até 20 MB | Aviso se passar |
| Resolução ideal | 2.000 px ou mais no lado menor | Selo verde "Foto perfeita" |
| Resolução aceitável | Entre 1.000 e 2.000 px | Aviso amarelo: "Pode perder um pouco de definição" |
| Resolução mínima | Abaixo de 1.000 px | Bloqueio: "Essa foto vai ficar pixelada. Tenta outra?" |
| Nitidez | Detecção de desfoque | Aviso amarelo se a foto estiver tremida |
| Recorte | Remoção de fundo automática | Cliente aprova o recorte antes de seguir |

Os limites de resolução são ponto de partida: validar com a estamparia o tamanho real de impressão da área da foto em cada template e ajustar.

**Foto de objeto** (o violão do pai, a moto, a caneca favorita) segue as mesmas regras, com uma dica extra: fundo liso e o objeto inteiro no quadro.

## Sistema de templates de design

Cada design é um template configurável, não uma imagem pronta: ele define onde entra a foto, onde entra o nome e qual tinta usar em cada cor de peça. Isso permite lançar designs novos pelo painel, sem programador, e gerar o arquivo de impressão automaticamente.

**Como um design nasce**

1. Arte criada no Illustrator, com camadas nomeadas: `arte`, `foto` (a área onde a foto entra) e `texto-nome`.
2. Exportação em SVG, uma versão por tinta (clara para peça preta, escura para peças branca e creme).
3. Cadastro no painel: upload dos SVGs + preenchimento da configuração abaixo + mockup de miniatura.
4. Teste no montador com 3 fotos reais (pet, pessoa, objeto) antes de ativar.

**Configuração de um template**

```json
{
  "slug": "fa-clube",
  "nome": "Fã-Clube",
  "status": "ativo",
  "drop": { "entrada": "2026-12-01", "saida": null, "selo": "novo" },
  "posicao": "costas",
  "logo_peito": true,
  "foto": { "formato": "circulo", "x": 0.5, "y": 0.48, "largura": 0.42, "sobrepoe_texto": true },
  "campos": [
    { "chave": "nome", "rotulo": "Nome", "max": 10, "caixa": "alta" }
  ],
  "tintas": {
    "preto": "creme",
    "branco": "verde-escuro",
    "creme": "verde-escuro"
  },
  "pecas_permitidas": ["camiseta-regular", "camiseta-oversized", "camiseta-dry-fit", "moletom", "moletom-capuz", "jaqueta-bomber"]
}
```

Posições e tamanhos são proporcionais à área de impressão (0 a 1), então o mesmo template serve para todas as peças; cada peça define sua própria área de impressão em centímetros.

**Linha de lançamento: 6 designs que servem para pet, gente e objeto**

| Design | Conceito | Campos |
| --- | --- | --- |
| Fã-Clube | Merch de ídolo: "Membro Oficial / NOME / Fã-Clube" | Nome |
| Turnê | Camiseta de banda com "datas" nas costas: Sala de Estar, Almoço de Domingo, Sofá, Meu Coração | Nome, ano |
| Futebol Clube | Escudo vintage autoral: "NOME F.C. · Fundado em ANO" | Nome, ano |
| Capa de Revista | Estética de capa de moda: "NOME · Edição Especial · O ícone do ano" | Nome |
| Procura-se | Cartaz de velho oeste: "Procura-se NOME, por roubar meu coração. Recompensa: amor eterno" | Nome |
| Maison | Grife minimalista: nome em serifada espaçada + "Uberlândia · Paris · Sofá da Sala" | Nome, cidade |

Todos usam a estética de cada universo com tipografia e símbolos próprios da Divestir, sem logo de marca, banda ou time reais (ver seção de propriedade intelectual).

**Mecânica de drops:** o painel controla data de entrada e de saída de cada design. Designs com saída marcada mostram "Últimos dias" na semana final; designs novos mostram "Novo" nas duas primeiras semanas.

## Catálogo de peças, cores e tamanhos

A v1 entra com 5 modelos, 3 cores e 6 tamanhos, todos cadastrados pelo painel para que novas peças e cores entrem sem programador.

| Peça | Caimento | Área de impressão nas costas | Preço |
| --- | --- | --- | --- |
| Camiseta manga curta | Regular | a definir com a estamparia | a definir |
| Camiseta manga curta | Oversized | a definir com a estamparia | a definir |
| Camiseta manga curta | Dry-fit | a definir com a estamparia | a definir |
| Moletom | Sem capuz | a definir com a estamparia | a definir |
| Moletom | Com capuz | a definir com a estamparia | a definir |
| Jaqueta bomber | Só na cor preta | a definir com a estamparia | a definir |

**Cores:** preto, branco, creme (a jaqueta bomber só em preto). **Tamanhos:** PP, P, M, G, GG, GGG, com tabela de medidas própria por modelo.

**Jaqueta bomber** (decisão do Lucas, 10/11/2026, no lugar da jaqueta college): só na cor preta, com gola, punhos e barra canelados e zíper na frente. A estampa vai só nas costas, e a frente leva a marca no peito.

**Camiseta dry-fit** (decisão do Lucas, 10/11/2026): nas três cores. O tecido é poliéster: confirmar com a estamparia a técnica de estampa em cada cor.

**Fotos de base para a prévia:** cada combinação de peça e cor precisa de uma foto de frente e uma de costas, no mesmo ângulo e luz. São 30 fotos (5 peças × 3 cores × 2 lados), geradas no Higgsfield no estilo manequim invisível, todas no mesmo canvas (1792 × 2240 px, 4:5) e no mesmo fundo cinza claro (#E9E9E7). Método: a versão preta de frente de cada peça é a matriz, e as costas e as cores branca e creme saem dela, para a silhueta não mudar quando o cliente troca de cor. Essas fotos são a base de toda prévia, então a qualidade delas define a percepção de valor do site.

**Perguntas em aberto**

- [ ] Preço de cada modelo (e se o preço varia por tamanho no GG e GGG)
- [ ] Áreas de impressão em centímetros por peça, validadas com a estamparia
- [ ] Prazo de personalização a exibir no checkout ("enviado em até X dias úteis")

## Carrinho e checkout

O checkout é curto, sem cadastro obrigatório, e deixa o prazo de personalização explícito antes do pagamento.

**Carrinho**

- Cada item mostra a miniatura da peça montada, design, cor, tamanho e preço, com botão "Editar" que volta ao montador com tudo carregado
- Botão "Criar outra Divestir" sempre visível
- **É presente?** Opção por item: embalagem especial, cartão com mensagem escrita pelo cliente e envio direto para a pessoa presenteada, sem valor impresso. Adicional com preço próprio

**Checkout em uma página**

1. Contato: nome, e-mail e WhatsApp (obrigatórios, porque é por eles que o cliente acompanha o pedido)
2. Endereço de entrega (com busca por CEP); se for presente, endereço e nome de quem recebe
3. Frete: valor e prazo de entrega, somados ao prazo de personalização
4. Pagamento: PIX (com desconto, se a operação quiser) e cartão parcelado, via Mercado Pago, Pagar.me ou Asaas
5. Aceite dos termos, incluindo a autorização de uso da imagem enviada

**Mensagem de prazo (exibida no carrinho e no checkout)**

> Cada Divestir é feita sob medida pra você. Seu pedido é personalizado e enviado em até X dias úteis. Você recebe todas as atualizações por e-mail e WhatsApp, do primeiro ajuste até a entrega.

**Depois do pagamento:** página de confirmação com a prévia da peça e o número do pedido, mais e-mail e WhatsApp de confirmação na hora.

## Painel da equipe

O painel é a ponte entre o site e a operação: a equipe revisa cada arte, entrega o arquivo de impressão à produção e move o pedido de status, e cada mudança avisa o cliente sozinha.

**Status do pedido e aviso automático**

| Status | Quem move | Aviso ao cliente (e-mail + WhatsApp) |
| --- | --- | --- |
| Pago | Sistema, ao confirmar pagamento | "Recebemos seu pedido! Agora é com a gente." |
| Revisão de arte | Sistema, logo após o pago | Nenhum |
| Ajuste de foto | Equipe, se o recorte ou a foto não servirem | "Precisamos de uma foto melhor", com link para reenviar |
| Em produção | Equipe, após aprovar a arte | "Sua Divestir está sendo feita." |
| Enviado | Equipe, ao informar o código de rastreio | "Saiu pra entrega!", com link de rastreio |
| Entregue | Equipe ou integração da transportadora | "Chegou! Marca a gente quando vestir." |

No status "Ajuste de foto", o cliente reenvia pelo link, o sistema refaz o recorte e o pedido volta para "Revisão de arte".

**Telas do painel**

- **Pedidos:** quadro por status (arrastar o card muda o status) e lista com busca e filtros por data, peça, design e status
- **Pedido:** prévia montada, foto original, recorte, dados do cliente e do presente, histórico de status e avisos enviados. Botões: aprovar arte, pedir nova foto, baixar arquivo de impressão, informar rastreio
- **Lote de produção:** seleciona os pedidos aprovados e baixa tudo de uma vez (arquivos de impressão + uma planilha com peça, cor, tamanho e número do pedido)
- **Designs:** criar, editar, ativar e encerrar templates, com datas de drop
- **Catálogo:** peças, cores, tamanhos, preços e fotos de base
- **Equipe:** usuários do painel com dois papéis: administrador (tudo) e operação (pedidos e lotes)

**Arquivo de impressão:** gerado no servidor assim que a arte é aprovada. PNG com fundo transparente, 300 DPI, no tamanho real da área de impressão da peça, nomeado com número do pedido, peça, cor e tamanho. Especificação final a confirmar com a estamparia.

## Stack e banco de dados

A Divestir usa a mesma base da Aufluencer, então o caminho de construção no Claude Code já é conhecido; o que muda é o montador e a geração do arquivo de impressão.

| Camada | Ferramenta | Função |
| --- | --- | --- |
| Site e painel | Next.js (App Router) + TypeScript + Tailwind | Loja pública e `/painel` no mesmo projeto |
| Banco, login e arquivos | Supabase (Postgres, Auth, Storage, RLS) | Pedidos, designs, fotos e acesso da equipe |
| Prévia ao vivo | Canvas no navegador (Konva) | Monta peça + design + foto em tempo real |
| Arquivo de impressão | Função no servidor (sharp) | PNG 300 DPI gerado na aprovação da arte |
| Recorte da foto | API de remoção de fundo | Recorte automático no upload |
| Pagamento | Mercado Pago, Pagar.me ou Asaas | PIX e cartão, com webhook de confirmação |
| E-mail | Resend | Avisos de status |
| WhatsApp | API do WhatsApp via provedor | Avisos de status com templates aprovados |
| Hospedagem | Vercel | Deploy e domínio |

**Tabelas principais**

```sql
pecas            (id, slug, nome, caimento, area_impressao_cm, tamanhos[], preco, ativo, ordem)
cores            (id, slug, nome, hex, ativo)
peca_imagens     (id, peca_id, cor_id, lado [frente|costas], url)
designs          (id, slug, nome, status [rascunho|ativo|encerrado], config jsonb,
                  svg_tinta_clara, svg_tinta_escura, miniatura_url,
                  drop_entrada, drop_saida, ordem)
fotos            (id, sessao_id, original_url, recorte_url, largura, altura,
                  nitidez, criado_em, apagar_em)
pedidos          (id, numero, nome, email, whatsapp, endereco jsonb,
                  presente jsonb, frete, total, status, pagamento_id,
                  rastreio, token_acompanhamento, criado_em)
itens_pedido     (id, pedido_id, peca_id, cor_id, tamanho, design_id,
                  foto_id, campos jsonb, preview_url, arquivo_impressao_url, preco)
status_historico (id, pedido_id, de, para, por_usuario, criado_em)
notificacoes     (id, pedido_id, canal [email|whatsapp], tipo, enviado_em, erro)
equipe           (id, user_id, nome, papel [admin|operacao])
```

**Segurança desde o primeiro dia**

- RLS em todas as tabelas: o público só lê catálogo e designs ativos; pedidos e fotos só a equipe
- Upload de foto por URL assinada, em bucket privado
- Cliente acompanha o pedido por link com `token_acompanhamento`, sem precisar de login
- Webhook de pagamento validado por assinatura antes de mudar o status
- Rotina diária que apaga fotos de pedidos entregues após o prazo definido nos termos, e fotos de montagens nunca compradas após 30 dias

## Roteiro de construção no Claude Code

São 10 etapas, cada uma termina com algo que dá para abrir e testar antes de seguir. O montador vem antes de pagamento e painel porque é ele que valida o produto.

1. **Base do projeto.** Next.js + Supabase + Vercel, tabelas e RLS, identidade visual básica (cores, tipografia, logo). *Teste: site no ar com a home.*
2. **Catálogo.** Cadastro de peças, cores e fotos de base direto no banco. *Teste: escolher peça e cor e ver a foto certa trocando.*
3. **Foto.** Upload, checagem de resolução e nitidez, remoção de fundo, ajuste de enquadramento. *Teste: subir 10 fotos reais (pets, pessoas, objetos) e avaliar os recortes.*
4. **Motor de templates.** Leitura da configuração, encaixe da foto e do nome, troca de tinta por cor. Começar com o Fã-Clube. *Teste: o Fã-Clube montado com as 10 fotos, nas 3 cores.*
5. **Montador completo.** Os 7 passos, prévia fixa, frente e costas, miniaturas de design com a foto do cliente, estado salvo. *Teste: montar uma peça do zero no celular.*
6. **Carrinho e checkout.** Carrinho, presente, "criar outra", pagamento em ambiente de teste e webhook. *Teste: pedido pago em modo de teste aparecendo no banco.*
7. **Arquivo de impressão.** Geração do PNG 300 DPI na aprovação. *Teste: mandar 3 arquivos para a estamparia validar antes de seguir.*
8. **Painel.** Login da equipe, quadro de pedidos, tela do pedido, lote de produção, designs e catálogo. *Teste: levar um pedido de "Pago" a "Entregue".*
9. **Avisos.** E-mail e WhatsApp a cada status, página de acompanhamento por link. *Teste: receber todos os avisos de um pedido de teste.*
10. **Lançamento.** Os 6 designs, termos e política de privacidade, domínio, pagamento em produção e piloto com pedidos reais de amigos e equipe. *Teste: 10 pedidos reais entregues antes de abrir ao público.*

**Antes da etapa 1, separar:** logo e identidade da Divestir, as 30 fotos de base das peças, os SVGs do primeiro design (Fã-Clube), conta no meio de pagamento escolhido e as respostas da seção de catálogo.

## Termos, LGPD e propriedade intelectual

Dois riscos precisam estar resolvidos antes do lançamento: imagem de terceiros e uso de marcas. Os dois pedem revisão de um advogado; abaixo está o que o site precisa ter.

**Imagem e dados (LGPD)**

- Aceite no checkout: o cliente declara ter autorização para usar a imagem de quem aparece na foto
- Política de privacidade clara: a foto serve só para produzir a peça, não é usada em divulgação sem nova autorização
- Pedido de autorização separado e opcional para usar a peça ou a foto em conteúdo da marca (é daí que sai o conteúdo de "antes e depois" do Instagram)
- Exclusão automática das fotos após o prazo definido, e canal para o cliente pedir exclusão antes
- Bloqueio de conteúdo impróprio: a equipe recusa na revisão de arte e o pedido é reembolsado

**Marcas e designs**

- Designs autorais inspirados na estética de cada universo (merch de banda, escudo de futebol, grife, capa de revista), sem reproduzir logos, nomes ou símbolos de marcas, bandas, times ou revistas reais
- Paródias de logos famosos ficam fora da v1; se entrarem no futuro, só com parecer de um advogado de propriedade intelectual
- Registrar a marca Divestir no INPI antes do lançamento público

**Política de troca:** peça personalizada não entra no direito de arrependimento da mesma forma que uma peça comum; definir com o advogado o que vale para defeito de produção, tamanho errado e foto aprovada pelo cliente.
