import { readdirSync, readFileSync, writeFileSync } from "node:fs";

const sources = {
  "qualitygate-studio": [
    ["API", "lib/qualitygate/http.ts", "export async function runQualityCheck", 15],
    ["Regra", "lib/qualitygate/engine.ts", "function verify(", 14],
    ["Teste", "e2e/laboratorios.spec.ts", 'test("um leitor nunca deveria', 11],
  ],
  ledgerflow: [
    ["Validação", "lib/ledgerflow/model.ts", "export function parseCsv", 15],
    ["Regra", "lib/ledgerflow/model.ts", "export function statusByReference", 17],
    ["Persistência", "lib/ledgerflow/store.ts", "async write(key", 15],
    ["Teste", "e2e/laboratorios.spec.ts", "LedgerFlow recusa escrita", 23],
  ],
  "farol-de-integracoes": [
    ["Regra", "lib/farol/model.ts", "function runRound", 22],
    ["Persistência", "lib/farol/store.ts", "export function d1RunStore", 14],
    ["Teste", "tests/farol.test.ts", "DLQ preserva o histórico", 13],
  ],
  traceatlas: [
    ["API", "lib/traceatlas/http.ts", "export async function runTraceAtlas", 18],
    ["Regra", "lib/traceatlas/model.ts", "export function analyze", 13],
    ["Teste", "tests/traceatlas.test.ts", "a sonda do TraceAtlas mede", 17],
  ],
  "radar-de-retorno": [
    ["Validação", "lib/return-radar.ts", "const parsed = contract.safeParse", 18],
    ["Teste", "tests/return-radar.test.ts", "só quando HTTP e estado concordam", 6],
  ],
  contractshield: [
    ["Validação", "lib/contractshield/contract.ts", "export const changeInput", 9],
    ["API", "lib/contractshield/http.ts", 'if (request.method === "GET")', 13],
    ["Persistência", "lib/contractshield/store.ts", "async create(scope", 18],
    ["Teste", "e2e/contractshield.spec.ts", "Contrato v2 e isolamento", 22],
  ],
};

const excerpts = Object.fromEntries(Object.entries(sources).map(([slug, files]) => [slug, files.map(([kind, file, anchor, size]) => {
  const rows = readFileSync(new URL("../" + file, import.meta.url), "utf8").replace(/\r\n/g, "\n").trimEnd().split("\n");
  const matches = rows.flatMap((line, index) => line.includes(anchor) ? [index] : []);
  if (matches.length !== 1) throw new Error(file + " precisa de uma âncora única para " + anchor);
  const start = matches[0];
  const code = rows.slice(start, start + size);
  return { kind, file, line: start + 1, end: start + code.length, code: code.join("\n") };
})]));

// Numbers shown on the home page come from the test files themselves.
function declaredTests(dir, pattern) {
  const files = readdirSync(new URL("../" + dir, import.meta.url)).filter((name) => pattern.test(name)).sort();
  const count = files.reduce((total, name) =>
    total + (readFileSync(new URL("../" + dir + "/" + name, import.meta.url), "utf8").match(/^\s*test\(/gm) ?? []).length, 0);
  return { files: files.length, tests: count };
}
const inventory = { browser: declaredTests("e2e", /\.spec\.ts$/), logic: declaredTests("tests", /\.test\.ts$/) };

const outputs = [
  [new URL("../lib/workspace-evidence.json", import.meta.url), JSON.stringify(excerpts, null, 2) + "\n"],
  [new URL("../lib/test-inventory.json", import.meta.url), JSON.stringify(inventory, null, 2) + "\n"],
];
for (const [output, content] of outputs) {
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8").replace(/\r\n/g, "\n") !== content) {
      throw new Error("Trechos ou inventário de testes desatualizados. Execute node scripts/workspace-evidence.mjs.");
    }
  } else {
    writeFileSync(output, content);
  }
}
