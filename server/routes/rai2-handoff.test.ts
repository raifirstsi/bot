import { mkdtempSync, rmSync } from "node:fs";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { allowedScopes } from "../account-signin.ts";
import { SessionRegistry } from "../sessions.ts";
import { rai2HandoffRoute } from "./rai2-handoff.ts";

const slug = "u-1234567890abcdef1234";
const host = "friendly-name.rai2.si";
const origin = `https://${host}`;
const portal = "https://app.rai2.si";
const token = "t".repeat(43);

async function fixture(email = "owner@example.test") {
  const root = mkdtempSync(join(tmpdir(), "rai2-handoff-"));
  const allow = () => ({ admins: ["owner@example.test"], members: [] });
  const sessions = new SessionRegistry({ file: join(root, "sessions.json"),
    emailScopesSnapshot: () => (value) => allowedScopes(value, allow()) });
  const seen: string[] = [];
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", origin);
    void rai2HandoffRoute({
      env: { OMB_RAI2_TENANT: "1", OMB_PUBLIC_URL: origin, OMB_SIGNIN_TENANT_URL: portal,
        OMB_SIGNIN_TENANT_SLUG: slug, OMB_SIGNIN_TENANT_TOKEN: token, OMB_SIGNIN_TENANT_DOMAIN: "rai2.si" },
      sessions, cookieName: "omb_test", allow,
      fetchImpl: async (target, init) => {
        seen.push(`${String(target)} ${String(init?.headers && Reflect.get(init.headers, "authorization"))}`);
        return new Response(JSON.stringify({ email }), { status: 200, headers: { "content-type": "application/json" } });
      },
    }, req, res, url.pathname, req.method ?? "GET").then((handled) => {
      if (!handled) { res.writeHead(404).end(); }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture not listening");
  const call = (path: string, method = "GET", body?: unknown, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; text: string; headers: Record<string, string | string[] | undefined> }>((resolve, reject) => {
      const payload = body === undefined ? undefined : JSON.stringify(body);
      const req = request({ hostname: "127.0.0.1", port: address.port, path, method,
        headers: { host, ...(payload ? { origin, "content-type": "application/json" } : {}), ...headers } }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8"), headers: res.headers }));
      });
      req.on("error", reject);
      req.end(payload);
    });
  const close = async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    sessions.close();
    rmSync(root, { recursive: true, force: true });
  };
  return { call, close, seen, sessions };
}

const opened: Array<Awaited<ReturnType<typeof fixture>>> = [];
afterEach(async () => { for (const f of opened.splice(0)) await f.close(); });

describe("RAI2 workspace handoff", () => {
  it("exchanges a same-origin code for a scoped host-only session", async () => {
    const f = await fixture(); opened.push(f);
    const page = await f.call("/api/auth/rai2/claim");
    expect(page.status).toBe(200);
    expect(page.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(page.headers["content-security-policy"]).toContain("img-src 'self'");
    expect(page.text).toContain('data-theme="light"');
    expect(page.text).toContain('src="/assets/rai-core-black.png"');
    expect(page.text).toContain('id="status-primary"');
    expect(page.text).toContain('aria-live="polite"');
    expect(page.text).toContain(`href="${portal}/"`);
    expect((await f.call("/api/auth/rai2/claim.js")).text).toContain("history.replaceState");
    expect((await f.call("/api/auth/rai2/claim", "POST", { code: "c".repeat(43) }, { origin: "https://other.test" })).status).toBe(403);
    expect(f.seen).toHaveLength(0);
    const claimed = await f.call("/api/auth/rai2/claim", "POST", { code: "c".repeat(43) });
    expect(claimed.status).toBe(200);
    expect(String(claimed.headers["set-cookie"])).toContain("omb_test=omb_sess_");
    expect(String(claimed.headers["set-cookie"])).toContain("HttpOnly");
    expect(String(claimed.headers["set-cookie"])).toContain("Secure");
    const issuedToken = String(claimed.headers["set-cookie"]).match(/omb_test=(omb_sess_[A-Za-z0-9_-]+)/)?.[1];
    expect(f.sessions.authenticate(issuedToken)).toMatchObject({ email: "owner@example.test", scopes: ["admin", "client"] });
    expect(f.seen).toEqual([`${portal}/api/tenant-auth/consume Bearer ${token}`]);
  });

  it("uses the shared RAI2 theme cookie without trusting other cookie values", async () => {
    const f = await fixture(); opened.push(f);
    const dark = await f.call("/api/auth/rai2/claim", "GET", undefined,
      { cookie: "unrelated=dark; rai2_theme=dark; suffix=value" });
    expect(dark.text).toContain('data-theme="dark"');
    expect(dark.text).toContain('name="theme-color" content="#080808"');

    const untrusted = await f.call("/api/auth/rai2/claim", "GET", undefined,
      { cookie: "rai2_theme=dark<script>" });
    expect(untrusted.text).toContain('data-theme="light"');
    expect(untrusted.text).not.toContain("dark<script>");
  });

  it("refuses a different workspace host or a non-member identity", async () => {
    const f = await fixture("stranger@example.test"); opened.push(f);
    expect((await f.call("/api/auth/rai2/claim", "GET", undefined, { host: "other.rai2.si" })).status).toBe(421);
    const refused = await f.call("/api/auth/rai2/claim", "POST", { code: "c".repeat(43) });
    expect(refused.status).toBe(403);
    expect(refused.headers["set-cookie"]).toBeUndefined();
  });
});
