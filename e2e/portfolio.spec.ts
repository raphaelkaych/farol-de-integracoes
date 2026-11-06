import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home, seções e navegação abrem sem erros críticos", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Software que passa pelo teste." })).toBeVisible();
  await page.getByRole("button", { name: "API", exact: true }).click();
  await expect(page.getByRole("link", { name: "Ver projeto da camada API" })).toHaveAttribute("href", "/projetos/ledgerflow");
  await page.getByRole("link", { name: "Explorar projetos" }).click();
  await expect(page).toHaveURL(/#projetos$/);
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Engenharia" }).click();
  await expect(page).toHaveURL(/#engenharia$/);
  await expect(page.getByRole("heading", { name: "O que você encontra no código" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("filtro e estudo de caso mantêm URL e rotas funcionais", async ({ page }) => {
  await page.goto("/projetos");
  await expect(page.getByRole("heading", { name: "6 projetos" })).toBeVisible();
  await page.getByRole("link", { name: "QA & Automation" }).click();
  await expect(page).toHaveURL(/categoria=qualidade/);
  await expect(page.getByRole("heading", { name: "1 projeto", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Estudo de caso de QualityGate Studio" }).click();
  await expect(page.getByRole("heading", { name: "QualityGate Studio", level: 1 })).toBeVisible();
  await page.locator("summary").filter({ hasText: "Contrato HTTP" }).click();
  await expect(page.getByText(/Cada requisição inicia dois estados/)).toBeVisible();
  await page.getByRole("link", { name: "Abrir demonstração" }).first().click();
  await expect(page).toHaveURL(/\/qualitygate$/);
});

test("busca por teclado encontra projeto e fecha com Escape", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Abrir busca rápida" });
  await expect(trigger).toBeEnabled();
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Busca rápida" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("searchbox")).toBeFocused();
  await dialog.getByRole("searchbox").fill("playwright");
  await expect(dialog.getByRole("link", { name: "QualityGate Studio" })).toBeVisible();
  await expect(dialog.getByRole("link", { name: "LedgerFlow" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await trigger.click();
  await dialog.getByRole("searchbox").fill("ledger");
  await dialog.getByRole("link", { name: "LedgerFlow" }).press("Enter");
  await expect(page).toHaveURL(/\/projetos\/ledgerflow$/);
});

test("layout em 360, 768 e 1440 px e navegação mobile", async ({ page }) => {
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const menu = page.getByRole("button", { name: "Abrir menu" });
  await menu.press("Enter");
  await expect(page.getByRole("navigation", { name: "Navegação principal" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await menu.click();
  await page.getByRole("navigation", { name: "Navegação principal" }).getByRole("link", { name: "Projetos" }).click();
  await expect(page).toHaveURL(/\/projetos$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("título é legível sem JavaScript e com movimento reduzido", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Software que passa pelo teste." })).toBeVisible();
    await expect(page.locator(".type-text").first()).toHaveCSS("clip-path", "none");
    await expect(page.getByRole("link", { name: "Explorar projetos" })).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a digitação revela todas as letras e o atalho pula para o conteúdo", async ({ page }) => {
  await page.goto("/");
  await expect.poll(() => page.locator(".type-text").evaluateAll((lines) =>
    lines.every((line) => getComputedStyle(line).clipPath === "none")
  )).toBe(true);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir para o conteúdo" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#conteudo")).toBeFocused();
});

test("metadados, recursos e rotas legadas respondem", async ({ request }) => {
  const pages = ["/", "/projetos", "/trajetoria", "/qualitygate", "/ledgerflow", "/farol",
    "/demos/plantao-ti", "/demos/ponte-erp", "/demos/pulso-operacao",
    "/projetos/farol-de-integracoes", "/projetos/plantao-ti", "/projetos/ponte-erp", "/projetos/pulso-operacao"];
  for (const path of pages) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text()).toContain('rel="canonical"');
  }
  for (const path of ["/robots.txt", "/sitemap.xml", "/compartilhamento.png", "/hero-diagrama.svg", "/api-contract.json", "/evidencias/qualitygate-permissao.png"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect((await request.get("/projetos/projeto-inexistente")).status()).toBe(404);
});

test("axe nas páginas inicial, de caso e de QualityGate", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/projetos/qualitygate-studio", "/qualitygate"]) {
    await page.goto(path);
    const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), path).toEqual([]);
  }
});
