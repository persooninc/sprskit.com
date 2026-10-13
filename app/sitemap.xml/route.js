import { sitemapXml } from "../../lib/crawl.js";

export function GET() {
  return new Response(sitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
