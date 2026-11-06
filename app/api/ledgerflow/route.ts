import { env } from "cloudflare:workers";
import { json } from "../../../lib/api";
import { ledgerRequest } from "../../../lib/ledgerflow/http";
import { ledgerStore } from "../../../lib/ledgerflow/store";

export const dynamic = "force-dynamic";

function route(request: Request) {
  if (!env.DB) return json({ error: "O banco de demonstração está indisponível." }, 503);
  return ledgerRequest(request, ledgerStore(env.DB));
}

export { route as GET, route as POST };
