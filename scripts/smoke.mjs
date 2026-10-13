import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 3456;
const base = `http://127.0.0.1:${port}`;

function start() {
  const child = spawn("npx", ["next", "start", "-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });
  return { child, readLogs: () => logs };
}

async function waitForHealth(child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`next start exited ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) return;
    } catch {
      // server still booting
    }
    await delay(250);
  }
  throw new Error("timed out waiting for /healthz");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const server = start();
try {
  await waitForHealth(server.child);
  const home = await fetch(base + "/");
  const html = await home.text();
  assert(home.status === 200, `home status ${home.status}`);
  assert(html.includes("SPRS score worksheet"), "home missing title");
  assert(html.includes("https://sprs.sh"), "home missing sprs.sh link");
  assert(html.includes("not an official"), "home missing the assessment disclaimer");

  const score = await fetch(`${base}/api/score?unmet5=1&unmet3=0&unmet1=0`);
  const body = await score.json();
  assert(score.status === 200, `score status ${score.status}`);
  assert(body.shown === 105, `expected 105, got ${body.shown}`);

  const bad = await fetch(`${base}/api/score?unmet5=40&unmet3=40&unmet1=40`);
  assert(bad.status === 400, `expected 400, got ${bad.status}`);
  console.log("smoke ok");
} catch (error) {
  console.error(server.readLogs());
  throw error;
} finally {
  server.child.kill("SIGTERM");
}
