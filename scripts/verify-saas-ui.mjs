import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";
import { createSaasServer } from "../saas/server.ts";
import { SaasStore } from "../saas/store.ts";

const output = process.argv[2];
if (!output || !isAbsolute(output)) throw new Error("Pass an absolute screenshot directory");
mkdirSync(output, { recursive: true });

async function freePort() {
  const socket = createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const address = socket.address();
  if (!address || typeof address === "string") throw new Error("no port");
  await new Promise((resolve) => socket.close(resolve));
  return address.port;
}

const scratch = mkdtempSync(join(tmpdir(), "rai2-ui-"));
const appPort = await freePort();
const debugPort = await freePort();
const origin = `http://127.0.0.1:${appPort}`;
const store = new SaasStore(join(scratch, "saas.db"));
const now = Date.UTC(2026, 10, 12, 9);
const token = randomBytes(32).toString("base64url");
const account = store.createSession("owner@example.test", createHash("sha256").update(token).digest("hex"), now);
const routedHosts = [];
const config = { publicOrigin: origin, tenantDomain: "rai2.test", bankAccount: "1234567890", bankName: "MBBank",
  sepayApiKey: "s".repeat(32), otpPepper: "p".repeat(32), tenantSigningKey: "t".repeat(32) };
const server = createSaasServer({
  store, now: () => now, mailer: { sendCode: async () => {} },
  onWorkspaceHandle: async (slug, host, legacyHosts) => { routedHosts.push({ slug, host, legacyHosts }); },
  config,
});
await new Promise((resolve) => server.listen(appPort, "127.0.0.1", resolve));

