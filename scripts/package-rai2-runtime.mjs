import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "dist-server");
const uiSource = process.argv[2] ?? join(root, "dist");
if (!isAbsolute(uiSource) || !existsSync(join(source, "index.js")) || !existsSync(join(uiSource, "index.html")) ||
  existsSync(join(source, "enterprise")) || existsSync(join(source, "routes", "sepay.js"))) {
  throw new Error("Build and verify the OSS server and UI before packaging");
}

const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const scratch = mkdtempSync(join(tmpdir(), "rai2-runtime-package-"));
const staged = join(scratch, "package");
mkdirSync(staged);
try {
  cpSync(source, join(staged, "dist-server"), { recursive: true });
  cpSync(uiSource, join(staged, "dist"), { recursive: true });
  cpSync(join(root, "skills"), join(staged, "skills"), { recursive: true });
  for (const name of ["LICENSE", "NOTICE"]) cpSync(join(root, name), join(staged, name));
  for (const name of ["LICENSE", "NOTICE"]) cpSync(join(root, name), join(staged, "dist", `${name}.txt`));
  mkdirSync(join(staged, "bin"));
  const cli = join(staged, "bin", "rai2.mjs");
  writeFileSync(cli, '#!/usr/bin/env node\nimport "../dist-server/openmausbot.js";\n');
  chmodSync(cli, 0o755);
  const thirdParty = join(root, "third_party");
  for (const file of readdirSync(thirdParty, { recursive: true, withFileTypes: true })) {
    if (!file.isFile() || !/^(?:LICENSE|NOTICE)(?:\..*)?$/i.test(file.name)) continue;
    const original = join(file.parentPath, file.name);
    const target = join(staged, relative(root, original));
    mkdirSync(dirname(target), { recursive: true });
    cpSync(original, target);
  }
  writeFileSync(join(staged, "package.json"), `${JSON.stringify({
    name: "@raifirst/rai2-runtime", version, type: "module", private: false,
    bin: { rai2: "bin/rai2.mjs" },
    engines: { node: ">=24" },
  }, null, 2)}\n`);
  const candidate = join(scratch, "candidate.tgz");
  const tar = spawnSync("tar", ["-czf", candidate, "-C", scratch, "package"], { stdio: "inherit" });
  if (tar.error) throw tar.error;
  if (tar.status !== 0) throw new Error("Could not create the runtime tarball");
  const hash = createHash("sha256").update(readFileSync(candidate)).digest("hex");
  const releases = join(root, "release");
  mkdirSync(releases, { recursive: true });
  const name = `rai2-runtime-${version}-${hash.slice(0, 16)}.tgz`;
  const archive = join(releases, name);
  if (existsSync(archive)) throw new Error(`Release already exists: ${archive}`);
  renameSync(candidate, archive);
  writeFileSync(`${archive}.sha256`, `${hash}  ${name}\n`);
  console.log(`RAI2 OSS runtime: ${archive}`);
  console.log(`SHA-256: ${hash}`);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
