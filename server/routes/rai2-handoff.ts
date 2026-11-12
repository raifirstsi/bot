import type { IncomingMessage, ServerResponse } from "node:http";

import { allowedScopes, type SignInAllowList } from "../account-signin.ts";
import { json, readBody } from "../harness/http.ts";
import { labelFromUserAgent, serializeSessionCookie } from "../request-auth.ts";
import { cookieMaxAgeSeconds, type SessionRegistry } from "../sessions.ts";

const CLAIM = "/api/auth/rai2/claim";
const SCRIPT = "/api/auth/rai2/claim.js";
const CODE = /^[A-Za-z0-9_-]{43}$/;
const script = `const page = document.documentElement;
const title = document.getElementById("handoff-title");
const primary = document.getElementById("status-primary");
const secondary = document.getElementById("status-secondary");
const fail = (heading, message, translation) => {
  page.dataset.state = "error";
  document.title = heading + " · RAI²";
  title.textContent = heading;
  primary.textContent = message;
  secondary.textContent = translation;
};
const code = new URLSearchParams(location.hash.slice(1)).get("code");
history.replaceState(null, "", location.pathname);
if (!code || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
  fail("Không thể mở workspace", "Liên kết đăng nhập không hợp lệ.", "Invalid sign-in link.");
}
else fetch("/api/auth/rai2/claim", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) })
  .then((response) => { if (!response.ok) throw new Error("claim refused"); location.replace("/"); })
  .catch(() => {
    fail("Không thể mở workspace", "Phiên đăng nhập đã hết hạn hoặc không thể sử dụng.", "Return to your RAI² account and try again.");
  });`;

