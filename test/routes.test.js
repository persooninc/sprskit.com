import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as health } from "../app/healthz/route.js";
import { GET as score } from "../app/api/score/route.js";
import { GET as robots } from "../app/robots.txt/route.js";
import { GET as sitemap } from "../app/sitemap.xml/route.js";
import Page from "../app/page.js";
import { metadata } from "../app/layout.js";
import { LIVE_ORIGIN, sitemapEntries } from "../lib/crawl.js";

test("GET /healthz reports the service and an unknown commit", async () => {
  const previous = process.env.VERCEL_GIT_COMMIT_SHA;
  const previousGit = process.env.GIT_COMMIT_SHA;
  delete process.env.VERCEL_GIT_COMMIT_SHA;
  delete process.env.GIT_COMMIT_SHA;
  try {
    const response = await health();
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body, { ok: true, service: "sprskit", commit: "unknown" });
  } finally {
    if (previous === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
    else process.env.VERCEL_GIT_COMMIT_SHA = previous;
    if (previousGit === undefined) delete process.env.GIT_COMMIT_SHA;
    else process.env.GIT_COMMIT_SHA = previousGit;
  }
});

test("GET /healthz shortens a platform commit sha", async () => {
  const previous = process.env.VERCEL_GIT_COMMIT_SHA;
  process.env.VERCEL_GIT_COMMIT_SHA = "5945033abcdef0123456789";
  try {
    const response = await health();
    const body = await response.json();
    assert.equal(body.commit, "5945033abcde");
  } finally {
    if (previous === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
    else process.env.VERCEL_GIT_COMMIT_SHA = previous;
  }
});

test("robots and sitemap name only the live worksheet", async () => {
  const robotsBody = await (await robots()).text();
  assert.match(robotsBody, /Allow: \/\n/);
  assert.match(robotsBody, /Disallow: \/api\/\n/);
  assert.match(robotsBody, /Disallow: \/healthz\n/);
  assert.match(robotsBody, new RegExp(`Sitemap: ${LIVE_ORIGIN}/sitemap.xml`));
  assert.doesNotMatch(robotsBody, /sprskit\.com/);

  const xml = await (await sitemap()).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locs, [`${LIVE_ORIGIN}/`]);
  assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  assert.equal(sitemapEntries().length, 1);
  assert.doesNotMatch(xml, /\/api\/|\/healthz|sprskit\.com/);
});

test("GET /api/score subtracts the three buckets", async () => {
  const response = await score(
    new Request("http://sprskit.local/api/score?unmet5=1&unmet3=0&unmet1=0"),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.shown, 105);
  assert.equal(body.floored, false);
});

test("GET /api/score returns 400 when the buckets sum past 110", async () => {
  const response = await score(
    new Request("http://sprskit.local/api/score?unmet5=40&unmet3=40&unmet1=40"),
  );
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /110/);
});

test("GET / renders the worksheet and the paid-kit boundary", () => {
  const html = renderToStaticMarkup(Page());
  assert.match(html, /SPRS score worksheet/);
  assert.match(html, /110 − \(5 × a\) − \(3 × b\) − c/);
  assert.match(html, /not an official SPRS submission/);
  assert.match(html, /href="https:\/\/sprs\.sh"/);
  assert.match(html, /does not sell that kit/);
  assert.match(html, /id="unmet5"/);
  assert.match(html, /id="unmet3"/);
  assert.match(html, /id="unmet1"/);
  assert.match(html, /Calculate score/);
});

test("the document title names sprskit.com and is not a certification", () => {
  assert.match(metadata.title, /sprskit\.com/);
  assert.match(metadata.description, /Not an official assessment/);
  assert.match(metadata.description, /sprs\.sh/);
});
