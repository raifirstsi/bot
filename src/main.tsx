import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  previewBrowserSignIn, readSessionState, takeBrowserSignInFromLocation, takePairingCodeFromLocation, takeInvitedEmailFromLocation,
} from "./lib/session";
import { bootstrapBrand, productName } from "./lib/brand";
import { t } from "./lib/i18n";
import { loadPageLanguage } from "./lib/language-preference";
import { applySkinChoice, readSkinChoice } from "./lib/skins";
import { applyChatWidth, readChatWidth } from "./lib/chat-width";
import { applyFont, readFont } from "./lib/fonts";
import { applySoftwareRendering } from "./lib/software-rendering";
import { settleInterfaceMode } from "./lib/new-look";
import { RaiLandingPage } from "./components/landing/RaiLandingPage";
import { PageBoundary } from "./components/PageBoundary";
import { endedBeforeReload, forgetEndedSession } from "./lib/session-ended";
import "./styles.css";

// Before first paint; settleInterfaceMode must run before applySkin writes omb-skin.
settleInterfaceMode();
applySkinChoice(readSkinChoice());
applyFont(readFont());
applySoftwareRendering();
applyChatWidth(readChatWidth());
const pageLanguage = loadPageLanguage();

// The app is its own chunk, so these pages don't parse it. Everywhere else its fetch starts now, alongside the session
// read, instead of after it. A failed fetch renders as a throw, so PageBoundary offers a reload.
const PAGES_WITHOUT_THE_APP = new Set(["/", "/home", "/pair", "/desktop-viewer"]);
const loadApp = () => import("./App").catch((error: unknown) => ({ default: (): never => { throw error; } }));
const appPage = PAGES_WITHOUT_THE_APP.has(location.pathname) ? null : loadApp();

async function chooseRoot(): Promise<React.ReactNode> {
  const home = window.ogb?.home;
  if (location.pathname === "/home" && home) {
    const { HomeScreen } = await import("./components/HomeScreen");
    return <HomeScreen bridge={home} manage={window.ogb?.cloudPlan?.manage} />;
  }
  if (location.pathname === "/pair") {
    const { PairPage } = await import("./pair/PairPage");
    const signIn = takeBrowserSignInFromLocation();
    if (signIn) {
      const { BrowserSignInPage } = await import("./pair/BrowserSignInPage");
      const preview = await previewBrowserSignIn(signIn);
      await pageLanguage;
      return preview ? <BrowserSignInPage credential={signIn} owner={preview.owner} /> : <PairPage initialCode={null} reason={t("pair.browser.signInFailed")} />;
    }
    return <PairPage initialCode={takePairingCodeFromLocation()} initialEmail={takeInvitedEmailFromLocation()} />;
  }
  if ((location.pathname === "/" || location.pathname === "") && !location.search.includes("app=1")) {
    return <RaiLandingPage onAdminSignIn={() => { location.href = "/pair"; }} />;
  }
  const session = await readSessionState();
  if (session.kind === "unauthenticated") {
    await pageLanguage;
    if (location.pathname === "/pair" || location.search.includes("code=") || location.hash.includes("code=")) {
      const { PairPage } = await import("./pair/PairPage");
      const pair = <PairPage initialCode={takePairingCodeFromLocation()} reason={endedBeforeReload() ? t("pair.sessionEnded") : session.error} />;
      if (home) {
        const { SignedOutAtHome } = await import("./components/HomeScreen");
        return <SignedOutAtHome bridge={home} fallback={pair} />;
      }
      return pair;
    }
    return <RaiLandingPage onAdminSignIn={() => { location.href = "/pair"; }} />;
  }
  forgetEndedSession();
  if (session.kind === "loopback" && session.trust === "service") {
    await pageLanguage;
    const { PairPage } = await import("./pair/PairPage");
    return <PairPage initialCode={null} reason={t("pair.serviceTrust")} />;
  }
  if (location.pathname === "/desktop-viewer") {
    const { DesktopViewer } = await import("./components/DesktopViewer");
    return <DesktopViewer />;
  }
  const { default: App } = await (appPage ?? loadApp());
  return <App />;
}

// The window is named before the brand file is asked for: the answer only ever renames it.
document.title = productName();

const isLanding = (location.pathname === "/" || location.pathname === "") && !location.search.includes("app=1");

if (isLanding) {
  // Ultra-fast path: render landing page instantly without blocking on brand or locale downloads
  void bootstrapBrand();
  void pageLanguage;
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <PageBoundary>
        <RaiLandingPage onAdminSignIn={() => { location.href = "/pair"; }} />
      </PageBoundary>
    </StrictMode>
  );
} else {
  void Promise.all([bootstrapBrand(), chooseRoot(), pageLanguage]).then(([, root]) => {
    createRoot(document.getElementById("root")!).render(<StrictMode><PageBoundary>{root}</PageBoundary></StrictMode>);
  });
}
