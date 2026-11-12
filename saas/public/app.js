const copy = {
  vi: {
    title: "Tài khoản RAI²", logout: "Đăng xuất", eyebrow: "TÀI KHOẢN",
    heading: "Không gian RAI² của bạn", signinTitle: "Bắt Đầu Với RAI²",
    signinBadge: "14 NGÀY MIỄN PHÍ",
    signinIntro: "Xác minh email để nhận workspace riêng trong 14 ngày. Không cần thanh toán trước.",
    emailLabel: "Email của bạn",
    previewNote: "Bản xem trước riêng · Chưa mở thanh toán",
    sendCode: "Gửi mã xác nhận", emailPlaceholder: "ban@congty.vn", codeLabel: "Mã xác nhận", codePlaceholder: "8 chữ số",
    verify: "Xác nhận", changeEmail: "Đổi email", accountTitle: "Tài khoản",
    workspace: "Workspace", openWorkspace: "Mở workspace", planName: "Gói RAI² BYOK",
    workspaceHandleLabel: "Đường dẫn workspace", workspaceHandlePlaceholder: "cong-ty-an-phat",
    workspaceHandleEdit: "Đổi đường dẫn", workspaceHandleCancel: "Hủy", workspaceHandleSave: "Lưu thay đổi", workspaceHandleSaving: "Đang lưu…",
    workspaceHandleHint: "Dùng 3–30 ký tự: chữ thường, số hoặc dấu gạch ngang.",
    workspaceHandleSaved: "Đã cập nhật đường dẫn workspace.", workspaceHandleInvalid: "Tên đường dẫn chưa hợp lệ.",
    workspaceHandleTaken: "Tên đường dẫn này đã được sử dụng.",
    workspaceHandleCooldown: "Bạn có thể đổi tên đường dẫn một lần mỗi giờ.",
    workspaceHandleFailed: "Chưa thể cập nhật đường dẫn. Vui lòng thử lại.",
    planDetail: "Một workspace riêng · Tự kết nối khóa API AI",
    price: "299.000đ", perMonth: "/ tháng", firstPayment: "Thanh toán tháng đầu",
    renew: "Gia hạn thêm 1 tháng", paymentTitle: "Thanh toán", qrAlt: "Mã QR chuyển khoản",
    bank: "Ngân hàng", bankAccount: "Số tài khoản", amount: "Số tiền",
    transferMemo: "Nội dung chuyển khoản", awaitingPayment: "Đang chờ xác nhận thanh toán",
    active: "Đang hoạt động", needsSupport: "Cần hỗ trợ", settingUp: "Đang thiết lập",
    unpaid: "Chưa thanh toán", trialActive: "Đang dùng thử", trialExpired: "Dùng thử đã hết hạn",
    setupFailed: "Chưa thiết lập được workspace. Liên hệ contact@raifirst.si để được hỗ trợ.",
    setupPending: "Workspace của bạn đang được thiết lập.",
    paidThrough: (date) => `Đã thanh toán đến ${date}`,
    trialThrough: (date) => `Dùng thử miễn phí đến ${date}`,
    requestFailed: "Không thể kết nối. Vui lòng thử lại.", loadAccountFailed: "Không tải được tài khoản. Vui lòng thử lại.",
    codeSent: "Đã gửi mã xác nhận đến email của bạn.",
    codeSentPreview: "Nếu email đã được cấp quyền xem trước, mã xác nhận sẽ được gửi đến đó.",
    codeInvalid: "Mã xác nhận không đúng hoặc đã hết hạn.",
    emailUnavailable: "Email tạm thời không khả dụng. Vui lòng thử lại sau.",
    qrFailed: "Không tải được mã QR. Hãy chuyển khoản theo thông tin bên dưới.",
    paymentReceived: "Đã nhận thanh toán. Workspace đang được chuẩn bị.",
    payBy: (date) => `Chuyển khoản trước ${date}`,
    orderExpired: "Mã chuyển khoản đã hết hạn. Hãy tạo đơn mới trước khi thanh toán.",
    soldOut: "Hiện đã hết suất workspace dùng thử. Vui lòng thử lại sau.",
    trialFull: "Suất dùng thử đang đầy. Tài khoản cũ vẫn có thể đăng nhập.",
    license: "Giấy phép", notices: "Thông báo bản quyền",
  },
  en: {
    title: "RAI² account", logout: "Sign out", eyebrow: "ACCOUNT",
    heading: "Your RAI² workspace", signinTitle: "Start with RAI²",
    signinBadge: "14 DAYS FREE",
    signinIntro: "Verify your email to receive a private workspace for 14 days. No payment required.",
    emailLabel: "Your email",
    previewNote: "Private preview · Payments are not open",
    sendCode: "Send verification code", emailPlaceholder: "you@example.com", codeLabel: "Verification code", codePlaceholder: "8 digits",
    verify: "Verify", changeEmail: "Change email", accountTitle: "Account",
    workspace: "Workspace", openWorkspace: "Open workspace", planName: "RAI² BYOK plan",
    workspaceHandleLabel: "Workspace address", workspaceHandlePlaceholder: "acme-company",
    workspaceHandleEdit: "Change address", workspaceHandleCancel: "Cancel", workspaceHandleSave: "Save changes", workspaceHandleSaving: "Saving…",
    workspaceHandleHint: "Use 3–30 lowercase letters, numbers, or hyphens.",
    workspaceHandleSaved: "Workspace address updated.", workspaceHandleInvalid: "Enter a valid workspace address.",
    workspaceHandleTaken: "This workspace address is already taken.",
    workspaceHandleCooldown: "You can change the workspace address once per hour.",
    workspaceHandleFailed: "Could not update the workspace address. Please try again.",
    planDetail: "One private workspace · Bring your own AI API key",
    price: "VND 299,000", perMonth: "/ month", firstPayment: "Pay for the first month",
    renew: "Renew for another month", paymentTitle: "Payment", qrAlt: "Bank transfer QR code",
    bank: "Bank", bankAccount: "Account number", amount: "Amount",
    transferMemo: "Transfer memo", awaitingPayment: "Waiting for payment confirmation",
    active: "Active", needsSupport: "Needs support", settingUp: "Setting up",
    unpaid: "Unpaid", trialActive: "Free trial", trialExpired: "Trial expired",
    setupFailed: "We could not set up your workspace. Contact contact@raifirst.si for help.",
    setupPending: "Your workspace is being set up.",
    paidThrough: (date) => `Paid through ${date}`,
    trialThrough: (date) => `Free trial through ${date}`,
    requestFailed: "Could not connect. Please try again.", loadAccountFailed: "Could not load your account. Please try again.",
    codeSent: "A verification code was sent to your email.",
    codeSentPreview: "If this email has preview access, a verification code will be sent.",
    codeInvalid: "The code is incorrect or has expired.",
    emailUnavailable: "Email is temporarily unavailable. Please try again later.",
    qrFailed: "Could not load the QR code. Use the bank details below to transfer manually.",
    paymentReceived: "Payment received. Your workspace is being prepared.",
    payBy: (date) => `Transfer before ${date}`,
    orderExpired: "This transfer code has expired. Create a new order before paying.",
    soldOut: "Trial workspaces are full right now. Please try again later.",
    trialFull: "Trial slots are full. Existing accounts can still sign in.",
    license: "License", notices: "Open source notices",
  },
};

