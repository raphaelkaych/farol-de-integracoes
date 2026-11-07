import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectReturn, maxReturnLength, returnFixtures } from "../lib/return-radar.ts";

test("o Radar separa confirmação, fila, rejeição, contrato incompatível e indisponibilidade", () => {
  assert.deepEqual(returnFixtures.map(({ http, payload }) => inspectReturn(http, JSON.stringify(payload)).decision),
    ["Avançar", "Aguardar", "Revisar", "Revisar", "Repetir depois"]);
  assert.deepEqual(inspectReturn(200, '{"estado":"aceito","protocolo":421}').fields, ["protocolo"]);
});

test("o Radar detecta um retorno coerente só quando HTTP e estado concordam", () => {
  assert.deepEqual(inspectReturn(200, '{"estado":"em_fila","protocolo":"DEMO-5"}').fields, ["estado", "HTTP"]);
  assert.equal(inspectReturn(202, '{"estado":"em_fila","protocolo":"DEMO-5","extra":1}').decision, "Aguardar");
  assert.equal(inspectReturn(200, '{"estado":"rejeitado","motivo":" " }').decision, "Revisar");
});

test("o Radar limita entradas e distingue falha HTTP de JSON inválido", () => {
  assert.equal(inspectReturn(503, "{").decision, "Repetir depois");
  assert.equal(inspectReturn(200, "{").decision, "Revisar");
  assert.equal(inspectReturn(200, " ".repeat(maxReturnLength + 1)).decision, "Revisar");
  assert.equal(inspectReturn(999, '{"estado":"aceito","protocolo":"DEMO-5"}').decision, "Revisar");
});
