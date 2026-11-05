import { actions, InvalidAction, maxActions, replay, scenarios } from "./model.ts";
import type { Action, Scenario } from "./model.ts";
import type { RunStore } from "./store.ts";

const uuid = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const bearer = new RegExp(`^Bearer (${uuid})\\.(${uuid})$`, "i");
const lifetime = 2 * 60 * 60 * 1000;
const maxBody = 1024;

class RequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function digest(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "no-store" } });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestError(415, "Envie application/json.");
  }
  if (!request.body) throw new RequestError(400, "Informe os dados da ação.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "";
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBody) {
        await reader.cancel();
        throw new RequestError(413, "O corpo da solicitação excede 1 KiB.");
      }
      text += decoder.decode(value, { stream: true });
    }
    const parsed: unknown = JSON.parse(text + decoder.decode());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("object required");
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError(400, "JSON inválido.");
  } finally {
    reader.releaseLock();
  }
}

export async function handle(request: Request, store: RunStore, now = Date.now()) {
  try {
    const input = request.method === "POST" ? await readBody(request) : null;
    if (input?.action === "iniciar") {
      if (!scenarios.includes(input.scenario as Scenario)) throw new RequestError(422, "Cenário inválido.");
      const scenario = input.scenario as Scenario;
      const id = crypto.randomUUID();
      const secret = crypto.randomUUID();
      const created = await store.create({ id, secretHash: await digest(secret), scenario, expiresAt: now + lifetime }, now);
      if (!created) throw new RequestError(503, "A demo atingiu o limite de sessões. Tente novamente mais tarde.");
      return json({ token: `${id}.${secret}`, state: replay(scenario, []) }, 201);
    }

    const auth = bearer.exec(request.headers.get("Authorization") ?? "");
    if (!auth) throw new RequestError(401, "Abra uma sessão de demonstração.");
    const [, id, secret] = auth;
    const secretHash = await digest(secret);
    const run = await store.get(id, secretHash, now);
    if (!run) throw new RequestError(404, "Sessão indisponível ou expirada. Inicie um novo cenário.");
    if (!input) return json({ state: replay(run.scenario, run.journal) });

    if (!actions.includes(input.action as Action) || !Number.isInteger(input.version) || Number(input.version) < 0) {
      throw new RequestError(422, "Ação ou versão inválida.");
    }
    if (input.version !== run.journal.length) {
      return json({ error: "O cenário foi atualizado. Confira o estado antes de tentar de novo.", state: replay(run.scenario, run.journal) }, 409);
    }
    if (run.journal.length >= maxActions) throw new RequestError(422, "A sessão chegou a 32 ações. Abra um novo cenário.");
    const action = input.action as Action;
    const state = replay(run.scenario, [...run.journal, action]);
    if (!await store.append(id, secretHash, now, run.journal.length, action)) {
      const latest = await store.get(id, secretHash, now);
      if (!latest) throw new RequestError(404, "Sessão indisponível ou expirada. Inicie um novo cenário.");
      return json({ error: "Outra ação foi registrada antes. O painel foi atualizado.", state: replay(latest.scenario, latest.journal) }, 409);
    }
    return json({ state });
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    if (error instanceof InvalidAction) return json({ error: error.message }, 422);
    console.error("farol_store_error", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "O armazenamento da demo está temporariamente indisponível." }, 503);
  }
}
