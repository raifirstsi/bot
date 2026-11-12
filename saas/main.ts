import { existsSync } from "node:fs";
import { join } from "node:path";
import { createTransport } from "nodemailer";
import { smtpOptions } from "../server/sign-in-mail.ts";
import { socketFleet } from "./provisioner.ts";
import { WorkspaceProvisioner } from "./provisioner.ts";
import { createSaasServer } from "./server.ts";
import { signInEmail } from "./signin-email.ts";
import { SaasStore } from "./store.ts";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

const dataDir = required("RAI2_SAAS_DATA_DIR");
if (!existsSync(join(dataDir, "saas.db"))) throw new Error("SaaS database missing; restore it or run the one-time init command before first launch");
const smtpUrl = required("RAI2_SIGNIN_SMTP_URL");
const port = Number(required("RAI2_SAAS_PORT"));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("RAI2_SAAS_PORT is invalid");
const paymentsEnabled = process.env.RAI2_SAAS_PAYMENTS_ENABLED === "1";
if (paymentsEnabled && !process.env.RAI2_SEPAY_WEBHOOK_SECRET?.trim()) {
  throw new Error("RAI2_SEPAY_WEBHOOK_SECRET is required before enabling payments");
}

const store = new SaasStore(join(dataDir, "saas.db"));
const mail = createTransport(smtpOptions(smtpUrl));
const tenantDomain = required("RAI2_TENANT_DOMAIN");
const provisioner = new WorkspaceProvisioner({
  store, fleet: socketFleet(required("RAI2_FLEET_SOCKET")),
  tenantAuthOrigin: required("RAI2_SAAS_ORIGIN"), tenantSigningKey: required("RAI2_TENANT_SIGNING_KEY"),
  tenantDomain,
  onFailure: (slug, action) => console.error(`workspace reconciliation failed: ${slug} ${action}`),
});
const reconcile = () => void provisioner.reconcile().catch(() => {
  console.error("workspace reconciliation failed");
});
const server = createSaasServer({
  store,
  paymentsEnabled,
  trialEnabled: !process.env.RAI2_SAAS_PREVIEW_EMAIL?.trim(),
  previewEmail: process.env.RAI2_SAAS_PREVIEW_EMAIL,
  onVerified: reconcile,
  onWorkspaceHandle: (slug, host, legacyHosts) => provisioner.setPublicHost(slug, host, legacyHosts),
  mailer: { sendCode: async (email, code) => {
    await mail.sendMail(signInEmail(email, code));
  } },
  config: {
    publicOrigin: required("RAI2_SAAS_ORIGIN"), tenantDomain,
    bankAccount: required("RAI2_BANK_ACCOUNT"), bankName: required("RAI2_BANK_NAME"),
    sepayApiKey: process.env.RAI2_SEPAY_API_KEY?.trim(),
    sepayWebhookSecret: process.env.RAI2_SEPAY_WEBHOOK_SECRET?.trim(),
    maxWorkspaces: Number(process.env.RAI2_MAX_WORKSPACES ?? "4"),
    otpPepper: required("RAI2_OTP_PEPPER"),
    tenantSigningKey: required("RAI2_TENANT_SIGNING_KEY"),
  },
});

server.listen(port, "127.0.0.1", () => {
  console.log(`RAI2 SaaS control plane listening on 127.0.0.1:${port}`);
});

const timer = setInterval(reconcile, 30_000);
reconcile();

const close = () => {
  clearInterval(timer);
  server.close(() => {
    mail.close();
    store.close();
  });
};
process.once("SIGINT", close);
process.once("SIGTERM", close);
