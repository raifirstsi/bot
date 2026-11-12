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
    expect(message).toContain("Content-ID: <rai2-logo@rai2.si>");
    expect(message).toContain("cid:rai2-logo@rai2.si");
  });

  it("renders a monochrome, inline-logo verification email", async () => {
    const message = signInEmail("person@example.test", "12345678");
    expect(message.subject).toBe("Mã xác nhận đăng nhập RAI²");
    expect(message.text).toContain("Mã xác nhận đăng nhập của bạn là: 12345678");
    expect(message.html).toContain('src="cid:rai2-logo@rai2.si"');
    expect(message.html).toContain("Mã xác nhận đăng nhập");
    expect(message.html).toContain("10 phút");
    const colors = [...message.html.matchAll(/#[0-9a-f]{6}/giu)].map(([color]) => color.slice(1));
    expect(colors.every((color) => color.slice(0, 2) === color.slice(2, 4) && color.slice(2, 4) === color.slice(4, 6))).toBe(true);
    expect(message.attachments).toEqual([
      { filename: "rai2-logo.png", path: expect.stringMatching(/[\\/]public[\\/]assets[\\/]rai-core-black\.png$/), cid: "rai2-logo@rai2.si" },
    ]);
  });
});
