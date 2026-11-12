import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist-saas");
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });

const result = await build({
  entryPoints: [join(root, "saas", "main.ts"), join(root, "saas", "init.ts"), join(root, "saas", "reconcile.ts")],
  outdir: output,
  outExtension: { ".js": ".mjs" },
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  metafile: true,
  banner: { js: 'import { createRequire as __rai2CreateRequire } from "node:module"; const require = __rai2CreateRequire(import.meta.url);' },
});

const nonOss = Object.keys(result.metafile.inputs).filter((path) =>
  path.split(/[\\/]/).includes("enterprise"));
if (nonOss.length) throw new Error("SaaS bundle includes Enterprise source");
const unknownDependency = Object.keys(result.metafile.inputs).find((path) =>
  path.includes("node_modules") && !/[\\/]node_modules[\\/]nodemailer[\\/]/.test(path));
if (unknownDependency) throw new Error(`SaaS bundle needs a license review for ${unknownDependency}`);

cpSync(join(root, "saas", "public"), join(output, "public"), { recursive: true });
mkdirSync(join(output, "public", "assets", "mascots"), { recursive: true });
for (const name of ["rai-core-white.png", "rai-core-black.png", "headline-badge-circle.png"]) {
  cpSync(join(root, "public", "assets", name), join(output, "public", "assets", name));
}
mkdirSync(join(output, "third_party", "inter"), { recursive: true });
cpSync(join(root, "node_modules", "@fontsource-variable", "inter", "LICENSE"),
  join(output, "third_party", "inter", "LICENSE"));
mkdirSync(join(output, "third_party", "geist"), { recursive: true });
cpSync(join(root, "node_modules", "@fontsource-variable", "geist", "LICENSE"),
  join(output, "third_party", "geist", "LICENSE"));
for (let index = 1; index <= 8; index++) {
  cpSync(join(root, "public", "assets", "mascots", `mascot-${index}.png`),
    join(output, "public", "assets", "mascots", `mascot-${index}.png`));
}
cpSync(join(root, "LICENSE"), join(output, "LICENSE"));
cpSync(join(root, "NOTICE"), join(output, "NOTICE"));
const nodemailerLicense = join(root, "node_modules", "nodemailer", "LICENSE");
mkdirSync(join(output, "third_party", "nodemailer"), { recursive: true });
cpSync(nodemailerLicense, join(output, "third_party", "nodemailer", "LICENSE"));
for (const name of ["elkjs", "khroma"]) {
  cpSync(join(root, "third_party", name), join(output, "third_party", name), { recursive: true });
}
console.log("RAI2 SaaS artifact verified: no Enterprise source; OpenMausBot, Nodemailer, Geist and Inter licenses included");
