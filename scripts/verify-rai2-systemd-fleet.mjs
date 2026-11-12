import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { request } from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSaasServer } from "../saas/server.ts";
import { SaasStore } from "../saas/store.ts";
import { WorkspaceProvisioner } from "../saas/provisioner.ts";

if (process.platform !== "linux" || process.getuid?.() !== 0) throw new Error("isolated Linux root required");
const cli = process.argv[2];
if (!cli?.startsWith("/") || !cli.endsWith("/bin/rai2.mjs")) throw new Error("pass a packaged CLI");

const run = (cmd, args, options = {}) => execFileSync(cmd, args, { encoding: "utf8", timeout: 90_000, ...options }).trim();
run("useradd", ["--system", "--create-home", "--home-dir", "/var/lib/rai2", "--shell", "/usr/sbin/nologin", "rai2"]);
run("systemctl", ["enable", "--now", "caddy.service"]);
run(process.execPath, [cli, "fleet", "init", "--domain", "fixture.test", "--operator", "rai2",
  "--internal-edge", "--control-plane-port", "8812", "--node", process.execPath, "--script", cli, "--yes"]);

const operatorUid = Number(run("id", ["-u", "rai2"]));
const operatorGid = Number(run("id", ["-g", "rai2"]));
let fleetReady = false;
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    const health = run("curl", ["-fsS", "--unix-socket", "/run/openmausbot/fleet.sock", "http://fleet/health"],
      { uid: operatorUid, gid: operatorGid, env: { PATH: "/usr/bin:/bin", HOME: "/var/lib/rai2" },
        stdio: ["ignore", "pipe", "ignore"], timeout: 2000 });
    if (JSON.parse(health).ok === true) { fleetReady = true; break; }
  } catch {}
  await new Promise((resolve) => setTimeout(resolve, 250));
}
assert(fleetReady, "fleet agent did not open its operator-only socket");
const fleet = (method, path, body) => new Promise((resolve, reject) => {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const req = request({ socketPath: "/run/openmausbot/fleet.sock", method, path,
    headers: payload ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) } : {},
  }, (res) => {
    const chunks = [];
    res.on("data", (chunk) => chunks.push(chunk));
    res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) }));
  });
  req.on("error", reject);
  req.end(payload);
});
const ownerOnly = async (uid, gid, port) => {
  const script = `fetch("http://127.0.0.1:${port}/api/health",{signal:AbortSignal.timeout(3000)}).then(r=>process.exit(r.ok?0:2),()=>process.exit(1))`;
  try { run(process.execPath, ["-e", script], { uid, gid, env: { PATH: "/usr/bin:/bin", HOME: "/" }, timeout: 5000 }); return true; }
  catch { return false; }
};

const scratch = mkdtempSync(join(tmpdir(), "rai2-trial-fleet-"));
const store = new SaasStore(join(scratch, "saas.db"));
const mail = new Map();
const signingKey = randomBytes(32).toString("hex");
const origin = "http://127.0.0.1:18880";
const server = createSaasServer({ store, trialEnabled: true, paymentsEnabled: false,
  mailer: { sendCode: async (email, code) => { mail.set(email, code); } },
  config: { publicOrigin: origin, tenantDomain: "fixture.test", bankAccount: "1234567890",
    bankName: "FixtureBank", sepayApiKey: "s".repeat(32), otpPepper: "p".repeat(32),
    tenantSigningKey: signingKey, maxWorkspaces: 2 } });
await new Promise((resolve) => server.listen(18880, "127.0.0.1", resolve));
const provisioner = new WorkspaceProvisioner({ store, fleet, tenantAuthOrigin: "https://app.fixture.test",
  tenantSigningKey: signingKey });
