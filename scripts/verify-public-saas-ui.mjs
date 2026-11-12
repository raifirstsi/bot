import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

const origin = process.env.RAI2_UI_ORIGIN ?? "https://app.rai2.si";
const landing = process.env.RAI2_UI_LANDING === "1";
const chromePath = process.platform === "win32"
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : process.env.CHROME_PATH || "google-chrome";
const scratch = mkdtempSync(join(tmpdir(), "rai2-public-ui-"));
const output = process.argv[2];
if (!output || !isAbsolute(output)) throw new Error("Pass an absolute screenshot directory");
mkdirSync(output, { recursive: true });

const listener = createServer();
await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
const address = listener.address();
assert(address && typeof address !== "string");
await new Promise((resolve) => listener.close(resolve));
const chrome = spawn(chromePath, [
  "--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--remote-debugging-port=${address.port}`, "--remote-allow-origins=*",
  `--user-data-dir=${join(scratch, "chrome")}`, origin,
], { stdio: "ignore" });

let socket;
try {
  let page;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline && !page) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${address.port}/json`)).json();
      page = tabs.find((tab) => tab.type === "page" && tab.url.startsWith(origin));
    } catch {}
    if (!page) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert(page?.webSocketDebuggerUrl, "Chrome did not open the public portal");
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
  const evaluate = async (expression) => (await send("Runtime.evaluate", {
    expression, returnByValue: true, awaitPromise: true,
  })).result.value;
  const waitFor = async (expression) => {
    const until = Date.now() + 10_000;
    while (Date.now() < until) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error(`UI did not reach ${expression}`);
  };
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844], ["compact", 320, 720]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: origin });
    if (landing) {
      await waitFor("document.querySelectorAll('.team-card img').length === 8");
      await waitFor("[...document.images].every(image => image.complete)");
      assert.equal(await evaluate("[...document.images].every(image => image.naturalWidth > 0)"), true);
      assert.equal(await evaluate("document.querySelectorAll('.team-card').length"), 8);
      assert.equal(await evaluate("document.querySelector('.hero-actions .button').href"), "https://app.rai2.si/");
      assert.equal(await evaluate("document.querySelectorAll('.metrics > div').length"), 4);
      assert.deepEqual(await evaluate("[...document.querySelectorAll('.desktop-nav a')].map(link => link.textContent.trim())"),
        ["Triết lý", "Nhân sự số", "Hệ thống", "Bảng giá"]);
      assert.equal(await evaluate("document.querySelectorAll('nav a[href=\"#cam-ket\"]').length"), 0);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-toggle')).borderTopStyle"), "none");
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.theme-toggle')).backgroundColor"), "rgba(0, 0, 0, 0)");
      assert((await evaluate("document.querySelector('.theme-toggle').getBoundingClientRect().width")) <= 32,
        `${name} theme toggle is not compact`);
    } else {
      await waitFor("document.getElementById('signin')?.hidden === false");
      await waitFor("document.getElementById('preview-note')?.hidden === true");
      await waitFor("document.querySelector('.brand img')?.complete === true");
      assert((await evaluate("document.querySelector('.brand img').naturalWidth")) > 0, "account logo did not load");
      assert((await evaluate("document.querySelector('.brand img').getBoundingClientRect().width")) > 0, "account logo has no width");
    }
    assert.equal(await evaluate("window.innerWidth"), width);
    assert((await evaluate("document.body.scrollWidth")) <= await evaluate("document.documentElement.clientWidth"), `${name} has horizontal overflow`);
    if (landing) {
      assert.equal(await evaluate("document.querySelector('.header-signup').getBoundingClientRect().right <= window.innerWidth"), true);
      assert.equal(await evaluate("document.querySelector('.header-signup').textContent.trim()"), "Workspace");
      const logoWidth = await evaluate("document.querySelector('.logo-link').getBoundingClientRect().width");
      assert(name === "desktop" ? logoWidth === 60 : logoWidth >= 50 && logoWidth <= 54,
        `${name} logo width is not balanced: ${logoWidth}px`);
      assert.equal(await evaluate("new URL(document.querySelector('link[rel=\"icon\"]').href).pathname"), "/assets/rai-backend-favicon.png");
      assert.equal(await evaluate("fetch('/assets/rai-backend-favicon.png').then(response => response.status)"), 200);
      assert.equal(await evaluate("getComputedStyle(document.querySelector('.mobile-menu-toggle')).display !== 'none'"), width <= 960);
      assert.equal(await evaluate("document.querySelector('h1').getBoundingClientRect().right <= window.innerWidth"), true);
      if (width < 600) {
        await evaluate("document.querySelector('.mobile-menu-toggle').click()");
        assert.equal(await evaluate("document.querySelector('.mobile-dialog').open"), true);
        assert.equal(await evaluate("document.querySelector('.mobile-dialog').getBoundingClientRect().right <= window.innerWidth"), true);
        assert.equal(await evaluate("document.querySelector('.mobile-dialog-actions a:last-child').href"), "https://app.rai2.si/");
        assert.deepEqual(await evaluate("[...document.querySelectorAll('.mobile-dialog nav > a')].map(link => link.childNodes[0].textContent.trim())"),
          ["Triết lý", "Nhân sự số", "Hệ thống", "Bảng giá"]);
        await evaluate("document.querySelector('.mobile-dialog-close').click()");
        await waitFor("!document.querySelector('.mobile-dialog').open");
      }
    } else {
      const languageHidden = await evaluate("document.getElementById('language').hidden");
      if (languageHidden) {
        assert.equal(await evaluate("getComputedStyle(document.getElementById('language')).display"), "none");
      } else {
        assert.equal(await evaluate("document.getElementById('language').getBoundingClientRect().right <= innerWidth"), true);
      }
    }
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    writeFileSync(join(output, `${landing ? "landing" : "account"}-${name}.png`), Buffer.from(result.data, "base64"));
    if (landing && width < 600) {
      const teamTop = await evaluate("document.querySelector('#team .section-kicker').getBoundingClientRect().top");
      assert(teamTop < height - 4, `team heading starts below the ${name} viewport: ${teamTop}px`);
    }
    if (landing && name === "mobile") {
      const full = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
      writeFileSync(join(output, "landing-mobile-full.png"), Buffer.from(full.data, "base64"));
      const before = await evaluate("document.documentElement.dataset.theme");
      await evaluate("document.querySelector('.theme-toggle').click()");
      assert.notEqual(await evaluate("document.documentElement.dataset.theme"), before);
      if (await evaluate("document.documentElement.dataset.theme") === "dark") {
        await evaluate("document.querySelector('.theme-toggle').click()");
      }
      assert.equal(await evaluate("document.documentElement.dataset.theme"), "light");
      assert.equal(await evaluate("[...document.images].filter(image => getComputedStyle(image).display !== 'none').every(image => image.naturalWidth > 0)"), true);
      const light = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      writeFileSync(join(output, "landing-mobile-light.png"), Buffer.from(light.data, "base64"));
    }
  }
  if (landing && origin === "https://rai2.si") {
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await send("Page.navigate", { url: "https://app.rai2.si/" });
    await waitFor("document.querySelector('#signin')?.hidden === false");
    await waitFor("document.documentElement.dataset.theme === 'light'");
    await waitFor("document.querySelector('.brand-light')?.naturalWidth > 0");
    assert.equal(await evaluate("getComputedStyle(document.body).backgroundColor"), "rgb(248, 249, 250)");
    const handoff = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    writeFileSync(join(output, "theme-handoff-light.png"), Buffer.from(handoff.data, "base64"));
    await evaluate("document.querySelector('#theme-toggle').click()");
    assert.equal(await evaluate("document.documentElement.dataset.theme"), "dark");
    await send("Page.navigate", { url: origin });
    await waitFor("document.documentElement.dataset.theme === 'dark'");
  }
  console.log(`RAI2 ${landing ? "landing" : "account"} verified at 1440x900, 390x844 and 320x720: ${output}`);
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    chrome.kill("SIGTERM");
    await new Promise((resolve) => chrome.once("exit", resolve));
  }
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
