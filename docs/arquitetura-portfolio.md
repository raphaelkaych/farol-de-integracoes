# Arquitetura e direção visual

O portfólio é servido por um Worker no Sites. A interface usa React com App Router e Vinext. A hospedagem mantém o repositório de fonte e a identidade do site. O GitHub público contém o espelho de desenvolvimento e a suíte de CI. O README do perfil tem apresentação e links em seu próprio repositório.

| Camada | Caminhos |
| --- | --- |
| Conteúdo público | `app/`, `lib/project-index.ts`, `lib/project-cases.ts` |
| Design | `app/globals.css`, `app/portfolio.css`, `app/labs.css`, fontes WOFF2 locais |
| QualityGate Studio | `app/qualitygate`, `app/api/qualitygate`, `lib/qualitygate` |
| LedgerFlow | `app/ledgerflow`, `app/api/ledgerflow`, `lib/ledgerflow`, migração `0001` |
| TraceAtlas | `app/traceatlas`, `app/api/traceatlas`, `lib/traceatlas` |
| Radar de Retorno | `app/radar-de-retorno`, `lib/return-radar.ts`, validação no navegador |
| Farol e demos anteriores | `app/farol`, `app/demos/[slug]`, `lib/farol` |
| Qualidade | `tests/`, `e2e/`, `.github/workflows/validar.yml` |

As rotas públicas legadas continuam sendo os pontos de entrada das demos. Os novos estudos ficam em `/projetos/:slug`. O filtro usa uma query string, e os detalhes da arquitetura usam elementos HTML expansíveis. A busca rápida usa o diálogo nativo. A primeira tela tem texto renderizado no servidor e animação CSS de curta duração, com estado estático para movimento reduzido.

O design usa a paleta Midnight Navy do briefing, Geist para interface e títulos e JetBrains Mono para metadados. Da Linear vieram a hierarquia e o uso de representações do produto. Da Vercel, a ideia do grid e a ênfase na arquitetura. Da Raycast, a busca rápida e o cuidado com o foco. Os SVGs e as composições são próprios. As galerias complementares foram usadas para avaliar ritmo, contraste e separação de seções. [Linear](https://linear.app/) · [Vercel](https://vercel.com/) · [Raycast](https://www.raycast.com/) · [Awwwards](https://www.awwwards.com/) · [SiteInspire](https://www.siteinspire.com/) · [Hover States](https://www.hoverstat.es/) · [Framer](https://www.framer.com/)

A escolha de manter D1 permite demonstrar concorrência e persistência na mesma infraestrutura que já atende o Farol. O QualityGate usa estado por requisição, suficiente para comparar variantes. O LedgerFlow faz escrita e auditoria em um lote SQL. A segunda migração cria as tabelas de conciliação e preserva as do Farol. O TraceAtlas gera rastros em memória e consulta o banco em modo de leitura para medir a prontidão real da demo.

O CI verifica tipos, lógica, build, navegação, API e acessibilidade automatizada. A publicação de produção usa o versionamento do Sites. O [contrato HTTP](../public/api-contract.json) é versionado junto com a aplicação.
