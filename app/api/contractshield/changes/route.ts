import { env } from "cloudflare:workers";
import { json } from "../../../../lib/api";
import { changeRequest } from "../../../../lib/contractshield/http";
import { contractStore } from "../../../../lib/contractshield/store";

export const dynamic = "force-dynamic";
function route(request: Request) {
  if (!env.DB) return json({ code: "indisponivel", error: "Banco de demonstração indisponível." }, 503);
  return changeRequest(request, contractStore(env.DB));
}
export { route as GET, route as POST };
