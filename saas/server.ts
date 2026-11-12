import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { isIP } from "node:net";
import { fileURLToPath } from "node:url";
import type { SaasStore } from "./store.ts";
import { MONTHLY_PRICE_VND, normalizeWorkspaceHandle, ORDER_TTL_MS, TRIAL_MS, WorkspaceCapacityError,
  WorkspaceHandleCooldownError, WorkspaceHandleTakenError } from "./store.ts";
import { tenantToken } from "./tenant-auth.ts";

export interface SaasConfig {
  publicOrigin: string;
  tenantDomain: string;
  bankAccount: string;
  bankName: string;
  sepayApiKey?: string;
  sepayWebhookSecret?: string;
  maxWorkspaces?: number;
  otpPepper: string;
  tenantSigningKey: string;
}

export interface SaasMailer {
  sendCode(email: string, code: string): Promise<void>;
}

export interface SaasServerOptions {
  config: SaasConfig;
  store: SaasStore;
  mailer: SaasMailer;
  paymentsEnabled?: boolean;
  trialEnabled?: boolean;
  previewEmail?: string;
  onVerified?: () => void;
  onWorkspaceHandle?: (slug: string, host: string, legacyHosts: string[]) => Promise<void>;
  now?: () => number;
  qrFetch?: typeof fetch;
}

const COOKIE = "rai2_session";
const JSON_LIMIT = 16 * 1024;
const emailPattern = /^[^\s@<>]{1,64}@[^\s@<>]{1,189}\.[^\s@<>]{2,63}$/;
const orderCode = /(?<![A-Z0-9])R2[A-F0-9]{16}(?![A-Z0-9])/g;
const pages = new Map([
  ["/", { name: "index.html", type: "text/html; charset=utf-8" }],
  ["/app.css", { name: "app.css", type: "text/css; charset=utf-8" }],
  ["/app.js", { name: "app.js", type: "text/javascript; charset=utf-8" }],
  ["/assets/rai-core-white.png", { name: "assets/rai-core-white.png", type: "image/png" }],
  ["/assets/rai-core-black.png", { name: "assets/rai-core-black.png", type: "image/png" }],
  ["/assets/rai-backend-favicon.png", { name: "assets/rai-backend-favicon.png", type: "image/png" }],
]);

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const digest = (pepper: string, value: string) => createHmac("sha256", pepper).update(value).digest("hex");

function sameSecret(actual: string, expected: string): boolean {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(body));
}

