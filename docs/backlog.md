# Próximas prioridades

As nove demonstrações disponíveis compartilham o ambiente do portfólio. As próximas entregas têm critérios para que cada proposta possa ser demonstrada e verificada.

| Prioridade | Entrega | Critério para publicar |
| --- | --- | --- |
| 1 | ReleasePilot | Publicar um fluxo verificável de validação de release, com evidência de CI, gate de qualidade e exercício de recuperação em ambiente isolado. |
| 2 | TraceAtlas com coleta distribuída | Instrumentar dois serviços independentes com OpenTelemetry. Propagar contexto entre eles, exportar os spans para um coletor e verificar uma recuperação ponta a ponta. |
| 3 | LedgerFlow com identidade própria | Modelar contas e aprovação, persistir lotes e lançamentos relacionais, testar migrações e isolamento de organizações. |
| 4 | Farol assíncrono | Comparar o relógio do laboratório com um worker agendado, backoff com jitter e rastreamento por evento. |
| 5 | AI EvalBench | Construir um conjunto de perguntas com gabarito e fontes fictícias. Medir regressões sobre versões do sistema com um protocolo reproduzível. |
| 6 | API TestKit | Extrair utilitários quando dois consumidores independentes já tiverem a mesma necessidade. Definir API, licença e testes antes de distribuir. |
| 7 | Versão em inglês | Traduzir páginas, metadados e mensagens das demos e verificar a navegação por idioma. |

Um comparador visual público pode entrar depois que houver um caso de regressão com capturas de referência, resultado e diferença que ajudem a explicar a mudança.
