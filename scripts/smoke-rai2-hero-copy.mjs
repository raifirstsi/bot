import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";

const [base, candidate] = process.argv.slice(2);
for (const archive of [base, candidate]) {
  if (!archive || !existsSync(archive)) throw new Error("Pass absolute base and candidate archives");
  const expected = readFileSync(`${archive}.sha256`, "utf8").trim().split(/\s+/)[0];
  assert.equal(createHash("sha256").update(readFileSync(archive)).digest("hex"), expected, `${archive} checksum mismatch`);
}
const scratch = mkdtempSync(join(tmpdir(), "rai2-hero-copy-smoke-"));
try {
  mkdirSync(join(scratch, "base"));
  mkdirSync(join(scratch, "candidate"));
  for (const [archive, folder] of [[base, "base"], [candidate, "candidate"]]) {
    const unpack = spawnSync("tar", ["-xzf", archive, "-C", join(scratch, folder)], { stdio: "inherit" });
    if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error(`Could not unpack ${archive}`);
  }
  const baseRoot = join(scratch, "base", "saas");
  const candidateRoot = join(scratch, "candidate", "saas");
  const walk = (root, dir = root) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(root, path) : [relative(root, path)];
  });
  const files = walk(baseRoot).filter((file) => file !== "public/landing.html" && file !== "public\\landing.html");
  for (const file of files) assert.deepEqual(readFileSync(join(candidateRoot, file)), readFileSync(join(baseRoot, file)), `${file} changed`);
  const landing = readFileSync(join(candidateRoot, "public", "landing.html"), "utf8");
  assert.match(landing, /Hệ Điều Hành Doanh Nghiệp RAI² First OS/);
  assert.match(landing, /<h1 class="hero-question">/);
  assert.doesNotMatch(landing, /<h1>RAI² First OS<\/h1>/);
  assert.doesNotMatch(landing, /<p class="announcement"><span class="pulse"><\/span> Retrofit AI Architecture/);
  console.log(`RAI2 hero-copy release preserved ${files.length} non-landing files`);
} finally {
  rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
