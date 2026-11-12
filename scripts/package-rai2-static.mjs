import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2];
if (!base || !isAbsolute(base) || !existsSync(base)) throw new Error("Pass the absolute current SaaS release archive");
const expected = readFileSync(`${base}.sha256`, "utf8").trim().split(/\s+/)[0];
const actual = createHash("sha256").update(readFileSync(base)).digest("hex");
if (expected !== actual) throw new Error("Base SaaS release checksum mismatch");

const scratch = mkdtempSync(join(tmpdir(), "rai2-static-release-"));
try {
  const extract = spawnSync("tar", ["-xzf", base, "-C", scratch], { stdio: "inherit" });
  if (extract.error || extract.status !== 0) throw extract.error ?? new Error("Could not unpack the base release");
  const destination = join(scratch, "saas", "public");
  const source = join(root, "saas", "public");
  for (const file of ["landing.html", "landing.css", "landing.js"]) {
    cpSync(join(source, file), join(destination, file));
  }
  for (const file of ["rai-backend-favicon.png", "rai-favicon.svg", "rai-favicon-32.png", "rai-favicon.ico", "rai-touch-180.png"]) {
    cpSync(join(source, "assets", file), join(destination, "assets", file));
  }
  const fonts = join(destination, "assets", "fonts");
  mkdirSync(fonts, { recursive: true });
  for (const file of ["geist-latin-wght-normal.woff2", "geist-vietnamese-wght-normal.woff2", "inter-latin-wght-normal.woff2", "inter-vietnamese-wght-normal.woff2"]) {
    cpSync(join(source, "assets", "fonts", file), join(fonts, file));
  }
  const interLicense = join(scratch, "saas", "third_party", "inter");
  mkdirSync(interLicense, { recursive: true });
  cpSync(join(root, "node_modules", "@fontsource-variable", "inter", "LICENSE"), join(interLicense, "LICENSE"));
  const geistLicense = join(scratch, "saas", "third_party", "geist");
  mkdirSync(geistLicense, { recursive: true });
  cpSync(join(root, "node_modules", "@fontsource-variable", "geist", "LICENSE"), join(geistLicense, "LICENSE"));
  cpSync(join(root, "NOTICE"), join(scratch, "saas", "NOTICE"));
  const candidate = join(scratch, "candidate.tgz");
  const pack = spawnSync("tar", ["-czf", candidate, "-C", scratch, "saas"], { stdio: "inherit" });
  if (pack.error || pack.status !== 0) throw pack.error ?? new Error("Could not pack the static release");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const filename = basename(base).replace(/[a-f0-9]{16}\.tgz$/, `${hash.slice(0, 16)}.tgz`);
  const archive = join(root, "release", filename);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${filename}\n`);
  console.log(`RAI2 static release: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
