import assert from "node:assert/strict";
import { test } from "node:test";
import {
  exportCsv, header, initialLedger, importEntries, LedgerError, mutate, parseCsv, sampleCsv, statusByReference,
} from "../lib/ledgerflow/model.ts";

test("o extrato conserva centavos e identifica reenvios idênticos", () => {
  const entries = parseCsv("\uFEFF" + sampleCsv.replaceAll("\n", "\r\n"));
  assert.equal(entries[1].cents, 126000);
  const first = importEntries(initialLedger(), entries);
  const second = importEntries(first.ledger, entries);
  assert.equal(first.inserted, 3);
  assert.equal(second.duplicates, 3);
  assert.equal(second.ledger.entries.length, 6);
});

test("um ID conflitante rejeita a importação inteira", () => {
  const current = importEntries(initialLedger(), parseCsv(sampleCsv)).ledger;
  const before = structuredClone(current);
  const incoming = parseCsv(header + "\nB-201,LF-2001,banco,2026-11-01,100\nB-101,LF-1001,banco,2026-10-02,1");
  assert.throws(() => importEntries(current, incoming), (error) => error instanceof LedgerError && error.status === 409);
  assert.deepEqual(current, before);
});

test("o CSV rejeita datas inexistentes e campos livres", () => {
  assert.throws(() => parseCsv(header + "\nB-201,LF-2001,banco,2026-02-29,100"), LedgerError);
  assert.throws(() => parseCsv(header + "\nB-201,=SOMA(1),banco,2026-02-01,100"), LedgerError);
  assert.throws(() => parseCsv(header + "\nB-201,LF-2001,sistema,2026-02-01,100"), LedgerError);
});

test("a conciliação identifica pares, divergências e referências ambíguas", () => {
  const ledger = importEntries(initialLedger(), parseCsv(sampleCsv)).ledger;
  const result = mutate(ledger, { action: "conciliar" }, 1).ledger;
  const statuses = statusByReference(result);
  assert.equal(statuses.get("LF-1001"), "conciliada");
  assert.equal(statuses.get("LF-1002"), "divergente");
  assert.equal(statuses.get("LF-1003"), "pendente");
  assert.match(exportCsv(result.entries, statuses), /B-101,LF-1001,banco,2026-10-02,34900,conciliada/);
  const ambiguous = mutate(result, { action: "criar", reference: "LF-1001", origin: "banco", date: "2026-10-02", cents: 34900 }, 2).ledger;
  assert.equal(ambiguous.reconciled, false);
  assert.equal(statusByReference({ ...ambiguous, reconciled: true }).get("LF-1001"), "ambigua");
});

test("um lançamento manual pode ser atualizado e removido, e o importado é preservado", () => {
  const initial = initialLedger();
  const draft = { reference: "LF-1099", origin: "sistema", date: "2026-10-05", cents: 100 };
  const created = mutate(initial, { action: "criar", ...draft }, 0).ledger;
  const updated = mutate(created, { action: "atualizar", id: "M-001", ...draft, cents: 200 }, 1).ledger;
  assert.equal(updated.entries.find((entry) => entry.id === "M-001")?.cents, 200);
  const removed = mutate(updated, { action: "remover", id: "M-001" }, 2).ledger;
  assert.deepEqual(removed, initial);
  assert.throws(() => mutate(removed, { action: "remover", id: "S-101" }, 3), LedgerError);
});
