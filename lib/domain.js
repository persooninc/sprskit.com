// Read-only checks for the custom domain. Run with `npm run smoke:domain`
// after the owner points DNS at Vercel. Every request is a GET.

export const APEX = "https://sprskit.com";
export const WWW = "https://www.sprskit.com";

const REDIRECT_CODES = new Set([301, 307, 308]);

export function canonicalHref(html) {
  const tag = String(html).match(/<link\b[^>]*\brel="canonical"[^>]*>/i);
  if (!tag) return null;
  const href = tag[0].match(/\bhref="([^"]+)"/i);
  return href ? href[1] : null;
}

function sameUrl(a, b) {
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.origin === y.origin && (x.pathname.replace(/\/+$/, "") || "/") === (y.pathname.replace(/\/+$/, "") || "/");
  } catch {
    return false;
  }
}

// Returns a list of failure messages. An empty list means the domain is live.
export async function checkDomain({ fetchImpl = fetch, apex = APEX, www = WWW } = {}) {
  const failures = [];
  let apexResponse;
  try {
    apexResponse = await fetchImpl(apex + "/", { redirect: "manual" });
  } catch (error) {
    return [`${apex}/ did not answer: ${error.message}`];
  }
  if (apexResponse.status !== 200) {
    failures.push(`${apex}/ returned ${apexResponse.status}, expected 200`);
  } else {
    const html = await apexResponse.text();
    if (!html.includes("SPRS score worksheet")) failures.push(`${apex}/ is not the worksheet`);
    const canonical = canonicalHref(html);
    if (!canonical || !sameUrl(canonical, apex + "/")) {
      failures.push(`${apex}/ canonical is ${canonical ?? "missing"}, expected ${apex}/ (set SITE_ORIGIN=${apex} and redeploy)`);
    }
  }

  let wwwResponse;
  try {
    wwwResponse = await fetchImpl(www + "/", { redirect: "manual" });
  } catch (error) {
    failures.push(`${www}/ did not answer: ${error.message}`);
    return failures;
  }
  const location = wwwResponse.headers.get("location");
  if (!REDIRECT_CODES.has(wwwResponse.status)) {
    failures.push(`${www}/ returned ${wwwResponse.status}, expected a redirect to ${apex}/`);
  } else if (!location || !sameUrl(new URL(location, www).href, apex + "/")) {
    failures.push(`${www}/ redirects to ${location ?? "nowhere"}, expected ${apex}/`);
  }
  return failures;
}
