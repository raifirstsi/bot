import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const bundleDir = process.env.RAI2_SAAS_BUNDLE_DIR ?? join(root, "dist-saas");
const bundle = join(bundleDir, "main.mjs");
assert(existsSync(bundle), "build SaaS before smoke");
assert(existsSync(join(bundleDir, "LICENSE")) && existsSync(join(bundleDir, "NOTICE")));
assert(!existsSync(join(bundleDir, "enterprise")));

const freePort = async () => {
  const listener = createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const address = listener.address();
  if (!address || typeof address === "string") throw new Error("no port");
  await new Promise((resolve) => listener.close(resolve));
  return address.port;
};

const scratch = mkdtempSync(join(tmpdir(), "rai2-saas-smoke-"));
const missing = spawnSync(process.execPath, [bundle], {
  env: { ...process.env, RAI2_SAAS_DATA_DIR: scratch }, encoding: "utf8", timeout: 10_000,
});
assert.notEqual(missing.status, 0, "missing SaaS data must fail closed");
assert.match(missing.stderr, /SaaS database missing/);
const initialize = spawnSync(process.execPath, [join(bundleDir, "init.mjs")], {
  env: { ...process.env, RAI2_SAAS_DATA_DIR: scratch }, encoding: "utf8",
});
if (initialize.error) throw initialize.error;
assert.equal(initialize.status, 0, initialize.stderr);
const repeat = spawnSync(process.execPath, [join(bundleDir, "init.mjs")], {
  env: { ...process.env, RAI2_SAAS_DATA_DIR: scratch }, encoding: "utf8",
});
assert.notEqual(repeat.status, 0, "initialization must refuse an existing database");
const missingHmac = spawnSync(process.execPath, [bundle], {
  env: { ...process.env, RAI2_SAAS_DATA_DIR: scratch, RAI2_SAAS_PORT: "18812",
    RAI2_SIGNIN_SMTP_URL: "smtps://user:password@mail.example.test:465",
    RAI2_SIGNIN_SMTP_FROM: "signin@example.test",
    RAI2_SAAS_PAYMENTS_ENABLED: "1", RAI2_SEPAY_WEBHOOK_SECRET: "" },
  encoding: "utf8", timeout: 10_000,
});
assert.notEqual(missingHmac.status, 0, "payments must refuse to start without SePay HMAC");
assert.match(missingHmac.stderr, /RAI2_SEPAY_WEBHOOK_SECRET is required/);
const port = await freePort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [bundle], {
  cwd: join(root, "dist-saas"),
  env: {
    PATH: process.env.PATH ?? "",
    ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    RAI2_SAAS_DATA_DIR: scratch,
    RAI2_SAAS_PORT: String(port),
    RAI2_SAAS_ORIGIN: origin,
    RAI2_TENANT_DOMAIN: "rai2.test",
    RAI2_BANK_ACCOUNT: "1234567890",
    RAI2_BANK_NAME: "Fixture Bank",
    RAI2_SEPAY_API_KEY: "s".repeat(32),
    RAI2_OTP_PEPPER: "p".repeat(32),
    RAI2_TENANT_SIGNING_KEY: "t".repeat(32),
    RAI2_SIGNIN_SMTP_URL: "smtps://user:encoded-key@mail.example.test:465",
    RAI2_SIGNIN_SMTP_FROM: "signin@rai2.test",
    RAI2_FLEET_SOCKET: join(scratch, "fleet.sock"),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (chunk) => { output += String(chunk).slice(0, 2000); });
child.stderr.on("data", (chunk) => { output += String(chunk).slice(0, 2000); });

try {
  let ready = false;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline && child.exitCode === null) {
    try {
      const response = await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready, `bundled control plane did not start: ${output.slice(-1000)}`);
  const page = await fetch(origin);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  const pageHtml = await page.text();
  assert.match(pageHtml, /Không gian RAI² của bạn/);
  for (const path of ["/app.js", "/app.css"]) assert.equal((await fetch(`${origin}${path}`)).status, 200);
  const logo = await fetch(`${origin}/assets/rai-core-white.png`);
  assert.equal(logo.status, 200);
  assert.equal(logo.headers.get("content-type"), "image/png");
  assert((await logo.arrayBuffer()).byteLength > 1000);
  const lightLogo = await fetch(`${origin}/assets/rai-core-black.png`);
  assert.equal(lightLogo.status, 200);
  assert.equal(lightLogo.headers.get("content-type"), "image/png");
  if (pageHtml.includes("/assets/rai-backend-favicon.png")) {
    const favicon = await fetch(`${origin}/assets/rai-backend-favicon.png`);
    assert.equal(favicon.status, 200);
    assert.equal(favicon.headers.get("content-type"), "image/png");
  }
  for (const name of ["landing.html", "landing.css", "landing.js", "assets/rai-core-white.png",
    "assets/rai-backend-favicon.png", "assets/headline-badge-circle.png",
    ...Array.from({ length: 8 }, (_, index) => `assets/mascots/mascot-${index + 1}.png`)]) {
    assert(existsSync(join(bundleDir, "public", name)), `${name} missing from SaaS bundle`);
  }
  for (const path of ["/LICENSE", "/NOTICE"]) {
    const legal = await fetch(`${origin}${path}`);
    assert.equal(legal.status, 200);
    assert.match(legal.headers.get("content-type") ?? "", /^text\/plain/);
    assert((await legal.text()).length > 100);
  }
  assert.deepEqual(await (await fetch(`${origin}/api/status`)).json(), {
    paymentsEnabled: false, privatePreview: false, trialDays: 14, trialAvailable: true,
  });
  assert.equal((await fetch(`${origin}/api/me`)).status, 401);
  assert.equal((await fetch(`${origin}/api/orders`, { method: "POST", headers: { origin } })).status, 401);
  assert.equal((await fetch(`${origin}/api/webhooks/sepay`, { method: "POST" })).status, 503);
  console.log("bundled SaaS portal served its UI, denied unauthenticated account/orders, and disabled payment webhooks");
} finally {
  child.kill("SIGTERM");
  await new Promise((resolve) => child.once("exit", resolve));
  rmSync(scratch, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
