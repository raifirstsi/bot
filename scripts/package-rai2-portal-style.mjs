import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2];
if (!base || !isAbsolute(base) || !existsSync(base)) throw new Error("Pass an absolute production SaaS archive");
const scratch = mkdtempSync(join(tmpdir(), "rai2-portal-style-"));
try {
  const unpack = spawnSync("tar", ["-xzf", base, "-C", scratch], { stdio: "inherit" });
  if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error("Could not unpack the production archive");
  const publicDir = join(scratch, "saas", "public");
  const index = join(publicDir, "index.html");
  const source = readFileSync(index, "utf8");
  if (!source.includes('href="/app.css')) throw new Error("production account page has no app.css link");
  const withoutSeparateStyle = source.replace(/\s*<link rel="stylesheet" href="\/portal-dashboard\.css[^>]*>/, "");
  if (withoutSeparateStyle !== source) writeFileSync(index, withoutSeparateStyle);
  const cssTarget = join(publicDir, "app.css");
  const portalCss = readFileSync(join(root, "saas", "public", "portal-dashboard.css"), "utf8");
  const appCss = readFileSync(cssTarget, "utf8");
  if (!appCss.includes("--portal-content-max")) writeFileSync(cssTarget, `${appCss}\n\n${portalCss}`);
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
