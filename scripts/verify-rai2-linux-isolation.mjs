import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { chownSync, chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fenceRules } from "../server/fleet.ts";

if (process.getuid?.() !== 0 || process.platform !== "linux") throw new Error("Linux root fixture required");
const runtime = process.argv[2];
if (!runtime?.startsWith("/") || !runtime.endsWith("/bin/rai2.mjs")) throw new Error("pass the packaged CLI path");

const run = (command, args) => execFileSync(command, args, { encoding: "utf8", timeout: 15_000 }).trim();
run("useradd", ["--system", "--user-group", "--shell", "/usr/sbin/nologin", "caddy"]);

const identities = [
  { slug: "alpha", port: 8810, webhookPort: 8811 },
  { slug: "beta", port: 8820, webhookPort: 8821 },
];
const children = [];
const holdPorts = [];
const homeRoot = "/var/lib/openmausbot";
mkdirSync(homeRoot, { recursive: true });

try {
  for (const item of identities) {
    const home = join(homeRoot, item.slug);
    const user = `omb-${item.slug}`;
    run("useradd", ["--system", "--user-group", "--create-home", "--home-dir", home,
      "--shell", "/usr/sbin/nologin", user]);
    const uid = Number(run("id", ["-u", user]));
    const gid = Number(run("id", ["-g", user]));
    const dataDir = join(home, ".openmausbot");
    mkdirSync(dataDir, { mode: 0o700 });
    writeFileSync(join(dataDir, "config.json"), JSON.stringify({ signIn: { admins: [`${item.slug}@example.test`], members: [] } }), { mode: 0o600 });
    chownSync(dataDir, uid, gid);
    chownSync(join(dataDir, "config.json"), uid, gid);
    chmodSync(home, 0o700);
    const child = spawn(process.execPath, [runtime, "serve", "--port", String(item.port),
      "--data-dir", dataDir, "--public-url", `https://${item.slug}.fixture.test`,
      "--label", item.slug, "--no-pair"], {
      uid, gid, cwd: home,
      env: { PATH: "/usr/bin:/bin", HOME: home, OMB_WEBHOOK_PORT: String(item.webhookPort),
        OMB_DATA_DIR: dataDir, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += String(chunk).slice(0, 1000); });
    child.stderr.on("data", (chunk) => { output += String(chunk).slice(0, 1000); });
    children.push({ child, item, uid, gid, home, output: () => output });
  }

  for (const entry of children) {
    const url = `http://127.0.0.1:${entry.item.port}/api/health`;
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (entry.child.exitCode !== null) throw new Error(`${entry.item.slug} exited: ${entry.output().slice(-1000)}`);
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    assert(ready, `${entry.item.slug} did not start: ${entry.output().slice(-1000)}`);
    const license = await fetch(`http://127.0.0.1:${entry.item.port}/LICENSE.txt`);
    assert.equal(license.status, 200);
    assert.match(await license.text(), /Apache License/);
  }

  for (const port of [8081, 8812]) {
    const { createServer } = await import("node:http");
    const server = createServer((_req, res) => res.end("fixture"));
    await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
    holdPorts.push(server);
  }

  const workspaces = identities.map((item) => ({ ...item, host: `${item.slug}.fixture.test`, status: "running", createdAt: "" }));
  const rules = fenceRules(workspaces, 8812);
  writeFileSync("/tmp/rai2-fence.nft", rules, { mode: 0o600 });
  run("nft", ["-f", "/tmp/rai2-fence.nft"]);

  const requestAs = (entry, port) => {
    const script = `fetch('http://127.0.0.1:${port}/api/health', { signal: AbortSignal.timeout(2000) })`
      + `.then(r => process.exit(r.ok ? 0 : 2), () => process.exit(1))`;
    try {
      execFileSync(process.execPath, ["-e", script], { uid: entry.uid, gid: entry.gid,
        cwd: entry.home, env: { HOME: entry.home, PATH: "/usr/bin:/bin" }, timeout: 5000 });
      return true;
    } catch { return false; }
  };

  for (const entry of children) {
    assert(requestAs(entry, entry.item.port), `${entry.item.slug} cannot reach its own API`);
    const sibling = children.find((candidate) => candidate !== entry);
    assert(!requestAs(entry, sibling.item.port), `${entry.item.slug} reached a sibling API`);
    for (const port of [8081, 8812]) assert(!requestAs(entry, port), `${entry.item.slug} reached internal port ${port}`);
    assert.throws(() => execFileSync("/usr/bin/ls", [sibling.home], {
      uid: entry.uid, gid: entry.gid, timeout: 5000, stdio: "ignore",
    }), `${entry.item.slug} read a sibling home`);
  }

  console.log("Linux isolation passed: real packaged tenants own their APIs, sibling APIs and homes are denied, internal edge and control-plane ports are denied");
} finally {
  for (const server of holdPorts) await new Promise((resolve) => server.close(resolve));
  for (const entry of children) entry.child.kill("SIGTERM");
  await Promise.all(children.map((entry) => new Promise((resolve) => {
    if (entry.child.exitCode !== null || entry.child.signalCode !== null) { resolve(); return; }
    entry.child.once("exit", resolve);
    setTimeout(() => { entry.child.kill("SIGKILL"); resolve(); }, 5000).unref();
  })));
}
