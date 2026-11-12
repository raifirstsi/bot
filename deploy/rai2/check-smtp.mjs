import { readFileSync } from "node:fs";
import { createTransport } from "nodemailer";
import { smtpOptions } from "../../server/sign-in-mail.ts";

const file = process.argv[2];
if (!file) throw new Error("usage: node --experimental-strip-types check-smtp.mjs ENV_FILE");
const line = readFileSync(file, "utf8").split(/\r?\n/).find((entry) => entry.startsWith("RAI2_SIGNIN_SMTP_URL="));
if (!line) throw new Error("SaaS SMTP URL missing");
const transport = createTransport(smtpOptions(line.slice("RAI2_SIGNIN_SMTP_URL=".length)));
try {
  await transport.verify();
  console.log("SMTP authentication succeeded without sending email");
} catch (error) {
  console.error(`SMTP authentication failed: ${typeof error?.code === "string" ? error.code : "unknown"}`);
  process.exitCode = 1;
} finally {
  transport.close();
}