const byId = (id) => document.getElementById(id);
const show = (id, value) => { byId(id).hidden = !value; };
const setText = (id, value) => { byId(id).textContent = value; };
let handleMessageKey = "";
let handleMessageError = false;
let handleEditorOpen = false;
const handleMessage = (key = "", error = false) => {
  handleMessageKey = key;
  handleMessageError = error;
  const element = byId("workspace-handle-message");
  element.textContent = key ? say(key) : "";
  element.classList.toggle("error", error);
  element.hidden = !key;
};
const normalizeHandle = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  .slice(0, 30).replace(/-+$/g, "");
const accountHandle = () => {
  const value = account?.workspaceHandle;
  return typeof value === "string" && value !== "undefined" && value !== "null" ? value : "";
};
const validHandle = (value) => value.length >= 3 && !value.startsWith("u-") &&
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])$/.test(value);
const updateHandleSave = () => {
  const handle = normalizeHandle(byId("workspace-handle").value);
  byId("workspace-handle-save").disabled = !validHandle(handle) || handle === accountHandle();
};
const setHandleEditor = (open) => {
  handleEditorOpen = open;
  show("workspace-handle-form", open);
  show("workspace-handle-edit", !open);
  byId("workspace-handle-edit").setAttribute("aria-expanded", String(open));
  if (!open) return;
  const input = byId("workspace-handle");
  input.value = accountHandle();
  input.removeAttribute("aria-invalid");
  updateHandleSave();
  input.focus();
  input.select();
};
const savedLocale = localStorage.getItem("rai2_locale");
let locale = savedLocale === "vi" || savedLocale === "en" ? savedLocale
  : navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