async function readRawJson(req: IncomingMessage): Promise<Buffer> {
  if (!/^application\/json(?:\s*;|$)/i.test(String(req.headers["content-type"] ?? ""))) {
    throw Object.assign(new Error("JSON required"), { status: 415 });
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > JSON_LIMIT) throw Object.assign(new Error("request too large"), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseJson(raw: Buffer): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw.toString("utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
  } catch {}
  throw Object.assign(new Error("invalid JSON"), { status: 400 });
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  return parseJson(await readRawJson(req));
}

function cookieToken(req: IncomingMessage): string | null {
  const pair = String(req.headers.cookie ?? "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`));
  const token = pair?.slice(COOKIE.length + 1);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

function customerEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && emailPattern.test(email) ? email : null;
}

function paymentCode(text: string): string | null {
  const codes = [...text.toUpperCase().matchAll(orderCode)].map((match) => match[0]);
  return codes.length === 1 ? codes[0]! : null;
}

export function validateSaasConfig(config: SaasConfig): void {
  const url = new URL(config.publicOrigin);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost"].includes(url.hostname))) ||
    url.origin !== config.publicOrigin || !/^[a-z0-9.-]+$/.test(config.tenantDomain) ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(config.tenantDomain) ||
    !/^[0-9]{6,30}$/.test(config.bankAccount) || !config.bankName.trim() ||
    (!config.sepayWebhookSecret && !config.sepayApiKey) ||
    (config.sepayApiKey !== undefined && config.sepayApiKey.length < 24) ||
    (config.sepayWebhookSecret !== undefined && config.sepayWebhookSecret.length < 32) ||
    (config.maxWorkspaces !== undefined && (!Number.isInteger(config.maxWorkspaces) || config.maxWorkspaces < 1)) ||
    config.otpPepper.length < 32 || config.tenantSigningKey.length < 32) {
    throw new Error("invalid SaaS configuration");
  }
}

export function createSaasServer(options: SaasServerOptions): Server {
  validateSaasConfig(options.config);
  const { config, store, mailer } = options;
  const publicUrl = new URL(config.publicOrigin);
  const now = options.now ?? Date.now;
  const secure = publicUrl.protocol === "https:";
  const qrFetch = options.qrFetch ?? fetch;
  const paymentsEnabled = options.paymentsEnabled ?? true;
  const trialEnabled = options.trialEnabled ?? false;
  const previewEmail = options.previewEmail?.trim().toLowerCase() ?? null;
  const workspaceUrl = (account: { slug: string; workspaceHandle: string | null }) =>
    `https://${account.workspaceHandle ?? account.slug}.${config.tenantDomain}`;
  let handleMutation: Promise<unknown> = Promise.resolve();
  const serializeHandle = <T>(action: () => Promise<T>): Promise<T> => {
    const result = handleMutation.then(action);
    handleMutation = result.catch(() => {});
    return result;
  };
  if (previewEmail && !customerEmail(previewEmail)) throw new Error("invalid preview email");
  if (trialEnabled && !config.maxWorkspaces) throw new Error("trial requires a workspace capacity");

  const sendCode = async (req: IncomingMessage, res: ServerResponse, email: string, identity: string): Promise<void> => {
    const peer = req.socket.remoteAddress ?? "unknown";
    const forwarded = req.headers["x-real-ip"];
    const source = (peer === "127.0.0.1" || peer === "::1" || peer === "::ffff:127.0.0.1") &&
      typeof forwarded === "string" && isIP(forwarded) ? forwarded : peer;
    const sourceHash = digest(config.otpPepper, identity.startsWith("tenant:") ? identity : source);
    const code = String(randomInt(0, 100_000_000)).padStart(8, "0");
    const codeHash = digest(config.otpPepper, `${identity}:${code}`);
    if (store.beginChallenge(identity, sourceHash, codeHash, now())) {
      try { await mailer.sendCode(email, code); }
      catch {
        store.discardChallenge(identity, codeHash);
        json(res, 503, { error: "email is temporarily unavailable" });
        return;
      }
    }
    json(res, 200, { ok: true });
  };

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const method = req.method ?? "GET";
    const path = new URL(req.url ?? "/", config.publicOrigin).pathname;
    if (req.headers.host !== publicUrl.host) return json(res, 421, { error: "wrong host" });
    if (method === "GET" && path === "/healthz") return json(res, 200, { ok: true });
    if (method === "GET" && path === "/api/status") return json(res, 200, {
      paymentsEnabled, privatePreview: Boolean(previewEmail), trialDays: trialEnabled ? TRIAL_MS / 86_400_000 : 0,
      trialAvailable: trialEnabled && store.hasTrialCapacity(now(), config.maxWorkspaces!),
    });
    if (method === "GET" && (path === "/LICENSE" || path === "/NOTICE")) {
      const bundled = fileURLToPath(new URL(`.${path}`, import.meta.url));
      const source = fileURLToPath(new URL(`..${path}`, import.meta.url));
      const body = readFileSync(existsSync(bundled) ? bundled : source);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=86400",
        "x-content-type-options": "nosniff" });
      res.end(body);
      return;
    }
    const page = method === "GET" ? pages.get(path) : undefined;
    if (page) {
      const bundled = fileURLToPath(new URL(`./public/${page.name}`, import.meta.url));
      const sourceAsset = fileURLToPath(new URL(`../public/${page.name}`, import.meta.url));
      const body = readFileSync(existsSync(bundled) ? bundled : sourceAsset);
      res.writeHead(200, {
        "content-type": page.type, "cache-control": "no-store", "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer",
        "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
      });
      res.end(body);
      return;
    }

    if (method === "POST" && path !== "/api/webhooks/sepay" && !path.startsWith("/api/tenant-auth/") &&
      req.headers.origin !== config.publicOrigin) return json(res, 403, { error: "same-origin request required" });

    if (method === "POST" && path === "/api/webhooks/sepay") {
      if (!paymentsEnabled) return json(res, 503, { error: "payments unavailable" });
      let body: Record<string, unknown>;
      if (config.sepayWebhookSecret) {
        const timestamp = req.headers["x-sepay-timestamp"];
        const signature = req.headers["x-sepay-signature"];
        if (typeof timestamp !== "string" || !/^\d{10,12}$/.test(timestamp) ||
          Math.abs(now() - Number(timestamp) * 1000) > 300_000 ||
          typeof signature !== "string" || !/^sha256=[a-f0-9]{64}$/i.test(signature)) {
          return json(res, 401, { error: "unauthorized" });
        }
        const raw = await readRawJson(req);
        const expected = `sha256=${createHmac("sha256", config.sepayWebhookSecret)
          .update(timestamp).update(".").update(raw).digest("hex")}`;
        if (!sameSecret(signature.toLowerCase(), expected)) return json(res, 401, { error: "unauthorized" });
        body = parseJson(raw);
      } else {
        const presented = String(req.headers.authorization ?? "").replace(/^Apikey\s+/i, "");
        if (!sameSecret(presented, config.sepayApiKey!)) return json(res, 401, { error: "unauthorized" });
        body = await readJson(req);
      }
      const account = body.accountNumber;
      const amount = body.transferAmount;
      const transactionId = body.id;
      const content = body.content;
      const id = typeof transactionId === "number" && Number.isSafeInteger(transactionId) && transactionId > 0
        ? String(transactionId) : typeof transactionId === "string" && /^[1-9][0-9]{0,19}$/.test(transactionId)
          ? transactionId : null;
      if (account !== config.bankAccount || body.transferType !== "in" ||
        typeof amount !== "number" || !Number.isSafeInteger(amount) || !id || typeof content !== "string") {
        return json(res, 200, { success: true, accepted: false });
      }
      const code = paymentCode(content);
      const result = store.recordPayment(code, `sepay:${id}`, amount, now());
      return json(res, 200, { success: true, accepted: result === "paid", duplicate: result === "duplicate" });
    }

    if (method === "POST" && (path === "/api/tenant-auth/start" || path === "/api/tenant-auth/verify" ||
      path === "/api/tenant-auth/consume")) {
      const body = await readJson(req);
      const slug = body.slug;
      if (typeof slug !== "string" || !/^u-[a-f0-9]{20}$/.test(slug)) return json(res, 400, { error: "invalid tenant request" });
      const presented = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "");
      const account = store.accountForSlug(slug);
      if (!account || !sameSecret(presented, tenantToken(config.tenantSigningKey, slug)) ||
        Math.max(account.paidThrough, account.trialThrough) <= now() || account.workspaceState !== "active") {
        return json(res, 401, { error: "tenant authentication unavailable" });
      }
      if (path.endsWith("/consume")) {
        const code = body.code;
        if (typeof code !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(code)) return json(res, 400, { error: "invalid handoff" });
        const email = store.consumeWorkspaceHandoff(slug, sha256(code), now());
        return email ? json(res, 200, { email }) : json(res, 401, { error: "handoff expired or used" });
      }
      const email = customerEmail(body.email);
      if (!email) return json(res, 400, { error: "invalid tenant request" });
      if (account.email !== email) return json(res, 403, { error: "email is not a workspace member" });
      const identity = `tenant:${slug}:${email}`;
      if (path.endsWith("/start")) return sendCode(req, res, email, identity);
      const code = body.code;
      if (typeof code !== "string" || !/^\d{8}$/.test(code)) return json(res, 400, { error: "invalid code" });
      if (!store.consumeChallenge(identity, digest(config.otpPepper, `${identity}:${code}`), now())) {
        return json(res, 401, { error: "code invalid or expired" });
      }
      return json(res, 200, { email });
    }

    if (method === "POST" && path === "/api/auth/start") {
      const body = await readJson(req);
      const email = customerEmail(body.email);
      if (!email) return json(res, 400, { error: "invalid email" });
      if (previewEmail && email !== previewEmail) return json(res, 200, { ok: true });
      return sendCode(req, res, email, `portal:${email}`);
    }

    if (method === "POST" && path === "/api/auth/verify") {
      const body = await readJson(req);
      const email = customerEmail(body.email);
      const code = body.code;
      if (!email || typeof code !== "string" || !/^\d{8}$/.test(code)) return json(res, 400, { error: "invalid code" });
      if (previewEmail && email !== previewEmail) return json(res, 401, { error: "code invalid or expired" });
      const identity = `portal:${email}`;
      if (!store.consumeChallenge(identity, digest(config.otpPepper, `${identity}:${code}`), now())) {
        return json(res, 401, { error: "code invalid or expired" });
      }
      const token = randomBytes(32).toString("base64url");
      try {
        store.createSession(email, sha256(token), now(), trialEnabled ? { maxWorkspaces: config.maxWorkspaces! } : undefined);
      } catch (error) {
        if (error instanceof WorkspaceCapacityError) return json(res, 409, { error: "trial capacity reached" });
        throw error;
      }
      res.setHeader("set-cookie", `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure ? "; Secure" : ""}`);
      json(res, 200, { ok: true });
      options.onVerified?.();
      return;
    }

    const token = cookieToken(req);
    const account = token ? store.accountForSession(sha256(token), now()) : null;
    if (!account || (previewEmail && account.email !== previewEmail)) return json(res, 401, { error: "sign in required" });

    if (method === "POST" && path === "/api/auth/logout") {
      store.revokeSession(sha256(token!));
      res.setHeader("set-cookie", `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
      return json(res, 200, { ok: true });
    }
    if (method === "POST" && path === "/api/workspace/handle") {
      const onWorkspaceHandle = options.onWorkspaceHandle;
      if (!onWorkspaceHandle || account.workspaceState !== "active" ||
        Math.max(account.paidThrough, account.trialThrough) <= now()) {
        return json(res, 409, { error: "workspace unavailable" });
      }
      const body = await readJson(req);
      const handle = normalizeWorkspaceHandle(body.handle);
      if (!handle) return json(res, 400, { error: "invalid workspace address" });
      return serializeHandle(async () => {
        let changed;
        try { changed = store.setWorkspaceHandle(account.id, handle, now()); }
        catch (error) {
          if (error instanceof WorkspaceHandleTakenError) return json(res, 409, { error: "workspace address is already taken" });
          if (error instanceof WorkspaceHandleCooldownError) return json(res, 429, { error: error.message });
          throw error;
        }
        if (changed.previous !== handle) {
          try { await onWorkspaceHandle(account.slug, `${handle}.${config.tenantDomain}`,
            store.workspaceHandleAliases(account.id).map((alias) => `${alias}.${config.tenantDomain}`)); }
          catch {
            store.restoreWorkspaceHandle(account.id, handle, changed.previous, changed.previousChangedAt);
            return json(res, 503, { error: "workspace address could not be updated" });
          }
        }
        return json(res, 200, { handle, workspaceUrl: workspaceUrl(changed.account) });
      });
    }
    if (method === "GET" && path === "/api/me") {
      return json(res, 200, {
        email: account.email, paidThrough: account.paidThrough, trialThrough: account.trialThrough,
        workspaceState: account.workspaceState, workspaceHandle: account.workspaceHandle,
        workspaceUrl: account.workspaceState === "active" && Math.max(account.paidThrough, account.trialThrough) > now()
          ? workspaceUrl(account) : null,
      });
    }
    if (method === "GET" && path === "/api/workspace/open") {
      const site = req.headers["sec-fetch-site"];
      if (site && site !== "same-origin" && site !== "none") return json(res, 403, { error: "same-origin navigation required" });
      const handoff = store.createWorkspaceHandoff(sha256(token!), now());
      if (!handoff) return json(res, 409, { error: "workspace unavailable" });
      res.writeHead(302, { location: `https://${handoff.handle ?? handoff.slug}.${config.tenantDomain}/api/auth/rai2/claim#code=${handoff.code}`,
        "cache-control": "no-store", "referrer-policy": "no-referrer", "x-content-type-options": "nosniff" });
      res.end();
      return;
    }
    if (method === "POST" && path === "/api/orders") {
      if (!paymentsEnabled) return json(res, 503, { error: "payments unavailable" });
      let order;
      try { order = store.createOrder(account.id, now(), config.maxWorkspaces); }
      catch (error) {
        if (error instanceof WorkspaceCapacityError) return json(res, 409, { error: "workspace capacity reached" });
        throw error;
      }
      return json(res, 201, {
        id: order.id, code: order.code, amount: MONTHLY_PRICE_VND,
        expiresAt: order.createdAt + ORDER_TTL_MS,
        bankAccount: config.bankAccount, bankName: config.bankName,
        qrUrl: `/api/orders/${order.id}/qr`,
      });
    }
    const qrMatch = /^\/api\/orders\/([a-f0-9-]{36})\/qr$/.exec(path);
    if (method === "GET" && qrMatch) {
      if (!paymentsEnabled) return json(res, 503, { error: "payments unavailable" });
      const order = store.orderForAccount(qrMatch[1]!, account.id);
      if (!order) return json(res, 404, { error: "order not found" });
      if (order.status === "pending" && now() - order.createdAt >= ORDER_TTL_MS) {
        return json(res, 410, { error: "order expired" });
      }
      const url = new URL("https://qr.sepay.vn/img");
      url.search = new URLSearchParams({ acc: config.bankAccount, bank: config.bankName,
        amount: String(order.amount), des: order.code }).toString();
      try {
        const image = await qrFetch(url, { redirect: "error", signal: AbortSignal.timeout(7_000) });
        if (!image.ok || !image.headers.get("content-type")?.startsWith("image/png")) throw new Error("QR unavailable");
        const bytes = Buffer.from(await image.arrayBuffer());
        if (bytes.length > 100_000 || bytes.length < 100 ||
          !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error("QR invalid");
        res.writeHead(200, { "content-type": "image/png", "cache-control": "private, max-age=300", "x-content-type-options": "nosniff" });
        res.end(bytes);
      } catch {
        json(res, 502, { error: "QR unavailable; use the bank details below" });
      }
      return;
    }
    const orderMatch = /^\/api\/orders\/([a-f0-9-]{36})$/.exec(path);
    if (method === "GET" && orderMatch) {
      const order = store.orderForAccount(orderMatch[1]!, account.id);
      return order ? json(res, 200, { status: order.status === "pending" && now() - order.createdAt >= ORDER_TTL_MS
        ? "expired" : order.status, paidAt: order.paidAt }) : json(res, 404, { error: "order not found" });
    }
    return json(res, 404, { error: "not found" });
  };

  return createServer((req, res) => {
    void handle(req, res).catch((error: unknown) => {
      if (res.headersSent) { res.destroy(); return; }
      const status = typeof (error as { status?: unknown })?.status === "number" ? Number((error as { status: number }).status) : 500;
      json(res, status, { error: status === 500 ? "internal error" : error instanceof Error ? error.message : "invalid request" });
    });
  });
}
