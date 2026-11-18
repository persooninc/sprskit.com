import assert from "node:assert/strict";
import test from "node:test";
import { canonicalHref, checkDomain } from "./domain.js";

const PAGE = (href) =>
  `<html><head><title>SPRS score worksheet</title>${href ? `<link rel="canonical" href="${href}"/>` : ""}</head></html>`;

function fakeFetch(routes) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, redirect: init?.redirect });
    const route = routes[url];
    if (route instanceof Error) throw route;
    if (!route) return new Response("not found", { status: 404 });
    return new Response(route.body ?? "", { status: route.status, headers: route.headers ?? {} });
  };
  return { impl, calls };
}

const LIVE = {
  "https://sprskit.com/": { status: 200, body: PAGE("https://sprskit.com") },
  "https://www.sprskit.com/": { status: 308, headers: { location: "https://sprskit.com/" } },
};

test("canonicalHref reads the link Next renders", () => {
  assert.equal(canonicalHref(PAGE("https://sprskit.com/")), "https://sprskit.com/");
  assert.equal(canonicalHref(PAGE(null)), null);
});

test("a live apex with a one-hop www redirect passes", async () => {
  const { impl, calls } = fakeFetch(LIVE);
  assert.deepEqual(await checkDomain({ fetchImpl: impl }), []);
  assert.ok(calls.every((call) => call.redirect === "manual"));
});

test("an apex that does not answer fails with the reason", async () => {
  const { impl } = fakeFetch({ "https://sprskit.com/": new Error("getaddrinfo ENOTFOUND sprskit.com") });
  const failures = await checkDomain({ fetchImpl: impl });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /did not answer: getaddrinfo ENOTFOUND/);
});

test("a canonical still on the vercel host fails and names the fix", async () => {
  const { impl } = fakeFetch({
    ...LIVE,
    "https://sprskit.com/": { status: 200, body: PAGE("https://sprskit.vercel.app/") },
  });
  const failures = await checkDomain({ fetchImpl: impl });
  assert.equal(failures.length, 1);
  assert.match(failures[0], /canonical is https:\/\/sprskit\.vercel\.app\//);
  assert.match(failures[0], /SITE_ORIGIN=https:\/\/sprskit\.com/);
});

test("www that serves the page instead of redirecting fails", async () => {
  const { impl } = fakeFetch({ ...LIVE, "https://www.sprskit.com/": { status: 200, body: PAGE("https://sprskit.com/") } });
  const failures = await checkDomain({ fetchImpl: impl });
  assert.deepEqual(failures, ["https://www.sprskit.com/ returned 200, expected a redirect to https://sprskit.com/"]);
});

test("www that redirects somewhere else fails", async () => {
  const { impl } = fakeFetch({ ...LIVE, "https://www.sprskit.com/": { status: 308, headers: { location: "https://sprskit.vercel.app/" } } });
  const failures = await checkDomain({ fetchImpl: impl });
  assert.match(failures[0], /redirects to https:\/\/sprskit\.vercel\.app\//);
});

test("a parked apex page is not the worksheet", async () => {
  const { impl } = fakeFetch({ ...LIVE, "https://sprskit.com/": { status: 200, body: "<html>parked</html>" } });
  const failures = await checkDomain({ fetchImpl: impl });
  assert.ok(failures.some((f) => /is not the worksheet/.test(f)));
  assert.ok(failures.some((f) => /canonical is missing/.test(f)));
});
