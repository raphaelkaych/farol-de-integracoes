import { expect, test, type Page } from "@playwright/test";

type Frame = { stage: string | null; path: string | null; selected: string | null };
type TracedWindow = typeof window & { motionFrames?: Frame[] };

async function observeSequence(page: Page) {
  // Record DOM transitions as they happen. Polling can skip a short phase on a busy host.
  await page.locator(".workbench").evaluate((map) => {
    const frames: Frame[] = [];
    (window as TracedWindow).motionFrames = frames;
    const observer = new MutationObserver(() => {
      const stage = map.getAttribute("data-stage");
      frames.push({ stage, path: map.querySelector(".wb-packet")?.getAttribute("d") ?? null,
        selected: map.querySelector('.workbench-tabs [aria-pressed="true"]')?.textContent ?? null });
      if (stage === "complete") observer.disconnect();
    });
    observer.observe(map, { attributes: true, attributeFilter: ["data-stage"] });
  });
}

async function recordedFrames(page: Page) {
  return page.evaluate(() => (window as TracedWindow).motionFrames ?? []);
}

test("o mapa percorre o fluxo e preserva o foco até o resultado", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".workbench");
  const run = page.getByRole("button", { name: "Executar fluxo" });
  await expect(run).toBeEnabled();
  await observeSequence(page);
  await run.press("Enter");
  await expect(map.getByRole("status")).toContainText("HTTP 201", { timeout: 10_000 });
  const frames = await recordedFrames(page);
  expect(frames.map(({ stage }) => stage)).toEqual(["prepare", "send", "validate", "write", "persist", "return", "complete"]);
  expect(frames.find(({ stage }) => stage === "send")?.path).toBe("M160 132H240");
  expect(frames.find(({ stage }) => stage === "persist")?.selected).toBe("Dados");
  await expect(page.getByRole("button", { name: "Dados", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(map.getByRole("status")).toContainText("HTTP 201");
  await expect(run).toBeFocused();
  await expect(map.getByRole("button", { name: "Reiniciar", exact: true })).toBeEnabled();
  await map.getByRole("button", { name: "Reiniciar", exact: true }).click();
  await expect(map).toHaveAttribute("data-stage", "idle");
  await expect(map.getByRole("status")).toBeEmpty();
});

test("bloqueio e validação recusam na API sem sinal de escrita", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".workbench");
  await observeSequence(page);
  await page.getByRole("button", { name: "Simular bloqueio", exact: true }).click();
  await expect(map.getByRole("status")).toContainText("HTTP 403");
  const frames = await recordedFrames(page);
  expect(frames.map(({ stage }) => stage)).toEqual(["prepare", "send", "validate", "return", "complete"]);
  expect(frames.find(({ stage }) => stage === "return")?.path).toMatch(/^M300 188/);
  await expect(map.getByRole("status")).toContainText("Nenhum dado é alterado");
  await expect(page.getByRole("button", { name: "API", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("combobox", { name: "Cenário do mapa" }).selectOption("invalid");
  await page.getByRole("button", { name: "Executar fluxo" }).click();
  await expect(map.getByRole("status")).toContainText("HTTP 422");
  await page.getByRole("combobox", { name: "Cenário do mapa" }).selectOption("stock");
  await page.getByRole("button", { name: "Executar fluxo" }).click();
  await expect(map.getByRole("status")).toContainText("HTTP 409");
  await expect(map.getByRole("status")).toContainText("sem escrita");
});

test("pausa conserva a etapa e retoma; fora da tela suspende o movimento", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".workbench");
  await page.getByRole("button", { name: "Executar fluxo" }).click();
  await page.getByRole("button", { name: "Pausar animações", exact: true }).click();
  const stage = await map.getAttribute("data-stage");
  expect(stage).not.toBe("complete");
  await expect(map).toHaveAttribute("data-ambient", "paused");
  await expect(map.locator(".wb-orbit")).toHaveCSS("animation-play-state", "paused");
  // Deliberate time sampling checks that the sequence cannot advance while paused.
  await page.waitForTimeout(1100);
  await expect(map).toHaveAttribute("data-stage", stage!);
  await page.getByRole("button", { name: "Retomar animações", exact: true }).click();
  await expect(map.getByRole("status")).toContainText("HTTP 201", { timeout: 10_000 });
  await page.locator("#contato").scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute("data-ambient", "paused");
  await map.scrollIntoViewIfNeeded();
  await expect(map).toHaveAttribute("data-ambient", "running");
});

test("movimento reduzido entrega resultado imediato e pausa as animações", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const map = page.locator(".workbench");
  await expect(page.getByRole("button", { name: "Movimento reduzido" })).toBeDisabled();
  await expect(map.locator(".wb-orbit")).toHaveCSS("animation-name", "none");
  const block = page.getByRole("button", { name: "Simular bloqueio", exact: true });
  await expect(block).toBeEnabled();
  await block.press("Enter");
  await expect(map).toHaveAttribute("data-stage", "complete");
  await expect(map.getByRole("status")).toContainText("HTTP 403");
  await expect(map.locator(".wb-packet")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Executar fluxo" }).click();
  await expect(map).not.toHaveAttribute("data-stage", "complete");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(map).toHaveAttribute("data-stage", "complete");
});

test("mudança de visibilidade suspende a sequência e permite retomar", async ({ page }) => {
  await page.goto("/");
  const map = page.locator(".workbench");
  await page.getByRole("button", { name: "Executar fluxo" }).click();
  // A deterministic visibility fixture; headless tabs do not reliably become hidden.
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(map).toHaveAttribute("data-ambient", "paused");
  const stage = await map.getAttribute("data-stage");
  expect(stage).not.toBe("complete");
  await page.waitForTimeout(1100);
  await expect(map).toHaveAttribute("data-stage", stage!);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(map.getByRole("status")).toContainText("HTTP 201", { timeout: 10_000 });
});

test("previews reagem ao foco com animação finita e ficam estáticos no modo reduzido", async ({ page }) => {
  await page.goto("/projetos");
  const card = page.getByRole("article", { name: "QualityGate Studio", exact: true });
  await card.getByRole("link", { name: "QualityGate Studio", exact: true }).focus();
  const reference = card.locator(".pv-comparison-result").first();
  await expect(reference).toHaveCSS("animation-iteration-count", "1");
  await expect(reference).toHaveCSS("animation-name", "pv-result-glow");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(reference).toHaveCSS("animation-name", "none");
});

test("terminal mantém histórico limitado, rolagem interna e o comando mais recente visível", async ({ page }) => {
  await page.goto("/workspace?projeto=contractshield&painel=codigo");
  const input = page.getByRole("textbox", { name: "Comando demonstrativo" });
  for (const command of ["help", "skills", "projects", "github", "contact", "help", "desconhecido"]) {
    await input.fill(command);
    await input.press("Enter");
  }
  const log = page.getByRole("log", { name: "Respostas do terminal" });
  await expect(log.locator(":scope > div")).toHaveCount(6);
  await expect(log).toContainText("Comando desconhecido");
  expect(await log.evaluate((element) => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
  await expect(input).toBeFocused();
});
