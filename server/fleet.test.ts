import { describe, expect, it } from "vitest";
import {
  allocatePort,
  applySignIn,
  assertSlug,
  caddySite,
  createPlan,
  deletePlan,
  describeSteps,
  emptyRegistry,
  fenceRules,
  fenceUnit,
  fleetLayout,
  initPlan,
  initialConfig,
  MANAGED_OPENROUTER,
  instanceEnv,
  parseRegistry,
  publicHostPlan,
  resumePlan,
  suspendPlan,
  templateUnit,
  upgradePlan,
  type FleetStep,
  type FleetWorkspace,
} from "./fleet.ts";

const layout = fleetLayout("/");
const now = new Date("2026-09-10T08:00:00Z");
const argvOf = (steps: FleetStep[]) => steps.flatMap((step) => (step.kind === "run" ? [step.argv.join(" ")] : []));
const writesOf = (steps: FleetStep[]) => steps.flatMap((step) => (step.kind === "write" ? [step.path] : []));

describe("fleet naming", () => {
  it("accepts DNS-label workspace names and refuses the rest", () => {
    for (const ok of ["acme", "globex-2", "a1"]) expect(() => assertSlug(ok)).not.toThrow();
    for (const bad of ["Acme", "-acme", "a", "acme_inc", "a".repeat(32), "acme.co", "../etc"]) expect(() => assertSlug(bad)).toThrow("not a workspace name");
  });

  it("allocates loopback ports in strides and skips ones already taken", () => {
    const registry = emptyRegistry("agentada.cc");
    expect(allocatePort(registry)).toEqual({ port: 8810, next: 8820 });
    registry.workspaces.acme = { slug: "acme", host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "running", createdAt: "" };
    registry.nextPort = 8810;
    expect(allocatePort(registry)).toEqual({ port: 8820, next: 8830 });
    expect(() => parseRegistry('{"version":2}')).toThrow("registry");
    expect(parseRegistry(JSON.stringify(registry)).workspaces.acme?.port).toBe(8810);
  });
});