const call = async (path, body, cookie) => {
  const response = await fetch(origin + path, { method: "POST",
    headers: { origin, "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body) });
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie") };
};
const sessions = [];
for (const index of [0, 1]) {
  const email = `owner${index}@example.test`;
  assert.equal((await call("/api/auth/start", { email })).status, 200);
  const verified = await call("/api/auth/verify", { email, code: mail.get(email) });
  assert.equal(verified.status, 200);
  assert(verified.cookie?.startsWith("rai2_session="));
  sessions.push(verified.cookie);
}
await provisioner.reconcile();
const slugs = [];
for (const cookie of sessions) {
  const response = await fetch(origin + "/api/me", { headers: { cookie } });
  assert.equal(response.status, 200);
  const account = await response.json();
  assert.equal(account.workspaceState, "active");
  assert.equal(account.paidThrough, 0);
  assert(account.trialThrough > Date.now());
  assert.match(account.workspaceUrl, /^https:\/\/u-[a-f0-9]{20}\.fixture\.test$/);
  slugs.push(new URL(account.workspaceUrl).hostname.split(".")[0]);
}
assert.notEqual(slugs[0], slugs[1]);
assert.equal((await call("/api/auth/start", { email: "owner2@example.test" })).status, 200);
assert.equal((await call("/api/auth/verify", {
  email: "owner2@example.test", code: mail.get("owner2@example.test"),
})).status, 409);

const registry = JSON.parse(readFileSync("/etc/openmausbot/fleet.json", "utf8"));
assert.deepEqual(Object.keys(registry.workspaces).sort(), [...slugs].sort());
assert.notEqual(registry.workspaces[slugs[0]].port, registry.workspaces[slugs[1]].port);
for (const [index, slug] of slugs.entries()) {
  const user = `omb-${slug}`;
  const uid = Number(run("id", ["-u", user]));
  const gid = Number(run("id", ["-g", user]));
  const ownPort = registry.workspaces[slug].port;
  const siblingPort = registry.workspaces[slugs[1 - index]].port;
  assert(await ownerOnly(uid, gid, ownPort), `${slug} cannot reach its own API`);
  assert(!(await ownerOnly(uid, gid, siblingPort)), `${slug} reached a sibling API`);
  assert(!(await ownerOnly(uid, gid, 8081)), `${slug} reached Caddy directly`);
  assert(!(await ownerOnly(uid, gid, 8812)), `${slug} reached the control-plane port`);
  assert.throws(() => run("ls", [`/var/lib/openmausbot/${slugs[1 - index]}`], {
    uid, gid, stdio: ["ignore", "pipe", "ignore"],
  }), `${slug} read a sibling home`);
  assert.equal(run("systemctl", ["is-active", `openmausbot@${slug}.service`]), "active");
  const direct = await fetch(`http://127.0.0.1:${ownPort}/`, { headers: { host: `${slug}.fixture.test` }, redirect: "manual" });
  assert.equal(direct.status, 302);
  assert.equal(direct.headers.get("location"), "https://app.fixture.test/?open=1");
  const claim = run("curl", ["-sS", "-o", "/dev/null", "-w", "%{http_code}",
    "-H", `Host: ${slug}.fixture.test`, `http://127.0.0.1:${ownPort}/api/auth/rai2/claim`]);
  assert.equal(claim, "200");
}
const suspend = await fleet("POST", `/workspaces/${slugs[1]}/suspend`);
assert.equal(suspend.status, 200, JSON.stringify(suspend.body));
assert.equal(run("systemctl", ["show", "-p", "ActiveState", "--value", `openmausbot@${slugs[1]}.service`]), "inactive");
const resume = await fleet("POST", `/workspaces/${slugs[1]}/resume`);
assert.equal(resume.status, 200, JSON.stringify(resume.body));
assert.equal(run("systemctl", ["is-active", `openmausbot@${slugs[1]}.service`]), "active");
console.log("Isolated systemd fleet passed: two distinct workspaces, Unix user and loopback isolation, sign-in handoff entry, suspend and resume");
await new Promise((resolve) => server.close(resolve));
store.close();
rmSync(scratch, { recursive: true, force: true });
