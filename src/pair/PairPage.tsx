import { useEffect, useState } from "react";
import { RaiLogo } from "../components/RaiLogo";
import { DesktopWorkspaceSwitcher } from "../components/DesktopWorkspaceSwitcher";
import { productName } from "../lib/brand";

import {
  defaultDeviceLabel,
  isConnected,
  newAttemptId,
  pairWithCode,
  readSessionState,
  reasonWorthShowing,
  startEmailSignIn,
  verifyEmailSignIn,
  type EnvironmentDescriptor,
  type SessionState,
} from "../lib/session";
import { pairedDestination } from "../lib/phone-pairing";
import { t } from "../lib/i18n";
import { formatPairingCode, PAIRING_INPUT_PROBLEM_KEY, readPairingInput } from "../../shared/pairing-code";
import { isPrivateHost } from "../../shared/private-host";

const input = "mt-1.5 w-full rounded-xl border border-hairline/60 bg-inset/70 px-3.5 py-2.5 text-[14px] text-ink outline-none transition-all focus:border-[#0099ff] focus:ring-2 focus:ring-[#0099ff]/15";
const buttonPrimary = "w-full rounded-xl bg-[#0099ff] hover:bg-[#0088ee] px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer";
const fieldLabel = "mt-3.5 block text-[12px] font-medium text-ink-secondary";

/** Only the desktop app pairs from a link at once; a browser asks, so a sent link cannot sign it in unseen. */
export function pairsAutomatically(initialCode: string | null, desktop = typeof window !== "undefined" && Boolean(window.ogb?.workspaces)): boolean {
  return Boolean(initialCode) && desktop;
}

export function pairIntro({ mode, sent, email, cloudHome }: { mode: "email" | "code" | null; sent: boolean; email: string; cloudHome: boolean }): string {
  if (mode === "email") return sent ? t("pair.intro.emailSent", { email }) : t("pair.intro.email");
  if (cloudHome) return t("pair.intro.cloud", { app: productName(), open: t("cloudHome.connect"), section: t("settings.section.cloudAccount") });
  return t("pair.intro.code");
}

/** The sentence for a wrong kind of code (an email's sign-in code, an old six-digit code, a script key), else null. */
export function codeProblem(code: string): string | null {
  const read = readPairingInput(code);
  return read.kind === "wrong" && read.problem !== "notACode" ? t(PAIRING_INPUT_PROBLEM_KEY[read.problem]) : null;
}

export function codeReady(code: string): boolean {
  const kind = readPairingInput(code).kind;
  return kind === "code" || kind === "credential";
}

/** The phone app opens this server with the code already filled in. */
export function openInAppLink(origin: string, code: string): string {
  const read = readPairingInput(code);
  const filled = read.kind === "code" ? `&code=${encodeURIComponent(formatPairingCode(read.code))}` : "";
  return `openmausbot://pair?address=${encodeURIComponent(origin)}${filled}`;
}

/** Plain http to the open internet: the session cookie and every chat would cross it readable. */
export function unencryptedPublic(where: { protocol: string; hostname: string }): boolean {
  return where.protocol === "http:" && !isPrivateHost(where.hostname);
}

export function pairTitle(environment: EnvironmentDescriptor | null, mode: "email" | "code" | null): string {
  if (environment?.capabilities.cloudTeam) return environment.label;
  if (environment?.capabilities.cloudHome) return t("pair.myCloud");
  return t(mode === "email" ? "pair.signInTo" : "pair.connectTo", { name: environment?.label ?? t("pair.thisOpenMausBot", { app: productName() }) });
}

export type AuthTab = "register" | "login" | "guest" | "code";

