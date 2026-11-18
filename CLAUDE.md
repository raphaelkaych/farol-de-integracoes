# Instruções para agentes

Portfólio de engenharia de Raphael Kaych: site, Developer Workspace, nove laboratórios e APIs em um único Worker. Conteúdo público em português do Brasil.

## Antes de mudar algo

- Leia [README.md](README.md), [docs/arquitetura-portfolio.md](docs/arquitetura-portfolio.md) e, para interface e movimento, [docs/visual-motion-3.md](docs/visual-motion-3.md).
- O estado da transferência para o Claude Code e o fluxo de publicação estão em [docs/transferencia-claude-code.md](docs/transferencia-claude-code.md).
- Preserve rotas públicas, contratos em `public/*.json`, cenários fictícios, o binding D1 `DB` e as migrações em `drizzle/`. Uma migração nova entra como arquivo novo, nunca editando um aplicado.

## Comandos

Node 24 e npm com o lockfile. A ordem abaixo é a do CI em `.github/workflows/validar.yml`.

```sh
npm ci
npm audit --omit=dev --audit-level=high
node scripts/workspace-evidence.mjs --check
npm run lint
npm test
npm run typecheck
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

- `node scripts/preview-e2e.mjs 18790` sobe a prévia com D1 local isolado depois do build. `PLAYWRIGHT_BASE_URL` reaproveita uma prévia já aberta.
- Ao mudar código exibido no Workspace, rode `node scripts/workspace-evidence.mjs` e confira o diff de `lib/workspace-evidence.json`.
- As capturas de `e2e/visual.spec.ts` só rodam no Linux. Atualize referências a partir do artefato do CI, depois de revisar a diferença.

## Regras

- Trabalhe em branch própria e abra PR para `main`. Merge no GitHub não publica o site: a produção é publicada pelo fluxo do Sites, por decisão do proprietário.
- Use apenas dados fictícios. Nenhuma credencial em código, logs, evidências ou capturas.
- O caso negativo do QualityGate falha de propósito e faz parte da demonstração.
- Movimento precisa de pausa, de alternativa para `prefers-reduced-motion` e de parada fora da viewport ou com a aba oculta.
