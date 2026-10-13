import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "next/dist/build/swc/index.js";

const root = fileURLToPath(new URL("..", import.meta.url));

export async function load(url, context, nextLoad) {
  if (!url.startsWith("file:") || !url.includes("/sprskit.com/") || url.includes("/node_modules/")) {
    return nextLoad(url, context);
  }
  if (!url.endsWith(".js")) return nextLoad(url, context);
  const path = fileURLToPath(url);
  if (!path.startsWith(root)) return nextLoad(url, context);
  let source = readFileSync(path, "utf8");
  source = source.replace(/^import\s+["'][^"']+\.css["'];\s*/m, "");
  const transformed = transformSync(source, {
    filename: path,
    jsc: {
      parser: { syntax: "ecmascript", jsx: true },
      transform: { react: { runtime: "automatic" } },
    },
    module: { type: "es6" },
  });
  const withExtensions = transformed.code.replace(
    /(from\s+["'])(\.[^"']+)(["'])/g,
    (_, open, spec, close) => open + (spec.endsWith(".js") ? spec : `${spec}.js`) + close,
  );
  return { format: "module", source: withExtensions, shortCircuit: true };
}
