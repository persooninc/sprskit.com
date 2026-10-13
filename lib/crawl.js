// Crawl contract for the free worksheet. The sitemap lists only pages a
// person can read. The apex name is not advertised until DNS answers and an
// owner sets SITE_ORIGIN.

import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const LIVE_ORIGIN = "https://sprskit.vercel.app";

const ORIGIN_RE = /^https:\/\/[a-z0-9.-]+$/i;

export function siteOrigin(env = process.env) {
  const raw = String(env.SITE_ORIGIN || LIVE_ORIGIN).trim().replace(/\/+$/, "");
  return ORIGIN_RE.test(raw) ? raw : LIVE_ORIGIN;
}

// One allowlist. /api/score and /healthz are not pages.
export const INDEXABLE = [{ path: "/", source: "app/page.js" }];

export function sourceLastmod(relativePath) {
  const info = statSync(path.join(root, relativePath));
  return info.mtime.toISOString().slice(0, 10);
}

export function sitemapEntries(env = process.env) {
  const origin = siteOrigin(env);
  return INDEXABLE.map((route) => ({
    loc: origin + (route.path === "/" ? "/" : route.path),
    lastmod: sourceLastmod(route.source),
  }));
}

export function sitemapXml(env = process.env) {
  const urls = sitemapEntries(env).map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`,
  );
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.join("\n") +
    "\n</urlset>\n"
  );
}

export function robotsTxt(env = process.env) {
  const origin = siteOrigin(env);
  return (
    "User-agent: *\n" +
    "Allow: /\n" +
    "Disallow: /api/\n" +
    "Disallow: /healthz\n" +
    "\n" +
    `Sitemap: ${origin}/sitemap.xml\n`
  );
}

const SHA_RE = /^[0-9a-f]{7,40}$/i;

export function deployCommit(env = process.env) {
  const raw = String(env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || "").trim();
  return SHA_RE.test(raw) ? raw.slice(0, 12) : "unknown";
}
