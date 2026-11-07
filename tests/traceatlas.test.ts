import assert from "node:assert/strict";
import { test } from "node:test";
import { runTraceAtlas } from "../lib/traceatlas/http.ts";
import { analyze, scenarios, type Scenario, type TraceRun } from "../lib/traceatlas/model.ts";

test("TraceAtlas mantém a árvore, o relógio e a correlação em todos os cenários", () => {
  for (const scenario of Object.keys(scenarios) as Scenario[]) {
    const { traces, metrics } = analyze(scenario, scenario);
    assert.equal(metrics.count, 9);
    assert.equal(new Set(traces.map((trace) => trace.id)).size, 9);
    assert.equal(metrics.p95, Math.max(...traces.map((trace) => trace.durationMs)));
    for (const trace of traces) {
      const root = trace.spans[0];
      assert.equal(root.parent, null);
      assert.equal(root.durationMs, trace.durationMs);
      assert.equal(root.status, trace.status);
      const byId = new Map(trace.spans.map((span) => [span.id, span]));
      assert.equal(byId.size, trace.spans.length);
      for (const span of trace.spans.slice(1)) {
        const parent = span.parent && byId.get(span.parent);
        assert.ok(parent, scenario + " · " + span.id);
        assert.ok(parent.startMs <= span.startMs);
        assert.ok(parent.startMs + parent.durationMs >= span.startMs + span.durationMs);
      }
      assert.equal(trace.logs.length, trace.spans.length);
      assert.deepEqual(trace.logs.map((log) => log.atMs), trace.logs.map((log) => log.atMs).sort((a, b) => a - b));
      for (const log of trace.logs) {
        assert.equal(log.traceId, trace.id);
        const span = byId.get(log.spanId);
        assert.ok(span);
        assert.equal(log.atMs, span.startMs + span.durationMs);
      }
    }
  }
});

test("TraceAtlas diferencia gargalo, falha antes do ERP e recuperação com tentativa registrada", () => {
  const normal = analyze("normal", "normal");
  const slow = analyze("db-lento", "slow");
  assert.ok(slow.metrics.p95 > normal.metrics.p95);
  assert.equal(slow.metrics.failures, 0);
  assert.equal(slow.traces[1].logs.find((log) => log.spanId === "db")?.level, "WARN");
  const db = analyze("db-fora", "db");
  assert.equal(db.metrics.failures, 6);
  assert.deepEqual(db.traces[1].spans.map((span) => span.id), ["gateway", "api", "db"]);
  const worker = analyze("worker", "worker");
  assert.equal(worker.metrics.failures, 6);
  assert.equal(worker.traces[1].spans.find((span) => span.id === "worker")?.code, 500);
  assert.ok(!worker.traces[1].spans.some((span) => span.service === "ERP"));
  assert.equal(analyze("erp", "erp").metrics.failures, 6);
  const recovery = analyze("recuperacao", "recovery");
  assert.equal(recovery.metrics.failures, 0);
  assert.equal(recovery.metrics.recovered, 6);
  assert.deepEqual(recovery.traces[1].spans.filter((span) => span.service === "ERP").map((span) => span.code), [503, 200]);
});

test("a API do TraceAtlas valida entradas antes de chamar o D1", async () => {
  const unused = async () => assert.fail("A sonda só deve executar com uma entrada válida.");
  const call = (body: string, type = "application/json") => runTraceAtlas(new Request("https://example.test/api/traceatlas", {
    method: "POST", headers: { "Content-Type": type }, body,
  }), unused);
  assert.equal((await call("{")).status, 400);
  assert.equal((await call('{"scenario":"__proto__"}')).status, 422);
  assert.equal((await call("x".repeat(1025))).status, 413);
  assert.equal((await call('{"scenario":"normal"}', "text/plain")).status, 415);
});

test("a sonda do TraceAtlas mede a dependência sem interferir no cenário", async () => {
  const call = (check: () => Promise<boolean>) => runTraceAtlas(new Request("https://example.test/api/traceatlas", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"scenario":"db-fora"}',
  }), check);
  const available = await call(async () => true);
  const healthy = await available.json() as TraceRun;
  assert.equal(available.status, 200);
  assert.equal(available.headers.get("X-Request-Id"), healthy.runId);
  assert.equal(available.headers.get("Cache-Control"), "no-store");
  assert.equal(healthy.probe.status, "disponivel");
  assert.ok(healthy.probe.durationMs >= 0);
  const unavailable = await call(async () => { throw new Error("D1 off"); });
  const unhealthy = await unavailable.json() as TraceRun;
  assert.equal(unavailable.status, 200);
  assert.equal(unhealthy.probe.status, "indisponivel");
  assert.notEqual(healthy.runId, unhealthy.runId);
  assert.equal(healthy.metrics.failures, 6);
  assert.deepEqual(healthy.metrics, unhealthy.metrics);
});
