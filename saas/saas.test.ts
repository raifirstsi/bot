import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { WorkspaceProvisioner, type FleetTransport } from "./provisioner.ts";
import { createSaasServer } from "./server.ts";
import { nextMonthlyDate, normalizeWorkspaceHandle, ORDER_TTL_MS, SaasStore, TRIAL_MS } from "./store.ts";
import { tenantToken } from "./tenant-auth.ts";

const HOST = "localhost";
const ORIGIN = `http://${HOST}`;
const KEY = randomBytes(32).toString("hex");
const TENANT_KEY = randomBytes(32).toString("hex");

async function fixture(options: { paymentsEnabled?: boolean; previewEmail?: string; sepayWebhookSecret?: string;
  maxWorkspaces?: number; trialEnabled?: boolean; onVerified?: () => void;
  onWorkspaceHandle?: (slug: string, host: string, legacyHosts: string[]) => Promise<void> } = {}) {
  const { sepayWebhookSecret, maxWorkspaces, ...serverOptions } = options;
  const root = mkdtempSync(join(tmpdir(), "rai2-saas-"));
  const store = new SaasStore(join(root, "saas.db"));
  const messages: Array<{ email: string; code: string }> = [];
  const qrRequests: string[] = [];
  let now = Date.UTC(2026, 10, 12, 10);
  const server = createSaasServer({
    store, now: () => now,
    ...serverOptions,
    mailer: { sendCode: async (email, code) => { messages.push({ email, code }); } },
    qrFetch: async (url) => {
      qrRequests.push(String(url));
      return new Response(Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.alloc(128)]),
        { status: 200, headers: { "content-type": "image/png" } });
    },
    config: {
      publicOrigin: ORIGIN, tenantDomain: "rai2.si", bankAccount: "1234567890", bankName: "Test Bank",
      sepayApiKey: KEY, otpPepper: randomBytes(32).toString("hex"), tenantSigningKey: TENANT_KEY,
      ...(maxWorkspaces ? { maxWorkspaces } : {}),
      ...(sepayWebhookSecret ? { sepayWebhookSecret } : {}),
    },
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture failed to listen");
  const call = (path: string, method = "GET", body?: unknown, cookie?: string, headers: Record<string, string> = {}, binary = false) =>
    new Promise<{ status: number; body: any; cookie: string | null }>((resolve, reject) => {
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = request({ hostname: "127.0.0.1", port: address.port, path, method,
        headers: { host: HOST, origin: ORIGIN, ...(payload ? { "content-type": "application/json", "content-length": String(Buffer.byteLength(payload)) } : {}),
          ...(cookie ? { cookie } : {}), ...headers },
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const value = Buffer.concat(chunks).toString("utf8");
          resolve({ status: res.statusCode ?? 0, body: binary ? Buffer.concat(chunks)
            : res.statusCode === 302 ? { location: res.headers.location } : JSON.parse(value),
            cookie: String(res.headers["set-cookie"] ?? "").split(";", 1)[0] || null });
        });
      });
      req.on("error", reject);
      req.end(payload);
    });
  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.close();
    rmSync(root, { recursive: true, force: true });
  };
  return { root, store, messages, qrRequests, call, close, now: () => now, setNow: (value: number) => { now = value; } };
}

const opened: Array<Awaited<ReturnType<typeof fixture>>> = [];
afterEach(async () => {
  for (const item of opened.splice(0)) await item.close();
});

async function signIn(f: Awaited<ReturnType<typeof fixture>>, email: string): Promise<string> {
  expect((await f.call("/api/auth/start", "POST", { email })).status).toBe(200);
  const code = f.messages.at(-1)?.code;
  if (!code) throw new Error("mail was not sent");
  const reply = await f.call("/api/auth/verify", "POST", { email, code });
  expect(reply.status).toBe(200);
  expect(reply.cookie).toMatch(/^rai2_session=/);
  return reply.cookie!;
}

