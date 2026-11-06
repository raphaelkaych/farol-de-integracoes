import { ApiError, json, readJson } from "../api.ts";
import { compare } from "./engine.ts";
import { scenarios, type Scenario } from "./scenarios.ts";

export async function runQualityCheck(request: Request) {
  try {
    const body = await readJson(request, 1024);
    if (typeof body.scenario !== "string" || !Object.hasOwn(scenarios, body.scenario)) {
      throw new ApiError(422, "Escolha um cenário do laboratório.");
    }
    return json(compare(body.scenario as Scenario));
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    throw error;
  }
}
