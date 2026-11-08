import { expect, test } from "@playwright/test";

test.skip(process.platform !== "linux", "Referências visuais geradas no runner Linux do CI.");
test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });

test("assinatura visual da abertura", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".hero-band")).toHaveScreenshot("abertura.png", { animations: "disabled", maxDiffPixelRatio: 0.003 });
});

test("assinatura visual do Workspace", async ({ page }) => {
  await page.goto("/workspace?projeto=qualitygate-studio&painel=arquitetura");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".workspace")).toHaveScreenshot("workspace.png", { animations: "disabled", maxDiffPixelRatio: 0.003 });
});

test("assinatura visual da comparação de permissões", async ({ page }) => {
  await page.goto("/qualitygate");
  await page.getByRole("radio", { name: /Permissão de escrita/ }).check();
  await page.getByRole("button", { name: "Executar comparação" }).click();
  await expect(page.getByRole("article", { name: "Implementação com defeito" })).toContainText("HTTP 201");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".qa-results")).toHaveScreenshot("qualitygate.png", { animations: "disabled", maxDiffPixelRatio: 0.003 });
});
