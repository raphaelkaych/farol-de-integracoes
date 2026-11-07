export const scenarios = {
  normal: { title: "Fluxo normal", detail: "API, banco, worker e ERP concluem as etapas no tempo esperado." },
  "db-lento": { title: "Banco lento", detail: "Parte dos pedidos termina com sucesso, mas a consulta ao banco aumenta a latência." },
  "db-fora": { title: "Banco indisponível", detail: "A leitura falha e o fluxo termina antes de chegar ao worker." },
  worker: { title: "Falha no worker", detail: "O processamento falha depois da leitura e o ERP não recebe a chamada." },
  erp: { title: "ERP fora do ar", detail: "O worker chama o ERP e recebe 503 em parte das execuções." },
  recuperacao: { title: "Recuperação do ERP", detail: "A primeira chamada ao ERP falha e a retentativa conclui o pedido." },
} as const;

export type Scenario = keyof typeof scenarios;
export type Service = "Gateway" | "API" | "Banco" | "Worker" | "ERP";
type SpanStatus = "ok" | "erro";

export type Span = {
  id: string; parent: string | null; service: Service; operation: string;
  startMs: number; durationMs: number; status: SpanStatus; code: number;
};

export type Trace = {
  id: string; durationMs: number; status: SpanStatus; recovered: boolean; spans: Span[];
  logs: { traceId: string; spanId: string; atMs: number; level: "INFO" | "WARN" | "ERROR"; text: string }[];
};

type Health = { status: "disponivel" | "indisponivel"; durationMs: number };

function span(id: string, parent: string | null, service: Service, operation: string, startMs: number, durationMs: number, code: number): Span {
  return { id, parent, service, operation, startMs, durationMs, status: code >= 400 ? "erro" : "ok", code };
}

function simulateTrace(scenario: Scenario, index: number, id: string): Trace {
  const affected = index % 3 !== 0;
  const dbError = affected && scenario === "db-fora";
  const workerError = affected && scenario === "worker";
  const erpError = affected && (scenario === "erp" || scenario === "recuperacao");
  const recovered = erpError && scenario === "recuperacao";
  const slowRead = affected && scenario === "db-lento";
  const query = span("db", "api", "Banco", "Ler itens do pedido", 6, slowRead ? 270 + index * 31 : 8 + index % 6, dbError ? 503 : 200);
  const nested = [query];
  let finish = query.startMs + query.durationMs + 3;
  if (!dbError) {
    const workerStart = finish;
    if (!workerError) {
      const first = span("erp", "worker", "ERP", "Enviar pedido", workerStart + 3, 16 + index * 2, erpError ? 503 : 200);
      nested.push(first);
      finish = first.startMs + first.durationMs + 2;
      if (recovered) {
        const retry = span("erp-retry", "worker", "ERP", "Reenviar pedido", finish + 40, 14 + index, 200);
        nested.push(retry);
        finish = retry.startMs + retry.durationMs + 2;
      }
    } else {
      finish += 9;
    }
    nested.splice(1, 0, span("worker", "api", "Worker", "Processar pedido", workerStart, finish - workerStart, workerError ? 500 : erpError && !recovered ? 502 : 200));
  }
  const code = dbError ? 503 : workerError || (erpError && !recovered) ? 502 : 200;
  const total = finish + 6;
  const spans = [
    span("gateway", null, "Gateway", "Receber POST /pedidos", 0, total, code),
    span("api", "gateway", "API", "Validar e encaminhar", 2, total - 4, code),
    ...nested,
  ];
  const logs = spans.map<Trace["logs"][number]>((item) => ({
    traceId: id, spanId: item.id, atMs: item.startMs + item.durationMs,
    level: item.status === "erro" ? "ERROR" : item.durationMs >= 150 ? "WARN" : "INFO",
    text: item.service + " · " + item.operation + " · " + item.code + " em " + item.durationMs + " ms",
  })).sort((a, b) => a.atMs - b.atMs);
  return { id, durationMs: total, status: code >= 400 ? "erro" : "ok", recovered, spans, logs };
}

export function analyze(scenario: Scenario, runId: string) {
  const traces = Array.from({ length: 9 }, (_, index) => simulateTrace(scenario, index, runId + "-" + (index + 1)));
  const durations = traces.map((trace) => trace.durationMs).sort((a, b) => a - b);
  const failures = traces.filter((trace) => trace.status === "erro").length;
  return {
    runId, scenario, traces,
    metrics: {
      count: traces.length, p95: durations[Math.ceil(durations.length * .95) - 1], failures,
      recovered: traces.filter((trace) => trace.recovered).length,
    },
  };
}

export type TraceRun = ReturnType<typeof analyze> & { probe: Health };