describe("rendered files", () => {
  it("renders one template unit for every workspace, hardened and parameterised by slug", () => {
    const unit = templateUnit({ node: "/usr/bin/node", script: "/usr/lib/node_modules/openmausbot/cli.js", layout });
    expect(unit).toContain("User=omb-%i");
    expect(unit).toContain("EnvironmentFile=/etc/openmausbot/instances/%i.env");
    expect(unit).toContain("ExecStart=/usr/bin/node /usr/lib/node_modules/openmausbot/cli.js serve --port ${OMB_PORT} --data-dir ${OMB_DATA_DIR} --public-url ${OMB_PUBLIC_URL} --label %i --no-pair");
    for (const line of ["PrivateTmp=yes", "NoNewPrivileges=yes", "ProtectSystem=strict", "ReadWritePaths=/var/lib/openmausbot/%i"]) expect(unit).toContain(line);
    expect(templateUnit({ node: "/usr/bin/node", script: "/src/server/cli.ts", layout })).toContain("--experimental-strip-types /src/server/cli.ts");
  });

  it("requires the loopback fence to start successfully before every tenant instance", () => {
    const unit = templateUnit({ node: "/usr/bin/node", script: "/src/server/openmausbot.ts", layout });
    const header = unit.split("[Service]")[0];
    expect(header).toContain("After=network-online.target openmausbot-fence.service\n");
    expect(header).toContain("Requires=openmausbot-fence.service\n");
    const fence = fenceUnit(layout);
    expect(fence).toContain("Type=oneshot\nRemainAfterExit=yes\nExecStart=/usr/sbin/nft -f /etc/openmausbot/fence.nft\n");
    expect(fence).not.toContain("Before=openmausbot@.service");
  });

  it("fences each workspace's loopback ports to its own user, Caddy and root", () => {
    const rules = fenceRules([
      { slug: "globex", host: "globex.x", port: 8820, webhookPort: 8821, status: "running", createdAt: "" },
      { slug: "acme", host: "acme.x", port: 8810, webhookPort: 8811, status: "running", createdAt: "" },
    ]);
    expect(rules).toContain("add table inet openmausbot\nflush table inet openmausbot");
    expect(rules.indexOf("omb-acme")).toBeLessThan(rules.indexOf("omb-globex"));
    expect(rules).toContain("oif lo tcp dport { 8810, 8811 } meta skuid != { omb-acme, caddy, root } reject");
    expect(fenceRules([])).not.toContain("reject");
    const incomplete: FleetWorkspace = { slug: "pending", host: "pending.x", port: 8830, webhookPort: 8831, status: "provisioning", createdAt: "" };
    expect(fenceRules([incomplete])).not.toContain("omb-pending");
    expect(fenceRules([{ ...incomplete, accountCreated: true }])).toContain("omb-pending");
    expect(fenceRules([{ ...incomplete, status: "error", accountCreated: true }])).toContain("omb-pending");
    expect(fenceRules([{ ...incomplete, status: "retained" }])).toContain("omb-pending");
    expect(fenceRules([{ ...incomplete, accountCreated: true }], 8812))
      .toContain("oif lo tcp dport { 8081, 8812 } meta skuid omb-pending reject");
    expect(fenceRules([incomplete], 8812)).not.toContain("dport { 8081, 8812 }");
  });

  it("serves a running workspace and answers 503 for a suspended one", () => {
    const running = caddySite({ host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "running" });
    expect(running).toContain("acme.agentada.cc {");
    expect(running).toContain("reverse_proxy 127.0.0.1:8811");
    expect(running).toContain("reverse_proxy 127.0.0.1:8810 {");
    expect(running).toContain("flush_interval -1");
    expect(caddySite({ host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "suspended" })).toContain('respond "This workspace is suspended." 503');
    for (const status of ["provisioning", "error", "retained"] as const) {
      expect(caddySite({ host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status })).toContain("503");
    }
    const internal = caddySite({ host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "running" }, true);
    expect(internal).toContain("http://acme.agentada.cc:8081 {");
    expect(internal).toContain("bind 127.0.0.1");
    expect(internal).toContain("header_up X-Forwarded-For {http.request.header.X-Real-IP}");
    expect(internal.match(/header_up X-Forwarded-Proto https/g)).toHaveLength(2);
    expect(internal).not.toContain("https://");
    expect(caddySite({ host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "suspended" }, true))
      .toContain("http://acme.agentada.cc:8081 {\n\tbind 127.0.0.1");
  });

  it("routes a friendly workspace host and keeps prior addresses as redirects", () => {
    const registry = initPlan({ domain: "rai2.si", node: "/usr/bin/node", script: "/opt/rai2/bin/rai2.mjs",
      internalEdge: true, controlPlanePort: 8812, layout }).registry;
    const created = createPlan({ registry, slug: "u-1234567890abcdef1234",
      seed: { admins: ["owner@example.test"], members: [], rai2Tenant: true,
        tenantAuthOrigin: "https://app.rai2.si", tenantAuthToken: "t".repeat(43) }, layout });
    const environment = (created.steps.find((step) => step.kind === "write" && step.path.endsWith(".env")) as
      Extract<FleetStep, { kind: "write" }>).content;
    const legacyEnvironment = environment.replace(/^OMB_SIGNIN_TENANT_DOMAIN=.*\n/m, "");
    const changed = publicHostPlan({ registry: created.registry, slug: created.workspace.slug,
      publicHost: "an-phat.rai2.si", legacyHosts: ["ten-cu.rai2.si"], currentEnv: legacyEnvironment, layout });
    expect(changed.workspace).toMatchObject({ publicHost: "an-phat.rai2.si", legacyHosts: ["ten-cu.rai2.si"] });
    const caddy = changed.steps.find((step) => step.kind === "write" && step.path.endsWith(".caddy"));
    expect(caddy).toMatchObject({ content: expect.stringContaining("http://an-phat.rai2.si:8081") });
    expect(caddy).toMatchObject({ content: expect.stringContaining("redir https://an-phat.rai2.si{uri} permanent") });
    expect(String((changed.steps.find((step) => step.kind === "write" && step.path.endsWith(".env")) as
      Extract<FleetStep, { kind: "write" }>).content)).toContain("OMB_PUBLIC_URL=https://an-phat.rai2.si");
    expect(String((changed.steps.find((step) => step.kind === "write" && step.path.endsWith(".env")) as
      Extract<FleetStep, { kind: "write" }>).content)).toContain("OMB_SIGNIN_TENANT_DOMAIN=rai2.si");
    expect(changed.rollbackSteps.find((step) => step.kind === "write" && step.path.endsWith(".env")))
      .toMatchObject({ content: legacyEnvironment });
    expect(() => publicHostPlan({ registry: created.registry, slug: created.workspace.slug,
      publicHost: "app.rai2.si", legacyHosts: [], currentEnv: legacyEnvironment, layout })).toThrow("invalid");
  });

  it("writes the environment, the first config and the sign-in edits the server reads live", () => {
    const workspace: FleetWorkspace = { slug: "acme", host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "running", createdAt: "" };
    expect(instanceEnv({ workspace, dataDir: "/var/lib/openmausbot/acme/.openmausbot", licenseKey: "omb1.k" })).toBe(
      "OMB_DATA_DIR=/var/lib/openmausbot/acme/.openmausbot\nOMB_PORT=8810\nOMB_WEBHOOK_PORT=8811\nOMB_PUBLIC_URL=https://acme.agentada.cc\nOMB_LICENSE_KEY=omb1.k\n",
    );
    expect(JSON.parse(initialConfig({ admins: ["ada@example.test"], members: ["@acme.test"], anthropicKey: "sk-ant-x", monthlyCapUsd: 50 }))).toEqual({
      signIn: { admins: ["ada@example.test"], members: ["@acme.test"] }, anthropic: { key: "sk-ant-x" }, budgets: { monthlyUsd: 50 },
    });
    const added = applySignIn('{"anthropic":{"key":"k"},"signIn":{"admins":["ada@example.test"]}}', "add", "Bob@Acme.test", true);
    expect(JSON.parse(added.config)).toEqual({ anthropic: { key: "k" }, signIn: { admins: ["ada@example.test"], members: ["bob@acme.test"] } });
    expect(added.summary).toContain("chat and approvals");
    const removed = applySignIn(added.config, "remove", "bob@acme.test", false);
    expect(JSON.parse(removed.config).signIn).toEqual({ admins: ["ada@example.test"], members: [] });
    expect(removed.summary).toContain("existing email sessions are rechecked");
    expect(() => applySignIn(added.config, "remove", "nobody@acme.test", false)).toThrow("not on the list");
    expect(() => applySignIn("{}", "add", "not an email", false)).toThrow("email");
    const promoted = applySignIn(added.config, "add", "bob@acme.test", false);
    expect(JSON.parse(promoted.config).signIn).toEqual({ admins: ["ada@example.test", "bob@acme.test"], members: [] });
    const demoted = applySignIn(promoted.config, "add", "ada@example.test", true);
    expect(JSON.parse(demoted.config).signIn).toEqual({ admins: ["bob@acme.test"], members: ["ada@example.test"] });
    expect(() => applySignIn(demoted.config, "add", "bob@acme.test", true)).toThrow("at least one admin");
    expect(() => applySignIn(demoted.config, "remove", "bob@acme.test", false)).toThrow("at least one admin");
  });

  it("seeds a SaaS workspace with a tenant-scoped sign-in token and no SMTP credential", () => {
    const tenantAuthOrigin = "https://app.rai2.si";
    const tenantAuthToken = "t".repeat(43);
    const plan = createPlan({ registry: emptyRegistry("rai2.si"), slug: "u-1234567890abcdef1234",
      seed: { admins: ["owner@example.test"], members: [], rai2Tenant: true, tenantAuthOrigin, tenantAuthToken }, layout });
    const environment = plan.steps.find((step) => step.kind === "write" && step.path.endsWith(".env"));
    expect(environment).toMatchObject({ mode: 0o600, content: expect.stringContaining(`OMB_SIGNIN_TENANT_URL=${tenantAuthOrigin}`) });
    expect(environment).toMatchObject({ content: expect.stringContaining("OMB_RAI2_TENANT=1") });
    expect(environment).toMatchObject({ content: expect.stringContaining(`OMB_SIGNIN_TENANT_TOKEN=${tenantAuthToken}`) });
    expect(environment).toMatchObject({ content: expect.not.stringContaining("OMB_SIGNIN_SMTP_URL=") });
    expect(environment).toMatchObject({ content: expect.not.stringContaining("OMB_ADMIN_URL=") });
    for (const settings of [
      { tenantAuthOrigin, tenantAuthToken: undefined },
      { rai2Tenant: true, tenantAuthOrigin: undefined, tenantAuthToken: undefined },
      { tenantAuthOrigin: "https://app.rai2.si\nOMB_LICENSE_KEY=forged", tenantAuthToken },
      { tenantAuthOrigin: "http://app.rai2.si", tenantAuthToken },
    ]) {
      expect(() => createPlan({ registry: emptyRegistry("rai2.si"), slug: "u-1234567890abcdef1234",
        seed: { admins: ["owner@example.test"], members: [], ...settings }, layout })).toThrow();
    }
  });
});

