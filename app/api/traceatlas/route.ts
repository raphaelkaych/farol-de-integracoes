import { env } from "cloudflare:workers";
import { runTraceAtlas } from "../../../lib/traceatlas/http";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
  return runTraceAtlas(request, async () => {
    const row = await env.DB?.prepare("SELECT 1 AS ready").first<{ ready: number }>();
    return row?.ready === 1;
  });
}
