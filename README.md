# Divestir

Aquela foto merece virar roupa. Site da Divestir: o cliente envia a foto de quem ama, escolhe a peça, o design, a cor e o tamanho, e recebe a peça em casa.

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
| `src/app/montar` | O montador: escolher peça, cor e lado |
| `src/app/montar/foto` | A tela da foto, com o guia da foto perfeita e a checagem da foto |
| `src/lib/foto` | Checagem da foto no aparelho do cliente (formato, tamanho, resolução e nitidez) |
| `src/lib/supabase` | Conexão com o Supabase |
| `src/lib/catalogo.ts` | Leitura do catálogo (peças, cores e fotos de base) |
| `supabase/migrations` | Estrutura do banco (tabelas e regras de acesso) |
| `supabase/seed.sql` | Catálogo inicial: 5 peças, 3 cores e 30 fotos de base |
| `scripts` | Testes e utilitários (inclui `preparar-fotos.py`, que ajusta as fotos da vitrine e as fotos de base) |
| `public/exemplos` | Fotos de exemplo da vitrine da home |
| `public/catalogo` | Fotos de base de cada peça, em cada cor, de frente e de costas |
| `public/guia` | Fotos ilustrativas do guia da foto perfeita |
| `docs` | Briefing do produto e os códigos das fotos de base no Higgsfield |
| `PRODUCT.md` | Quem é o cliente, o que a Divestir promete e o que ainda está em aberto |
| `DESIGN.md` | Sistema visual: cores, fontes, formas, componentes e regras |
| `.claude/skills/impeccable` | Skill de design usada para criar e polir as telas |
