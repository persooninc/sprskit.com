// Crawl contract for the free worksheet. The sitemap lists only pages a
// person can read. The apex name is not advertised until DNS answers and an
// owner sets SITE_ORIGIN.

import { execFileSync } from "node:child_process";
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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function sourceLastmod(relativePath, env = process.env) {
  // next.config.mjs sets this at build. The serverless function has no .git,
  // and a Vercel checkout stamps mtimes with the deploy day.
  const baked = String(env.SITEMAP_PAGE_LASTMOD || "").trim();
  if (DATE_RE.test(baked)) return baked;
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", relativePath], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return DATE_RE.test(date) ? date : null;
  } catch {
    return null;
  }
}

export function sitemapEntries(env = process.env) {
  const origin = siteOrigin(env);
  return INDEXABLE.map((route) => ({
    loc: origin + (route.path === "/" ? "/" : route.path),
    lastmod: sourceLastmod(route.source, env),
  }));
}

export function sitemapXml(env = process.env) {
  const urls = sitemapEntries(env).map((entry) => {
    const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
    return `  <url>\n    <loc>${entry.loc}</loc>${lastmod}\n  </url>`;
  });
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
