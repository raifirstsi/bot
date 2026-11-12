import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist-server");
rmSync(join(output, "routes", "sepay.js"), { force: true });
const run = (script, args, env = process.env) => {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run(join(root, "node_modules", "typescript", "bin", "tsc"), ["-p", "tsconfig.server.build.json"]);
run(join(root, "scripts", "bundle-server.mjs"), [], { ...process.env, OMB_OSS_ONLY: "1" });

const entry = join(output, "index.js");
if (!existsSync(entry) || existsSync(join(output, "routes", "sepay.js")) || readdirSync(output, { recursive: true }).some((name) =>
  String(name).split(/[\\/]/).includes("enterprise"))) {
  throw new Error("OSS server artifact is missing its entry or contains the enterprise layer");
}
console.log("OSS server artifact verified: dist-server contains no enterprise layer");
