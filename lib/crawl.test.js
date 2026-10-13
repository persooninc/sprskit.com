import assert from "node:assert/strict";
import test from "node:test";
import { deployCommit, LIVE_ORIGIN, siteOrigin, sitemapXml } from "./crawl.js";

test("site origin stays on the host that answers", () => {
  assert.equal(siteOrigin({}), LIVE_ORIGIN);
  assert.equal(siteOrigin({ SITE_ORIGIN: "not a url" }), LIVE_ORIGIN);
  assert.equal(siteOrigin({ SITE_ORIGIN: "http://sprskit.com" }), LIVE_ORIGIN);
  assert.equal(
    siteOrigin({ SITE_ORIGIN: "https://sprskit.com/" }),
    "https://sprskit.com",
  );
});

test("sitemap lastmod is the page commit date and the loc is the vercel host", () => {
  const xml = sitemapXml({});
  assert.match(xml, new RegExp(`<loc>${LIVE_ORIGIN}/</loc>`));
  assert.match(xml, /<lastmod>2026-10-12<\/lastmod>/);
  assert.equal(xml.includes("sprskit.com"), false);
});

test("deploy commit is unknown unless the value is hex", () => {
  assert.equal(deployCommit({}), "unknown");
  assert.equal(deployCommit({ VERCEL_GIT_COMMIT_SHA: "main" }), "unknown");
  assert.equal(deployCommit({ GIT_COMMIT_SHA: "abc1234" }), "abc1234");
});
