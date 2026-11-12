import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const archive = process.argv[2];
if (!archive || !isAbsolute(archive) || !existsSync(archive)) throw new Error("Pass an absolute SaaS tarball path");
const expected = readFileSync(`${archive}.sha256`, "utf8").trim().split(/\s+/)[0];
const actual = createHash("sha256").update(readFileSync(archive)).digest("hex");
assert.equal(actual, expected, "SaaS archive checksum mismatch");
const scratch = mkdtempSync(join(tmpdir(), "rai2-saas-archive-smoke-"));
try {
  const tar = spawnSync("tar", ["-xzf", archive, "-C", scratch], { stdio: "inherit" });
  if (tar.error) throw tar.error;
  assert.equal(tar.status, 0);
  const bundle = join(scratch, "saas");
  for (const name of ["main.mjs", "init.mjs", "reconcile.mjs", "LICENSE", "NOTICE", "public/index.html", "public/landing.html", "public/landing.css", "public/landing.js", "public/assets/rai-core-white.png", "public/assets/rai-backend-favicon.png", "public/assets/rai-favicon.svg", "public/assets/rai-favicon-32.png", "public/assets/rai-favicon.ico", "public/assets/rai-touch-180.png", "public/assets/headline-badge-circle.png", "public/assets/fonts/geist-latin-wght-normal.woff2", "public/assets/fonts/geist-vietnamese-wght-normal.woff2", "public/assets/fonts/inter-latin-wght-normal.woff2", "public/assets/fonts/inter-vietnamese-wght-normal.woff2", "public/assets/mascots/mascot-1.png", "third_party/nodemailer/LICENSE", "third_party/geist/LICENSE", "third_party/inter/LICENSE", "third_party/elkjs/LICENSE.md", "third_party/khroma/LICENSE"]) {
    assert(existsSync(join(bundle, name)), `${name} missing from SaaS archive`);
  }
  assert(!existsSync(join(bundle, "enterprise")));
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const smoke = spawnSync(process.execPath, [join(root, "scripts", "smoke-saas.mjs")], {
    cwd: root, env: { ...process.env, RAI2_SAAS_BUNDLE_DIR: bundle }, stdio: "inherit", timeout: 60_000,
  });
  if (smoke.error) throw smoke.error;
  assert.equal(smoke.status, 0, "SaaS archive smoke failed");
  console.log(`Verified RAI2 SaaS archive against SHA-256 ${actual}`);
} finally {
  rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
