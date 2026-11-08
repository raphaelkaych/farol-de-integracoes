import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import Ajv from "ajv";
import { requestLimit, type Sandbox } from "../lib/contractshield/contract";

test.use({ trace: "off" });

const path = "/api/contractshield/changes";
const payload = { service: "catalogo", releaseWindow: "comercial" };
const ajv = new Ajv({ strict: false });
const spec = JSON.parse(readFileSync(new URL("../public/contractshield.openapi.json", import.meta.url), "utf8")) as {
  components: { schemas: Record<string, object> };
};
const schemas = Object.fromEntries(Object.entries(spec.components.schemas).map(([name, schema]) =>
  [name, ajv.compile({ ...schema, components: spec.components })]));
const bearer = (token: string) => ({ Authorization: "Bearer " + token });

async function session(request: APIRequestContext) {
  const response = await request.post("/api/contractshield/session", { data: {} });
  expect(response.status()).toBe(201);
  const value = await response.json();
  expect(schemas.Sandbox(value)).toBe(true);
  return (value as Sandbox).actors;
}

test("Contrato v2 e isolamento de objeto usam respostas reais", async ({ request }) => {
  const actors = await session(request);
  const created = await request.post(path, {
    data: payload, headers: { ...bearer(actors.operador), "Idempotency-Key": randomUUID() },
  });
  expect(created.status()).toBe(201);
  const initial = await created.json();
  expect(schemas.ChangeV1(initial)).toBe(true);
  expect(Object.keys(initial).sort()).toEqual(["createdAt", "id", "releaseWindow", "service", "status"]);
  const uri = path + "?id=" + initial.id;
  const denied = await request.get(uri, { headers: bearer(actors.externo) });
  expect(denied.status()).toBe(404);
  expect(schemas.Problem(await denied.json())).toBe(true);
  const empty = await request.get(path, { headers: bearer(actors.externo) });
  expect(await empty.json()).toEqual({ items: [] });
  const allowed = await request.get(uri + "&version=2", { headers: bearer(actors.leitor) });
  expect(allowed.status()).toBe(200);
  const body = await allowed.json();
  expect(schemas.ChangeV1(body)).toBe(true);
  expect(schemas.ChangeV2(body)).toBe(true);
  expect(body).toEqual({ ...initial, revision: 1 });
  expect((await request.get(uri)).status()).toBe(401);
});

test("ContractShield protege escrita, propriedades, regra e tamanho do corpo", async ({ request }) => {
  const actors = await session(request);
  const post = (token: string, data: object) => request.post(path, {
    data, headers: { ...bearer(token), "Idempotency-Key": randomUUID() },
  });
  expect((await post(actors.leitor, payload)).status()).toBe(403);
  const injected = { ...payload, organization: "orbita" };
  expect(schemas.ChangeInput(injected)).toBe(false);
  expect((await post(actors.operador, injected)).status()).toBe(422);
  const invalid = await post(actors.operador, { ...payload, service: "cobranca" });
  expect(await invalid.json()).toMatchObject({ code: "janela_invalida" });
  expect((await post(actors.operador, { ...payload, padding: "á".repeat(1100) })).status()).toBe(413);
  const list = await request.get(path, { headers: bearer(actors.operador) });
  expect(await list.json()).toEqual({ items: [] });
});

test("ContractShield retorna um único ID para dois POST concorrentes", async ({ request }) => {
  const actors = await session(request);
  const headers = { ...bearer(actors.operador), "Idempotency-Key": randomUUID() };
  const results = await Promise.all([request.post(path, { headers, data: payload }), request.post(path, { headers, data: payload })]);
  expect(results.map((response) => response.status()).sort()).toEqual([200, 201]);
  expect(await results[0].json()).toEqual(await results[1].json());
  expect((await request.post(path, { headers, data: { ...payload, service: "notificacoes" } })).status()).toBe(409);
  const response = await request.get(path, { headers: bearer(actors.operador) });
  const list = await response.json();
  expect(schemas.ChangeList(list)).toBe(true);
  expect(list.items).toHaveLength(1);
});

test("ContractShield aplica o orçamento da sessão no banco", async ({ request }) => {
  const actors = await session(request);
  const headers = bearer(actors.operador);
  const responses = await Promise.all(Array.from({ length: requestLimit + 1 }, () => request.get(path, { headers })));
  expect(responses.filter((response) => response.status() === 200)).toHaveLength(requestLimit);
  const limited = responses.find((response) => response.status() === 429);
  expect(limited).toBeDefined();
  expect(limited?.headers()["retry-after"]).toMatch(/^\d+$/);
});

test("ContractShield exibe o 404 real no cenário de leitura cruzada", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contractshield");
  await page.getByRole("button", { name: "Executar requisição" }).click();
  await expect(page.getByRole("status")).toHaveText("Comportamento esperado verificado.");
  await expect(page.getByText("GET · externo · HTTP 404")).toBeVisible();
  await expect(page.getByText("POST · operador · HTTP 201")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
