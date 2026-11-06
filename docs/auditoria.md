# Auditoria dos quatro laboratórios

Leitura local de 6 de novembro de 2026. Os cinco checkouts de `outputs/Portfolio-Raphael` estavam limpos e suas branches `main` coincidiam com as referências locais `origin/main`. O diretório `raphaelkaych` contém a apresentação pública do perfil. A aplicação e os componentes das quatro demos estão no código do Farol.

| Laboratório | Implementação | Evidência local |
| --- | --- | --- |
| Farol de Integrações | Painel React, rota no Worker, motor de eventos TypeScript e diário em Cloudflare D1. O ERP e o relógio são simulados. | `node --test outputs/Portfolio-Raphael/farol-de-integracoes/tests/farol.test.ts` executou 6 testes com sucesso. |
| Plantão de TI | CLI Python e SQLite para abertura, fila e resolução. A demo usa React com estado e relógio locais à página. | `python -B -m unittest discover -s outputs/Portfolio-Raphael/plantao-ti -v` executou 2 testes com sucesso. |
| Ponte ERP | Receptor HTTP em Python com assinatura HMAC-SHA256, validação de payload e unicidade em SQLite. A demo executa a verificação no navegador com chave de exemplo. | `unittest` executou 3 testes com sucesso usando uma pasta temporária dentro de `work`. O ambiente bloqueou a primeira execução com a pasta temporária padrão. |
| Pulso da Operação | Importador Python, consulta agregada em SQL e relatório HTML. A demo lê três recortes da consulta original exportados para JSON. | `python -B -m unittest discover -s outputs/Portfolio-Raphael/pulso-operacao -v` executou 2 testes com sucesso. |

## Pontos a preservar durante a reconstrução

- Manter `/farol`, `/api/farol` e `/demos/{plantao-ti,ponte-erp,pulso-operacao}` porque os READMEs já apontam para essas rotas.
- Preservar o diário, a migração e os retornos da API do Farol. A chave composta, a condição de revisão e a expiração sustentam os cenários de concorrência e isolamento verificados.
- Usar o checkout do Site para o deploy e o repositório público como cópia rastreável do código. O manifesto de implantação do checkout do Site contém a identidade da hospedagem e o manifesto público declara a ligação D1 usada localmente.
- Manter distinta a apresentação de cada runtime. O navegador roda a triagem e a assinatura de demonstração em React, a análise usa resultados pré-calculados e o Farol grava no Worker e no D1.

## Melhorias de maior retorno

- Testar a integração HTTP completa do Ponte em loopback, incluindo limites de corpo e erro operacional, em uma evolução do laboratório.
- Automatizar a comparação entre os snapshots do Pulso e a saída do exportador para detectar desatualização.
- Exercitar as rotas antigas no novo Playwright e vincular cada caso ao código e à evidência existente.
