import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2];
if (!base || !isAbsolute(base) || !existsSync(base)) throw new Error("Pass the absolute current SaaS archive");
const expected = readFileSync(`${base}.sha256`, "utf8").trim().split(/\s+/)[0];
const actual = createHash("sha256").update(readFileSync(base)).digest("hex");
if (actual !== expected) throw new Error("Base SaaS checksum mismatch");

const scratch = mkdtempSync(join(tmpdir(), "rai2-logo-refresh-"));
const replace = (file, pattern, replacement, label) => {
  const before = readFileSync(file, "utf8");
  const after = before.replace(pattern, replacement);
  if (after === before) throw new Error(`Could not update ${label}`);
  writeFileSync(file, after);
};
try {
  const unpack = spawnSync("tar", ["-xzf", base, "-C", scratch], { stdio: "inherit" });
  if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error("Could not unpack SaaS archive");
  const publicDir = join(scratch, "saas", "public");
  replace(join(publicDir, "landing.css"), /(\.logo-link img\s*\{\s*width:\s*)74px/, "$1" + "60px", "desktop landing logo");
  replace(join(publicDir, "landing.css"), /(\.logo-link img\s*\{\s*width:\s*)66px/, "$1" + "54px", "mobile landing logo");
  replace(join(publicDir, "app.css"), ".brand img { display: block; width: 74px; height: auto; }",
    ".brand img { display: block; width: 60px; height: auto; }", "desktop account logo");
  replace(join(publicDir, "app.css"), "  .brand img { width: 66px; }",
    "  .brand img { width: 54px; }", "mobile account logo");
  replace(join(publicDir, "landing.html"), 'href="/landing.css"', 'href="/landing.css?v=20261112-logo2"', "landing CSS version");
  replace(join(publicDir, "landing.html"), 'src="/landing.js"', 'src="/landing.js?v=20261112-logo2"', "landing JS version");
  replace(join(publicDir, "landing.html"), /href="(\/assets\/rai-[^"]+(?:\.svg|\.png|\.ico))"/g,
    'href="$1?v=20261112-logo2"', "landing icon version");
  replace(join(publicDir, "index.html"), 'href="/app.css"', 'href="/app.css?v=20261112-logo2"', "account CSS version");
  replace(join(publicDir, "index.html"), /href="(\/assets\/rai-[^"]+(?:\.svg|\.png|\.ico))"/g,
    'href="$1?v=20261112-logo2"', "account icon version");
  const candidate = join(scratch, "candidate.tgz");
  const pack = spawnSync("tar", ["-czf", candidate, "-C", scratch, "saas"], { stdio: "inherit" });
  if (pack.error || pack.status !== 0) throw pack.error ?? new Error("Could not pack SaaS archive");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const filename = basename(base).replace(/[a-f0-9]{16}\.tgz$/, `${hash.slice(0, 16)}.tgz`);
  const archive = join(root, "release", filename);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${filename}\n`);
  console.log(`RAI2 logo refresh: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
