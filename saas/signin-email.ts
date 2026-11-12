export const SIGN_IN_EMAIL_FROM = {
  name: "RAI²",
  address: "support@rai2.si",
} as const;

export function signInEmail(email: string, code: string) {
  return {
    from: SIGN_IN_EMAIL_FROM,
    to: email,
    subject: "RAI² sign-in code / Mã đăng nhập",
    text: `Your sign-in code is ${code}. It expires in 10 minutes.\nMã đăng nhập của bạn là ${code}. Mã hết hạn sau 10 phút.`,
  };
}
