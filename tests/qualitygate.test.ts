import assert from "node:assert/strict";
import { test } from "node:test";
import { compare } from "../lib/qualitygate/engine.ts";
import { runQualityCheck } from "../lib/qualitygate/http.ts";
import type { Scenario } from "../lib/qualitygate/scenarios.ts";

for (const scenario of ["stock", "replay", "role"] as Scenario[]) {
  test("QualityGate detecta a violação injetada: " + scenario, () => {
    const { control, injected } = compare(scenario);
    assert.equal(control.conforms, true);
    assert.equal(injected.conforms, false);
    assert.notEqual(control.inventory.receipts.length, injected.inventory.receipts.length);
  });
}

test("QualityGate isola estoque e recibos por execução", () => {
  const first = compare("stock");
  const second = compare("replay");
  assert.equal(first.injected.inventory.available, -1);
  assert.equal(second.control.inventory.available, 2);
  assert.deepEqual(second.control.responses.map((response) => response.code), [201, 200]);
  assert.equal(second.control.responses[0].receipt, second.control.responses[1].receipt);
});

test("a API do QualityGate recusa entradas fora do contrato", async () => {
  const call = (body: string) => runQualityCheck(new Request("http://example.test/api/qualitygate", {
    method: "POST", headers: { "Content-Type": "application/json" }, body,
  }));
  assert.equal((await call("{")).status, 400);
  assert.equal((await call(JSON.stringify({ scenario: "__proto__" }))).status, 422);
  assert.equal((await call(JSON.stringify({ scenario: "x".repeat(1024) }))).status, 413);
  const valid = await call(JSON.stringify({ scenario: "role" }));
  assert.equal(valid.status, 200);
  assert.equal(valid.headers.get("Cache-Control"), "no-store");
});