describe("plans", () => {
  it("initialises the server once: folders, registry, templates, fence, the Caddy import, and reloads", () => {
    const { steps, registry } = initPlan({ domain: "AgentAda.cc", node: "/usr/bin/node", script: "/usr/lib/node_modules/openmausbot/cli.js", layout });
    expect(registry).toEqual({ version: 1, domain: "agentada.cc", nextPort: 8810, workspaces: {} });
    expect(writesOf(steps)).toEqual(["/etc/openmausbot/fleet.json", "/etc/systemd/system/openmausbot@.service", "/etc/openmausbot/fence.nft", "/etc/systemd/system/openmausbot-fence.service"]);
    expect(steps.find((step) => step.kind === "append-once")).toEqual({ kind: "append-once", path: "/etc/caddy/Caddyfile", line: "import /etc/caddy/omb.d/*.caddy" });
    expect(argvOf(steps)).toEqual(["systemctl daemon-reload", "systemctl enable --now openmausbot-fence.service", "systemctl reload caddy"]);
    expect(() => initPlan({ domain: "not a domain", node: "n", script: "s", layout })).toThrow("domain name");
    const withAgent = initPlan({ domain: "agentada.cc", node: "/usr/bin/node", script: "/usr/lib/node_modules/openmausbot/cli.js", operator: "maus", layout });
    expect(withAgent.registry.operator).toBe("maus");
    const agent = withAgent.steps.find((step) => step.kind === "write" && step.path === "/etc/systemd/system/openmausbot-fleet.service");
    expect(agent).toMatchObject({ content: expect.stringContaining("fleet agent --socket /run/openmausbot/fleet.sock --group maus") });
    expect(agent).toMatchObject({ content: expect.stringContaining("RuntimeDirectory=openmausbot") });
    expect(argvOf(withAgent.steps)).toContain("systemctl enable --now openmausbot-fleet.service");
    expect(() => initPlan({ domain: "agentada.cc", node: "n", script: "s", operator: "Not A User", layout })).toThrow("Unix user");
    const shared = initPlan({ domain: "rai2.si", node: "/usr/bin/node", script: "/opt/rai2/bin/rai2.mjs",
      operator: "rai2", internalEdge: true, controlPlanePort: 8812, layout });
    expect(shared.registry).toMatchObject({ domain: "rai2.si", internalEdge: true, controlPlanePort: 8812 });
    expect(shared.steps.at(-2)).toMatchObject({ kind: "note", text: expect.stringContaining("127.0.0.1:8081") });
    for (const port of [0, 443, 8081, 8810, 8811, 8820]) {
      expect(() => initPlan({ domain: "rai2.si", node: "n", script: "s", controlPlanePort: port, layout })).toThrow("control plane port");
    }
    expect(() => parseRegistry(JSON.stringify({ ...shared.registry, internalEdge: false }))).toThrow("edge mode");
    expect(() => parseRegistry(JSON.stringify({ ...shared.registry, controlPlanePort: 8810 }))).toThrow("control plane port");
    expect(() => initPlan({ domain: "rai2.si", node: "n", script: "s", internalEdge: true, layout })).toThrow("internal edge mode");
  });

  it("keeps internal edge routing and the control plane fence through workspace lifecycle", () => {
    const registry = initPlan({ domain: "rai2.si", node: "/usr/bin/node", script: "/opt/rai2/bin/rai2.mjs",
      internalEdge: true, controlPlanePort: 8812, layout }).registry;
    const created = createPlan({ registry, slug: "acme", seed: { admins: ["owner@example.test"], members: [] }, layout });
    const site = created.steps.find((step) => step.kind === "write" && step.path.endsWith("acme.caddy"));
    expect(site).toMatchObject({ content: expect.stringContaining("http://acme.rai2.si:8081") });
    expect(site).toMatchObject({ content: expect.stringContaining("header_up X-Forwarded-Proto https") });
    const fence = created.steps.find((step) => step.kind === "write" && step.path === layout.fenceFile);
    expect(fence).toMatchObject({ content: expect.stringContaining("dport { 8081, 8812 } meta skuid omb-acme reject") });
    const suspended = suspendPlan({ registry: created.registry, slug: "acme", layout });
    expect(suspended.steps.find((step) => step.kind === "write" && step.path.endsWith("acme.caddy")))
      .toMatchObject({ content: expect.stringContaining("http://acme.rai2.si:8081") });
    const resumed = resumePlan({ registry: suspended.registry, slug: "acme", layout });
    expect(resumed.steps.find((step) => step.kind === "write" && step.path.endsWith("acme.caddy")))
      .toMatchObject({ content: expect.stringContaining("http://acme.rai2.si:8081") });
    const deleted = deletePlan({ registry: resumed.registry, slug: "acme", keepData: true, layout });
    expect(deleted.steps.find((step) => step.kind === "write" && step.path === layout.fenceFile))
      .toMatchObject({ content: expect.stringContaining("dport { 8081, 8812 } meta skuid omb-acme reject") });
  });

  it("creates a workspace as its own account with private data, a fenced port, a unit and a site", () => {
    const registry = emptyRegistry("agentada.cc");
    const plan = createPlan({ registry, slug: "acme", seed: { admins: ["ada@example.test"], members: [] }, licenseKey: "omb1.k", memoryMax: "1G", now, layout });
    expect(plan.workspace).toEqual({ slug: "acme", host: "acme.agentada.cc", port: 8810, webhookPort: 8811, status: "running", createdAt: now.toISOString() });
    expect(plan.registry.nextPort).toBe(8820);
    const checkpoints = plan.steps.flatMap((step) => step.kind === "write" && step.path === layout.registryFile ? [JSON.parse(step.content)] : []);
    expect(checkpoints.map((checkpoint) => checkpoint.workspaces.acme)).toEqual([
      { ...plan.workspace, status: "provisioning", accountCreated: false },
      { ...plan.workspace, status: "provisioning", accountCreated: true },
      plan.workspace,
    ]);
    expect(plan.steps[0]).toMatchObject({ kind: "write", path: layout.registryFile });
    expect(plan.steps[1]).toMatchObject({ kind: "run", argv: expect.arrayContaining(["useradd"]) });
    expect(plan.steps[2]).toMatchObject({ kind: "write", path: layout.registryFile });
    expect(checkpoints.every((checkpoint) => checkpoint.nextPort === 8820)).toBe(true);
    expect(argvOf(plan.steps)).toEqual([
      "useradd --system --create-home --home-dir /var/lib/openmausbot/acme --shell /usr/sbin/nologin --user-group omb-acme",
      "nft -f /etc/openmausbot/fence.nft",
      "systemctl daemon-reload",
      "systemctl enable --now openmausbot@acme.service",
      "systemctl reload caddy",
    ]);
    const config = plan.steps.find((step) => step.kind === "write" && step.path.endsWith("/acme/.openmausbot/config.json"));
    expect(config).toMatchObject({ mode: 0o600, owner: "omb-acme" });
    const env = plan.steps.find((step) => step.kind === "write" && step.path === "/etc/openmausbot/instances/acme.env");
    expect(env).toMatchObject({ mode: 0o600 });
    // root keeps the environment file: it carries the licence key
    expect(env).not.toHaveProperty("owner");
    expect(plan.steps.find((step) => step.kind === "write" && step.path.endsWith("limits.conf"))).toMatchObject({ content: "[Service]\nMemoryMax=1G\n" });
    expect(plan.steps.find((step) => step.kind === "health")).toMatchObject({ url: "http://127.0.0.1:8810/api/health" });
    const sequence = plan.steps.flatMap((step) => (step.kind === "run" ? [step.argv[0] === "systemctl" ? step.argv.slice(0, 2).join(" ") : step.argv[0]] : step.kind === "health" ? ["health"] : []));
    expect(sequence).toEqual(["useradd", "nft", "systemctl daemon-reload", "systemctl enable", "health", "systemctl reload"]);
    expect(plan.steps.at(-1)).toMatchObject({ kind: "note", text: expect.stringContaining("https://acme.agentada.cc is ready") });
    expect(() => createPlan({ registry: plan.registry, slug: "acme", seed: { admins: ["x@y.test"], members: [] }, layout })).toThrow("already exists");
    expect(() => createPlan({ registry, slug: "beta", seed: { admins: [], members: [] }, layout })).toThrow("at least one admin");
    expect(() => createPlan({ registry, slug: "beta", seed: { admins: ["x@y.test"], members: [] }, memoryMax: "lots", layout })).toThrow("--memory");
  });

  it("suspends, resumes, deletes and upgrades with the registry kept in step", () => {
    const created = createPlan({ registry: emptyRegistry("agentada.cc"), slug: "acme", seed: { admins: ["a@b.test"], members: [] }, now, layout });
    const suspended = suspendPlan({ registry: created.registry, slug: "acme", layout });
    expect(suspended.registry.workspaces.acme?.status).toBe("suspended");
    expect(argvOf(suspended.steps)).toEqual(["systemctl disable --now openmausbot@acme.service", "systemctl reload caddy"]);
    expect(suspended.steps.find((step) => step.kind === "write" && step.path.endsWith("acme.caddy"))).toMatchObject({ content: expect.stringContaining("503") });
    const resumed = resumePlan({ registry: suspended.registry, slug: "acme", layout });
    expect(resumed.registry.workspaces.acme?.status).toBe("running");
    expect(argvOf(resumed.steps)).toEqual(["systemctl enable --now openmausbot@acme.service", "systemctl reload caddy"]);
    const kept = deletePlan({ registry: resumed.registry, slug: "acme", keepData: true, layout });
    expect(kept.registry.workspaces.acme).toMatchObject({ status: "retained", port: 8810 });
    expect(argvOf(kept.steps).some((argv) => argv.startsWith("userdel"))).toBe(false);
    expect(argvOf(deletePlan({ registry: resumed.registry, slug: "acme", keepData: false, layout }).steps)).toContain("userdel --remove omb-acme");
    expect(() => deletePlan({ registry: kept.registry, slug: "acme", keepData: true, layout })).toThrow("operator recovery");
    expect(() => createPlan({ registry: kept.registry, slug: "acme", seed: { admins: ["a@b.test"], members: [] }, layout })).toThrow("already exists");
    expect(fenceRules(Object.values(kept.registry.workspaces))).toContain("omb-acme");
    for (const status of ["provisioning", "error", "retained"] as const) {
      const incomplete = { ...created.registry, workspaces: { acme: { ...created.workspace, status } } };
      expect(() => resumePlan({ registry: incomplete, slug: "acme", layout })).toThrow("operator recovery");
      expect(() => suspendPlan({ registry: incomplete, slug: "acme", layout })).toThrow("operator recovery");
      expect(() => deletePlan({ registry: incomplete, slug: "acme", keepData: false, layout })).toThrow("operator recovery");
    }
    const two = createPlan({ registry: created.registry, slug: "globex", seed: { admins: ["g@x.test"], members: [] }, now, layout }).registry;
    const releaseFile = "/opt/rai2/releases/rai2-runtime-0.1.151.tgz";
    const releaseSha256 = "a".repeat(64);
    expect(argvOf(upgradePlan({ registry: suspendPlan({ registry: two, slug: "globex", layout }).registry, releaseFile, releaseSha256 })))
      .toEqual([`npm install -g --ignore-scripts ${releaseFile}`, "systemctl restart openmausbot@acme.service"]);
    expect(upgradePlan({ registry: two, releaseFile, releaseSha256 })[0]).toEqual({ kind: "verify", path: releaseFile, sha256: releaseSha256 });
    expect(() => upgradePlan({ registry: two, releaseFile: "openmausbot@latest", releaseSha256 })).toThrow("absolute pinned");
    expect(() => upgradePlan({ registry: two, releaseFile, releaseSha256: "bad" })).toThrow("SHA-256");
  });

  it("seeds only the trusted portal gateway and reserves the portal hostname", () => {
    const registry = emptyRegistry("example.test");
    const seed = { admins: ["owner@example.test"], members: [], portalUrl: "https://admin.example.test", anthropicUrl: "https://admin.example.test/api/gateway/acme/anthropic", anthropicKey: "workspace-scoped-token" };
    const plan = createPlan({ registry, slug: "acme", seed, now, layout });
    const env = plan.steps.find((step) => step.kind === "write" && step.path.endsWith("/acme.env"));
    expect(env).toMatchObject({ mode: 0o600, content: expect.stringContaining("OMB_ADMIN_URL=https://admin.example.test\nOMB_ADMIN_WORKSPACE=acme") });
    expect(env).not.toHaveProperty("owner");
    const config = plan.steps.find((step) => step.kind === "write" && step.path.endsWith("/config.json"));
    expect(config).toMatchObject({ owner: "omb-acme", content: expect.stringContaining('"url": "https://admin.example.test/api/gateway/acme/anthropic"') });
    for (const portalUrl of ["http://admin.example.test", "https://admin.example.test/", "https://user:secret@admin.example.test", "https://admin.example.test/path"]) {
      expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, portalUrl }, layout })).toThrow("HTTPS origin");
    }
    expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, anthropicUrl: "https://other.example.test" }, layout })).toThrow("workspace's portal gateway");
    expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, portalUrl: undefined }, layout })).toThrow("requires portalUrl");
    expect(() => createPlan({ registry, slug: "admin", seed, layout })).toThrow("reserved for the admin portal");
  });

  it("renders privileged steps but never recommends root writes through tenant paths", () => {
    const lines = describeSteps([
      { kind: "mkdir", path: "/var/lib/openmausbot/acme/.openmausbot", mode: 0o700, owner: "omb-acme" },
      { kind: "write", path: "/var/lib/openmausbot/acme/.openmausbot/config.json", content: "secret", mode: 0o600, owner: "omb-acme" },
      { kind: "write", path: "/etc/openmausbot/instances/acme.env", content: "OMB_PORT=8810\n", mode: 0o600 },
      { kind: "run", argv: ["useradd", "--comment", "Acme Inc", "omb-acme"], why: "the account" },
      { kind: "append-once", path: "/etc/caddy/Caddyfile", line: "import /etc/caddy/omb.d/*.caddy" },
      { kind: "note", text: "done" },
    ]);
    expect(lines).toEqual([
      "# Create /var/lib/openmausbot/acme/.openmausbot mode 700 as omb-acme (use fleet --yes; never root chown on tenant paths)",
      "# Write /var/lib/openmausbot/acme/.openmausbot/config.json mode 600 as omb-acme (use fleet --yes; tenant content omitted)",
      "cat > /etc/openmausbot/instances/acme.env <<'OMB_EOF'",
      "OMB_PORT=8810",
      "OMB_EOF",
      "chmod 600 /etc/openmausbot/instances/acme.env",
      "useradd --comment 'Acme Inc' omb-acme   # the account",
      "grep -qxF 'import /etc/caddy/omb.d/*.caddy' /etc/caddy/Caddyfile || printf '\\n%s\\n' 'import /etc/caddy/omb.d/*.caddy' >> /etc/caddy/Caddyfile",
      "# done",
    ]);
  });

  it("seeds private agentful OpenRouter config, including an empty catalog for later assignments", () => {
    const seed = { admins: ["owner@example.test"], members: [], portalUrl: "https://admin.example.test", openrouterKey: "workspace-scoped-token", openrouterUrl: "https://admin.example.test/api/gateway/acme/openrouter/v1", openrouterModels: ["anthropic/claude-sonnet-4"], openrouterDefault: true };
    const registry = emptyRegistry("example.test");
    const plan = createPlan({ registry, slug: "acme", seed, layout });
    const config = plan.steps.find((step) => step.kind === "write" && step.path.endsWith("/opencode.json"));
    expect(config).toMatchObject({ owner: "omb-acme", mode: 0o600 });
    expect(config?.kind === "write" && JSON.parse(config.content)).toEqual({ provider: { [MANAGED_OPENROUTER]: {
      npm: "@ai-sdk/openai-compatible", name: "Managed OpenRouter",
      options: { baseURL: seed.openrouterUrl, apiKey: seed.openrouterKey }, models: { "anthropic/claude-sonnet-4": { name: "anthropic/claude-sonnet-4" } },
    } } });
    expect(plan.steps.filter((step) => step.kind === "mkdir" && step.path.includes("/.config"))).toEqual([
      { kind: "mkdir", path: "/var/lib/openmausbot/acme/.config", mode: 0o700, owner: "omb-acme" },
      { kind: "mkdir", path: "/var/lib/openmausbot/acme/.config/opencode", mode: 0o700, owner: "omb-acme" },
    ]);
    expect(JSON.parse(initialConfig(seed)).defaultModelSelection).toEqual({ instanceId: "opencodeGo", model: `${MANAGED_OPENROUTER}/anthropic/claude-sonnet-4` });
    expect(JSON.parse(initialConfig({ ...seed, openrouterDefault: false, anthropicKey: "other-scoped-token" }))).not.toHaveProperty("defaultModelSelection");
    const empty = createPlan({ registry, slug: "acme", seed: { ...seed, openrouterModels: [], openrouterDefault: false }, layout });
    const emptyConfig = empty.steps.find((step) => step.kind === "write" && step.path.endsWith("/opencode.json"));
    expect(emptyConfig?.kind === "write" && JSON.parse(emptyConfig.content).provider[MANAGED_OPENROUTER].models).toEqual({});
    for (const openrouterUrl of ["https://evil.example.test/v1", "https://admin.example.test/api/gateway/other/openrouter/v1", `${seed.openrouterUrl}?key=secret`]) {
      expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, openrouterUrl }, layout })).toThrow("workspace's portal gateway");
    }
    expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, portalUrl: undefined }, layout })).toThrow("workspace's portal gateway");
    expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, openrouterModels: [] }, layout })).toThrow("requires a model assignment");
    for (const openrouterModels of [["bad\nmodel"], Array(101).fill("provider/model")]) expect(() => createPlan({ registry, slug: "acme", seed: { ...seed, openrouterModels }, layout })).toThrow("valid model IDs");
  });
});
