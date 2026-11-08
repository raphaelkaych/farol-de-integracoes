import { z } from "zod";

export const changeInput = z.strictObject({
  service: z.enum(["catalogo", "notificacoes", "cobranca"]),
  releaseWindow: z.enum(["comercial", "noturna"]),
});

export const createSandboxInput = z.strictObject({});
export const idempotencyKey = z.string().regex(/^[A-Za-z0-9_-]{12,64}$/);
export const changeId = z.uuid();

export type ChangeInput = z.infer<typeof changeInput>;
export type Change = ChangeInput & { id: string; createdAt: number; status: "registrada"; revision?: 1 };
export type Actor = "operador" | "leitor" | "externo";
export type Sandbox = { actors: Record<Actor, string>; expiresAt: number };

export function validReleaseWindow(input: ChangeInput) {
  return input.service !== "cobranca" || input.releaseWindow === "noturna";
}

export const bodyLimit = 2048;
export const changesLimit = 12;
export const requestLimit = 36;
export const sandboxLifetime = 15 * 60_000;
