import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { canonicalUrl, deployCommit, LIVE_ORIGIN, PAGE_LASTMOD, robotsTxt, siteOrigin, sitemapXml } from "./crawl.js";

test("site origin stays on the host that answers", () => {
  assert.equal(siteOrigin({}), LIVE_ORIGIN);
  assert.equal(siteOrigin({ SITE_ORIGIN: "not a url" }), LIVE_ORIGIN);
  assert.equal(siteOrigin({ SITE_ORIGIN: "http://sprskit.com" }), LIVE_ORIGIN);
  assert.equal(
    siteOrigin({ SITE_ORIGIN: "https://sprskit.com/" }),
    "https://sprskit.com",
  );
});

test("the canonical url follows SITE_ORIGIN with robots and the sitemap", () => {
  assert.equal(canonicalUrl({}), LIVE_ORIGIN + "/");
  assert.equal(canonicalUrl({ SITE_ORIGIN: "http://sprskit.com" }), LIVE_ORIGIN + "/");
  const apex = { SITE_ORIGIN: "https://sprskit.com" };
  assert.equal(canonicalUrl(apex), "https://sprskit.com/");
  assert.match(sitemapXml(apex), /<loc>https:\/\/sprskit\.com\/<\/loc>/);
  assert.match(robotsTxt(apex), /Sitemap: https:\/\/sprskit\.com\/sitemap\.xml/);
});

test("sitemap lastmod is the page commit date and the loc is the vercel host", () => {
  const xml = sitemapXml({});
  assert.match(xml, new RegExp(`<loc>${LIVE_ORIGIN}/</loc>`));
  assert.match(xml, /<lastmod>2026-11-15<\/lastmod>/);
  assert.equal(xml.includes("sprskit.com"), false);
});

test("a baked lastmod wins and a bad value is ignored", () => {
  assert.match(sitemapXml({ SITEMAP_PAGE_LASTMOD: "1999-01-02" }), /<lastmod>1999-01-02<\/lastmod>/);
  assert.match(sitemapXml({ SITEMAP_PAGE_LASTMOD: "deploy-day" }), /<lastmod>2026-11-15<\/lastmod>/);
});

test("the checked-in lastmod matches the page commit date", () => {
  const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", "app/page.js"], {
    encoding: "utf8",
  }).trim();
  assert.equal(PAGE_LASTMOD, date);
});

test("deploy commit is unknown unless the value is hex", () => {
  assert.equal(deployCommit({}), "unknown");
  assert.equal(deployCommit({ VERCEL_GIT_COMMIT_SHA: "main" }), "unknown");
  assert.equal(deployCommit({ GIT_COMMIT_SHA: "abc1234" }), "abc1234");
});
