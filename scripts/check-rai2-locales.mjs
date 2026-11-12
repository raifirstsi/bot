import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { staleTranslationKeys, validateSourceCatalog, validateTranslationCatalog } from "./generate-locale.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalog = (name) => JSON.parse(readFileSync(join(root, "src", "locales", name), "utf8"));
const source = catalog("en.json");
const vietnamese = catalog("vi.json");
const hashes = catalog("source-hashes.json");
const problems = [
  ...validateSourceCatalog(source),
  ...validateTranslationCatalog(source, vietnamese),
  ...staleTranslationKeys(source, vietnamese, hashes.locales.vi ?? {}).map((key) => `stale Vietnamese translation: ${key}`),
];
if (problems.length) throw new Error(problems.slice(0, 20).join("\n"));
console.log("RAI2 English and Vietnamese catalogs are current");
