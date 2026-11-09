# Visual Motion 3.0

Refinamento da experiência existente: a identidade Midnight Navy, os nove laboratórios, as APIs, os contratos e a trajetória profissional foram preservados. Nenhuma dependência foi adicionada.

## Direção a partir da inspeção

O estado anterior foi observado no navegador, incluindo entrada, seleção das camadas, bloqueio, scroll, hover, catálogo, estudos, currículo, Workspace e laboratórios. As capturas comparáveis usam 1600 × 1000, 1280 × 900, 768 × 1024 e 390 × 844.

| Prioridade | Observação | Implementação |
| --- | --- | --- |
| Mapa | A seleção mudava o contorno, sem explicar a sequência | Três nós estáveis, sinal de ida e retorno, destaque de validação, resultado e reinício |
| Hero | O título quebrava em três linhas no desktop largo; o fundo competia com a leitura | Tipografia ajustada, linhas mais discretas, iluminação lenta e reação do visual ao cursor |
| Projetos | Os previews tinham composições muito semelhantes | Comparação, pareamento, autorização HTTP, waterfall e retentativas com assinaturas próprias |
| Workspace | Divisórias e seleções tinham peso semelhante | Navegação discreta, trilho de seleção, superfície de leitura, transições entre arquivos e linhas destacadas |
| Continuidade | Tempos locais e respostas pouco coordenadas | Tokens compartilhados, entrada única dos cards, scroll nativo e movimento restrito a áreas úteis |

## Movimento e acessibilidade

`app/globals.css` define 200 ms para microinterações, 320 ms para conteúdo, 560 ms para entrada, 70 ms para stagger e 12 s para iluminação ambiental. A órbita decorativa completa uma volta em 36 s. Os previews executam animações finitas ao receber hover ou foco. O conteúdo já está visível antes de qualquer observador.

O mapa possui quatro cenários ilustrativos coerentes com as regras do QualityGate: reserva válida (201), perfil sem permissão (403), quantidade inválida (422) e saldo insuficiente (409). A animação não chama APIs, não grava dados e não representa telemetria de produção. Em recusas, a sequência termina na API sem sinal de escrita.

O controle de pausa conserva a etapa e o tempo restante. A animação ambiental e o relógio da sequência param fora da viewport e com a aba oculta. `prefers-reduced-motion` remove o percurso animado e entrega o resultado imediatamente; mudanças dessa preferência durante a execução também são tratadas. O resultado permanece em texto. A região de status anuncia apenas o resultado final. A execução conserva o foco do botão.

O terminal continua limitado aos comandos documentados da interface. Mantém seis respostas, com rolagem interna e foco no campo de entrada; não executa shell. As linhas mostradas no Workspace continuam extraídas do repositório e conferidas pelo CI.

## Validação reproduzível

- `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- `node scripts/workspace-evidence.mjs --check`.
- `npm run test:e2e`: regressão funcional, navegação, acessibilidade axe, motion e screenshots Linux.
- `e2e/motion.spec.ts`: sequência completa, recusas, pausa/retomada, saída da viewport, preferência de movimento, foco, previews finitos e histórico do terminal.

A visibilidade em segundo plano usa uma fixture de `visibilitychange` no teste headless; não equivale a ensaiar suspensão pelo sistema operacional. Axe não substitui uma auditoria manual completa com diferentes leitores de tela. As capturas automatizadas são Chromium; não afirmam equivalência de pixels em todos os navegadores. Lighthouse é uma medição de laboratório, sem INP de usuários reais.

## Referências estudadas

- [Linear — design refresh](https://linear.app/now/behind-the-latest-design-refresh): hierarquia e redução do peso da navegação.
- [Vercel Geist — Grid](https://vercel.com/geist/grid): composição estável, guias e ordem semântica.
- [Raycast — Action Panel](https://manual.raycast.com/action-panel): ações contextuais e teclado.
- [Resend — event timeline](https://resend.com/changelog/email-events-timeline): cronologia e explicação de falhas.
- [Awwwards — The Need for Speed](https://www.awwwards.com/brainfood-mobile-performance-vol3.pdf): feedback e continuidade. O domínio principal não respondeu à pesquisa; foi consultado o material oficial indexado.
- [W3C — Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide): controle de movimento prolongado.
