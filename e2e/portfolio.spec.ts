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
  await expect(page.getByRole("heading", { name: "8 projetos" })).toBeVisible();
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

test("rede da home acompanha o mouse e respeita movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const signals = page.locator(".hero-signals");
  await expect(signals).toHaveAttribute("data-tracking", "");
  const point = await signals.locator(".signal-nodes circle").nth(5).evaluate((node: SVGCircleElement) => {
    const { x, y } = new DOMPoint(node.cx.baseVal.value, node.cy.baseVal.value).matrixTransform(node.getScreenCTM()!);
    return { x, y };
  });
  await page.mouse.move(point.x + 22, point.y + 20);
  await expect(signals).toHaveAttribute("data-following", "");
  await expect(signals).toHaveAttribute("data-linked", "");
  const tether = signals.locator(".signal-link line");
  const start = await tether.getAttribute("x1");
  await page.mouse.move(point.x + 53, point.y + 20);
  await expect.poll(() => tether.getAttribute("x1")).not.toBe(start);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(signals).not.toHaveAttribute("data-tracking");
  await page.mouse.move(point.x + 28, point.y + 27);
  await expect(signals).not.toHaveAttribute("data-following");
  await expect(signals.locator(".signal-link")).toHaveCSS("opacity", "0");
});

test("busca abre Vindex Fiscal no currículo e a impressão preserva o relato", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Abrir busca rápida" }).click();
  const dialog = page.getByRole("dialog", { name: "Busca rápida" });
  await dialog.getByRole("searchbox").fill("SEFAZ");
  await dialog.getByRole("link", { name: "Vindex Fiscal" }).click();
  await expect(page).toHaveURL(/\/trajetoria#vindex-fiscal$/);
  const vindex = page.getByRole("region", { name: "Vindex Fiscal" });
  await expect(vindex).toContainText("desenvolvimento em equipe");
  await expect(vindex.getByRole("link", { name: "Testar um retorno fictício" })).toHaveAttribute("href", "/radar-de-retorno");
  await expect(page.getByRole("button", { name: "Imprimir ou salvar em PDF" })).toBeEnabled();
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Imprimir ou salvar em PDF" })).toBeHidden();
  await expect(vindex.getByRole("heading", { name: "Vindex Fiscal" })).toBeVisible();
  await expect(page.getByText(/inglês intermediário/i)).toBeVisible();
});

test("título é legível e controles do TraceAtlas ficam desabilitados sem JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Software que passa pelo teste." })).toBeVisible();
    await expect(page.locator(".type-text").first()).toHaveCSS("clip-path", "none");
    await expect(page.getByRole("link", { name: "Explorar projetos" })).toBeVisible();
    await page.goto("/traceatlas");
    await expect(page.getByRole("combobox", { name: "Cenário", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Executar cenário" })).toBeDisabled();
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
  const pages = ["/", "/projetos", "/trajetoria", "/qualitygate", "/ledgerflow", "/farol", "/traceatlas", "/radar-de-retorno",
    "/demos/plantao-ti", "/demos/ponte-erp", "/demos/pulso-operacao",
    "/projetos/qualitygate-studio", "/projetos/ledgerflow", "/projetos/traceatlas", "/projetos/radar-de-retorno",
    "/projetos/farol-de-integracoes", "/projetos/plantao-ti", "/projetos/ponte-erp", "/projetos/pulso-operacao"];
  for (const path of pages) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text()).toContain('rel="canonical"');
  }
  for (const path of ["/robots.txt", "/sitemap.xml", "/compartilhamento.png", "/hero-diagrama.svg", "/vindex-fluxo.svg", "/api-contract.json", "/evidencias/qualitygate-permissao.png"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
  expect((await request.get("/projetos/projeto-inexistente")).status()).toBe(404);
});

test("axe nas páginas principais e nos laboratórios", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const path of ["/", "/projetos/qualitygate-studio", "/qualitygate", "/traceatlas", "/trajetoria", "/radar-de-retorno"]) {
    await page.goto(path);
    if (path === "/traceatlas") {
      await page.getByRole("combobox", { name: "Cenário", exact: true }).selectOption("recuperacao");
      await page.getByRole("button", { name: "Executar cenário" }).click();
      await expect(page.getByRole("heading", { name: "Linha do tempo" })).toBeVisible();
    }
    const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(({ target }) => target) })), path).toEqual([]);
  }
});