function handoffPage(portalOrigin: string, theme: "light" | "dark"): string {
  const themeColor = theme === "dark" ? "#080808" : "#f8fafd";
  return `<!doctype html>
<html lang="vi" data-theme="${theme}" data-state="loading">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${themeColor}">
  <title>Đang mở workspace · RAI²</title>
  <link rel="icon" href="/favicon.ico">
  <style>
    :root {
      color-scheme: light;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      --ground: #f8fafd;
      --panel: #ffffff;
      --ink: #0f172a;
      --muted: #475569;
      --quiet: #64748b;
      --line: #e2e8f0;
      --blue: #0099ff;
      --blue-soft: #e0f2fe;
      --danger: #c2414b;
    }
    :root[data-theme="dark"] {
      color-scheme: dark;
      --ground: #080808;
      --panel: #121212;
      --ink: #f8fafc;
      --muted: #94a3b8;
      --quiet: #71717a;
      --line: #27272a;
      --blue-soft: #0d1a25;
      --danger: #fda4af;
    }
    * { box-sizing: border-box; }
    html { min-width: 320px; background: var(--ground); }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      margin: 0;
      display: grid;
      grid-template-rows: auto 1fr auto;
      background: var(--ground);
      color: var(--ink);
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .site-header {
      min-height: 64px;
      padding: 0 max(24px, env(safe-area-inset-left));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      border-bottom: 1px solid var(--line);
    }
    .brand { display: inline-flex; align-items: center; text-decoration: none; }
    .brand img { display: block; width: 74px; height: auto; }
    .brand-dark { display: none !important; }
    :root[data-theme="dark"] .brand-light { display: none; }
    :root[data-theme="dark"] .brand-dark { display: block !important; }
    .context {
      color: var(--quiet);
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      letter-spacing: 0;
    }
    main {
      width: min(100% - 48px, 1040px);
      margin-inline: auto;
      display: grid;
      align-items: center;
      padding-block: 56px;
    }
    .handoff { width: min(100%, 560px); }
    .progress {
      width: 42px;
      height: 42px;
      margin-bottom: 28px;
      display: grid;
      place-items: center;
      border: 3px solid var(--blue-soft);
      border-top-color: var(--blue);
      border-radius: 50%;
      animation: spin 900ms linear infinite;
    }
    .progress::after {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--blue);
      content: "";
    }
    .eyebrow {
      margin: 0 0 12px;
      color: var(--blue);
      font-size: 11px;
      font-weight: 700;
      line-height: 1.2;
    }
    h1 {
      margin: 0;
      font-size: clamp(34px, 6vw, 52px);
      font-weight: 600;
      line-height: 1.08;
      letter-spacing: 0;
    }
    .status {
      margin: 22px 0 0;
      display: grid;
      gap: 5px;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.55;
    }
    #status-secondary { color: var(--quiet); font-size: 14px; }
    .return-link {
      width: fit-content;
      min-height: 46px;
      margin-top: 32px;
      padding: 9px 16px;
      display: inline-grid;
      grid-template-columns: 20px auto;
      align-items: center;
      column-gap: 10px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: var(--panel);
      color: var(--ink);
      font-size: 14px;
      font-weight: 600;
      line-height: 1.25;
      text-decoration: none;
      transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
    }
    .return-link:hover { border-color: var(--blue); color: var(--blue); }
    .return-link:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }
    .return-copy { display: grid; gap: 2px; }
    .return-copy span:last-child { color: var(--quiet); font-size: 11px; font-weight: 500; }
    footer {
      min-height: 64px;
      padding: 20px max(24px, env(safe-area-inset-left)) max(20px, env(safe-area-inset-bottom));
      display: flex;
      align-items: center;
      border-top: 1px solid var(--line);
      color: var(--quiet);
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
    }
    :root[data-state="error"] .progress {
      border-color: color-mix(in srgb, var(--danger) 22%, transparent);
      animation: none;
    }
    :root[data-state="error"] .progress::after {
      width: auto;
      height: auto;
      border-radius: 0;
      background: transparent;
      color: var(--danger);
      content: "!";
      font-size: 20px;
      font-weight: 700;
    }
    :root[data-state="error"] .eyebrow { color: var(--danger); }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 640px) {
      .site-header { min-height: 60px; padding-inline: 16px; }
      .brand img { width: 66px; }
      main { width: min(100% - 32px, 560px); padding-block: 40px; }
      .progress { width: 38px; height: 38px; margin-bottom: 24px; }
      h1 { font-size: 36px; }
      .status { margin-top: 18px; font-size: 15px; }
      .return-link { width: 100%; margin-top: 28px; }
      footer { min-height: 60px; padding-inline: 16px; }
    }
    @media (max-width: 375px) {
      main { width: min(100% - 24px, 560px); }
      h1 { font-size: 32px; }
      .context { font-size: 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .progress { animation: none; }
      .return-link { transition: none; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${portalOrigin}/" aria-label="RAI² · Trang tài khoản">
      <img class="brand-light" src="/assets/rai-core-black.png" alt="RAI²">
      <img class="brand-dark" src="/assets/rai-core-white.png" alt="">
    </a>
    <span class="context">WORKSPACE</span>
  </header>
  <main>
    <section class="handoff" aria-labelledby="handoff-title">
      <div class="progress" aria-hidden="true"></div>
      <p class="eyebrow">RAI² WORKSPACE</p>
      <h1 id="handoff-title">Đang mở workspace</h1>
      <p id="status" class="status" role="status" aria-live="polite">
        <span id="status-primary">Đang xác thực phiên đăng nhập của bạn.</span>
        <span id="status-secondary" lang="en">Opening your workspace...</span>
      </p>
      <a class="return-link" href="${portalOrigin}/">
        <span aria-hidden="true">←</span>
        <span class="return-copy"><span>Trở lại tài khoản</span><span lang="en">Return to account</span></span>
      </a>
    </section>
  </main>
  <footer>RAI² FIRST OS</footer>
  <script src="${SCRIPT}" defer></script>
</body>
</html>`;
}

export interface Rai2HandoffDeps {
  env: NodeJS.ProcessEnv;
  sessions: Pick<SessionRegistry, "issue">;
  cookieName: string;
  allow(): SignInAllowList;
  fetchImpl?: typeof fetch;
}