const chromePath = process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : process.env.CHROME_PATH || "google-chrome";
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", "--remote-allow-origins=*",
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${join(scratch, "chrome")}`, origin,
], { stdio: "ignore" });

let socket;
let previewServer;
try {
  let page;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline && !page) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json`);
      const tabs = await response.json();
      page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(origin));
    } catch {}
    if (!page) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(page?.webSocketDebuggerUrl, "Chrome did not open the fixture page");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const pending = new Map();
  let id = 0;
  socket.onmessage = (event) => {
    const packet = JSON.parse(event.data);
    if (!packet.id) return;
    const call = pending.get(packet.id);
    pending.delete(packet.id);
    if (packet.error) call.reject(new Error(packet.error.message));
    else call.resolve(packet.result);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const callId = ++id;
    pending.set(callId, { resolve, reject });
    socket.send(JSON.stringify({ id: callId, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  const waitFor = async (expression) => {
    const until = Date.now() + 8_000;
    while (Date.now() < until) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`UI did not reach ${expression}`);
  };
  const capture = async (name, full = false) => {
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
    writeFileSync(join(output, name), Buffer.from(result.data, "base64"));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: origin });
  await waitFor("document.getElementById('signin')?.hidden === false");
  await waitFor("document.querySelector('.brand img')?.complete === true");
  assert((await evaluate("document.querySelector('.brand img').naturalWidth")) > 0, "RAI2 logo did not render");
  assert.equal(await evaluate("[...document.querySelectorAll('.brand img')].filter((image) => getComputedStyle(image).display !== 'none').length"), 1);
  assert.equal(await evaluate("getComputedStyle(document.getElementById('language')).display"), "none");
  await evaluate("document.getElementById('language').value = 'vi'; document.getElementById('language').dispatchEvent(new Event('change'))");
  assert.equal(await evaluate("document.documentElement.lang"), "vi");
  assert.equal(await evaluate("document.documentElement.dataset.theme"), "dark");
  assert.equal(await evaluate("document.querySelector('h1').textContent"), "Không gian RAI² của bạn");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontSize"), "48px");
  assert.equal(await evaluate("document.querySelector('.header-inner').getBoundingClientRect().height"), 64);
  await capture("signin-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await waitFor("document.documentElement.clientWidth === 390");
  await capture("signin-mobile.png");
  await evaluate("document.getElementById('language').value = 'en'; document.getElementById('language').dispatchEvent(new Event('change'))");
  assert.equal(await evaluate("document.documentElement.lang"), "en");
  assert.equal(await evaluate("document.querySelector('h1').textContent"), "Your RAI² workspace");
  assert.equal(await evaluate("document.getElementById('email').placeholder"), "you@example.com");
  assert((await evaluate("document.body.scrollWidth")) <= 390, "English sign-in overflows mobile viewport");
  await capture("signin-mobile-en.png");

  await send("Network.setCookie", { name: "rai2_session", value: token, url: origin, httpOnly: true, sameSite: "Lax" });
  await send("Page.navigate", { url: origin });
  await waitFor("document.getElementById('account')?.hidden === false");
  assert.equal(await evaluate("document.documentElement.lang"), "en");
  assert.equal(await evaluate("document.getElementById('account-status').textContent"), "Unpaid");
  assert((await evaluate("document.body.scrollWidth")) <= 390, "account view overflows mobile viewport");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontSize"), "34px");
  await capture("account-mobile.png");
  await evaluate("document.getElementById('language').value = 'vi'; document.getElementById('language').dispatchEvent(new Event('change'))");
  assert.equal(await evaluate("document.getElementById('account-status').textContent"), "Chưa thanh toán");
  await capture("account-mobile-vi.png");
  await evaluate("document.getElementById('order-button').click()");
  await waitFor("document.getElementById('payment')?.hidden === false");
  await waitFor("document.getElementById('payment-qr')?.naturalWidth > 0");
  assert((await evaluate("document.body.scrollWidth")) <= 390, "payment view overflows mobile viewport");
  await capture("payment-mobile.png", true);
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await capture("payment-desktop.png");

  const order = store.createOrder(account.id, now);
  assert.equal(store.recordPayment(order.code, "sepay:fixture-1", order.amount, now), "paid");
  store.setWorkspaceState(account.id, "active");
  await send("Page.navigate", { url: origin });
  await waitFor("document.getElementById('workspace-row')?.hidden === false");
  assert.equal(await evaluate("new URL(document.getElementById('workspace-link').href).pathname"), "/api/workspace/open");
  assert.equal(await evaluate("document.getElementById('workspace-address').textContent"), `${account.slug}.rai2.test`);
  assert.equal(await evaluate("document.getElementById('workspace-handle-form').hidden"), true);
  await evaluate("account.workspaceHandle = 'undefined'; renderAccount()");
  assert.equal(await evaluate("document.getElementById('workspace-handle').value"), "");
  await evaluate("account.workspaceHandle = null; renderAccount()");
  assert.equal(await evaluate("document.getElementById('workspace-handle-save').disabled"), true);
  await evaluate("document.getElementById('workspace-handle-edit').click()");
  assert.equal(await evaluate("document.getElementById('workspace-handle-form').hidden"), false);
  assert.equal(await evaluate("document.getElementById('workspace-handle-edit').hidden"), true);
  assert.equal(await evaluate("document.getElementById('workspace-handle-edit').getAttribute('aria-expanded')"), "true");
  await evaluate("document.getElementById('workspace-handle').value = 'Công ty An Phát'; document.getElementById('workspace-handle').dispatchEvent(new Event('input'))");
  assert.equal(await evaluate("document.getElementById('workspace-handle-save').disabled"), false);
  await capture("workspace-editor-desktop.png");
  await evaluate("document.getElementById('workspace-handle-form').requestSubmit()");
  await waitFor("document.getElementById('workspace-handle-message').textContent.includes('Đã cập nhật')");
  assert.deepEqual(routedHosts, [{ slug: account.slug, host: "cong-ty-an-phat.rai2.test", legacyHosts: [] }]);
  assert.equal(await evaluate("document.getElementById('workspace-address').textContent"), "cong-ty-an-phat.rai2.test");
  assert.equal(await evaluate("document.getElementById('workspace-handle').value"), "cong-ty-an-phat");
  assert.equal(await evaluate("document.getElementById('workspace-handle-form').hidden"), true);
  assert.equal(await evaluate("document.getElementById('workspace-handle-edit').hidden"), false);
  assert.equal(await evaluate("document.getElementById('workspace-handle-edit').getAttribute('aria-expanded')"), "false");
  await capture("workspace-desktop.png");
  await waitFor("document.documentElement.dataset.theme === 'dark'");
  assert.equal(await evaluate("getComputedStyle(document.body).backgroundColor"), "rgb(8, 8, 8)");
  assert.equal(await evaluate("[...document.querySelectorAll('.brand img')].filter((image) => getComputedStyle(image).display !== 'none').length"), 1);
  await capture("workspace-desktop-dark.png");
  await evaluate("document.getElementById('theme-toggle').click()");
  await waitFor("document.documentElement.dataset.theme === 'light'");

  const trialToken = randomBytes(32).toString("base64url");
  const trialAccount = store.createSession("trial@example.test",
    createHash("sha256").update(trialToken).digest("hex"), now, { maxWorkspaces: 2 });
  store.setWorkspaceState(trialAccount.id, "active");
  await send("Network.setCookie", { name: "rai2_session", value: trialToken, url: origin, httpOnly: true, sameSite: "Lax" });
  await send("Page.navigate", { url: origin });
  await waitFor("document.getElementById('workspace-row')?.hidden === false");
  assert.equal(await evaluate("document.getElementById('account-status').textContent"), "Đang dùng thử");
  assert.equal(await evaluate("document.getElementById('trial-through').hidden"), false);
  assert.equal(await evaluate("document.getElementById('order-button').hidden"), true);
  await capture("trial-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert((await evaluate("document.body.scrollWidth")) <= 390, "trial overflows mobile viewport");
  assert((await evaluate("document.getElementById('workspace-link').getBoundingClientRect().height")) >= 44,
    "mobile workspace action is too short");
  await evaluate("document.getElementById('workspace-handle-edit').click()");
  assert((await evaluate("document.getElementById('workspace-handle-form').getBoundingClientRect().right")) <= 390,
    "workspace address form overflows mobile viewport");
  assert((await evaluate("document.getElementById('workspace-handle-save').getBoundingClientRect().height")) >= 40,
    "mobile workspace save action is too short");
  await capture("trial-mobile.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 720, deviceScaleFactor: 1, mobile: true });
  assert((await evaluate("document.body.scrollWidth")) <= 320, "trial overflows compact viewport");
  assert.equal(await evaluate("document.querySelector('.header-actions').getBoundingClientRect().right <= window.innerWidth"), true);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('h1')).fontSize"), "30px");
  await capture("trial-compact.png");
  await evaluate("document.getElementById('workspace-handle-cancel').click()");
  assert.equal(await evaluate("document.getElementById('workspace-handle-form').hidden"), true);

  const previewPort = await freePort();
  const previewOrigin = `http://127.0.0.1:${previewPort}`;
  const previewToken = randomBytes(32).toString("base64url");
  store.createSession("preview@example.test", createHash("sha256").update(previewToken).digest("hex"), now);
  previewServer = createSaasServer({ store, now: () => now, mailer: { sendCode: async () => {} },
    config: { ...config, publicOrigin: previewOrigin }, paymentsEnabled: false, previewEmail: "preview@example.test" });
  await new Promise((resolve) => previewServer.listen(previewPort, "127.0.0.1", resolve));
  await send("Network.setCookie", { name: "rai2_session", value: previewToken, url: previewOrigin, httpOnly: true, sameSite: "Lax" });
  await send("Page.navigate", { url: previewOrigin });
  await waitFor("document.getElementById('account')?.hidden === false");
  await waitFor("document.getElementById('preview-note')?.hidden === false");
  assert.equal(await evaluate("document.getElementById('order-button').hidden"), true);
  assert.equal(await evaluate("document.getElementById('payment').hidden"), true);
  assert.equal(await evaluate("document.querySelector('[data-i18n=planName]').textContent"), "RAI² BYOK plan");
  assert.equal(await evaluate("document.getElementById('account-status').classList.contains('unpaid')"), true);
  await capture("preview-desktop.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  assert((await evaluate("document.body.scrollWidth")) <= 390, "preview overflows mobile viewport");
  await capture("preview-mobile.png");
  await send("Network.setCookie", { name: "rai2_theme", value: "light", url: previewOrigin, sameSite: "Lax" });
  await send("Page.navigate", { url: previewOrigin });
  await waitFor("document.documentElement.dataset.theme === 'light'");
  await waitFor("document.querySelector('.brand-light')?.complete === true");
  assert((await evaluate("document.querySelector('.brand-light').naturalWidth")) > 0, "light logo did not load");
  assert.equal(await evaluate("getComputedStyle(document.body).backgroundColor"), "rgb(248, 250, 253)");
  await capture("signin-mobile-light.png");
  console.log(`RAI2 portal UI checked in Vietnamese and English at 1440x900 and 390x844: ${output}`);
} finally {
  socket?.close();
  const chromeExit = chrome.exitCode === null
    ? new Promise((resolve) => chrome.once("exit", resolve))
    : Promise.resolve();
  if (chrome.exitCode === null && process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
  } else if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
  }
  chrome.unref();
  await Promise.race([chromeExit, new Promise((resolve) => setTimeout(resolve, 3_000))]);
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  if (previewServer) {
    previewServer.closeAllConnections();
    await new Promise((resolve) => previewServer.close(resolve));
  }
  store.close();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      rmSync(scratch, { recursive: true, force: true });
      break;
    } catch {
      if (attempt === 19) console.warn(`Chrome profile remains for later cleanup: ${scratch}`);
      else await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}
