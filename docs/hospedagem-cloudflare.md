# Hospedagem na Cloudflare

Desde 18/11/2026 o portfólio roda em uma conta Cloudflare do proprietário, sem depender do Sites do ChatGPT.

| Item | Valor |
| --- | --- |
| Endereço | https://raphael-kaych.raphaelkaych.workers.dev |
| Worker | `raphael-kaych` |
| Banco | D1 `raphael-kaych-portfolio`, binding `DB`, região ENAM |
| Configuração | [`cloudflare.json`](../cloudflare.json) (o ID do D1 identifica o recurso e não é segredo) |
| Plano | Gratuito: Workers e D1 cobrem o tráfego de um portfólio |

## Publicar

```sh
npm ci
npm run build
npx wrangler login        # uma vez por máquina; o proprietário autoriza no navegador
npm run deploy
```

`npm run deploy` executa [`scripts/deploy-cloudflare.mjs`](../scripts/deploy-cloudflare.mjs). Ele gera `dist/server/wrangler.production.json` a partir do build, com o nome do Worker e o D1 reais, aplica as migrações pendentes de `drizzle/` (registradas pelo Wrangler na tabela `d1_migrations`) e publica. `node scripts/deploy-cloudflare.mjs --dry-run` só valida o pacote.

Migrações são aditivas. Uma migração nova entra como arquivo novo em `drizzle/` e é aplicada antes da publicação do código que depende dela.

## Reverter

```sh
npx wrangler deployments list --config dist/server/wrangler.production.json
npx wrangler rollback <version-id> --config dist/server/wrangler.production.json
```

A reversão troca o código, não o banco. Como as migrações são aditivas, a versão anterior continua funcionando com o banco atual.

## Verificação da primeira publicação

- Primeira versão `89ca4fa3-c2ed-4d53-bd0b-0dc2741451a8`, a partir de `main` em `6700fc7`. A versão `2250c4bd-9805-40d0-a5ba-57b9dda24d76` acrescenta o endereço novo como canônico e os ajustes de desempenho desta branch.
- `npm run test:e2e` com `PLAYWRIGHT_BASE_URL` apontando para o endereço de produção: 34 aprovados e 3 visuais pulados fora do Linux, incluindo os laboratórios que gravam no D1.
- Migrações `0000`, `0001` e `0002` aplicadas, com 9 tabelas no banco.
- PageSpeed Insights (servidores do Google, celular), home: desempenho 98, LCP 1,2 s, TBT 0 ms, CLS 0; acessibilidade, boas práticas e SEO 100. A produção anterior no Sites media 67 no celular.

Medições de Lighthouse nesta máquina oscilaram com a CPU ocupada por outros programas (até 83% de carga) e não servem de comparação. Use o PageSpeed Insights ou uma máquina ociosa.

## Domínio próprio

Para trocar `workers.dev` por um domínio como `raphaelkaych.dev`: registre ou transfira o domínio para a Cloudflare, adicione um Custom Domain ao Worker `raphael-kaych` no painel e troque `siteUrl` em `lib/portfolio-meta.ts`, `public/sitemap.xml`, `public/robots.txt` e os links dos READMEs.

## Site antigo

O endereço `raphael-kaych.raphaelvindex.chatgpt.site` continua no Sites do ChatGPT, na versão 8, até o proprietário decidir desligá-lo ou redirecioná-lo.
