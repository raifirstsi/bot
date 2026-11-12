import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const SIGN_IN_EMAIL_FROM = {
  name: "RAI²",
  address: "support@rai2.si",
} as const;

const moduleDir = dirname(fileURLToPath(import.meta.url));
const RAI_LOGO_PATH = [
  join(moduleDir, "public", "assets", "rai-core-black.png"),
  join(moduleDir, "..", "public", "assets", "rai-core-black.png"),
].find((path) => existsSync(path));

if (!RAI_LOGO_PATH) throw new Error("RAI² email logo asset is missing");

export function signInEmail(email: string, code: string) {
  const safeCode = code.replace(/[^0-9]/g, "");
  return {
    from: SIGN_IN_EMAIL_FROM,
    to: email,
    subject: "Mã xác nhận đăng nhập RAI²",
    text: [
      "RAI² First OS",
      "",
      `Mã xác nhận đăng nhập của bạn là: ${safeCode}`,
      "Mã có hiệu lực trong 10 phút.",
      "",
      "Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email.",
      "",
      "RAI² First OS · rai2.si",
      "",
      `Your RAI² sign-in code is: ${safeCode}`,
      "This code expires in 10 minutes. If you did not request it, you can ignore this email.",
    ].join("\n"),
    html: `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Mã xác nhận đăng nhập RAI²</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;color:#111111;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">Mã xác nhận đăng nhập RAI² của bạn có hiệu lực trong 10 phút.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;border:1px solid #e5e5e5;background:#ffffff;">
            <tr>
              <td style="padding:28px 32px 24px;border-bottom:1px solid #e5e5e5;">
                <img src="cid:rai2-logo@rai2.si" width="86" alt="RAI² First OS" style="display:block;width:86px;height:auto;border:0;">
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 10px;color:#111111;font-size:24px;line-height:1.25;font-weight:700;">Mã xác nhận đăng nhập</p>
                <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">Dùng mã dưới đây để tiếp tục vào workspace RAI² First OS của bạn.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#f7f7f7;border:1px solid #111111;">
                  <tr>
                    <td align="center" style="padding:20px 16px;color:#111111;font-size:32px;line-height:1;font-weight:700;letter-spacing:7px;">${safeCode}</td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#555555;font-size:14px;line-height:1.6;">Mã có hiệu lực trong <strong style="color:#111111;">10 phút</strong>.</p>
                <p style="margin:0;color:#777777;font-size:13px;line-height:1.6;">Nếu bạn không yêu cầu mã này, bạn có thể bỏ qua email. Không chia sẻ mã với bất kỳ ai.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e5e5e5;color:#777777;font-size:12px;line-height:1.5;">RAI² First OS · <a href="https://rai2.si" style="color:#111111;text-decoration:none;">rai2.si</a></td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    attachments: [{ filename: "rai2-logo.png", path: RAI_LOGO_PATH, cid: "rai2-logo@rai2.si" }],
  };
}
