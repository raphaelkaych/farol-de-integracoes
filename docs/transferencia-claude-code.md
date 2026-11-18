# Transferência para o Claude Code

Registro de 18/11/2026. O Claude Code assumiu a manutenção pelo GitHub a partir do commit `17c7b2417bdccdab882643a41bafe7bdf6cc854e` de `main`, sem commits posteriores. O mesmo ciclo verificou o perfil e os três laboratórios independentes.

| Repositório | SHA de partida | Branch de trabalho | Validação |
| --- | --- | --- | --- |
| farol-de-integracoes | `17c7b24` | `docs/transferencia-claude-code` | Sequência completa do CI, abaixo |
| raphaelkaych | `332389c` | `docs/transferencia-claude-code` | Revisão do README e da capa |
| plantao-ti | `30bf9d7` | `docs/transferencia-claude-code` | `python -m unittest -v`: 2 de 2 e o exemplo do README |
| ponte-erp | `c9e89b3` | `docs/transferencia-claude-code` | `python -m unittest -v`: 3 de 3 |
| pulso-operacao | `3ccbf1d` | `docs/transferencia-claude-code` | `python -m unittest -v`: 2 de 2; `docs/index.html` regerado sem diferença de conteúdo |

## Ambiente e resultados do farol

Windows 11, Node 24.22.3, npm 11.19.1, Python 3.15.0, Chromium do Playwright 1.65.0. Clone limpo, a partir do lockfile.

| Comando | Resultado |
| --- | --- |
| `npm ci` | 691 pacotes |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades |
| `node scripts/workspace-evidence.mjs --check` | Trechos sincronizados |
| `npm run lint` | Sem erros |
| `npm test` | 23 de 23 |
| `npm run typecheck` | Sem erros |
| `npm run build` | `dist/server/index.js` e configuração do Worker gerados |
| `npx playwright install chromium` | Chromium instalado. `--with-deps` só se aplica ao Linux. |
| `npm run test:e2e` | 33 aprovados; 3 visuais pulados fora do Linux, como previsto em `e2e/visual.spec.ts` |

As capturas de referência continuam validadas pelo [CI do commit de partida](https://github.com/raphaelkaych/farol-de-integracoes/actions/runs/42620215881), no Ubuntu 24.04. `scripts/exportar-pulso.py` aplicado ao clone do pulso-operacao reproduz `lib/pulso-snapshots.json`, o que confirma que a demo e o repositório do SQL estão de acordo.

### Observações de ambiente

- **Caminho longo no Windows.** Em uma pasta com caminho próximo de 190 caracteres, `npm ci` falhou ao executar `cmd.exe` em `node_modules` e o `workerd` não abriu o SQLite do D1 local (`SQLITE_CANTOPEN`). Em uma pasta de caminho curto, tudo passou. Mantenha o clone perto da raiz do usuário.
- **npm 11.19.** O npm avisa que os scripts de instalação de `esbuild`, `workerd` e `unrs-resolver` não constam em `allowScripts`. Build, prévia e testes funcionam sem eles. Aprovar os scripts é uma decisão separada.

## Produção e versão validada

As 22 URLs de `sitemap.xml` responderam HTTP 200 em produção e na prévia local. O texto visível da home, do Workspace, da trajetória e do estudo do QualityGate é idêntico entre produção e o build de `17c7b24`. Os hashes de assets diferem, porque o Sites empacota a fonte no próprio repositório gerenciado. A versão 8 do Sites corresponde, em conteúdo, ao commit de partida.

## Publicação

O GitHub é a base de desenvolvimento e CI. Um PR ou merge em `main` não publica o site. A publicação no domínio atual é feita pelo proprietário no fluxo do Sites:

1. Sincronizar a fonte do SHA aprovado em `main` com o repositório gerenciado do Sites.
2. Gerar o build empacotado, salvar a versão e publicar pelo fluxo oficial.
3. Para reverter, republicar a versão anterior salva no Sites.

O manifesto `.openai/hosting.json` declara `d1: "DB"` e `r2: null`. Migrações novas em `drizzle/` precisam ser aplicadas ao D1 de produção antes de publicar o código que depende delas. Outra hospedagem é uma migração de infraestrutura separada.

## Acesso

- Leitura comprovada pelo clone HTTPS dos cinco repositórios.
- Escrita pelo `gh` autenticado pelo proprietário. Se o PR desta transferência existir, a escrita foi comprovada por ele.
- Nenhuma credencial foi gravada em arquivos, logs ou evidências.

## Retomar

```sh
git clone https://github.com/raphaelkaych/farol-de-integracoes
cd farol-de-integracoes
npm ci
npm run build
node scripts/preview-e2e.mjs 18790
```

A base está pronta para o redesign: a suíte completa passa em um clone limpo e as instruções para agentes estão em [CLAUDE.md](../CLAUDE.md).
