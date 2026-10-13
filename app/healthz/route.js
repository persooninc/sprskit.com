import { deployCommit } from "../../lib/crawl.js";

export function GET() {
  return Response.json({
    ok: true,
    service: "sprskit",
    commit: deployCommit(),
  });
}
