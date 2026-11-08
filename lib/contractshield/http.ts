import { ApiError, demoBearer, json, readJson, secretDigest } from "../api.ts";
import { bodyLimit, changeId, changeInput, createSandboxInput, idempotencyKey, sandboxLifetime, validReleaseWindow, type Change, type Sandbox } from "./contract.ts";
import type { ContractStore, StoredChange } from "./store.ts";

function problem(status: number, code: string, error: string) {
  return json({ code, error }, status);
}

function dto(row: StoredChange, version: string): Change {
  return {
    id: row.id, service: row.service, releaseWindow: row.releaseWindow, status: "registrada", createdAt: row.createdAt,
    ...(version === "2" ? { revision: 1 } : {}),
  };
}

function failure(error: unknown) {
  if (error instanceof ApiError) return problem(error.status, "entrada_invalida", error.message);
  console.error("contractshield_store_error", error instanceof Error ? error.name : "UnknownError");
  return problem(503, "indisponivel", "O armazenamento da demonstração está indisponível.");
}

export async function openSandbox(request: Request, store: ContractStore, now = Date.now()) {
  try {
    if (!createSandboxInput.safeParse(await readJson(request, bodyLimit)).success) {
      return problem(422, "campos_invalidos", "Envie um objeto vazio para abrir a demonstração.");
    }
    const id = crypto.randomUUID();
    const secrets = { operador: crypto.randomUUID(), leitor: crypto.randomUUID(), externo: crypto.randomUUID() };
    const [operador, leitor, externo] = await Promise.all([
      secretDigest(secrets.operador), secretDigest(secrets.leitor), secretDigest(secrets.externo),
    ]);
    const expiresAt = now + sandboxLifetime;
    if (!await store.open(id, { operador, leitor, externo }, now, expiresAt)) {
      return problem(503, "capacidade", "Capacidade de sessões temporárias atingida.");
    }
    const sandbox: Sandbox = {
      actors: { operador: id + "." + secrets.operador, leitor: id + "." + secrets.leitor, externo: id + "." + secrets.externo },
      expiresAt,
    };
    return json(sandbox, 201);
  } catch (error) {
    return failure(error);
  }
}

export async function changeRequest(request: Request, store: ContractStore, now = Date.now()) {
  try {
    const body = request.method === "POST" ? await readJson(request, bodyLimit) : null;
    const auth = demoBearer(request);
    const scope = auth ? await store.authorize(auth.id, await secretDigest(auth.secret), now) : null;
    if (!scope) return problem(401, "sessao_invalida", "Abra uma sessão válida da demonstração.");
    if (!await store.consume(scope, now)) {
      const response = problem(429, "limite", "A sessão atingiu o limite de requisições deste minuto.");
      const elapsed = now + sandboxLifetime - scope.expiresAt;
      response.headers.set("Retry-After", String(Math.ceil((60_000 - elapsed % 60_000) / 1000)));
      return response;
    }

    const params = new URL(request.url).searchParams;
    const version = params.get("version") ?? "1";
    if (version !== "1" && version !== "2") return problem(422, "versao_invalida", "Escolha a versão 1 ou 2 do contrato.");
    if (request.method === "GET") {
      const id = params.get("id");
      if (id === null) return json({ items: (await store.list(scope)).map((row) => dto(row, version)) });
      if (!changeId.safeParse(id).success) return problem(422, "id_invalido", "Informe o identificador da mudança.");
      const row = await store.read(scope, id);
      return row ? json(dto(row, version)) : problem(404, "mudanca_ausente", "Mudança não encontrada neste escopo.");
    }

    if (scope.actor === "leitor") return problem(403, "somente_leitura", "O perfil leitor só pode consultar mudanças.");
    const key = idempotencyKey.safeParse(request.headers.get("Idempotency-Key"));
    if (!key.success) return problem(422, "chave_invalida", "Informe uma chave de idempotência válida.");
    const input = changeInput.safeParse(body);
    if (!input.success) return problem(422, "campos_invalidos", "Informe somente service e releaseWindow, com valores do contrato.");
    if (!validReleaseWindow(input.data)) {
      return problem(422, "janela_invalida", "Mudanças em cobrança exigem janela noturna.");
    }

    const result = await store.create(scope, key.data, input.data, now);
    if (!result.row) return problem(409, "capacidade", "Este escopo atingiu o limite de mudanças da sessão.");
    if (result.row.service !== input.data.service || result.row.releaseWindow !== input.data.releaseWindow) {
      return problem(409, "chave_em_conflito", "A chave já está associada a outra mudança.");
    }
    return json(dto(result.row, version), result.created ? 201 : 200);
  } catch (error) {
    return failure(error);
  }
}