let account = null;
let messageKey = "";
let messageError = false;
let paymentKey = "awaitingPayment";
let paymentExpiryAt = null;
let paymentsEnabled = false;
let privatePreview = false;
const openWhenReady = new URLSearchParams(location.search).get("open") === "1";
const themeCookie = /(?:^|;\s*)rai2_theme=(light|dark)(?:;|$)/.exec(document.cookie)?.[1];
let theme = themeCookie || localStorage.getItem("rai2_landing_theme") || "dark";
const setTheme = (value) => {
  theme = value === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  byId("theme-toggle").textContent = theme === "light" ? "☾" : "☀";
  document.querySelector('meta[name="theme-color"]').content = theme === "light" ? "#f8f9fa" : "#080808";
  localStorage.setItem("rai2_landing_theme", theme);
  if (location.hostname === "rai2.si" || location.hostname.endsWith(".rai2.si")) {
    document.cookie = `rai2_theme=${theme}; Domain=rai2.si; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  }
};

const say = (key) => copy[locale][key];
const message = (key, error = false) => {
  messageKey = key;
  messageError = error;
  const element = byId("message");
  element.textContent = key ? say(key) : "";
  element.classList.toggle("error", error);
  element.hidden = !key;
};
const renderAccount = () => {
  if (!account) return;
  setText("account-email", account.email);
  const active = account.workspaceState === "active" && Boolean(account.workspaceUrl);
  const paid = account.paidThrough > Date.now();
  const trial = !paid && account.trialThrough > Date.now();
  const entitled = paid || trial;
  byId("account-status").classList.toggle("unpaid", !entitled);
  setText("account-status", say(account.workspaceState === "error" && entitled ? "needsSupport"
    : active ? trial ? "trialActive" : "active"
    : entitled ? "settingUp"
    : account.trialThrough ? "trialExpired" : "unpaid"));
  show("workspace-row", active);
  if (active) {
    byId("workspace-link").href = "/api/workspace/open";
    setText("workspace-address", new URL(account.workspaceUrl).host);
    if (!handleEditorOpen) byId("workspace-handle").value = accountHandle();
    updateHandleSave();
  }
  setText("order-button", say(paid ? "renew" : "firstPayment"));
  show("order-button", paymentsEnabled && !trial && (!paid || active));
  show("setup-note", entitled && !active);
  if (entitled && !active) setText("setup-note", say(account.workspaceState === "error" ? "setupFailed" : "setupPending"));
  show("paid-through", paid);
  if (paid) setText("paid-through", say("paidThrough")(
    new Date(account.paidThrough).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB")));
  show("trial-through", trial);
  if (trial) setText("trial-through", say("trialThrough")(
    new Date(account.trialThrough).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB")));
};
const setLocale = (value) => {
  locale = value;
  localStorage.setItem("rai2_locale", value);
  document.documentElement.lang = value;
  document.title = say("title");
  byId("language").value = value;
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = say(element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = say(element.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => { element.alt = say(element.dataset.i18nAlt); });
  renderAccount();
  handleMessage(handleMessageKey, handleMessageError);
  setText("payment-status", say(paymentKey));
  if (paymentExpiryAt) setText("payment-expiry", say("payBy")(
    paymentExpiryAt.toLocaleString(value === "vi" ? "vi-VN" : "en-GB")));
  message(messageKey, messageError);
};
const request = async (path, method = "GET", body) => {
  const response = await fetch(path, {
    method, credentials: "same-origin",
    ...(body === undefined ? {} : {
      headers: { "content-type": "application/json" }, body: JSON.stringify(body),
    }),
  });
  if (!response.ok) {
    const error = new Error(say("requestFailed"));
    error.status = response.status;
    throw error;
  }
  return response.json();
};

const loadStatus = async () => {
  try {
    const status = await request("/api/status");
    paymentsEnabled = status.paymentsEnabled === true;
    privatePreview = status.privatePreview === true;
    show("trial-full", status.trialDays > 0 && status.trialAvailable === false);
  } catch {
    paymentsEnabled = false;
  }
  show("preview-note", !paymentsEnabled);
  renderAccount();
};

let email = "";
let orderId = null;
let pollTimer = null;
let readyTimer = null;

const refresh = async () => {
  try {
    account = await request("/api/me");
    show("signin", false);
    show("account", true);
    show("logout", true);
    renderAccount();
    if (openWhenReady && account.workspaceUrl) {
      location.replace("/api/workspace/open");
      return;
    }
    const waiting = Math.max(account.paidThrough, account.trialThrough) > Date.now() &&
      account.workspaceState !== "active" && account.workspaceState !== "error";
    if (waiting && !readyTimer) readyTimer = setInterval(() => void refresh(), 3000);
    else if (!waiting && readyTimer) { clearInterval(readyTimer); readyTimer = null; }
  } catch (error) {
    if (error.status !== 401) { message("loadAccountFailed", true); return; }
    account = null;
    show("signin", true);
    show("account", false);
    show("payment", false);
    show("logout", false);
  }
};

byId("language").addEventListener("change", (event) => setLocale(event.target.value));
byId("theme-toggle").addEventListener("click", () => setTheme(theme === "light" ? "dark" : "light"));

byId("email-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  message("");
  email = byId("email").value.trim();
  try {
    await request("/api/auth/start", "POST", { email });
    show("email-form", false);
    show("code-form", true);
    byId("code").focus();
    message(privatePreview ? "codeSentPreview" : "codeSent");
  } catch (error) { message(error.status === 503 ? "emailUnavailable" : "requestFailed", true); }
  finally { button.disabled = false; }
});

byId("code-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  message("");
  try {
    await request("/api/auth/verify", "POST", { email, code: byId("code").value.trim() });
    await refresh();
    message("");
  } catch (error) {
    if (error.status === 409) {
      show("email-form", true);
      show("code-form", false);
    }
    message(error.status === 409 ? "soldOut" : error.status === 401 ? "codeInvalid" : "requestFailed", true);
  }
  finally { button.disabled = false; }
});

byId("change-email").addEventListener("click", () => {
  show("email-form", true);
  show("code-form", false);
  message("");
  byId("email").focus();
});

byId("logout").addEventListener("click", async () => {
  try { await request("/api/auth/logout", "POST", {}); }
  catch { message("requestFailed", true); return; }
  if (pollTimer) clearInterval(pollTimer);
  if (readyTimer) clearInterval(readyTimer);
  orderId = null;
  await refresh();
});

byId("workspace-handle-edit").addEventListener("click", () => {
  handleMessage();
  setHandleEditor(!handleEditorOpen);
});

byId("workspace-handle-cancel").addEventListener("click", () => {
  handleMessage();
  setHandleEditor(false);
  byId("workspace-handle-edit").focus();
});

byId("workspace-handle").addEventListener("input", () => {
  byId("workspace-handle").removeAttribute("aria-invalid");
  handleMessage();
  updateHandleSave();
});
byId("workspace-handle").addEventListener("blur", () => {
  byId("workspace-handle").value = normalizeHandle(byId("workspace-handle").value);
  updateHandleSave();
});

byId("workspace-handle-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = byId("workspace-handle-save");
  const input = byId("workspace-handle");
  const handle = normalizeHandle(input.value);
  input.value = handle;
  if (!validHandle(handle)) {
    input.setAttribute("aria-invalid", "true");
    handleMessage("workspaceHandleInvalid", true);
    updateHandleSave();
    return;
  }
  button.disabled = true;
  setText("workspace-handle-save", say("workspaceHandleSaving"));
  form.setAttribute("aria-busy", "true");
  handleMessage();
  try {
    const result = await request("/api/workspace/handle", "POST", { handle });
    account.workspaceHandle = result.handle;
    account.workspaceUrl = result.workspaceUrl;
    setHandleEditor(false);
    renderAccount();
    handleMessage("workspaceHandleSaved");
    byId("workspace-handle-edit").focus();
  } catch (error) {
    input.setAttribute("aria-invalid", "true");
    handleMessage(error.status === 400 ? "workspaceHandleInvalid" : error.status === 409 ? "workspaceHandleTaken"
      : error.status === 429 ? "workspaceHandleCooldown" : "workspaceHandleFailed", true);
    input.focus();
  } finally {
    form.removeAttribute("aria-busy");
    setText("workspace-handle-save", say("workspaceHandleSave"));
    updateHandleSave();
  }
});

byId("order-button").addEventListener("click", async () => {
  const button = byId("order-button");
  button.disabled = true;
  message("");
  try {
    const order = await request("/api/orders", "POST", {});
    orderId = order.id;
    byId("payment-qr").src = order.qrUrl;
    byId("payment-qr").onerror = () => {
      show("payment-qr", false);
      paymentKey = "qrFailed";
      setText("payment-status", say(paymentKey));
    };
    show("payment-qr", true);
    setText("payment-bank", order.bankName);
    setText("payment-account", order.bankAccount);
    setText("payment-code", order.code);
    paymentExpiryAt = new Date(order.expiresAt);
    setText("payment-expiry", say("payBy")(
      paymentExpiryAt.toLocaleString(locale === "vi" ? "vi-VN" : "en-GB")));
    show("payment-expiry", true);
    paymentKey = "awaitingPayment";
    setText("payment-status", say(paymentKey));
    show("payment", true);
    byId("payment").scrollIntoView({ behavior: "smooth" });
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
      if (!orderId) return;
      try {
        const status = await request(`/api/orders/${orderId}`);
        if (status.status === "expired") {
          clearInterval(pollTimer);
          pollTimer = null;
          orderId = null;
          show("payment", false);
          message("orderExpired", true);
          return;
        }
        if (status.status !== "paid") return;
        clearInterval(pollTimer);
        pollTimer = null;
        paymentKey = "paymentReceived";
        setText("payment-status", say(paymentKey));
        await refresh();
      } catch { message("requestFailed", true); }
    }, 4000);
  } catch (error) { message(error.status === 409 ? "soldOut" : "requestFailed", true); }
  finally { button.disabled = false; }
});

setTheme(theme);
setLocale(locale);
void loadStatus().then(refresh);
