# sprskit.com

Free SPRS score arithmetic. You count unimplemented NIST SP 800-171 requirements in the 5-point, 3-point, and 1-point buckets. The page computes `110 - (5 × a) - (3 × b) - c` and shows the published floor of -203.

This is not an official SPRS submission, not a CMMC assessment, and not legal or contracting advice. It does not store answers and it does not sell anything. The paid self-assessment kit stays at [sprs.sh](https://sprs.sh).

```bash
npm install
npm test
npm run build
npm run smoke
```

| Doc | What it is |
|---|---|
| [TECHSTACK.md](TECHSTACK.md) | Runtime, routes, host |
| [ACCOUNTS.md](ACCOUNTS.md) | Account names only |
| [docs/VISION.md](docs/VISION.md) | What the page is for |
| [docs/deck/index.html](docs/deck/index.html) | Short deck |

DNS for sprskit.com is an owner step. This repo does not attach a custom domain or a Stripe price. The live host is https://sprskit.vercel.app.

`/robots.txt` allows the worksheet and disallows `/api/` and `/healthz`. `/sitemap.xml` lists only `https://sprskit.vercel.app/`. `lastmod` is the date of `app/page.js`. The apex is not in either file until an owner sets `SITE_ORIGIN` after DNS answers. `/healthz` reports `commit` from `VERCEL_GIT_COMMIT_SHA` (first 12 hex characters) or `unknown`.

Google Analytics loads only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is a real `G-` id. See `.env.example`. The placeholder disables the tag. Vercel Web Analytics stays off.
