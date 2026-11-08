# Auditoria e arquitetura da Missão 2.0

A base auditada foi a versão 5 do Sites e o commit público `8d160b0`. As 20 rotas do sitemap e do contrato responderam com HTTP 200. A revisão visual conferiu a home em desktop e o QualityGate a 390 px. O npm reportou seis alertas na árvore de produção, com severidade crítica em Next.js e alta em Zod, sharp e source-map-js. A triagem das branches públicas dos cinco repositórios consultou padrões conhecidos de segredo e nomes de arquivos sensíveis. [PR da base](https://github.com/raphaelkaych/farol-de-integracoes/pull/4) · [CI da base](https://github.com/raphaelkaych/farol-de-integracoes/actions/runs/42381664293)

| Prioridade | Evidência | Ação |
| --- | --- | --- |
| P0 | Dependências com avisos críticos e altos. | Atualizar versões e travar a auditoria de produção no CI. |
| P1 | O QualityGate podia habilitar controles antes da hidratação. A comparação mostrava o resultado agregado. | Aguardar a interface pronta e explicar cada assertiva com esperado e obtido. |
| P1 | A mutação do LedgerFlow podia manter uma sessão inválida na tela. A referência divergente exigia busca manual pela contraparte. | Reiniciar a sessão com mensagem própria e exibir as duas origens da referência. |
| P1 | O TraceAtlas mantinha o lote anterior após falha. A seleção não permitia buscar o ID ou recortar um serviço. | Limpar o lote na nova execução, filtrar e destacar a etapa mais demorada sem suboperações. |
| P1 | A abertura conectava demos, mas as fontes de código e teste exigiam navegação em várias páginas. | Integrar o mapa ao Developer Workspace e vincular trechos e evidências. |
| P2 | Ações por tag e ausência de referências visuais no pipeline. | Fixar SHAs e comparar capturas de componentes críticos no runner Ubuntu 24.04. |
| P2 | Repositórios públicos com licença sem declaração. | Registrar a decisão de licenciamento para cada artefato antes de uma distribuição como biblioteca. |
| P3 | Entrega progressiva, avaliação de IA e biblioteca reutilizável. | Ordenar no backlog pelos problemas que cada projeto resolve. |

## Organização dos repositórios

QualityGate, LedgerFlow, TraceAtlas e ContractShield têm fronteiras no código e nos testes. A publicação do Worker, os componentes de interface, a migração do banco e o pipeline são compartilhados. A estrutura escolhida é uma aplicação de demonstração com módulos próprios e guias por laboratório. O GitHub acompanha o código e a validação. O Sites mantém o repositório de publicação e as versões de deploy.

Um workspace com pacotes faria sentido quando dois aplicativos independentes consumirem a mesma interface. Um repositório próprio se justifica quando um laboratório puder ser executado, testado e implantado por conta própria. Ponte ERP, Plantão de TI e Pulso da Operação já têm essas fronteiras em Python e SQLite.

## Composição e interação

O mapa passou a mostrar envio, validação e retorno. Um cenário ilustrativo evidencia o caminho de autorização e abre o painel correspondente. O Workspace usa uma árvore, painéis e um terminal de comandos fixos. A abertura e os cards usam a paleta Midnight Navy, realce sob o cursor e transições curtas. O currículo concentra os atalhos para recrutamento.

A organização por operação e evidência partiu de Linear e Resend. A grade e a navegação por atalhos usam referências de Vercel e Raycast. A revisão de movimento e hierarquia considerou Framer e as galerias de portfólios. [Linear](https://linear.app/) · [Resend](https://resend.com/) · [Vercel Geist](https://vercel.com/geist/grid) · [Raycast](https://manual.raycast.com/action-panel) · [Framer](https://www.framer.com/help/articles/reduced-motion-settings/) · [Awwwards](https://www.awwwards.com/) · [Hover States](https://www.hoverstat.es/) · [SiteInspire](https://www.siteinspire.com/)
