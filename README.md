# Portfólio de engenharia · Raphael Kaych

[Portfólio público](https://raphael-kaych.raphaelvindex.chatgpt.site/) · [Vitrine de projetos](https://raphael-kaych.raphaelvindex.chatgpt.site/projetos) · [Execuções de CI](https://github.com/raphaelkaych/farol-de-integracoes/actions/workflows/validar.yml)

Aplicação que reúne estudos de caso e laboratórios de desenvolvimento, qualidade e integração de sistemas. O repositório começou como Farol de Integrações e hoje também contém a vitrine e dois módulos de demonstração.

| Laboratório | Código e documentação | Demo |
| --- | --- | --- |
| QualityGate Studio | [Comparação de referência e defeito](docs/qualitygate-studio.md) | [Executar cenários](https://raphael-kaych.raphaelvindex.chatgpt.site/qualitygate) |
| LedgerFlow | [Conciliação e auditoria](docs/ledgerflow.md) | [Importar um extrato fictício](https://raphael-kaych.raphaelvindex.chatgpt.site/ledgerflow) |
| Farol de Integrações | [Retentativas e recuperação](docs/farol.md) | [Recuperar um pedido](https://raphael-kaych.raphaelvindex.chatgpt.site/farol) |

## Instalação local

Use Node.js 24 e npm.

```sh
npm ci
npm run build
node scripts/preview-e2e.mjs 18790
```

Abra [http://127.0.0.1:18790](http://127.0.0.1:18790). O script cria um banco D1 local isolado e aplica as migrações na ordem. Encerre com Ctrl+C. Para usar um banco local que sobreviva entre execuções do Wrangler, aplique as migrações uma vez em `.wrangler/state` e use `npm start`.

Nenhuma chave é necessária para a prévia. `PLAYWRIGHT_BASE_URL` permite direcionar a suíte a uma prévia já iniciada. `PLAYWRIGHT_BROWSERS_PATH` pode apontar para o cache local de navegadores.

## Testes e evidências

```sh
npm test
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes com node:test cobrem domínio e contratos do servidor. Playwright cobre a interface, as APIs e regressões do Farol. axe avalia páginas selecionadas usando critérios WCAG. O CI publica o relatório, a captura e o trace da falha controlada do QualityGate. A execução local grava o relatório em `playwright-report/`. Use apenas dados fictícios nas demos.

## Decisões e contexto

- [Auditoria da versão anterior](docs/auditoria.md)
- [Arquitetura, design e deploy](docs/arquitetura-portfolio.md)
- [Pesquisa de mercado e referências](docs/mercado-e-referencias.md)
- [Contrato OpenAPI](public/api-contract.json)
- [Prioridades de evolução](docs/backlog.md)