describe("RAI2 SaaS control plane", () => {
  it("gives an active workspace a friendly address without changing its internal slug", async () => {
    const routed: Array<{ slug: string; host: string; legacyHosts: string[] }> = [];
    let refuse = false;
    const f = await fixture({ maxWorkspaces: 2, trialEnabled: true,
      onWorkspaceHandle: async (slug, host, legacyHosts) => {
        if (refuse) throw new Error("fleet unavailable");
        routed.push({ slug, host, legacyHosts });
      } });
    opened.push(f);
    expect(normalizeWorkspaceHandle("Công ty An Phát")).toBe("cong-ty-an-phat");
    for (const value of ["ab", "u-hidden", "app", "--"]) expect(normalizeWorkspaceHandle(value)).toBeNull();

    const owner = await signIn(f, "owner@example.test");
    const ownerAccount = f.store.accountForSession(createHash("sha256").update(owner.split("=")[1]!).digest("hex"), f.now())!;
    f.store.setWorkspaceState(ownerAccount.id, "active");
    expect((await f.call("/api/workspace/handle", "POST", { handle: "ab" }, owner)).status).toBe(400);
    const changed = await f.call("/api/workspace/handle", "POST", { handle: "Công ty An Phát" }, owner);
    expect(changed).toMatchObject({ status: 200, body: { handle: "cong-ty-an-phat",
      workspaceUrl: "https://cong-ty-an-phat.rai2.si" } });
    expect(routed).toEqual([{ slug: ownerAccount.slug, host: "cong-ty-an-phat.rai2.si", legacyHosts: [] }]);
    expect((await f.call("/api/me", "GET", undefined, owner)).body).toMatchObject({
      workspaceHandle: "cong-ty-an-phat", workspaceUrl: "https://cong-ty-an-phat.rai2.si",
    });
    expect(new URL((await f.call("/api/workspace/open", "GET", undefined, owner)).body.location).host)
      .toBe("cong-ty-an-phat.rai2.si");

    const second = await signIn(f, "second@example.test");
    const secondAccount = f.store.accountForSession(createHash("sha256").update(second.split("=")[1]!).digest("hex"), f.now())!;
    f.store.setWorkspaceState(secondAccount.id, "active");
    expect((await f.call("/api/workspace/handle", "POST", { handle: "cong-ty-an-phat" }, second)).status).toBe(409);
    expect((await f.call("/api/workspace/handle", "POST", { handle: "new-name" }, owner)).status).toBe(429);

    f.setNow(f.now() + 60 * 60_000 + 1);
    expect((await f.call("/api/workspace/handle", "POST", { handle: "an-phat-moi" }, owner)).status).toBe(200);
    expect(routed.at(-1)).toEqual({ slug: ownerAccount.slug, host: "an-phat-moi.rai2.si",
      legacyHosts: ["cong-ty-an-phat.rai2.si"] });
    expect((await f.call("/api/workspace/handle", "POST", { handle: "cong-ty-an-phat" }, second)).status).toBe(409);

    f.setNow(f.now() + 60 * 60_000 + 1);
    refuse = true;
    expect((await f.call("/api/workspace/handle", "POST", { handle: "khong-luu" }, owner)).status).toBe(503);
    expect((await f.call("/api/me", "GET", undefined, owner)).body.workspaceHandle).toBe("an-phat-moi");
  });

  it("hands a portal session to only its active workspace once", async () => {
    const f = await fixture({ maxWorkspaces: 2, trialEnabled: true }); opened.push(f);
    const owner = await signIn(f, "owner@example.test");
    const second = await signIn(f, "second@example.test");
    const ownerAccount = f.store.accountForSession(createHash("sha256").update(owner.split("=")[1]!).digest("hex"), f.now())!;
    const secondAccount = f.store.accountForSession(createHash("sha256").update(second.split("=")[1]!).digest("hex"), f.now())!;
    expect((await f.call("/api/workspace/open", "GET", undefined, owner)).status).toBe(409);
    f.store.setWorkspaceState(ownerAccount.id, "active");
    f.store.setWorkspaceState(secondAccount.id, "active");
    expect((await f.call("/api/workspace/open", "GET", undefined, owner,
      { "sec-fetch-site": "cross-site" })).status).toBe(403);
    const link = await f.call("/api/workspace/open", "GET", undefined, owner);
    expect(link.status).toBe(302);
    const destination = new URL(link.body.location);
    expect(destination.host).toBe(`${ownerAccount.slug}.rai2.si`);
    expect(destination.pathname).toBe("/api/auth/rai2/claim");
    const code = new URLSearchParams(destination.hash.slice(1)).get("code")!;
    const consume = (slug: string, bearer: string, value = code) => f.call("/api/tenant-auth/consume", "POST",
      { slug, code: value }, undefined, { authorization: `Bearer ${bearer}`, origin: "" });
    expect((await consume(secondAccount.slug, tenantToken(TENANT_KEY, secondAccount.slug))).status).toBe(401);
    expect((await consume(ownerAccount.slug, tenantToken(TENANT_KEY, secondAccount.slug))).status).toBe(401);
    expect((await consume(ownerAccount.slug, tenantToken(TENANT_KEY, ownerAccount.slug))).body)
      .toEqual({ email: "owner@example.test" });
    expect((await consume(ownerAccount.slug, tenantToken(TENANT_KEY, ownerAccount.slug))).status).toBe(401);
    const revoked = new URL((await f.call("/api/workspace/open", "GET", undefined, owner)).body.location);
    const revokedCode = new URLSearchParams(revoked.hash.slice(1)).get("code")!;
    expect((await f.call("/api/auth/logout", "POST", {}, owner)).status).toBe(200);
    expect((await consume(ownerAccount.slug, tenantToken(TENANT_KEY, ownerAccount.slug), revokedCode)).status).toBe(401);
    const expiring = new URL((await f.call("/api/workspace/open", "GET", undefined, second)).body.location);
    const expiringCode = new URLSearchParams(expiring.hash.slice(1)).get("code")!;
    f.setNow(f.now() + 60_001);
    expect((await consume(secondAccount.slug, tenantToken(TENANT_KEY, secondAccount.slug), expiringCode)).status).toBe(401);
  });
  it("migrates an existing account database without resetting paid accounts", () => {
    const root = mkdtempSync(join(tmpdir(), "rai2-trial-migration-"));
    const file = join(root, "saas.db");
    const old = new DatabaseSync(file);
    const paidThrough = Date.UTC(2026, 11, 1);
    old.exec(`CREATE TABLE accounts (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE,
      paid_through INTEGER NOT NULL DEFAULT 0, billing_anchor_day INTEGER,
      workspace_state TEXT NOT NULL DEFAULT 'none', created_at INTEGER NOT NULL
    )`);
    old.prepare("INSERT INTO accounts (id,email,slug,paid_through,workspace_state,created_at) VALUES (?,?,?,?,?,?)")
      .run("paid-account", "paid@example.test", "u-1234567890abcdef1234", paidThrough, "active", 0);
    old.prepare("INSERT INTO accounts (id,email,slug,paid_through,workspace_state,created_at) VALUES (?,?,?,?,?,?)")
      .run("former-customer", "former@example.test", "u-abcdef1234567890abcd",
        Date.UTC(2026, 9, 1), "suspended", 0);
    old.close();
    try {
      const store = new SaasStore(file);
      try {
        const account = store.createSession("paid@example.test", "token-hash", Date.UTC(2026, 10, 12), { maxWorkspaces: 2 });
        expect(account).toMatchObject({ id: "paid-account", paidThrough, trialThrough: 0, workspaceState: "active" });
        expect(store.createSession("former@example.test", "former-token", Date.UTC(2026, 10, 12),
          { maxWorkspaces: 2 })).toMatchObject({ id: "former-customer", trialThrough: 0 });
        expect(store.accountForSession("token-hash", Date.UTC(2026, 10, 12))).toMatchObject({ id: "paid-account" });
      } finally { store.close(); }
      const reopened = new SaasStore(file);
      try {
        const columns = new DatabaseSync(file, { readOnly: true });
        try {
          const names = (columns.prepare("PRAGMA table_info(accounts)").all() as Array<{ name: string }>).map((row) => row.name);
          expect(names).toContain("trial_started_at");
          expect(names).toContain("trial_expires_at");
        } finally { columns.close(); }
      } finally { reopened.close(); }
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("starts one trial per verified email, provisions separate workspaces and suspends expired trials", async () => {
    const f = await fixture({ maxWorkspaces: 2, trialEnabled: true }); opened.push(f);
    expect((await f.call("/api/status")).body.trialDays).toBe(14);
    expect((await f.call("/api/auth/start", "POST", { email: "a@example.test" })).status).toBe(200);
    expect((await f.call("/api/auth/verify", "POST", { email: "a@example.test", code: "00000000" })).status).toBe(401);
    const alice = (await f.call("/api/auth/verify", "POST", {
      email: "a@example.test", code: f.messages.at(-1)!.code,
    })).cookie!;
    const bob = await signIn(f, "b@example.test");
    const aliceBefore = (await f.call("/api/me", "GET", undefined, alice)).body;
    const bobBefore = (await f.call("/api/me", "GET", undefined, bob)).body;
    expect(aliceBefore).toMatchObject({ trialThrough: f.now() + TRIAL_MS, paidThrough: 0, workspaceUrl: null });
    expect(bobBefore).toMatchObject({ trialThrough: f.now() + TRIAL_MS, paidThrough: 0, workspaceUrl: null });

    const tenants = new Map<string, string>();
    const created: Array<{ slug: string; admins: string[]; members: string[]; memory: string }> = [];
    const fleet: FleetTransport = async (method, path, body) => {
      if (method === "GET" && path === "/workspaces") {
        return { status: 200, body: { workspaces: [...tenants].map(([slug, status]) => ({ slug, status })) } };
      }
      if (method === "POST" && path === "/workspaces") {
        const seed = body as { slug: string; admins: string[]; members: string[]; memory: string };
        created.push(seed);
        tenants.set(seed.slug, "running");
        return { status: 200, body: { ok: true } };
      }
      const match = /^\/workspaces\/(u-[a-f0-9]{20})\/(suspend|resume)$/.exec(path);
      if (method === "POST" && match) {
        tenants.set(match[1]!, match[2] === "suspend" ? "suspended" : "running");
        return { status: 200, body: { ok: true } };
      }
      return { status: 404, body: {} };
    };
    const provisioner = new WorkspaceProvisioner({ store: f.store, fleet,
      tenantAuthOrigin: "https://app.rai2.si", tenantSigningKey: TENANT_KEY, tenantDomain: "rai2.si" });
    await provisioner.reconcile(f.now());
    expect(created).toHaveLength(2);
    expect(created.map((seed) => seed.admins[0]).sort()).toEqual(["a@example.test", "b@example.test"]);
    expect(created.every((seed) => seed.members.length === 0 && seed.memory === "2G")).toBe(true);
    expect(created[0]!.slug).not.toBe(created[1]!.slug);
    const aliceUrl = (await f.call("/api/me", "GET", undefined, alice)).body.workspaceUrl;
    const bobUrl = (await f.call("/api/me", "GET", undefined, bob)).body.workspaceUrl;
    expect(aliceUrl).toMatch(/^https:\/\/u-[a-f0-9]{20}\.rai2\.si$/);
    expect(bobUrl).toMatch(/^https:\/\/u-[a-f0-9]{20}\.rai2\.si$/);
    expect(aliceUrl).not.toBe(bobUrl);
    f.setNow(f.now() + 30_001);
    const aliceRepeat = await signIn(f, "a@example.test");
    expect((await f.call("/api/me", "GET", undefined, aliceRepeat)).body.trialThrough).toBe(aliceBefore.trialThrough);
    await provisioner.reconcile(f.now());
    expect(created).toHaveLength(2);
    const aliceSlug = created.find((seed) => seed.admins[0] === "a@example.test")!.slug;
    const aliceAuth = { authorization: `Bearer ${tenantToken(TENANT_KEY, aliceSlug)}`, origin: "" };
    expect((await f.call("/api/tenant-auth/start", "POST", {
      slug: aliceSlug, email: "a@example.test",
    }, undefined, aliceAuth)).status).toBe(200);
    const tenantCode = f.messages.at(-1)!.code;
    expect((await f.call("/api/tenant-auth/verify", "POST", {
      slug: aliceSlug, email: "a@example.test", code: tenantCode,
    }, undefined, aliceAuth)).body).toEqual({ email: "a@example.test" });
    expect((await f.call("/api/tenant-auth/start", "POST", {
      slug: aliceSlug, email: "b@example.test",
    }, undefined, aliceAuth)).status).toBe(403);
    await provisioner.reconcile(f.now());
    expect(created).toHaveLength(2);

    expect((await f.call("/api/auth/start", "POST", { email: "c@example.test" })).status).toBe(200);
    expect((await f.call("/api/auth/verify", "POST", {
      email: "c@example.test", code: f.messages.at(-1)!.code,
    })).status).toBe(409);
    const order = (await f.call("/api/orders", "POST", {}, alice)).body;
    const paid = (await f.call("/api/webhooks/sepay", "POST", {
      id: 991, accountNumber: "1234567890", transferType: "in", transferAmount: 299000, content: order.code,
    }, undefined, { authorization: `Apikey ${KEY}` })).body;
    expect(paid.accepted).toBe(true);
    const paidThrough = (await f.call("/api/me", "GET", undefined, alice)).body.paidThrough;
    expect(paidThrough).toBe(nextMonthlyDate(aliceBefore.trialThrough));

    f.setNow(f.now() + TRIAL_MS + 1);
    await provisioner.reconcile(f.now());
    expect((await f.call("/api/me", "GET", undefined, bob)).body).toMatchObject({
      workspaceState: "suspended", workspaceUrl: null,
    });
    const bobSlug = created.find((seed) => seed.admins[0] === "b@example.test")!.slug;
    expect((await f.call("/api/tenant-auth/start", "POST", {
      slug: bobSlug, email: "b@example.test",
    }, undefined, { authorization: `Bearer ${tenantToken(TENANT_KEY, bobSlug)}`, origin: "" })).status).toBe(401);
    expect((await f.call("/api/me", "GET", undefined, alice)).body.workspaceUrl).toBe(aliceUrl);
    const charlie = await signIn(f, "c@example.test");
    expect((await f.call("/api/me", "GET", undefined, charlie)).body.trialThrough).toBe(f.now() + TRIAL_MS);
    await provisioner.reconcile(f.now());
    expect(created).toHaveLength(3);
    expect((await f.call("/api/me", "GET", undefined, charlie)).body.workspaceUrl).toMatch(/^https:\/\/u-[a-f0-9]{20}\.rai2\.si$/);
    const bobAgain = await signIn(f, "b@example.test");
    expect((await f.call("/api/me", "GET", undefined, bobAgain)).body.trialThrough).toBe(bobBefore.trialThrough);
    expect((await f.call("/api/me", "GET", undefined, bobAgain)).body.workspaceUrl).toBeNull();
  });
  it("reserves the shared host's capacity before payment and expires unpaid transfer codes", async () => {
    const f = await fixture({ maxWorkspaces: 2 }); opened.push(f);
    const alice = await signIn(f, "alice@example.test");
    const bob = await signIn(f, "bob@example.test");
    const charlie = await signIn(f, "charlie@example.test");
    const first = await f.call("/api/orders", "POST", {}, alice);
    expect(first.status).toBe(201);
    expect(first.body.expiresAt).toBe(f.now() + ORDER_TTL_MS);
    expect((await f.call("/api/orders", "POST", {}, bob)).status).toBe(201);
    expect((await f.call("/api/orders", "POST", {}, charlie)).status).toBe(409);
    f.setNow(f.now() + ORDER_TTL_MS + 1);
    expect((await f.call(`/api/orders/${first.body.id}`, "GET", undefined, alice)).body.status).toBe("expired");
    expect((await f.call(first.body.qrUrl, "GET", undefined, alice)).status).toBe(410);
    const late = { id: 201, accountNumber: "1234567890", transferType: "in",
      transferAmount: 299000, content: first.body.code };
    expect((await f.call("/api/webhooks/sepay", "POST", late, undefined,
      { authorization: `Apikey ${KEY}` })).body.accepted).toBe(false);
    expect(f.store.unmatchedPayments()).toMatchObject([{ reason: "expired-order" }]);
    expect((await f.call("/api/orders", "POST", {}, charlie)).status).toBe(201);
  });
  it("accepts only fresh HMAC signatures over the exact SePay JSON body", async () => {
    const secret = "h".repeat(40);
    const f = await fixture({ sepayWebhookSecret: secret }); opened.push(f);
    const owner = await signIn(f, "owner@example.test");
    const order = (await f.call("/api/orders", "POST", {}, owner)).body;
    const event = { id: 413, accountNumber: "1234567890", transferType: "in",
      transferAmount: 299000, content: `RAI2 ${order.code}` };
    const timestamp = String(Math.floor(f.now() / 1000));
    const signature = (body: unknown, at = timestamp) => `sha256=${createHmac("sha256", secret)
      .update(`${at}.${JSON.stringify(body)}`).digest("hex")}`;
    const webhook = (body: unknown, at = timestamp, signed = signature(body, at)) =>
      f.call("/api/webhooks/sepay", "POST", body, undefined,
        { "x-sepay-timestamp": at, "x-sepay-signature": signed });
    expect((await f.call("/api/webhooks/sepay", "POST", event, undefined,
      { authorization: `Apikey ${KEY}` })).status).toBe(401);
    expect((await webhook({ ...event, transferAmount: 1 }, timestamp, signature(event))).status).toBe(401);
    expect((await webhook(event, String(Number(timestamp) - 301))).status).toBe(401);
    expect((await webhook(event, timestamp, "sha256=" + "0".repeat(64))).status).toBe(401);
    expect((await webhook(event)).body).toMatchObject({ success: true, accepted: true });
    expect((await webhook(event)).body).toMatchObject({ success: true, duplicate: true });
  });
  it("offers a private sign-in preview without issuing payment orders or accepting webhooks", async () => {
    const f = await fixture({ paymentsEnabled: false, previewEmail: "owner@example.test" }); opened.push(f);
    const license = await f.call("/LICENSE", "GET", undefined, undefined, {}, true);
    expect(license.status).toBe(200);
    expect(String(license.body)).toContain("Apache License");
    expect((await f.call("/api/status")).body).toEqual({
      paymentsEnabled: false, privatePreview: true, trialDays: 0, trialAvailable: false,
    });
    expect((await f.call("/api/auth/start", "POST", { email: "stranger@example.test" })).status).toBe(200);
    expect(f.messages).toHaveLength(0);
    expect((await f.call("/api/auth/verify", "POST", { email: "stranger@example.test", code: "12345678" })).status).toBe(401);
    const owner = await signIn(f, "owner@example.test");
    expect((await f.call("/api/me", "GET", undefined, owner)).body.email).toBe("owner@example.test");
    expect((await f.call("/api/orders", "POST", {}, owner)).status).toBe(503);
    const tokenHash = createHash("sha256").update(owner.split("=")[1]!).digest("hex");
    const account = f.store.accountForSession(tokenHash, f.now())!;
    const order = f.store.createOrder(account.id, f.now());
    expect((await f.call(`/api/orders/${order.id}/qr`, "GET", undefined, owner)).status).toBe(503);
    expect((await f.call("/api/webhooks/sepay", "POST", { id: 1 }, undefined,
      { authorization: `Apikey ${KEY}` })).status).toBe(503);
  });
  it("keeps the same billing day after a short month", () => {
    const january = Date.UTC(2027, 0, 31, 10);
    const february = nextMonthlyDate(january);
    expect(new Date(february).toISOString()).toBe("2027-02-28T10:00:00.000Z");
    expect(new Date(nextMonthlyDate(february, 31)).toISOString()).toBe("2027-03-31T10:00:00.000Z");
  });

  it("limits OTP emails from one public source across different addresses", async () => {
    const f = await fixture(); opened.push(f);
    for (let i = 0; i < 12; i++) {
      expect((await f.call("/api/auth/start", "POST", { email: `person${i}@example.test` }, undefined,
        { "cf-connecting-ip": `198.51.100.${i + 1}`, "x-real-ip": "203.0.113.7" })).status).toBe(200);
    }
    expect(f.messages).toHaveLength(10);
  });
  it("verifies email before creating an account, scopes orders and never exposes a tenant before payment", async () => {
    const f = await fixture(); opened.push(f);
    expect((await f.call("/api/me")).status).toBe(401);
    expect((await f.call("/api/orders", "POST")).status).toBe(401);
    expect((await f.call("/api/auth/start", "POST", { email: "a@example.test" }, undefined, { origin: "https://other.test" })).status).toBe(403);
    expect((await f.call("/api/auth/start", "POST", { email: "a@example.test" })).status).toBe(200);
    expect((await f.call("/api/auth/verify", "POST", { email: "a@example.test", code: "00000000" })).status).toBe(401);
    const code = f.messages.at(-1)!.code;
    const first = await f.call("/api/auth/verify", "POST", { email: "a@example.test", code });
    expect(first.status).toBe(200);
    expect((await f.call("/api/auth/verify", "POST", { email: "a@example.test", code })).status).toBe(401);
    const alice = first.cookie!;
    expect((await f.call("/api/me", "GET", undefined, alice)).body).toMatchObject({ email: "a@example.test", paidThrough: 0, workspaceUrl: null });
    const order = await f.call("/api/orders", "POST", {}, alice);
    expect(order.status).toBe(201);
    expect(order.body).toMatchObject({ amount: 299000, bankAccount: "1234567890" });
    expect(order.body.qrUrl).toBe(`/api/orders/${order.body.id}/qr`);
    expect((await f.call(order.body.qrUrl)).status).toBe(401);
    expect((await f.call(order.body.qrUrl, "GET", undefined, alice, {}, true)).status).toBe(200);
    expect(f.qrRequests).toHaveLength(1);
    expect((await f.call("/api/orders", "POST", {}, alice)).body.id).toBe(order.body.id);
    const bob = await signIn(f, "b@example.test");
    expect((await f.call(`/api/orders/${order.body.id}`, "GET", undefined, bob)).status).toBe(404);
    expect((await f.call(order.body.qrUrl, "GET", undefined, bob)).status).toBe(404);
    expect((await f.call("/api/me", "GET", undefined, bob)).body.workspaceUrl).toBeNull();
    expect((await f.call("/api/auth/logout", "POST", {}, alice)).status).toBe(200);
    expect((await f.call("/api/me", "GET", undefined, alice)).status).toBe(401);
  });

  it("accepts only authenticated, matching and sufficient SePay events, then provisions exactly one workspace", async () => {
    const f = await fixture(); opened.push(f);
    const alice = await signIn(f, "a@example.test");
    const bob = await signIn(f, "b@example.test");
    const order = (await f.call("/api/orders", "POST", {}, alice)).body;
    const bankEvent = { id: 92704, accountNumber: "1234567890", transferAmount: 299000, transferType: "in",
      gateway: "MBBank", referenceCode: "TX-1", content: `Payment ${order.code}` };
    const webhook = (body: unknown, authorization = `Apikey ${KEY}`) =>
      f.call("/api/webhooks/sepay", "POST", body, undefined, { authorization, origin: "" });
    expect((await webhook(bankEvent, "Apikey invalid")).status).toBe(401);
    expect((await webhook({ ...bankEvent, id: 92701, transferAmount: 1 })).body).toMatchObject({ success: true, accepted: false });
    expect((await webhook({ ...bankEvent, id: 92703, transferAmount: 598000 })).body).toMatchObject({ success: true, accepted: false });
    expect((await webhook({ ...bankEvent, accountNumber: "9999999999" })).body.accepted).toBe(false);
    expect((await webhook({ ...bankEvent, transferType: "out" })).body.accepted).toBe(false);
    expect((await webhook({ ...bankEvent, id: 92702, content: `${order.code} ${order.code}` })).body.accepted).toBe(false);
    expect(f.store.unmatchedPayments().map((row) => row.reference).sort()).toEqual(["sepay:92701", "sepay:92702", "sepay:92703"]);
    expect((await webhook(bankEvent)).body.accepted).toBe(true);
    const paidThrough = (await f.call("/api/me", "GET", undefined, alice)).body.paidThrough;
    expect(paidThrough).toBe(nextMonthlyDate(f.now()));
    expect((await webhook(bankEvent)).body).toMatchObject({ accepted: false, duplicate: true });
    expect((await f.call("/api/me", "GET", undefined, alice)).body.paidThrough).toBe(paidThrough);
    expect((await f.call(`/api/orders/${order.id}`, "GET", undefined, alice)).body.status).toBe("paid");

    const tenants = new Map<string, string>();
    const calls: Array<{ method: string; path: string; body?: any }> = [];
    const fleet: FleetTransport = async (method, path, body) => {
      calls.push({ method, path, body });
      if (path === "/workspaces" && method === "GET") {
        return { status: 200, body: { workspaces: [...tenants].map(([slug, status]) => ({ slug, status })) } };
      }
      if (path === "/workspaces" && method === "POST") {
        tenants.set((body as { slug: string }).slug, "running");
        return { status: 200, body: { ok: true } };
      }
      if (path.endsWith("/suspend")) {
        tenants.set(path.split("/")[2]!, "suspended");
        return { status: 200, body: { ok: true } };
      }
      if (path.endsWith("/resume")) {
        tenants.set(path.split("/")[2]!, "running");
        return { status: 200, body: { ok: true } };
      }
      return { status: 404, body: {} };
    };
    const provisioner = new WorkspaceProvisioner({ store: f.store, fleet, tenantAuthOrigin: "https://app.rai2.si", tenantSigningKey: TENANT_KEY, tenantDomain: "rai2.si" });
    await provisioner.reconcile(f.now());
    const created = calls.filter((call) => call.method === "POST" && call.path === "/workspaces");
    expect(created).toHaveLength(1);
    expect(created[0]!.body).toMatchObject({ admins: ["a@example.test"], members: [], memory: "2G",
      tenantAuthOrigin: "https://app.rai2.si" });
    expect(created[0]!.body.tenantAuthToken).toBe(tenantToken(TENANT_KEY, created[0]!.body.slug));
    expect(JSON.stringify(created[0]!.body)).not.toContain("smtps://");
    const url = (await f.call("/api/me", "GET", undefined, alice)).body.workspaceUrl;
    expect(url).toMatch(/^https:\/\/u-[a-f0-9]{20}\.rai2\.si$/);
    expect((await f.call("/api/me", "GET", undefined, bob)).body.workspaceUrl).toBeNull();
    const slug = created[0]!.body.slug;
    const tenantAuthorization = `Bearer ${tenantToken(TENANT_KEY, slug)}`;
    const tenantRequest = { slug, email: "a@example.test" };
    expect((await f.call("/api/tenant-auth/start", "POST", tenantRequest)).status).toBe(401);
    expect((await f.call("/api/tenant-auth/start", "POST", { slug, email: "b@example.test" }, undefined, { authorization: tenantAuthorization })).status).toBe(403);
    expect((await f.call("/api/tenant-auth/start", "POST", tenantRequest, undefined,
      { authorization: tenantAuthorization, origin: "" })).status).toBe(200);
    const tenantCode = f.messages.at(-1)!.code;
    expect((await f.call("/api/auth/verify", "POST", { email: "a@example.test", code: tenantCode })).status).toBe(401);
    expect((await f.call("/api/tenant-auth/verify", "POST", { ...tenantRequest, code: tenantCode }, undefined,
      { authorization: tenantAuthorization, origin: "" })).body).toEqual({ email: "a@example.test" });
    expect((await f.call("/api/tenant-auth/verify", "POST", { ...tenantRequest, code: tenantCode }, undefined,
      { authorization: tenantAuthorization })).status).toBe(401);
    await provisioner.reconcile(f.now());
    expect(calls.filter((call) => call.method === "POST" && call.path === "/workspaces")).toHaveLength(1);

    f.setNow(paidThrough + 1);
    await provisioner.reconcile(f.now());
    const renewedSession = await signIn(f, "a@example.test");
    expect((await f.call("/api/me", "GET", undefined, renewedSession)).body.workspaceState).toBe("suspended");
    const renewal = (await f.call("/api/orders", "POST", {}, renewedSession)).body;
    expect((await webhook({ ...bankEvent, id: 92705, referenceCode: "TX-2", content: `Renew ${renewal.code}` })).body.accepted).toBe(true);
    await provisioner.reconcile(f.now());
    expect((await f.call("/api/me", "GET", undefined, renewedSession)).body.workspaceUrl).toBe(url);
    expect(calls.filter((call) => call.path.endsWith("/resume"))).toHaveLength(1);
  });

  it("keeps unmatched receipts for manual reconciliation without double credit", async () => {
    const f = await fixture(); opened.push(f);
    const cookie = await signIn(f, "owner@example.test");
    const order = (await f.call("/api/orders", "POST", {}, cookie)).body;
    const event = { id: 82001, accountNumber: "1234567890", transferAmount: 299000,
      transferType: "in", content: "No order code" };
    const webhook = (payload: unknown) => f.call("/api/webhooks/sepay", "POST", payload, undefined,
      { authorization: `Apikey ${KEY}`, origin: "" });
    expect((await webhook(event)).body).toMatchObject({ success: true, accepted: false });
    expect(f.store.unmatchedPayments()).toMatchObject([{ reference: "sepay:82001", amount: 299000, reason: "no-single-code" }]);
    expect(f.store.assignUnmatched("sepay:82001", order.code, f.now())).toBe(true);
    expect(f.store.assignUnmatched("sepay:82001", order.code, f.now())).toBe(false);
    expect((await webhook({ ...event, content: order.code })).body.duplicate).toBe(true);
    expect(f.store.unmatchedPayments()).toEqual([]);
    expect((await f.call(`/api/orders/${order.id}`, "GET", undefined, cookie)).body.status).toBe("paid");
    expect((await f.call("/api/me", "GET", undefined, cookie)).body.paidThrough).toBe(nextMonthlyDate(f.now()));
  });
});
