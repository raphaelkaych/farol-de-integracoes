import { env } from "cloudflare:workers";
import { handle } from "../../../lib/farol/http";
import { d1RunStore } from "../../../lib/farol/store";

export const dynamic = "force-dynamic";

function route(request: Request) {
  if (!env.DB) {
    return Response.json({ error: "O banco da demo está indisponível." }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
  return handle(request, d1RunStore(env.DB));
}

export { route as GET, route as POST };
