import { expect, test } from "@playwright/test";
import type { Comparison } from "../lib/qualitygate/engine";
import { header, sampleCsv } from "../lib/ledgerflow/model";

test.use({ trace: "on" });

test("QualityGate compara reenvio pela API e mostra duas contagens", async ({ page, request }) => {
  const raw = await request.post("/api/qualitygate", { data: { scenario: "replay" } });
  expect(raw.status()).toBe(200);
  const result = await raw.json() as Comparison;
  expect(result.control.inventory.receipts).toHaveLength(1);
  expect(result.injected.inventory.receipts).toHaveLength(2);
  expect((await request.post("/api/qualitygate", { data: { scenario: "invalido" } })).status()).toBe(422);

  await page.goto("/qualitygate");
  await page.getByRole("radio", { name: /Reenvio do pedido/ }).check();
  await page.getByRole("button", { name: "Executar comparação" }).click();
  const control = page.getByRole("article", { name: "Implementação de referência" });
  const injected = page.getByRole("article", { name: "Implementação com defeito" });
  await expect(control).toContainText("HTTP 200");
  await expect(control).toContainText("Regra respeitada");
  await expect(injected).toContainText("Regra violada");
});

test("LedgerFlow importa, concilia, filtra, exporta e grava auditoria", async ({ page }) => {
  await page.goto("/ledgerflow");
  await page.getByRole("button", { name: "Entrar como analista" }).click();
  await expect(page.getByRole("heading", { name: "Sessão de analista" })).toBeVisible();
  await page.getByRole("button", { name: "Importar CSV de exemplo" }).click();
  await expect(page.getByRole("status")).toContainText("3 novos");
  await page.getByRole("button", { name: "Importar CSV de exemplo" }).click();
  await expect(page.getByRole("status")).toContainText("3 duplicados");
  await page.getByRole("button", { name: "Conciliar agora" }).click();
  await expect(page.getByRole("status")).toContainText("1 referência(s) conciliada(s)");
  await page.getByRole("combobox", { name: "Estado" }).selectOption("divergente");
  await expect(page.getByRole("row", { name: /LF-1002 B-102/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /LF-1001/ })).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar recorte" }).click();
  expect((await download).suggestedFilename()).toBe("ledgerflow-resultados.csv");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Histórico de alterações" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "Conciliação" })).toBeVisible();
  await page.getByRole("button", { name: "Entrar como leitor" }).click();
  await expect(page.getByRole("heading", { name: "Sessão de leitor" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Importar CSV de exemplo" })).toHaveCount(0);
});

test("LedgerFlow recusa escrita de leitor e alterações concorrentes na mesma revisão", async ({ request }) => {
  const open = async (role: string) => {
    const response = await request.post("/api/ledgerflow", { data: { action: "iniciar", role } });
    expect(response.status()).toBe(201);
    return (await response.json()).token as string;
  };
  const post = (token: string, data: unknown) => request.post("/api/ledgerflow", { data, headers: { Authorization: "Bearer " + token } });
  const read = (token: string) => request.get("/api/ledgerflow", { headers: { Authorization: "Bearer " + token } });
  const reader = await open("leitor");
  const analyst = await open("analista");
  expect((await post(reader, { action: "conciliar", role: "analista", version: 0 })).status()).toBe(403);
  expect((await read(analyst.split(".")[0] + "." + reader.split(".")[1])).status()).toBe(404);
  const body = { action: "importar", csv: sampleCsv, version: 0 };
  const outcomes = await Promise.all([post(analyst, body), post(analyst, body)]);
  expect(outcomes.map((response) => response.status()).sort()).toEqual([200, 409]);
  const conflict = await post(analyst, { action: "importar", version: 1, csv: header + "\nB-101,LF-1001,banco,2026-10-02,1" });
  expect(conflict.status()).toBe(409);
  const { state } = await (await read(analyst)).json();
  expect(state.entries).toHaveLength(6);
  expect(state.audit).toHaveLength(1);
  expect(state.revision).toBe(1);
  const { state: isolated } = await (await read(reader)).json();
  expect(isolated.entries).toHaveLength(3);
});

test("LedgerFlow cria, edita e remove um lançamento manual pelo diálogo", async ({ page }) => {
  await page.goto("/ledgerflow");
  await page.getByRole("button", { name: "Entrar como analista" }).click();
  await page.getByRole("button", { name: "Novo lançamento" }).click();
  const create = page.getByRole("dialog", { name: "Criar lançamento" });
  await create.getByLabel("Valor em centavos").fill("1000");
  await create.getByRole("button", { name: "Salvar lançamento" }).click();
  const row = page.getByRole("row", { name: /LF-1005 M-001/ });
  await expect(row).toContainText("10,00");
  await row.getByRole("button", { name: "Editar M-001" }).click();
  const edit = page.getByRole("dialog", { name: "Editar lançamento" });
  await edit.getByLabel("Valor em centavos").fill("2000");
  await edit.getByRole("button", { name: "Salvar lançamento" }).click();
  await expect(row).toContainText("20,00");
  await row.getByRole("button", { name: "Editar M-001" }).click();
  await edit.getByRole("button", { name: "Remover lançamento", exact: true }).click();
  await edit.getByRole("button", { name: "Confirmar remoção", exact: true }).click();
  await expect(row).toHaveCount(0);
  await expect(page.getByRole("listitem").filter({ hasText: "M-001 removido" })).toBeVisible();
});

test("Farol continua recuperando um pedido da quarentena", async ({ page }) => {
  await page.goto("/farol");
  await page.getByRole("button", { name: /ERP fora do ar/ }).click();
  for (const seconds of [0, 30, 90]) await page.getByRole("button", { name: "Executar rodada (+" + seconds + "s)", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Na DLQ", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar ERP" }).click();
  await page.getByRole("button", { name: "Reprocessar DLQ" }).click();
  await page.getByRole("button", { name: "Executar rodada (+90s)", exact: true }).click();
  await expect(page.getByRole("row", { name: /evt-1042 Entregue 4/ })).toBeVisible();
});

test.describe("Evidência de falha controlada", () => {
  test("um leitor nunca deveria conseguir criar uma reserva", async ({ page }, testInfo) => {
    await page.goto("/qualitygate");
    await page.getByRole("radio", { name: /Permissão de escrita/ }).check();
    await page.getByRole("button", { name: "Executar comparação" }).click();
    const defective = page.getByRole("article", { name: "Implementação com defeito" });
    await expect(defective).toContainText("HTTP 201");
    await testInfo.attach("reserva-indevida", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    test.fail(true, "A versão com a falha injetada aceita a escrita do perfil leitor.");
    await expect(defective).toContainText("HTTP 403", { timeout: 1200 });
  });
});
