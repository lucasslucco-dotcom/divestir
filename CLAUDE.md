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

- Identidade visual (provisória): cores e papel de cada fonte em `src/app/globals.css`; arquivos de fonte em `src/app/fontes/`. A troca pela identidade definitiva acontece só nesses dois lugares.
- Conexão com o Supabase: `src/lib/supabase/client.ts` (navegador) e `src/lib/supabase/server.ts` (servidor).
- Banco: migrations em `supabase/migrations/`. Toda mudança no banco vira uma migration nova, nunca edição de uma antiga.
- Teste das regras de acesso do banco: `npm run testar:banco` (roda as migrations num Postgres local e confere quem lê e altera o quê). Rode sempre que mexer no banco.
- Variáveis de ambiente: lista em `.env.example`.
- Projeto no Supabase: `divestir` (ref `hpubkogmfhgabtzrpgxv`), região São Paulo, plano gratuito. Antes do lançamento, passar para o plano pago: no gratuito o banco pausa depois de uma semana sem uso.
- Site no ar: https://divestir.vercel.app (projeto `divestir` no time LUCCO da Vercel). Cada envio para a branch `main` do GitHub publica o site sozinho. Antes de começar a vender, o time precisa estar no plano Pro: o Hobby da Vercel só permite uso pessoal, não comercial.

## Pendências técnicas

- Etapa 8 (painel): reorganizar as regras de leitura de `pecas`, `cores`, `peca_imagens`, `designs` e `equipe` para uma regra por papel e por ação. O Supabase avisa que hoje há duas regras de leitura para usuários logados nessas tabelas (aviso só de desempenho). A mudança precisa de DROP POLICY, então pede confirmação.
- Quando o site ganhar rotas no servidor (upload de foto, checkout), configurar a região das funções da Vercel para São Paulo (`gru1`), perto do banco.

## Etapa atual

Etapa 1: Base do projeto.
