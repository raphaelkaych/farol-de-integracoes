import { expect, test } from "@playwright/test";

test("Workspace abre código por URL, investiga arquitetura e aceita comandos por teclado", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/workspace?projeto=ledgerflow&painel=codigo");
  await page.getByRole("button", { name: "Persistência", exact: true }).press("Enter");
  await expect(page.getByLabel("Código do repositório")).toContainText("UPDATE ledger_sessions");
  await expect(page.getByRole("link", { name: "Abrir linhas no GitHub" })).toHaveAttribute("href", /ledgerflow\/store.ts#L/);
  const terminal = page.getByRole("textbox", { name: "Comando demonstrativo" });
  await terminal.fill("architecture");
  await terminal.press("Enter");
  await expect(page.getByRole("heading", { name: "Arquitetura", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /D1 e auditoria/ }).press("Enter");
  await expect(page.getByRole("region", { name: "D1 e auditoria" })).toContainText("Lote SQL em D1");
  await terminal.fill("whoami");
  await terminal.press("Enter");
  await expect(page.getByText(/Comando desconhecido/)).toBeVisible();
  await page.getByRole("navigation", { name: "Projetos no Workspace" }).getByRole("link", { name: /ContractShield/ }).press("Enter");
  await expect(page.getByRole("link", { name: "Abrir demo" })).toHaveAttribute("href", "/contractshield");
  await expect(page).toHaveURL(/projeto=contractshield&painel=arquitetura/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("mapa da home ilustra um bloqueio e encaminha à arquitetura", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Simular bloqueio" }).click();
  await expect(page.getByText("HTTP 403", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Abrir arquitetura" })).toHaveAttribute("href", "/workspace?projeto=ledgerflow&painel=arquitetura");
});
