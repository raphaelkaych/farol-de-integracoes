import { github, siteRepository } from "./portfolio-meta";

// Each case states a verifiable result and points at the test that proves it.
export type Evidence = {
  problem: string;
  decision: string;
  result: string;
  test: { label: string; href: string };
};

const blob = (path: string) => siteRepository + "/blob/main/" + path;

export const evidence: Record<string, Evidence> = {
  "qualitygate-studio": {
    problem: "Uma reserva pode responder 201 e ainda deixar saldo negativo ou um recibo a mais.",
    decision: "Executar a mesma regra contra a referência e contra uma variante com uma falha injetada, e comparar o estado final.",
    result: "Um leitor que grava uma reserva recebe 403 na referência e 201 na variante defeituosa. O CI exige que essa falha apareça.",
    test: { label: "e2e/laboratorios.spec.ts", href: blob("e2e/laboratorios.spec.ts") },
  },
  contractshield: {
    problem: "Uma API pode vazar o registro de outra organização ou criar dois recursos para o mesmo reenvio.",
    decision: "Autorizar por objeto no servidor e gravar a chave de idempotência na mesma transação do D1.",
    result: "Dois POST concorrentes com a mesma chave devolvem um único ID. A leitura de outro escopo devolve 404.",
    test: { label: "e2e/contractshield.spec.ts", href: blob("e2e/contractshield.spec.ts") },
  },
  ledgerflow: {
    problem: "Extrato e sistema descrevem a mesma operação com datas, reenvios e referências diferentes.",
    decision: "Guardar valores em centavos inteiros e gravar estado e auditoria no mesmo lote SQL, com revisão.",
    result: "Um reenvio idêntico do extrato é reconhecido, e um ID com valores diferentes rejeita a importação inteira com 409.",
    test: { label: "tests/ledgerflow.test.ts", href: blob("tests/ledgerflow.test.ts") },
  },
  traceatlas: {
    problem: "Um pedido lento atravessa API, banco e ERP, e o log de cada serviço conta só uma parte.",
    decision: "Correlacionar spans por ID, destacar a etapa mais lenta e medir a sonda real do D1 em um painel separado.",
    result: "No cenário de banco lento, o rastro aponta o Banco como gargalo sem misturar simulação e medição.",
    test: { label: "tests/traceatlas.test.ts", href: blob("tests/traceatlas.test.ts") },
  },
  "farol-de-integracoes": {
    problem: "Quando o ERP cai, cada pedido precisa de um destino: nova tentativa, quarentena ou entrega.",
    decision: "Limitar as retentativas com espera crescente e manter o ID do evento ao passar pela DLQ.",
    result: "Com o ERP instável, o pedido é entregue no terceiro envio, após 30 e 60 segundos de espera.",
    test: { label: "tests/farol.test.ts", href: blob("tests/farol.test.ts") },
  },
  "radar-de-retorno": {
    problem: "Um HTTP 200 pode trazer um corpo que o fluxo não deveria aceitar.",
    decision: "Validar código e conteúdo juntos com um schema Zod antes de decidir o próximo passo.",
    result: "O Radar marca contrato quebrado mesmo quando a resposta chega com HTTP 200.",
    test: { label: "tests/return-radar.test.ts", href: blob("tests/return-radar.test.ts") },
  },
  "ponte-erp": {
    problem: "O emissor reenvia o webhook quando perde a resposta, às vezes em paralelo.",
    decision: "Validar o HMAC do corpo bruto e deduplicar evento e pedido com chaves únicas na mesma transação.",
    result: "Reenvios concorrentes criam um único pedido; outro valor com o mesmo ID recebe 409.",
    test: { label: "test_ponte.py", href: github + "/ponte-erp/blob/main/test_ponte.py" },
  },
  "pulso-operacao": {
    problem: "A fila com mais chamados nem sempre é a que pede atenção primeiro.",
    decision: "Recortar a base em um horário de corte e agregar volume, vencidos e SLA por área em SQL.",
    result: "ERP e Acessos têm o mesmo volume, mas só o ERP acumula fechamentos fora do prazo.",
    test: { label: "test_relatorio.py", href: github + "/pulso-operacao/blob/main/test_relatorio.py" },
  },
  "plantao-ti": {
    problem: "Um ERP fora do ar e um pedido de acesso chegam no mesmo minuto.",
    decision: "Ordenar a fila pelo prazo de resolução e encerrar com uma atualização condicional.",
    result: "Um P1 aberto depois de um P3 entra na frente da fila, e um segundo fechamento do mesmo incidente é recusado.",
    test: { label: "test_plantao.py", href: github + "/plantao-ti/blob/main/test_plantao.py" },
  },
};
