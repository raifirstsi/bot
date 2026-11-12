import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "saas", "public", "assets");
const source = readFileSync(join(assets, "rai-favicon.svg"));
const render = (size) => new Resvg(source, { fitTo: { mode: "width", value: size } }).render().asPng();

writeFileSync(join(assets, "rai-favicon-32.png"), render(32));
writeFileSync(join(assets, "rai-touch-180.png"), render(180));

const sizes = [16, 32, 48];
const images = sizes.map(render);
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
let offset = directory.length;
images.forEach((png, index) => {
  const start = 6 + index * 16;
  directory.writeUInt8(sizes[index], start);
  directory.writeUInt8(sizes[index], start + 1);
  directory.writeUInt16LE(1, start + 4);
  directory.writeUInt16LE(32, start + 6);
  directory.writeUInt32LE(png.length, start + 8);
  directory.writeUInt32LE(offset, start + 12);
  offset += png.length;
});
writeFileSync(join(assets, "rai-favicon.ico"), Buffer.concat([directory, ...images]));
