import { createTransport } from "nodemailer";
import { describe, expect, it } from "vitest";

import { signInEmail } from "./signin-email.ts";

describe("RAI² sign-in email", () => {
  it("uses the product name and support address in the From header", async () => {
    const transport = createTransport({ streamTransport: true, buffer: true, newline: "unix" });
    const sent = await transport.sendMail(signInEmail("person@example.test", "12345678"));
    const message = sent.message.toString("utf8");

    expect(sent.envelope.from).toBe("support@rai2.si");
    expect(message).toMatch(/^From: =\?UTF-8\?Q\?RAI=C2=B2\?= <support@rai2\.si>$/mu);
  });
});
