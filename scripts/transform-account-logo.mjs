import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const [source, target] = process.argv.slice(2);
if (!source?.startsWith("/opt/rai2/releases/saas-") || !source.endsWith("/saas") ||
  !target?.startsWith("/opt/rai2/releases/saas-") || !target.endsWith("/saas") ||
  !existsSync(source) || existsSync(target)) throw new Error("invalid account logo transform paths");
cpSync(source, target, { recursive: true, errorOnExist: true });
const cssFile = `${target}/public/app.css`;
let logoIndex = 0;
const widths = [60, 54, 50];
const css = readFileSync(cssFile, "utf8").replace(/(\.brand img\s*\{[^}]*?width:\s*)\d+px/g, (match, prefix) => {
  if (logoIndex >= widths.length) return match;
  return `${prefix}${widths[logoIndex++]}px`;
});
if (logoIndex !== widths.length) throw new Error("Could not normalize all account logo breakpoints");
writeFileSync(cssFile, css);

const htmlFile = `${target}/public/index.html`;
const html = readFileSync(htmlFile, "utf8")
  .replace(/href="\/app\.css[^"]*"/, 'href="/app.css?v=20261112-logo2"')
  .replace(/href="(\/assets\/rai-[^"]+\.(?:svg|png|ico))[^"]*"/g,
    'href="$1?v=20261112-logo2"');
if (!html.includes('href="/app.css?v=20261112-logo2"')) throw new Error("Could not version account CSS");
writeFileSync(htmlFile, html);