export async function rai2HandoffRoute(deps: Rai2HandoffDeps, req: IncomingMessage, res: ServerResponse,
  path: string, method: string): Promise<boolean> {
  if (path !== CLAIM && path !== SCRIPT) return false;
  const { env } = deps;
  const slug = env.OMB_SIGNIN_TENANT_SLUG ?? "";
  const domain = env.OMB_SIGNIN_TENANT_DOMAIN ?? "";
  const token = env.OMB_SIGNIN_TENANT_TOKEN ?? "";
  let portal: URL;
  let publicUrl: URL;
  try {
    portal = new URL(env.OMB_SIGNIN_TENANT_URL ?? "");
    publicUrl = new URL(env.OMB_PUBLIC_URL ?? "");
  } catch {
    json(res, 503, { error: "workspace sign-in unavailable" });
    return true;
  }
  if (env.OMB_RAI2_TENANT !== "1" || portal.protocol !== "https:" || portal.origin !== env.OMB_SIGNIN_TENANT_URL ||
    publicUrl.protocol !== "https:" || publicUrl.origin !== env.OMB_PUBLIC_URL ||
    !/^u-[a-f0-9]{20}$/.test(slug) || !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) ||
    !publicUrl.hostname.endsWith(`.${domain}`) || publicUrl.hostname.slice(0, -(domain.length + 1)).includes(".") ||
    !CODE.test(token)) {
    json(res, 503, { error: "workspace sign-in unavailable" });
    return true;
  }
  if (req.headers.host !== publicUrl.host) {
    json(res, 421, { error: "wrong workspace host" });
    return true;
  }
  if (path === SCRIPT && method === "GET") {
    res.writeHead(200, { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store",
      "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" });
    res.end(script);
    return true;
  }
  if (path === CLAIM && method === "GET") {
    const theme = /(?:^|;\s*)rai2_theme=(light|dark)(?:;|$)/.exec(String(req.headers.cookie ?? ""))?.[1] === "dark"
      ? "dark" : "light";
    const html = handoffPage(portal.origin, theme);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store",
      "content-security-policy": "default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
      "x-content-type-options": "nosniff", "referrer-policy": "no-referrer" });
    res.end(html);
    return true;
  }
  if (path !== CLAIM || method !== "POST") {
    json(res, 405, { error: "method not allowed" });
    return true;
  }
  if (req.headers.origin !== publicUrl.origin || !/^application\/json(?:\s*;|$)/i.test(String(req.headers["content-type"] ?? ""))) {
    json(res, 403, { error: "same-origin JSON required" });
    return true;
  }
  const body = await readBody(req);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!CODE.test(code)) {
    json(res, 400, { error: "invalid handoff" });
    return true;
  }
  let email: string;
  try {
    const response = await (deps.fetchImpl ?? fetch)(new URL("/api/tenant-auth/consume", portal), {
      method: "POST", redirect: "error", signal: AbortSignal.timeout(5_000),
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ slug, code }),
    });
    if (!response.ok) throw new Error("handoff refused");
    const payload: unknown = await response.json();
    email = typeof payload === "object" && payload !== null && typeof Reflect.get(payload, "email") === "string"
      ? Reflect.get(payload, "email") as string : "";
  } catch {
    json(res, 401, { error: "handoff expired or unavailable" });
    return true;
  }
  const scopes = allowedScopes(email, deps.allow());
  if (!scopes) {
    json(res, 403, { error: "workspace access denied" });
    return true;
  }
  const issued = deps.sessions.issue({ label: labelFromUserAgent(req.headers["user-agent"]),
    scopes, userId: `tenant:${slug}:${email}`, email });
  res.setHeader("set-cookie", serializeSessionCookie(deps.cookieName, issued.token, { secure: true, maxAgeSeconds: cookieMaxAgeSeconds(issued.session) }));
  json(res, 200, { ok: true });
  return true;
}
