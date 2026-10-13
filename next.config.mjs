import { execFileSync } from "node:child_process";

function pageLastmod() {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", "app/page.js"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
  } catch {
    return "";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: { SITEMAP_PAGE_LASTMOD: pageLastmod() },
};
export default nextConfig;
