import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { test } from "node:test";
import { handle } from "../lib/farol/http.ts";
import { destinationIsUp, InvalidAction, replay } from "../lib/farol/model.ts";
import type { State } from "../lib/farol/model.ts";
import { d1RunStore, type RunStore } from "../lib/farol/store.ts";

function database() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(readFileSync(new URL("../drizzle/0000_farol_sessions.sql", import.meta.url), "utf8"));

  // Execute the production queries against SQLite, translating only the D1 I/O shape.
  function prepare(sql: string, values: SQLInputValue[] = []) {
    const statement = sqlite.prepare(sql);
    return {
      bind: (...parameters: SQLInputValue[]) => prepare(sql, parameters),
      async run() { return { meta: { changes: Number(statement.run(...values).changes) } }; },
      async all() { return { results: statement.all(...values) }; },
    };
  }

  const binding = {
    prepare,
    async batch(statements: ReturnType<typeof prepare>[]) {
      sqlite.exec("BEGIN");
      try {
        const result = [];
        for (const statement of statements) result.push(await statement.run());
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as D1Database;

  return { store: d1RunStore(binding), sqlite };
}

function request(store: RunStore, data?: unknown, token?: string, now = 1000) {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = "Bearer " + token;
  return handle(new Request("https://local.test/api/farol", {
    method: data ? "POST" : "GET", headers, body: data ? JSON.stringify(data) : undefined,
  }), store, now);
}

async function body<T>(response: Response): Promise<T> {
  return await response.json() as T;
}

test("ERP instável entrega no terceiro envio após 30 e 60 segundos de espera", () => {
  const state = replay("instavel", ["enviar-1042", "rodada", "rodada", "rodada", "enviar-1042"]);
  assert.equal(state.events.length, 1);
  assert.equal(state.events[0].status, "entregue");
  assert.equal(state.events[0].attempts, 3);
  assert.equal(state.now, 90);
  assert.deepEqual(state.audit.filter((row) => row.kind === "retentativa").map((row) => row.nextAt), [30, 90]);
  assert.equal(state.audit.filter((row) => row.kind === "duplicado").length, 2);
});

test("DLQ preserva o histórico e só permite reprocessar com o destino disponível", () => {
  const failed = ["rodada", "rodada", "rodada"] as const;
  assert.equal(replay("indisponivel", failed).events[0].status, "dlq");
  assert.throws(() => replay("indisponivel", [...failed, "reprocessar"]), InvalidAction);

  const recovered = replay("indisponivel", [...failed, "recuperar", "reprocessar", "rodada"]);
  assert.equal(destinationIsUp(recovered), true);
  assert.equal(recovered.events[0].id, "evt-1042");
  assert.equal(recovered.events[0].status, "entregue");
  assert.equal(recovered.events[0].attempts, 4);
  assert.equal(recovered.events[0].cycleAttempts, 1);
  assert.deepEqual(recovered.audit.slice(-4).map((row) => row.kind), ["dlq", "recuperado", "reprocessado", "entregue"]);
});

test("uma rodada processa só os eventos prontos e preserva a ordem dos prazos", () => {
  const state = replay("instavel", ["rodada", "enviar-1047", "rodada"]);
  assert.equal(state.now, 0);
  assert.deepEqual(state.events.map((event) => event.due), [30, 30]);
  const next = replay("instavel", ["rodada", "enviar-1047", "rodada", "rodada"]);
  assert.equal(next.now, 30);
  assert.deepEqual(next.events.map((event) => event.attempts), [2, 2]);
});

test("a API grava uma única ação para duas escritas concorrentes na mesma revisão", async (t) => {
  const { store, sqlite } = database();
  t.after(() => sqlite.close());

  const created = await request(store, { action: "iniciar", scenario: "indisponivel" });
  assert.equal(created.status, 201);
  const { token } = await body<{ token: string }>(created);
  const [first, second] = await Promise.all([
    request(store, { action: "rodada", version: 0 }, token),
    request(store, { action: "enviar-1047", version: 0 }, token),
  ]);
  assert.deepEqual([first.status, second.status].sort(), [200, 409]);
  const snapshot = await request(store, undefined, token);
  assert.equal((await body<{ state: State }>(snapshot)).state.version, 1);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM farol_actions").get()?.count, 1);
});

test("sessões são isoladas, expiram e têm seu histórico removido na limpeza", async (t) => {
  const { store, sqlite } = database();
  t.after(() => sqlite.close());
  const a = await body<{ token: string }>(await request(store, { action: "iniciar", scenario: "instavel" }));
  const b = await body<{ token: string }>(await request(store, { action: "iniciar", scenario: "instavel" }));
  const stolenId = a.token.split(".")[0] + "." + b.token.split(".")[1];
  assert.equal((await request(store)).status, 401);
  assert.equal((await request(store, undefined, stolenId)).status, 404);
  assert.equal((await request(store, { action: "rodada", version: 0 }, a.token)).status, 200);
  assert.equal((await body<{ state: State }>(await request(store, undefined, b.token))).state.version, 0);

  const later = 1000 + 2 * 60 * 60 * 1000;
  assert.equal((await request(store, undefined, a.token, later)).status, 404);
  assert.equal((await request(store, { action: "iniciar", scenario: "instavel" }, undefined, later)).status, 201);
  assert.equal(sqlite.prepare("SELECT COUNT(*) AS count FROM farol_actions").get()?.count, 0);
});

test("a API limita tamanho e rejeita ações desconhecidas", async (t) => {
  const { store, sqlite } = database();
  t.after(() => sqlite.close());
  assert.equal((await request(store, { action: "iniciar", scenario: "x".repeat(1100) })).status, 413);
  assert.equal((await request(store, { action: "iniciar", scenario: "outro" })).status, 422);
  const { token } = await body<{ token: string }>(await request(store, { action: "iniciar", scenario: "instavel" }));
  assert.equal((await request(store, { action: "atualizar", version: 0 }, token)).status, 422);
  assert.equal((await request(store, { action: "reprocessar", version: 0 }, token)).status, 422);
});
