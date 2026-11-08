import { ApiError, demoBearer, json, readJson, secretDigest } from "../api.ts";
import { initialLedger, LedgerError, maxRevision, mutate } from "./model.ts";
import type { LedgerStore } from "./store.ts";

export async function ledgerRequest(request: Request, store: LedgerStore, now = Date.now()) {
  try {
    const input = request.method === "POST" ? await readJson(request, 8192) : null;
    if (input?.action === "iniciar") {
      if (input.role !== "analista" && input.role !== "leitor") throw new ApiError(422, "Escolha um perfil da demo.");
      const id = crypto.randomUUID();
      const secret = crypto.randomUUID();
      const key = { id, hash: await secretDigest(secret), now };
      const initial = initialLedger();
      if (!await store.open(key, input.role, initial)) throw new ApiError(503, "Limite de sessões atingido. Tente mais tarde.");
      return json({ token: id + "." + secret, state: { ...initial, role: input.role, revision: 0, audit: [] } }, 201);
    }

    const auth = demoBearer(request);
    if (!auth) throw new ApiError(401, "Abra uma sessão da demonstração.");
    const key = { id: auth.id, hash: await secretDigest(auth.secret), now };
    const state = await store.get(key);
    if (!state) return json({ code: "sessao_ausente", error: "Sessão ausente ou expirada. Abra uma nova sessão." }, 404);
    if (!input) return json({ state });
    if (state.role !== "analista") throw new ApiError(403, "O perfil leitor tem acesso apenas à consulta.");
    if (typeof input.action !== "string" || !Number.isSafeInteger(input.version) || Number(input.version) < 0) {
      throw new ApiError(422, "Informe uma ação e uma revisão válidas.");
    }
    if (state.revision !== input.version) return json({ state, error: "A sessão mudou. Confira os dados antes de repetir a ação." }, 409);
    if (state.revision >= maxRevision) throw new ApiError(422, "Esta sessão chegou ao limite de operações.");
    const next = mutate({ entries: state.entries, reconciled: state.reconciled }, input, state.revision);
    const changed = await store.write(key, state.revision, next.ledger, input.action, next.detail);
    const current = await store.get(key);
    if (!current) return json({ code: "sessao_ausente", error: "Sessão ausente ou expirada. Abra uma nova sessão." }, 404);
    if (!changed) return json({ state: current, error: "Uma ação concorrente chegou primeiro. A tela foi atualizada." }, 409);
    return json({ state: current, message: next.detail });
  } catch (error) {
    if (error instanceof ApiError || error instanceof LedgerError) return json({ error: error.message }, error.status);
    console.error("ledger_store_error", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "O banco de demonstração está temporariamente indisponível." }, 503);
  }
}
