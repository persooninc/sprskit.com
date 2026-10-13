# Tech stack — sprskit.com

Checked against the repo on 2026-10-12. No secrets.

| Layer | Choice |
|---|---|
| App | Next.js 15 App Router, React 19. Plain JavaScript. No database. |
| Score | `lib/score.js`. Formula `110 - (5 × a) - (3 × b) - c`, floor −203. The page and `GET /api/score` share that function. |
| Routes | `/` worksheet, `/healthz` JSON `{ ok, service }`, `/api/score` query params `unmet5`, `unmet3`, `unmet1`. |
| Tests | `npm test` runs `node --test` on the score function and every route handler. `npm run smoke` builds, starts Next on port 3456, and checks `/`, `/healthz`, and `/api/score`. |
| Host | Vercel project `sprskit`, team `dhillonrs`. Public URL `https://sprskit.vercel.app`. No custom domain is attached from this repo. |
| Analytics | GA4 gtag when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a `G-` id. Absent otherwise. `anonymize_ip` is on. Ads storage stays denied. No Vercel Web Analytics. |
| Payments | None. The paid NIST 800-171 kit stays on sprs.sh. |
| DNS | sprskit.com is a Cloudflare zone. Pointing it at Vercel is an owner step on the morning list. Agents do not change DNS. |
