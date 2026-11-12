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
const scratch = mkdtempSync(join(tmpdir(), "rai2-portal-style-smoke-"));
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
  const files = walk(baseRoot).filter((file) => !["public/index.html", "public/app.css", "public/portal-dashboard.css"].includes(file.replaceAll("\\", "/")));
  for (const file of files) assert.deepEqual(readFileSync(join(candidateRoot, file)), readFileSync(join(baseRoot, file)), `${file} changed`);
  assert.doesNotMatch(readFileSync(join(candidateRoot, "public", "index.html"), "utf8"), /portal-dashboard\.css/);
  assert.match(readFileSync(join(candidateRoot, "public", "app.css"), "utf8"), /--portal-content-max/);
  console.log(`RAI2 portal style release preserved ${files.length} production files`);
} finally {
  rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
