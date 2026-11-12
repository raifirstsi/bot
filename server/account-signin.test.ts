import { describe, expect, it } from "vitest";

import { allowedScopes, createEmailSignIn, parseAllowList, signInEnabled } from "./account-signin.ts";
import { startControlPlaneStub } from "./testing/control-plane-stub.ts";

describe("the sign-in allow-list", () => {
  it("splits on commas, spaces and newlines and ignores case", () => {
    expect(parseAllowList(" Her@Example.test, @Agentada.test\nstaff@example.test ")).toEqual(["her@example.test", "@agentada.test", "staff@example.test"]);
    expect(parseAllowList(undefined)).toEqual([]);
  });

  it("maps addresses and @domains to scopes, and never matches a look-alike domain", () => {
    const list = { admins: ["her@example.test", "@agentada.test"], members: ["staff@example.test", "@partner.test"] };
    expect(allowedScopes("HER@example.test", list)).toEqual(["admin", "client"]);
    expect(allowedScopes("anyone@agentada.test", list)).toEqual(["admin", "client"]);
    expect(allowedScopes("staff@example.test", list)).toEqual(["client"]);
    expect(allowedScopes("x@partner.test", list)).toEqual(["client"]);
    expect(allowedScopes("x@evilagentada.test", list)).toBeNull();
    expect(allowedScopes("x@agentada.test.evil", list)).toBeNull();
    expect(allowedScopes("@agentada.test", list)).toBeNull();
    expect(allowedScopes("stranger@example.test", list)).toBeNull();
    expect(signInEnabled(list)).toBe(true);
    expect(signInEnabled({ admins: [], members: [] })).toBe(false);
  });
});

describe("the exchange with the control plane", () => {
  it("sends a code only to welcome addresses, turns the right code into scopes, and explains the wrong one", async () => {
    const stub = await startControlPlaneStub();
    try {
      const signIn = createEmailSignIn({
        allow: { admins: ["her@example.test"], members: ["@team.test"] },
        env: { ...process.env, OMB_CONTROL_PLANE_URL: stub.url },
      });
      expect(signIn.enabled()).toBe(true);
      expect(await signIn.start("nobody@example.test")).toMatchObject({ ok: false, status: 403 });
      expect(await signIn.start("not an email")).toMatchObject({ ok: false, status: 400 });
      expect(stub.calls).not.toContain("POST /api/auth/email-otp/send-verification-otp");
      expect(await signIn.start("Her@Example.test")).toEqual({ ok: true });
      expect(stub.calls).toContain("POST /api/auth/email-otp/send-verification-otp");

      const wrong = await signIn.verify("her@example.test", "00000000");
      expect(wrong).toMatchObject({ ok: false, status: 401 });
      expect(wrong.ok ? "" : wrong.error).toMatch(/wrong or has expired/);
      expect(await signIn.verify("her@example.test", "12")).toMatchObject({ ok: false, status: 400 });
      expect(await signIn.verify("nobody@example.test", stub.otp)).toMatchObject({ ok: false, status: 403 });

      const admin = await signIn.verify("her@example.test", stub.otp);
      expect(admin).toEqual({ ok: true, email: "her@example.test", userId: "user_stub", scopes: ["admin", "client"] });
      const member = await signIn.verify("someone@team.test", stub.otp);
      expect(member).toMatchObject({ ok: true, scopes: ["client"] });
      await new Promise((r) => setTimeout(r, 50));
      expect(stub.calls.filter((call) => call === "POST /api/auth/sign-out").length).toBe(2);
    } finally {
      await stub.close();
    }
  });

  it("is off with an empty allow-list and says so when the sign-in service is down", async () => {
    const off = createEmailSignIn({ allow: () => ({ admins: [], members: [] }) });
    expect(off.enabled()).toBe(false);
    const down = createEmailSignIn({ allow: { admins: ["a@b.test"], members: [] }, env: { ...process.env, OMB_CONTROL_PLANE_URL: "http://127.0.0.1:9" } });
    expect(await down.start("a@b.test")).toMatchObject({ ok: false, status: 502 });
  });
});

describe("RAI2 tenant sign-in", () => {
  it("uses only its scoped HTTPS token and the tenant's owner allow-list", async () => {
    const slug = "u-1234567890abcdef1234";
    const token = "t".repeat(43);
    const calls: Array<{ url: string; authorization: string; body: Record<string, unknown> }> = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
      calls.push({ url: String(input), authorization: new Headers(init?.headers).get("authorization") ?? "", body });
      return new Response(JSON.stringify(body.code ? { email: body.email } : { ok: true }), { status: 200 });
    };
    const signIn = createEmailSignIn({ allow: { admins: ["owner@example.test"], members: [] }, fetchImpl,
      env: { OMB_SIGNIN_TENANT_URL: "https://app.rai2.si", OMB_SIGNIN_TENANT_SLUG: slug,
        OMB_SIGNIN_TENANT_TOKEN: token, OMB_CONTROL_PLANE_URL: "https://accounts.openmausbot.com" } });
    expect(signIn.enabled()).toBe(true);
    expect(await signIn.start("other@example.test")).toMatchObject({ ok: false, status: 403 });
    expect(await signIn.start("OWNER@example.test")).toEqual({ ok: true });
    expect(await signIn.verify("owner@example.test", "12345678")).toEqual({
      ok: true, email: "owner@example.test", userId: `tenant:${slug}:owner@example.test`, scopes: ["admin", "client"],
    });
    expect(calls).toHaveLength(2);
    expect(calls[0]).toMatchObject({ url: "https://app.rai2.si/api/tenant-auth/start",
      authorization: `Bearer ${token}`, body: { slug, email: "owner@example.test" } });
    expect(calls[1]?.body.code).toBe("12345678");
  });

  it("fails closed on incomplete configuration or a mismatched verification", async () => {
    const partial = createEmailSignIn({ allow: { admins: ["owner@example.test"], members: [] },
      env: { OMB_SIGNIN_TENANT_URL: "https://app.rai2.si" } });
    expect(partial.enabled()).toBe(false);
    const missing = createEmailSignIn({ allow: { admins: ["owner@example.test"], members: [] },
      env: { OMB_RAI2_TENANT: "1", OMB_CONTROL_PLANE_URL: "https://accounts.openmausbot.com" },
      fetchImpl: async () => { throw new Error("upstream must not be called"); } });
    expect(missing.enabled()).toBe(false);
    expect(await missing.start("owner@example.test")).toMatchObject({ ok: false, status: 503 });
    const mismatched = createEmailSignIn({ allow: { admins: ["owner@example.test"], members: [] },
      env: { OMB_SIGNIN_TENANT_URL: "https://app.rai2.si", OMB_SIGNIN_TENANT_SLUG: "u-1234567890abcdef1234",
        OMB_SIGNIN_TENANT_TOKEN: "t".repeat(43) },
      fetchImpl: async () => new Response(JSON.stringify({ email: "someone@example.test" }), { status: 200 }) });
    expect(await mismatched.verify("owner@example.test", "12345678")).toMatchObject({ ok: false, status: 503 });
  });
});
