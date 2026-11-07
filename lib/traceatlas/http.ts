import { ApiError, json, readJson } from "../api.ts";
import { analyze, scenarios, type Scenario, type TraceRun } from "./model.ts";

export async function runTraceAtlas(request: Request, checkStorage: () => Promise<boolean>) {
  try {
    const body = await readJson(request, 1024);
    if (typeof body.scenario !== "string" || !Object.hasOwn(scenarios, body.scenario)) {
      throw new ApiError(422, "Escolha um cenário disponível no TraceAtlas.");
    }
    const id = crypto.randomUUID();
    const started = performance.now();
    let healthy = false;
    try { healthy = await checkStorage(); } catch { /* A falha aparece na sonda, separada dos rastros simulados. */ }
    const probe: TraceRun["probe"] = {
      status: healthy ? "disponivel" : "indisponivel",
      durationMs: Math.round((performance.now() - started) * 10) / 10,
    };
    const response = json({ ...analyze(body.scenario as Scenario, id), probe });
    response.headers.set("X-Request-Id", id);
    return response;
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    throw error;
  }
}
