import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.argv[2];
if (!base || !isAbsolute(base) || !existsSync(base)) throw new Error("Pass an absolute production SaaS archive");
const scratch = mkdtempSync(join(tmpdir(), "rai2-hero-copy-"));
try {
  const unpack = spawnSync("tar", ["-xzf", base, "-C", scratch], { stdio: "inherit" });
  if (unpack.error || unpack.status !== 0) throw unpack.error ?? new Error("Could not unpack the production archive");
  const file = join(scratch, "saas", "public", "landing.html");
  const source = readFileSync(file, "utf8");
  const before = `          <p class="announcement"><span class="pulse"></span> Retrofit AI Architecture · RAI² First OS</p>\n          <h1>RAI² First OS</h1>\n          <p class="hero-question">Nếu hôm nay Tôi <img src="/assets/headline-badge-circle.png" alt="RAI²" class="headline-badge"> xây lại doanh nghiệp từ đầu, với năng lực AI đang có, Tôi có thiết kế bộ máy công ty theo cách cũ hay không?</p>`;
  const after = `          <p class="announcement"><span class="pulse"></span> Hệ Điều Hành Doanh Nghiệp RAI² First OS</p>\n          <h1 class="hero-question">Nếu hôm nay Tôi <img src="/assets/headline-badge-circle.png" alt="RAI²" class="headline-badge"> xây lại doanh nghiệp từ đầu, với năng lực AI đang có, Tôi có thiết kế bộ máy công ty theo cách cũ hay không?</h1>`;
  if (source.indexOf(before) < 0 || source.indexOf(before) !== source.lastIndexOf(before)) {
    throw new Error("production landing.html does not contain the exact reviewed hero copy");
  }
  writeFileSync(file, source.replace(before, after));
  const candidate = join(scratch, "candidate.tgz");
  const pack = spawnSync("tar", ["-czf", candidate, "-C", scratch, "saas"], { stdio: "inherit" });
  if (pack.error || pack.status !== 0) throw pack.error ?? new Error("Could not pack the hero copy release");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const filename = `rai2-saas-0.1.151-${hash.slice(0, 16)}.tgz`;
  const archive = join(root, "release", filename);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${filename}\n`);
  console.log(`RAI2 hero copy release: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
