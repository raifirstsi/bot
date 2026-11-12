import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const [script, args] of [
  ["scripts/check-rai2-locales.mjs", []],
  ["node_modules/typescript/bin/tsc", ["-b"]],
  ["node_modules/vite/bin/vite.js", ["build"]],
  ["scripts/build-oss-server.mjs", []],
  ["scripts/package-rai2-runtime.mjs", []],
]) {
  const env = script.includes("vite") ? { ...process.env, VITE_RAI2_SAAS: "1" } : process.env;
  const run = spawnSync(process.execPath, [join(root, script), ...args], { cwd: root, env, stdio: "inherit" });
  if (run.error) throw run.error;
  if (run.status !== 0) process.exit(run.status ?? 1);
}
