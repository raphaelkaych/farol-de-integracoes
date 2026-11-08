import { env } from "cloudflare:workers";
import { json } from "../../../../lib/api";
import { openSandbox } from "../../../../lib/contractshield/http";
import { contractStore } from "../../../../lib/contractshield/store";

export function POST(request: Request) {
  if (!env.DB) return json({ code: "indisponivel", error: "Banco de demonstração indisponível." }, 503);
  return openSandbox(request, contractStore(env.DB));
}
