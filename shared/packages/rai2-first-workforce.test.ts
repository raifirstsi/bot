import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { parsePackageDocument } from "../package-format.ts";

describe("RAI² FIRST OS Digital Workforce Package", () => {
  it("parses valid openmaus.package v2 with 13 presets across 7 zones", () => {
    const filePath = join(__dirname, "rai2-first-workforce.package.json");
    const raw = readFileSync(filePath, "utf8");
    const parsedJson = JSON.parse(raw);
    const doc = parsePackageDocument(parsedJson, { trust: "file" });

    expect(doc.format).toBe("openmaus.package");
    expect(doc.version).toBe(2);
    expect(doc.package.id).toBe("rai2-first-workforce");
    expect(doc.package.presets.length).toBe(13);

    const keys = doc.package.presets.map((p) => p.key);
    expect(keys).toContain("rai-lead");
    expect(keys).toContain("rai-copy");
    expect(keys).toContain("rai-quote");
    expect(keys).toContain("rai-close");
    expect(keys).toContain("rai-task");
    expect(keys).toContain("rai-qc");
    expect(keys).toContain("rai-care");
    expect(keys).toContain("rai-rescue");
    expect(keys).toContain("rai-cash");
    expect(keys).toContain("rai-margin");
    expect(keys).toContain("rai-talent");
    expect(keys).toContain("rai-coach");
    expect(keys).toContain("rai-strategy");
  });
});
