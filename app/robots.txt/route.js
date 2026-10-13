import { robotsTxt } from "../../lib/crawl.js";

export function GET() {
  return new Response(robotsTxt(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
