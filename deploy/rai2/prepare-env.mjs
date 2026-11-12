import { randomBytes } from "node:crypto";
import { closeSync, fsyncSync, openSync, readFileSync, writeFileSync, constants } from "node:fs";

const [inputFile, outputFile] = process.argv.slice(2);
if (!inputFile || !outputFile) throw new Error("usage: node prepare-env.mjs INPUT OUTPUT");

const expected = new Set([
  "RAI2_BANK_ACCOUNT", "RAI2_BANK_NAME", "RAI2_SEPAY_API_KEY",
  "RAI2_SEPAY_WEBHOOK_SECRET",
  "RAI2_SIGNIN_SMTP_HOST", "RAI2_SIGNIN_SMTP_PORT", "RAI2_SIGNIN_SMTP_USER",
  "RAI2_SIGNIN_SMTP_PASSWORD",
]);
const values = new Map();
for (const line of readFileSync(inputFile, "utf8").split(/\r?\n/).filter(Boolean)) {
  const separator = line.indexOf("=");
  const name = line.slice(0, separator);
  const value = line.slice(separator + 1);
  if (separator < 1 || !expected.has(name) || values.has(name) || !value || value.startsWith("DIEN_")) {
    throw new Error("SaaS input has a missing, duplicate or unexpected field");
  }
  values.set(name, value);
}
if (values.size !== expected.size || !/^[0-9]{6,30}$/.test(values.get("RAI2_BANK_ACCOUNT")) ||
  !/^[A-Za-z0-9._-]{2,64}$/.test(values.get("RAI2_BANK_NAME")) ||
  !/^[!-~]{24,256}$/.test(values.get("RAI2_SEPAY_API_KEY")) ||
  !/^[!-~]{32,256}$/.test(values.get("RAI2_SEPAY_WEBHOOK_SECRET")) ||
  values.get("RAI2_SIGNIN_SMTP_HOST") !== "smtp.resend.com" ||
  values.get("RAI2_SIGNIN_SMTP_PORT") !== "465" ||
  values.get("RAI2_SIGNIN_SMTP_USER") !== "resend" ||
  !/^[!-~]{24,256}$/.test(values.get("RAI2_SIGNIN_SMTP_PASSWORD"))) {
  throw new Error("SaaS input has an invalid account, bank, SePay or Resend field");
}

const smtpUrl = new URL("smtps://smtp.resend.com:465");
smtpUrl.username = values.get("RAI2_SIGNIN_SMTP_USER");
smtpUrl.password = values.get("RAI2_SIGNIN_SMTP_PASSWORD");
const output = [
  "RAI2_SAAS_DATA_DIR=/var/lib/rai2/saas",
  "RAI2_SAAS_PORT=8812",
  "RAI2_MAX_WORKSPACES=4",
  "RAI2_SAAS_ORIGIN=https://app.rai2.si",
  "RAI2_TENANT_DOMAIN=rai2.si",
  "RAI2_FLEET_SOCKET=/run/openmausbot/fleet.sock",
  `RAI2_BANK_ACCOUNT=${values.get("RAI2_BANK_ACCOUNT")}`,
  `RAI2_BANK_NAME=${values.get("RAI2_BANK_NAME")}`,
  `RAI2_SEPAY_API_KEY=${values.get("RAI2_SEPAY_API_KEY")}`,
  `RAI2_SEPAY_WEBHOOK_SECRET=${values.get("RAI2_SEPAY_WEBHOOK_SECRET")}`,
  `RAI2_OTP_PEPPER=${randomBytes(32).toString("base64url")}`,
  `RAI2_TENANT_SIGNING_KEY=${randomBytes(32).toString("base64url")}`,
  `RAI2_SIGNIN_SMTP_URL=${smtpUrl.href}`,
].join("\n") + "\n";

const fd = openSync(outputFile, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o600);
try {
  writeFileSync(fd, output);
  fsyncSync(fd);
} finally {
  closeSync(fd);
}
console.log("SaaS environment prepared without printing secrets");
