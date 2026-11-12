import { createHmac } from "node:crypto";

export function tenantToken(key: string, slug: string): string {
  return createHmac("sha256", key).update(`tenant:${slug}`).digest("base64url");
}
