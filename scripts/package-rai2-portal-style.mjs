import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2];
if (!base || !isAbsolute(base) || !existsSync(base)) throw new Error("Pass an absolute production SaaS archive");
const scratch = mkdtempSync(join(tmpdir(), "rai2-portal-style-"));
try {
  mkdirSync(join(scratch, "saas"), { recursive: true });
  const unpack = spawnSync("tar", ["-xzf", base, "-C", scratch], { stdio: "inherit" });
  if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error("Could not unpack the production archive");
  const publicDir = join(scratch, "saas", "public");
  const index = join(publicDir, "index.html");
  const source = readFileSync(index, "utf8");
  if (!source.includes('href="/app.css')) throw new Error("production account page has no app.css link");
  if (!source.includes("portal-dashboard.css")) {
    const updated = source.replace(/(\s*<script src="\/app\.js[^>]*><\/script>)/, '$1\n    <link rel="stylesheet" href="/portal-dashboard.css?v=dashboard1">');
    if (updated === source) throw new Error("could not insert dashboard stylesheet link");
    writeFileSync(index, updated);
  }
  const cssTarget = join(publicDir, "portal-dashboard.css");
  writeFileSync(cssTarget, readFileSync(join(root, "saas", "public", "portal-dashboard.css")));
  const candidate = join(scratch, "candidate.tgz");
  const pack = spawnSync("tar", ["-czf", candidate, "-C", scratch, "saas"], { stdio: "inherit" });
  if (pack.error || pack.status !== 0) throw pack.error ?? new Error("Could not pack the portal style release");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const filename = `rai2-saas-0.1.151-${hash.slice(0, 16)}.tgz`;
  const archive = join(root, "release", filename);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${filename}\n`);
  console.log(`RAI2 portal style release: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
