import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const [base, candidate] = process.argv.slice(2);
for (const archive of [base, candidate]) {
  if (!archive || !isAbsolute(archive)) throw new Error("Pass absolute base and candidate archives");
  const expected = readFileSync(`${archive}.sha256`, "utf8").trim().split(/\s+/)[0];
  assert.equal(createHash("sha256").update(readFileSync(archive)).digest("hex"), expected,
    `${basename(archive)} checksum mismatch`);
}
const scratch = mkdtempSync(join(tmpdir(), "rai2-logo-smoke-"));
try {
  for (const [archive, folder] of [[base, "base"], [candidate, "candidate"]]) {
    const destination = join(scratch, folder);
    mkdirSync(destination);
    const unpack = spawnSync("tar", ["-xzf", archive, "-C", destination], { stdio: "inherit" });
    if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error(`Could not unpack ${archive}`);
  }
  const oldRoot = join(scratch, "base", "saas");
  const newRoot = join(scratch, "candidate", "saas");
  for (const file of ["main.mjs", "init.mjs", "reconcile.mjs", "public/index.html", "public/app.css", "public/app.js"]) {
    assert.deepEqual(readFileSync(join(newRoot, file)), readFileSync(join(oldRoot, file)), `${file} changed`);
  }
  for (const file of ["landing.html", "landing.css", "landing.js"]) {
    assert.deepEqual(readFileSync(join(newRoot, "public", file)), readFileSync(join(root, "saas", "public", file)),
      `public/${file} differs from source`);
  }
  for (const file of ["geist-latin-wght-normal.woff2", "geist-vietnamese-wght-normal.woff2", "inter-latin-wght-normal.woff2", "inter-vietnamese-wght-normal.woff2"]) {
    assert.deepEqual(readFileSync(join(newRoot, "public", "assets", "fonts", file)),
      readFileSync(join(root, "saas", "public", "assets", "fonts", file)), `font ${file} differs from source`);
  }
  assert.deepEqual(readFileSync(join(newRoot, "third_party", "inter", "LICENSE")),
    readFileSync(join(root, "node_modules", "@fontsource-variable", "inter", "LICENSE")), "Inter license differs");
  assert.deepEqual(readFileSync(join(newRoot, "third_party", "geist", "LICENSE")),
    readFileSync(join(root, "node_modules", "@fontsource-variable", "geist", "LICENSE")), "Geist license differs");
  const landingCss = readFileSync(join(newRoot, "public", "landing.css"), "utf8");
  assert.match(landingCss, /font-family:\s*"Geist Variable"/);
  assert.match(landingCss, /font-weight:\s*450/);
  console.log("RAI2 static release preserves backend bytes and matches reviewed public source assets");
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
