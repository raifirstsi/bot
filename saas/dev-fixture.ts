import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSaasServer } from "./server.ts";
import { SaasStore } from "./store.ts";

const port = Number(process.env.RAI2_FIXTURE_PORT || 8812);
const dataDir = mkdtempSync(join(tmpdir(), "rai2-saas-preview-"));
const store = new SaasStore(join(dataDir, "preview.db"));
const server = createSaasServer({
  store,
  config: {
    publicOrigin: `http://127.0.0.1:${port}`, tenantDomain: "rai2.test", bankAccount: "1234567890",
    bankName: "MBBank", sepayApiKey: randomBytes(32).toString("hex"),
    otpPepper: randomBytes(32).toString("hex"), tenantSigningKey: randomBytes(32).toString("hex"),
  },
  mailer: { sendCode: async (email, code) => { console.log(`Fixture OTP for ${email}: ${code}`); } },
});
server.listen(port, "127.0.0.1", () => console.log(`RAI2 SaaS fixture: http://127.0.0.1:${port}`));
const close = () => server.close(() => {
  store.close();
  rmSync(dataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});
process.once("SIGINT", close);
process.once("SIGTERM", close);
