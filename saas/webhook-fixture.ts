import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSaasServer } from "./server.ts";
import { SaasStore } from "./store.ts";

const required = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const home = mkdtempSync(join(tmpdir(), "rai2-webhook-fixture-"));
const store = new SaasStore(join(home, "fixture.db"));
const server = createSaasServer({
  store,
  paymentsEnabled: true,
  previewEmail: "fixture@example.test",
  mailer: { sendCode: async () => { throw new Error("fixture mail is disabled"); } },
  config: {
    publicOrigin: "https://webhook-test.rai2.si",
    tenantDomain: "rai2.si",
    bankAccount: required("RAI2_BANK_ACCOUNT"),
    bankName: required("RAI2_BANK_NAME"),
    sepayWebhookSecret: required("RAI2_SEPAY_WEBHOOK_SECRET"),
    otpPepper: "p".repeat(32),
    tenantSigningKey: "t".repeat(32),
  },
});

server.listen(18812, "127.0.0.1", () => {
  console.log("RAI2 isolated webhook fixture listening on 127.0.0.1:18812");
});

const close = () => server.close(() => {
  store.close();
  rmSync(home, { recursive: true, force: true });
});
process.once("SIGINT", close);
process.once("SIGTERM", close);