export function PairPage({ initialCode, initialEmail = null, reason }: { initialCode: string | null; initialEmail?: string | null; reason?: string }) {
  const [activeTab, setActiveTab] = useState<AuthTab>(() => {
    if (initialCode) return "code";
    if (initialEmail) return "login";
    return "register";
  });

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regTier, setRegTier] = useState<"trial" | "starter" | "pro" | "team">("trial");

  // Login state
  const [loginEmail, setLoginEmail] = useState(initialEmail ?? "");
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);

  // Pairing code state
  const [code, setCode] = useState(initialCode ?? "");
  const [label, setLabel] = useState(defaultDeviceLabel());

  // App & Environment state
  const [environment, setEnvironment] = useState<EnvironmentDescriptor | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState(() => newAttemptId());
  const [opening, setOpening] = useState(() => pairsAutomatically(initialCode));

  useEffect(() => {
    if (!opening || !initialCode) return;
    let active = true;
    void pairWithCode({ code: initialCode, label, attemptId }).then((result) => {
      if (!active) return;
      if (result.ok) { location.replace(pairedDestination(location.search)); return; }
      setOpening(false);
      setError(result.error);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void fetch("/.well-known/openmausbot/environment")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: EnvironmentDescriptor | null) => {
        setEnvironment(d);
      })
      .catch(() => {
        setEnvironment(null);
      });
    void readSessionState().then(setSession);
  }, []);

  const connected = isConnected(session);
  const cloudHome = environment?.capabilities.cloudHome === true;
  const ownServer = !cloudHome && environment?.capabilities.cloudTeam !== true;
  const problem = codeProblem(code);
  const where = typeof location !== "undefined" && typeof location.protocol === "string" ? location : null;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!regEmail || !regEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ để đăng ký.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/instant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), tier: regTier, name: regName.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Không thể khởi tạo tài khoản lúc này.");
      }
      location.replace(data.redirectUrl || "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký không thành công. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  async function handleInstantLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEmail || !loginEmail.includes("@")) {
      setError("Vui lòng nhập địa chỉ email của bạn.");
      return;
    }

    if (otpMode) {
      setBusy(true);
      setError(null);
      const result = sent ? await verifyEmailSignIn({ email: loginEmail, code: otp, label }) : await startEmailSignIn(loginEmail);
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (sent) {
        location.replace(pairedDestination(location.search));
        return;
      }
      setSent(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/instant-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Không thể đăng nhập tài khoản.");
      }
      location.replace(data.redirectUrl || "/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  function handleCloudGuest() {
    location.assign("https://app.rai2.si/");
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await pairWithCode({ code, label, attemptId });
    setBusy(false);
    if (result.ok) {
      location.replace(pairedDestination(location.search));
      return;
    }
    setError(result.error);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-app px-4 py-8 text-ink">
      <div className="absolute left-3 top-12 max-w-[280px]">
        <DesktopWorkspaceSwitcher />
      </div>

      <div className="w-full max-w-[460px] rounded-3xl border border-hairline/60 bg-panel/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-secondary hover:text-[#0099ff] transition-colors"
          >
            ← Trang chủ RAI²
          </a>
          <a
            href="https://app.rai2.si"
            className="text-[12px] font-medium text-[#0099ff] hover:underline"
          >
            Dùng thử 14 ngày
          </a>
        </div>

        <div className="mb-6 flex flex-col items-center text-center">
          <div className="h-10 w-auto mb-2 flex items-center justify-center">
            <RaiLogo className="h-9 w-auto object-contain" />
          </div>
          <h1 className="text-[19px] sm:text-[21px] font-bold tracking-tight text-ink">
            {activeTab === "register"
              ? "Đăng Ký Tài Khoản Mới"
              : activeTab === "login"
              ? "Đăng Nhập Không Gian Làm Việc"
              : activeTab === "guest"
              ? "Dùng Thử Miễn Phí 14 Ngày"
              : pairTitle(environment, "code")}
          </h1>
          <p className="mt-1 text-[13px] text-ink-secondary leading-snug max-w-[360px]">
            {activeTab === "register"
              ? "Tạo tài khoản và bắt đầu vận hành đội ngũ AI Agent cho doanh nghiệp của bạn."
              : activeTab === "login"
              ? "Nhập email của bạn để vào không gian điều phối AI."
              : activeTab === "guest"
              ? "Xác minh email một lần để mở workspace riêng trong 14 ngày."
              : "Kết nối thiết bị hoặc quản trị viên với mã bảo mật."}
          </p>
        </div>

        {where && unencryptedPublic(where) ? (
          <p role="alert" className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-3.5 py-2 text-[12px] text-warning">
            {t("pair.notEncrypted")}
          </p>
        ) : null}

        {reasonWorthShowing(reason) && !connected ? (
          <p className="mb-4 rounded-xl border border-hairline/40 bg-inset/60 px-3.5 py-2 text-[12px] text-ink-secondary">
            {reasonWorthShowing(reason)}
          </p>
        ) : null}

        {error ? (
          <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[12px] text-danger">
            {error}
          </div>
        ) : null}

        {opening ? (
          <div className="py-8 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-[#0099ff] border-t-transparent mb-3" />
            <p role="status" className="text-[16px] font-medium text-ink">
              {cloudHome ? t("pair.openingCloud") : t("pair.connectingTo", { name: environment?.label ?? t("pair.thisOpenMausBot") })}
            </p>
          </div>
        ) : connected ? (
          <div className="py-6 text-center">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-3 text-xl">
              ✓
            </div>
            <p className="text-[15px] font-medium text-ink">Bạn đã kết nối thành công!</p>
            <a
              href="/app"
              className="mt-4 inline-block rounded-xl bg-[#0099ff] px-6 py-2.5 text-[14px] font-semibold text-white shadow-sm hover:bg-[#0088ee] transition-all"
            >
              Vào ứng dụng ngay →
            </a>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="mb-6 grid grid-cols-4 gap-1 rounded-2xl border border-hairline/60 bg-inset/60 p-1 text-[12px] font-medium">
              <button
                type="button"
                onClick={() => { setActiveTab("register"); setError(null); }}
                className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                  activeTab === "register"
                    ? "bg-panel text-ink shadow-sm font-semibold"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Đăng Ký
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("login"); setError(null); }}
                className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                  activeTab === "login"
                    ? "bg-panel text-ink shadow-sm font-semibold"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Đăng Nhập
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("guest"); setError(null); }}
                className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                  activeTab === "guest"
                    ? "bg-panel text-ink shadow-sm font-semibold"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                14 Ngày
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("code"); setError(null); }}
                className={`rounded-xl py-2 px-1 text-center transition-all cursor-pointer ${
                  activeTab === "code"
                    ? "bg-panel text-ink shadow-sm font-semibold"
                    : "text-ink-secondary hover:text-ink"
                }`}
              >
                Mã Ghép
              </button>
            </div>

            {/* TAB 1: ĐĂNG KÝ TÀI KHOẢN MỚI */}
            {activeTab === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary" htmlFor="reg-email">
                    Email của Bạn hoặc Doanh nghiệp <span className="text-[#0099ff]">*</span>
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ceo@congty.com"
                    autoComplete="email"
                    className={input}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary" htmlFor="reg-name">
                    Tên Doanh nghiệp / Họ tên (Tuỳ chọn)
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="VD: Minh Khang / Công ty CP Công Nghệ ABC"
                    className={input}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary mb-1.5">
                    Gói dịch vụ muốn đăng ký
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "trial", label: "Dùng thử", tag: "14 ngày Free" },
                      { id: "starter", label: "Starter", tag: "299.000đ/tháng" },
                      { id: "pro", label: "Pro", tag: "799.000đ/tháng" },
                      { id: "team", label: "Team", tag: "1.990.000đ/tháng" },
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setRegTier(plan.id as any)}
                        className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
                          regTier === plan.id
                            ? "border-[#0099ff] bg-[#0099ff]/10 ring-1 ring-[#0099ff]"
                            : "border-hairline/60 bg-inset/40 hover:border-hairline"
                        }`}
                      >
                        <div className="text-[12px] font-semibold text-ink">{plan.label}</div>
                        <div className="text-[10px] text-ink-secondary mt-0.5">{plan.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={busy || !regEmail.includes("@")} className={buttonPrimary}>
                    {busy ? "Đang khởi tạo tài khoản..." : "🚀 Đăng Ký & Vào Workspace Ngay"}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setActiveTab("login"); setError(null); }}
                    className="text-[12px] text-ink-secondary hover:text-[#0099ff] transition-colors"
                  >
                    Đã có tài khoản? <span className="font-semibold text-ink underline">Đăng nhập</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: ĐĂNG NHẬP */}
            {activeTab === "login" && (
              <form onSubmit={handleInstantLogin} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary" htmlFor="login-email">
                    Email đã đăng ký <span className="text-[#0099ff]">*</span>
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setSent(false);
                      setOtp("");
                    }}
                    placeholder="ceo@congty.com"
                    autoComplete="email"
                    className={input}
                  />
                </div>

                {otpMode && sent && (
                  <div>
                    <label className={fieldLabel} htmlFor="signin-code">
                      {t("pair.emailCode")}
                    </label>
                    <input
                      id="signin-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="12345678"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className={`${input} font-mono text-[15px] tracking-[0.12em]`}
                    />
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" disabled={busy || !loginEmail.includes("@")} className={buttonPrimary}>
                    {busy
                      ? "Đang đăng nhập..."
                      : otpMode
                      ? sent
                        ? t("pair.signIn")
                        : "Gửi mã đăng nhập OTP"
                      : "🔑 Đăng Nhập Vào Hệ Thống"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 text-[12px] text-ink-secondary">
                  <button
                    type="button"
                    onClick={() => { setActiveTab("register"); setError(null); }}
                    className="hover:text-[#0099ff] transition-colors"
                  >
                    Chưa có tài khoản? <span className="font-semibold text-ink underline">Đăng ký mới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOtpMode(!otpMode); setSent(false); }}
                    className="hover:text-ink underline text-[11px]"
                  >
                    {otpMode ? "Đăng nhập nhanh 1 chạm" : "Đăng nhập bằng mã OTP"}
                  </button>
                </div>
              </form>
            )}

            {activeTab === "guest" && (
              <div className="space-y-4 py-2 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#0099ff]/10 text-2xl">
                  ⚡
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-ink">Dùng Thử RAI² Trong 14 Ngày</h3>
                  <p className="mt-1.5 text-[13px] text-ink-secondary leading-relaxed">
                    Xác minh email tại app.rai2.si để nhận workspace riêng. Không cần thanh toán trước.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCloudGuest}
                    disabled={busy}
                    className={buttonPrimary}
                  >
                    Bắt Đầu Dùng Thử
                  </button>
                </div>

              </div>
            )}

            {/* TAB 4: MÃ GHÉP NỐI & ADMIN CODE */}
            {activeTab === "code" && (
              <form onSubmit={submitCode} className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary" htmlFor="pair-code">
                    {t("pair.code")}
                  </label>
                  <input
                    id="pair-code"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setAttemptId(newAttemptId());
                    }}
                    placeholder="XXXX-XXXX-XXXX"
                    autoComplete="one-time-code"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className={`${input} font-mono text-[14px] tracking-[0.08em]`}
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-ink-secondary" htmlFor="pair-label">
                    {t("pair.deviceLabel")}
                  </label>
                  <input
                    id="pair-label"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    maxLength={80}
                    className={input}
                  />
                </div>

                {problem ? <p role="alert" className="text-[12px] text-danger">{problem}</p> : null}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={busy || !codeReady(code)}
                    className={buttonPrimary}
                  >
                    {busy ? t("pair.connecting") : t("pair.connect")}
                  </button>
                </div>

                {where?.origin ? (
                  <p className="text-center text-[12px] text-ink-secondary pt-1">
                    {t("pair.onPhone")}{" "}
                    <a href={openInAppLink(where.origin, code)} className="text-[#0099ff] underline">
                      {t("pair.openInApp", { app: productName() })}
                    </a>
                  </p>
                ) : null}

                {ownServer ? (
                  <p className="text-center text-[11px] text-ink-secondary">
                    {t("pair.noCode")} <code className="select-all rounded bg-inset px-1.5 py-0.5 text-[11px] text-ink">npx openmausbot pair</code>
                  </p>
                ) : null}
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
