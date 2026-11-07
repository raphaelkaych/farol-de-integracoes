import existing from "./project-cases-existing.json";

type Part = { title: string; text: string };
export type Case = {
  slug: string; context: string; goal: string; architecture: Part[]; decisions: Part[];
  quality: string; tests: string; limits: string; next: string; snippet: string; snippetLabel: string;
};

export const cases: readonly Case[] = [
  {
    slug: "qualitygate-studio",
    context: "Uma reserva de estoque pode parecer correta na tela e ainda deixar saldo negativo, criar duas reservas para um pedido ou permitir uma escrita de quem só deveria consultar. Cada caso exige conferir a resposta e o efeito sobre os dados.",
    goal: "Exercitar um serviço de reserva com três falhas reproduzíveis. O visitante compara a implementação de referência com uma variante defeituosa e vê qual regra deixou de ser atendida.",
    architecture: [
      { title: "Painel de cenários", text: "A interface escolhe uma regra de estoque, reenvio ou autorização e chama a API com um identificador de cenário." },
      { title: "Contrato HTTP", text: "A rota valida o corpo JSON e aceita somente cenários predefinidos. Cada requisição inicia dois estados independentes." },
      { title: "Serviço de reserva", text: "As duas variantes exercitam a mesma operação de negócio. A variante de falha desativa apenas a verificação relevante." },
      { title: "Verificador da regra", text: "O resultado compara códigos, saldo e recibos efetivamente produzidos. O pipeline também testa a API e o fluxo no Chromium." },
    ],
    decisions: [
      { title: "Comparar o estado final", text: "Um HTTP 201 indica que houve escrita. A quantidade de recibos e o saldo mostram se a escrita foi correta." },
      { title: "Uma falha por vez", text: "Cada experimento altera uma condição, o que ajuda a vincular a violação à regra que deveria impedi-la." },
      { title: "Falha esperada no CI", text: "Um teste Playwright verifica a regra de autorização contra a versão defeituosa. O pipeline trata como regressão tanto uma falha inesperada quanto a ausência da falha prevista." },
    ],
    quality: "Os cenários trabalham com pedidos e perfis fictícios. A API limita a entrada a 1 KiB e não compartilha estoque ou reservas entre visitantes.",
    tests: "Testes de domínio validam as duas variantes. Playwright confere a API, a interface e a evidência da falha esperada. O relatório e os traces ficam associados à execução no GitHub Actions.",
    limits: "O estoque existe apenas durante a execução de um cenário. A comparação no navegador e os resultados do CI são apresentados em áreas distintas.",
    next: "Ampliar a matriz com expiração da reserva e concorrência sobre estoque persistido. Incluir casos de contrato entre versões do serviço.",
    snippet: 'return first.code === 201 && second.code === 200 && first.receipt === second.receipt &&\n  inventory.receipts.length === 1 && inventory.available === 2;',
    snippetLabel: "lib/qualitygate/engine.ts · regra de reenvio",
  },
  {
    slug: "ledgerflow",
    context: "Um extrato bancário e um sistema de pedidos podem descrever a mesma operação em dias diferentes. Reenvios do arquivo, valores divergentes e referências ambíguas precisam ser tratados antes de fechar a conciliação.",
    goal: "Importar lançamentos fictícios, distinguir pares conciliados de divergências e registrar cada operação autorizada em uma trilha de auditoria.",
    architecture: [
      { title: "Painel React", text: "O analista importa um CSV, ajusta lançamentos manuais e executa a conciliação. Filtros e exportação atuam sobre o recorte atual." },
      { title: "Sessão e API", text: "Um segredo aleatório identifica a sessão. O servidor aplica a permissão de analista ou leitor e compara a revisão de cada escrita." },
      { title: "Regras de negócio", text: "O domínio valida campos, compara reenvios e agrupa os registros por referência antes de comparar valor e data." },
      { title: "D1 e auditoria", text: "Um lote SQL atualiza o estado e acrescenta a auditoria. Se a revisão já mudou, a API devolve o estado atual com HTTP 409." },
    ],
    decisions: [
      { title: "Valores em centavos", text: "A regra compara inteiros. Datas, origem, identificador e valor seguem o formato restrito do CSV da demonstração." },
      { title: "Reenvio igual e conflito são casos distintos", text: "Um ID com os mesmos dados é contado como duplicado. Um ID com dados diferentes rejeita o lote inteiro." },
      { title: "Conciliar com revisão", text: "Uma referência precisa ter um registro por origem, o mesmo valor e até dois dias de diferença. Alterações nos lançamentos invalidam o cálculo anterior." },
    ],
    quality: "O perfil leitor consulta e exporta. O servidor barra escritas desse perfil mesmo quando a requisição ignora a interface. Sessões duram duas horas e guardam apenas o hash do segredo.",
    tests: "Os testes cobrem CSV inválido, reenvio idempotente e estados de conciliação. Playwright usa o D1 local para verificar escrita, concorrência, isolamento por token e o fluxo pelo navegador.",
    limits: "A sessão usa um conjunto pequeno de dados fictícios e permite editar lançamentos manuais. A permissão vale para a sessão temporária. Uma aplicação financeira real exigiria identidade de usuários, regras de aprovação e modelo relacional para o volume de produção.",
    next: "Modelar lotes e lançamentos em tabelas relacionais para importações grandes. Adicionar contas de usuário, regras de aprovação e trilhas por organização.",
    snippet: 'WHERE id = ? AND secret_hash = ? AND expires_at > ? AND role = \'analista\' AND revision = ?',
    snippetLabel: "lib/ledgerflow/store.ts · condição da escrita",
  },
  {
    slug: "traceatlas",
    context: "Um pedido pode ficar lento, falhar antes de chegar ao ERP ou terminar com sucesso depois de uma retentativa. Só observar o status final esconde parte do caminho.",
    goal: "Investigar a origem de uma falha em nove pedidos fictícios por lote, relacionando duração, código, parentesco e logs de cada operação.",
    architecture: [
      { title: "Contrato HTTP", text: "A rota recebe um cenário validado e gera um ID de correlação que volta no corpo e no cabeçalho X-Request-Id." },
      { title: "Modelo de rastros", text: "O simulador compõe spans encadeados de gateway, API, banco, worker e ERP. Cada log aponta para o rastro e para a etapa que o originou." },
      { title: "Painel de investigação", text: "A interface calcula a posição de cada barra pelo início e pela duração. O filtro considera falhas intermediárias, inclusive em pedidos recuperados." },
      { title: "Sonda do banco", text: "A API mede separadamente uma consulta real de prontidão no D1 e apresenta o resultado no mesmo painel." },
    ],
    decisions: [
      { title: "Relógios separados", text: "A simulação usa um relógio determinístico para reproduzir a falha. A sonda mede o tempo real da consulta com performance.now()." },
      { title: "Falha intermediária e falha final", text: "O ERP pode responder 503 e depois 200 para o mesmo pedido. O lote registra a recuperação e mantém a primeira falha no rastro." },
      { title: "P95 por posição", text: "As durações ordenadas produzem o P95 pelo método de posto mais próximo. Com nove pedidos, o indicador corresponde à maior duração do lote." },
    ],
    quality: "O corpo da solicitação tem limite de 1 KiB. Os cenários são fixos, e a única consulta real é uma leitura de prontidão. Os rastros fictícios são gerados por execução.",
    tests: "Testes de domínio conferem a árvore, os limites de tempo e a correlação dos logs. Playwright executa a API e investiga a falha e a recuperação na interface.",
    limits: "O painel representa um fluxo distribuído em uma simulação de serviço único. A sonda mede somente a consulta ao D1 do site. Os dados de cada lote ficam na resposta e no navegador durante a visita.",
    next: "Instrumentar serviços independentes com OpenTelemetry e exportar spans para um coletor em um ambiente de laboratório.",
    snippet: "const durations = traces.map((trace) => trace.durationMs).sort((a, b) => a - b);\nconst p95 = durations[Math.ceil(durations.length * .95) - 1];",
    snippetLabel: "lib/traceatlas/model.ts · cálculo do P95",
  },
  ...existing,
];
