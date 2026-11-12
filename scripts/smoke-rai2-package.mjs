import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const archive = process.argv[2];
if (!archive || !isAbsolute(archive) || !existsSync(archive)) throw new Error("Pass an absolute runtime tarball path");
const checksum = readFileSync(`${archive}.sha256`, "utf8").trim().split(/\s+/)[0];
const actual = createHash("sha256").update(readFileSync(archive)).digest("hex");
assert.equal(actual, checksum, "runtime tarball checksum mismatch");

const scratch = mkdtempSync(join(tmpdir(), "rai2-release-smoke-"));
try {
  const extracted = spawnSync("tar", ["-xzf", archive, "-C", scratch], { stdio: "inherit" });
  if (extracted.error) throw extracted.error;
  assert.equal(extracted.status, 0, "runtime archive did not extract");
  const staged = join(scratch, "package");
  for (const name of ["LICENSE", "NOTICE", "dist", "dist/LICENSE.txt", "dist/NOTICE.txt", "dist-server", "skills", "third_party/elkjs/LICENSE.md", "third_party/khroma/LICENSE"]) {
    assert(existsSync(join(staged, name)), `${name} missing from runtime archive`);
  }
  assert(!existsSync(join(staged, "dist-server", "enterprise")));
  assert(!existsSync(join(staged, "dist-server", "routes", "sepay.js")));
  const manifest = JSON.parse(readFileSync(join(staged, "package.json"), "utf8"));
  assert.equal(manifest.name, "@raifirst/rai2-runtime");
  assert.equal(manifest.bin.rai2, "bin/rai2.mjs");
  const cli = spawnSync(process.execPath, [join(staged, manifest.bin.rai2), "version"], {
    cwd: staged, encoding: "utf8", timeout: 15_000,
  });
  if (cli.error) throw cli.error;
  assert.equal(cli.status, 0, `runtime CLI did not run: ${cli.stderr}`);
  assert.equal(cli.stdout.trim(), manifest.version);
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const smoke = spawnSync(process.execPath, [join(root, "scripts", "smoke-packaged-server.mjs")], {
    cwd: root, env: { ...process.env, OMB_SMOKE_DIST: join(staged, "dist-server"), OMB_EXPECT_OSS: "1" },
    stdio: "inherit", timeout: 240_000,
  });
  if (smoke.error) throw smoke.error;
  assert.equal(smoke.status, 0, "extracted runtime failed packaged smoke");
  console.log(`Verified RAI2 runtime ${basename(archive)} against SHA-256 ${actual}`);
} finally {
  rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
