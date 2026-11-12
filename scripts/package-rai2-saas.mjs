import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "dist-saas");
for (const name of ["main.mjs", "init.mjs", "reconcile.mjs", "LICENSE", "NOTICE", "public/index.html", "public/landing.html", "public/landing.css", "public/landing.js", "public/assets/rai-core-white.png", "public/assets/rai-backend-favicon.png", "public/assets/rai-favicon.svg", "public/assets/rai-favicon-32.png", "public/assets/rai-favicon.ico", "public/assets/rai-touch-180.png", "public/assets/headline-badge-circle.png", "public/assets/fonts/geist-latin-wght-normal.woff2", "public/assets/fonts/geist-vietnamese-wght-normal.woff2", "public/assets/fonts/inter-latin-wght-normal.woff2", "public/assets/fonts/inter-vietnamese-wght-normal.woff2", "public/assets/mascots/mascot-1.png", "third_party/nodemailer/LICENSE", "third_party/geist/LICENSE", "third_party/inter/LICENSE", "third_party/elkjs/LICENSE.md", "third_party/khroma/LICENSE"]) {
  if (!existsSync(join(source, name))) throw new Error(`SaaS build is missing ${name}`);
}
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const scratch = mkdtempSync(join(tmpdir(), "rai2-saas-package-"));
try {
  cpSync(source, join(scratch, "saas"), { recursive: true });
  const candidate = join(scratch, "candidate.tgz");
  const tar = spawnSync("tar", ["-czf", candidate, "-C", scratch, "saas"], { stdio: "inherit" });
  if (tar.error) throw tar.error;
  if (tar.status !== 0) throw new Error("Could not create SaaS archive");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const releases = join(root, "release");
  mkdirSync(releases, { recursive: true });
  const name = `rai2-saas-${version}-${hash.slice(0, 16)}.tgz`;
  const archive = join(releases, name);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${name}\n`);
  console.log(`RAI2 SaaS artifact: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
