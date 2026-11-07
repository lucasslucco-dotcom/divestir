# Divestir

Merch oficial de quem você ama. Site da Divestir: o cliente envia a foto de quem ama, escolhe a peça, o design, a cor e o tamanho, e recebe a peça em casa.

Site no ar: https://divestir.vercel.app

O briefing completo do produto está em [`docs/divestir-briefing.md`](docs/divestir-briefing.md).

## Rodar no computador

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e preencha com os dados do projeto no Supabase.
3. Rode `npm run dev` e abra http://localhost:3000

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Abre o site no computador para testar |
| `npm run build` | Gera a versão final do site, igual à da Vercel |
| `npm run lint` | Procura problemas no código |
| `npm run testar:banco` | Testa as regras de acesso do banco num Postgres local |

## Estrutura

| Pasta | O que tem |
| --- | --- |
| `src/app` | Páginas do site |
| `src/app/fontes` | Fontes da identidade |
| `src/lib/supabase` | Conexão com o Supabase |
| `supabase/migrations` | Estrutura do banco (tabelas e regras de acesso) |
| `scripts` | Testes e utilitários |
| `docs` | Briefing do produto |
| `PRODUCT.md` | Quem é o cliente, o que a Divestir promete e o que ainda está em aberto |
| `DESIGN.md` | Sistema visual: cores, fontes, formas, componentes e regras |
| `.claude/skills/impeccable` | Skill de design usada para criar e polir as telas |
