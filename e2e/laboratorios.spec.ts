import { expect, test } from "@playwright/test";
import type { Comparison } from "../lib/qualitygate/engine";
import type { TraceRun } from "../lib/traceatlas/model";
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
  const divergent = page.getByRole("row", { name: /LF-1002 B-102/ });
  await expect(divergent).toBeVisible();
  await divergent.getByRole("button", { name: "Inspecionar LF-1002" }).click();
  await expect(page.getByRole("region", { name: "Comparação de LF-1002" })).toContainText("Diferença de valor");
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

test("TraceAtlas correlaciona a falha e a recuperação com a sonda real separada", async ({ page, request }) => {
  const raw = await request.post("/api/traceatlas", { data: { scenario: "db-fora" } });
  expect(raw.status()).toBe(200);
  const result = await raw.json() as TraceRun;
  expect(raw.headers()["x-request-id"]).toBe(result.runId);
  expect(result.probe.status).toBe("disponivel");
  expect(result.metrics.failures).toBe(6);
  expect((await request.post("/api/traceatlas", { data: { scenario: "invalido" } })).status()).toBe(422);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/traceatlas");
  await page.getByRole("combobox", { name: "Cenário", exact: true }).selectOption("recuperacao");
  await page.getByRole("button", { name: "Executar cenário" }).click();
  await expect(page.getByText("Rastros disponíveis para investigação.")).toBeVisible();
  const metrics = page.getByRole("region", { name: "Métricas do lote simulado" });
  await expect(metrics).toContainText(/0\s*Falhas finais/);
  await expect(metrics).toContainText(/6\s*Recuperados/);
  await page.getByRole("checkbox", { name: "Só rastros com falha" }).check();
  await expect(page.getByRole("button", { name: /^Rastro \d/ })).toHaveCount(6);
  const timeline = page.getByRole("region", { name: "Linha do tempo" });
  await timeline.getByRole("button", { name: /ERP Enviar pedido/ }).click();
  await expect(timeline.getByRole("status")).toContainText("HTTP 503");
  await timeline.getByRole("button", { name: /ERP Reenviar pedido/ }).click();
  await expect(timeline.getByRole("status")).toContainText("HTTP 200");
  await timeline.getByText("Ver logs correlacionados").click();
  const probe = page.getByRole("region", { name: "Sonda do banco D1" });
  const correlation = await probe.locator("code").innerText();
  await expect(timeline.getByText(correlation + "-2", { exact: true })).toBeVisible();
  await expect(probe).toContainText("Disponível");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("Radar de Retorno detecta contrato quebrado mesmo com HTTP 200", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/radar-de-retorno");
  const examples = page.getByRole("combobox", { name: "Exemplo", exact: true });
  const validate = page.getByRole("button", { name: "Validar retorno" });
  const result = page.getByRole("status");
  await examples.selectOption("formato");
  await validate.click();
  await expect(result).toContainText("Revisar");
  await expect(result).toContainText("protocolo");
  await examples.selectOption("fila");
  await validate.click();
  await expect(result).toContainText("Aguardar");
  await page.getByRole("spinbutton", { name: "Código HTTP" }).fill("200");
  await validate.click();
  await expect(result).toContainText("deve chegar com HTTP 202");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
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

test("Plantão, Ponte e Pulso preservam seus fluxos no navegador", async ({ page }) => {
  await page.goto("/demos/plantao-ti");
  await page.getByRole("textbox", { name: "Chamado fictício" }).fill("Teste de regressão");
  await page.getByRole("button", { name: "Abrir chamado", exact: true }).click();
  const incident = page.getByRole("row", { name: /Teste de regressão/ });
  await expect(incident).toBeVisible();
  await incident.getByRole("button", { name: "Resolver chamado 4" }).click();
  await expect(incident).toContainText("Resolvido no prazo");

  await page.goto("/demos/ponte-erp");
  for (const name of ["Enviar pedido", "Reenviar o mesmo pedido", "Reenviar com outro valor", "Enviar com assinatura inválida"]) {
    await page.getByRole("button", { name, exact: true }).click();
  }
  for (const name of ["201", "200", "409", "401"]) await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();

  await page.goto("/demos/pulso-operacao");
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Data de referência (UTC)" }).selectOption("2");
  await expect(page.getByText("77%", { exact: true })).toBeVisible();
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
