import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = process.env.RAI2_STATIC_DIR ?? join(root, "dist-saas", "public");
if (!isAbsolute(site)) throw new Error("RAI2_STATIC_DIR must be absolute");
const output = process.argv[2];
if (!output || !isAbsolute(output)) throw new Error("Pass an absolute screenshot directory");
mkdirSync(output, { recursive: true });
const contentType = (path) => path.endsWith(".css") ? "text/css" : path.endsWith(".js") ? "text/javascript"
  : path.endsWith(".woff2") ? "font/woff2"
  : path.endsWith(".svg") ? "image/svg+xml" : path.endsWith(".ico") ? "image/x-icon"
    : path.endsWith(".png") ? "image/png" : "text/html";
const app = createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const file = resolve(site, pathname === "/" ? "landing.html" : pathname.slice(1));
  if (!file.startsWith(`${site}${sep}`)) { res.writeHead(404).end(); return; }
  try {
    res.writeHead(200, { "content-type": contentType(file), "cache-control": "no-store" });
    res.end(readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise((done) => app.listen(0, "127.0.0.1", done));
const appAddress = app.address();
if (!appAddress || typeof appAddress === "string") throw new Error("fixture did not listen");
const origin = process.env.RAI2_UI_ORIGIN ?? `http://127.0.0.1:${appAddress.port}`;
const chromePort = createServer();
await new Promise((done) => chromePort.listen(0, "127.0.0.1", done));
const portAddress = chromePort.address();
if (!portAddress || typeof portAddress === "string") throw new Error("no Chrome port");
await new Promise((done) => chromePort.close(done));
const scratch = mkdtempSync(join(tmpdir(), "rai2-mobile-"));
const chrome = spawn(process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : process.env.CHROME_PATH || "google-chrome", ["--headless=new", "--disable-gpu", "--no-first-run",
    `--remote-debugging-port=${portAddress.port}`, "--remote-allow-origins=*",
    `--user-data-dir=${join(scratch, "chrome")}`, origin], { stdio: "ignore" });
let socket;
try {
  let page;
  const deadline = Date.now() + 20_000;
  while (!page && Date.now() < deadline) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${portAddress.port}/json`)).json();
      page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(origin));
    } catch {}
    if (!page) await new Promise((done) => setTimeout(done, 150));
  }
  assert(page?.webSocketDebuggerUrl, "Chrome did not open fixture");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  const pending = new Map();
  let callId = 0;
  socket.onmessage = (event) => {
    const reply = JSON.parse(event.data);
    if (!reply.id) return;
    const call = pending.get(reply.id);
    pending.delete(reply.id);
    if (reply.error) call.reject(new Error(reply.error.message));
    else call.resolve(reply.result);
  };
  const send = (method, params = {}) => new Promise((done, fail) => {
    const id = ++callId;
    pending.set(id, { resolve: done, reject: fail });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true,
  })).result.value;
  const waitFor = async (expression) => {
    const until = Date.now() + 8_000;
    while (Date.now() < until) {
      if (await evaluate(expression)) return;
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error(`UI did not reach ${expression}`);
  };
  const capture = async (name, full = false) => {
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: full });
    writeFileSync(join(output, name), Buffer.from(result.data, "base64"));
  };
  await send("Page.enable");
  await send("Runtime.enable");
  for (const [width, height] of [[1440, 900], [1024, 768], [768, 900], [390, 844], [360, 740], [320, 720]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width <= 960 });
    await send("Page.navigate", { url: origin });
    await waitFor("document.readyState === 'complete' && [...document.images].every(image => image.complete)");
    await waitFor("document.fonts.check('450 32px \\\"Geist Variable\\\"')");
    assert.equal(await evaluate("getComputedStyle(document.body).fontFamily.startsWith('\\\"Geist Variable\\\"')"), true);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero-question')).fontWeight"), "450");
    const fontResources = await evaluate("[...performance.getEntriesByType('resource')].map(entry => new URL(entry.name).pathname).filter(path => path.includes('/assets/fonts/'))");
    assert(fontResources.includes("/assets/fonts/geist-latin-wght-normal.woff2"));
    assert(fontResources.includes("/assets/fonts/geist-vietnamese-wght-normal.woff2"));
    assert.equal(await evaluate("[...document.images].every(image => image.naturalWidth > 0)"), true);
    assert.equal(await evaluate("document.documentElement.scrollWidth <= innerWidth"), true, `overflow at ${width}px`);
    assert.equal(await evaluate("document.querySelector('.hero-question').textContent.replace(/\\s+/g, ' ').trim()"),
      "Nếu hôm nay Tôi xây lại doanh nghiệp từ đầu, với năng lực AI đang có, Tôi có thiết kế bộ máy công ty theo cách cũ hay không?");
    assert.equal(await evaluate("document.querySelectorAll('.hero-question .headline-badge').length"), 1);
    assert.equal(await evaluate("document.querySelector('.guarantee-action .button').textContent.replace(/\\s+/g, ' ').trim()"),
      "Trải nghiệm miễn phí");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-toggle')).borderTopWidth"), "0px");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-icon-moon')).display !== 'none'"), true);
    assert.equal(await evaluate("[...document.querySelectorAll('a')].some(link => /[↗→]/u.test(link.textContent))"), false);
    assert.equal(await evaluate("[...document.querySelectorAll('.team-card, .plan, .feature-grid article, .metrics > div')].every(item => item.scrollWidth <= item.clientWidth + 1)"),
      true, `content clipped at ${width}px`);
    const header = await evaluate(`(() => { const actions=document.querySelector('.header-actions');
      const mark=document.querySelector('.logo-link');
      return { logo: mark.getBoundingClientRect().width, markRight:mark.getBoundingClientRect().right,
        actionsLeft:actions.getBoundingClientRect().left, actionsRight:actions.getBoundingClientRect().right }; })()`);
    assert.equal(header.logo, width <= 640 ? 54 : 60);
    assert(header.markRight + 8 <= header.actionsLeft && header.actionsRight <= width, `header overlap at ${width}px`);
    assert.equal(await evaluate("document.querySelector('.header-signup').textContent.trim()"), "Workspace");
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.mobile-menu-toggle')).display !== 'none'"), width <= 960);
    if (width <= 640) {
      const mobileHeader = await evaluate(`(() => {
        const controls=[...document.querySelectorAll('.theme-toggle, .header-signup, .mobile-menu-toggle')];
        return controls.map(control => ({ width:control.getBoundingClientRect().width,
          height:control.getBoundingClientRect().height, clipped:control.scrollWidth > control.clientWidth + 1 }));
      })()`);
      assert(mobileHeader.every((control) => control.height >= 44 && !control.clipped), `mobile header controls at ${width}px`);
      const nextSectionTop = await evaluate("document.querySelector('#team').getBoundingClientRect().top");
      assert(nextSectionTop < height, `next section is outside ${width}px first viewport: ${nextSectionTop}px`);
      const footer = await evaluate(`(() => {
        const nav=document.querySelector('.footer-nav').getBoundingClientRect();
        const links=[...document.querySelectorAll('.footer-nav a')].map(link => link.getBoundingClientRect());
        const workspace=document.querySelector('.footer-workspace').getBoundingClientRect();
        return { navWidth:nav.width, linkHeights:links.map(link => link.height),
          firstWidth:links[0].width, secondWidth:links[1].width, workspaceWidth:workspace.width };
      })()`);
      assert(footer.linkHeights.every((heightValue) => heightValue >= 48), `footer targets at ${width}px`);
      assert(Math.abs(footer.firstWidth - footer.secondWidth) <= 1 && footer.workspaceWidth >= footer.navWidth - 1,
        `footer grid at ${width}px`);
    }
    await capture(`landing-${width}.png`);
    if (width === 390) {
      await capture("landing-390-full.png", true);
      await evaluate("document.querySelector('.theme-toggle').click()");
      assert.equal(await evaluate("document.documentElement.dataset.theme"), "dark");
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-icon-sun')).display !== 'none'"), true);
      assert.equal(await evaluate("document.querySelector('.theme-toggle').getAttribute('aria-label')"), "Bật giao diện sáng");
      await capture("landing-390-dark.png");
      await evaluate("document.querySelector('.theme-toggle').click()");
    }
    if (width <= 960) {
      await evaluate("document.querySelector('.mobile-menu-toggle').click()");
      await waitFor("document.querySelector('.mobile-dialog').open");
      await waitFor("[...document.querySelector('.mobile-dialog').getAnimations({ subtree: true })].every(animation => animation.playState === 'finished')");
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.mobile-dialog nav a'), '::before').content"), "none");
      assert.equal(await evaluate("document.querySelectorAll('.mobile-dialog nav a span').length"), 0);
      assert.equal(await evaluate("document.querySelector('.mobile-dialog-actions .button').textContent.trim()"), "Trải nghiệm miễn phí");
      const menu = await evaluate(`(() => { const box=document.querySelector('.mobile-dialog').getBoundingClientRect();
        return { left:box.left, right:box.right, top:box.top, bottom:box.bottom,
          links:[...document.querySelectorAll('.mobile-dialog nav a')].map(link=>link.getBoundingClientRect().height),
          actions:[...document.querySelectorAll('.mobile-dialog-actions a')].map(link=>link.getBoundingClientRect().height) }; })()`);
      assert(menu.left >= 0 && menu.right <= width && menu.bottom <= height &&
        menu.links.every((value) => value >= 48) && menu.actions.every((value) => value >= 48),
        `menu size at ${width}px`);
      assert.equal(await evaluate("document.querySelector('.mobile-menu-toggle').getAttribute('aria-expanded')"), "true");
      await capture(`menu-${width}.png`);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: 4, y: height - 20, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 4, y: height - 20, button: "left", clickCount: 1 });
      await waitFor("!document.querySelector('.mobile-dialog').open");
      assert.equal(await evaluate("document.body.classList.contains('menu-open')"), false);
      await evaluate("document.querySelector('.mobile-menu-toggle').click()");
      await waitFor("document.querySelector('.mobile-dialog').open");
      await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
      await waitFor("!document.querySelector('.mobile-dialog').open");
      await evaluate("document.querySelector('.mobile-menu-toggle').click()");
      await waitFor("document.querySelector('.mobile-dialog').open");
      await evaluate("document.querySelector('.mobile-dialog nav a[href=\"#team\"]').click()");
      await waitFor("!document.querySelector('.mobile-dialog').open && location.hash === '#team'");
      await waitFor("(() => { const top=document.querySelector('#team').getBoundingClientRect().top; return top>=56 && top<140; })()");
      const teamTop = await evaluate("document.querySelector('#team').getBoundingClientRect().top");
      assert(teamTop >= 56 && teamTop < 140, `section hidden under header at ${width}px: ${teamTop}`);
      if (width === 390) {
        for (const section of ["team", "philosophy", "features", "pricing", "cam-ket"]) {
          await evaluate(`document.getElementById('${section}').scrollIntoView({ behavior: 'instant', block: 'start' })`);
          await capture(`section-${section}-390.png`);
        }
        await evaluate("document.querySelector('.site-footer').scrollIntoView({ behavior: 'instant', block: 'start' })");
        await capture("section-footer-390.png");
      }
    }
  }
  const icon = readFileSync(join(site, "assets", "rai-favicon.ico"));
  assert.equal(icon.readUInt16LE(2), 1);
  assert.equal(icon.readUInt16LE(4), 3);
  assert.deepEqual(
    readFileSync(join(site, "assets", "rai-backend-favicon.png")),
    readFileSync(join(root, "public", "favicon.png")),
  );
  for (const path of ["rai-backend-favicon.png", "rai-favicon.svg", "rai-favicon-32.png", "rai-favicon.ico", "rai-touch-180.png"]) {
    assert.equal((await fetch(`${origin}/assets/${path}`)).status, 200);
  }
  console.log(`RAI2 responsive landing, menu and favicon passed: ${output}`);
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(chrome.pid), "/t", "/f"], { stdio: "ignore" });
    } else {
      chrome.kill("SIGTERM");
      await new Promise((done) => chrome.once("exit", done));
    }
  }
  await new Promise((done) => app.close(done));
  removeScratch();
}

function removeScratch() {
  try {
    rmSync(scratch, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 });
  } catch (error) {
    if (error?.code !== "EBUSY" && error?.code !== "EPERM") throw error;
    console.warn("Chrome released its preview profile late; screenshots and assertions completed");
  }
}
