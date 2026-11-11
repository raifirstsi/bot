// SePay VietQR payment gateway and subscription manager for RAI² (rai2.si)
import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { json, readBody } from "../harness/http.ts";
import { cookieMaxAgeSeconds, type SessionRegistry } from "../sessions.ts";
import { serializeSessionCookie, requestOrigin } from "../request-auth.ts";

export interface SubscriptionPlan {
  tier: "starter" | "pro" | "team";
  name: string;
  priceVnd: number;
  period: "month" | "year";
  features: string[];
}

export const RAI2_PLANS: SubscriptionPlan[] = [
  {
    tier: "starter",
    name: "RAI² Khởi Động",
    priceVnd: 299000,
    period: "month",
    features: [
      "Bộ Tứ Nhân Sự Số Tự Hành (4 Core Agents)",
      "Mô hình 100% BYOK (OpenAI, Claude, Gemini, DeepSeek)",
      "1 Sandbox Máy Ảo Linux Cô Lập",
      "Routines & Tự Động Hóa 24/7 Cơ Bản"
    ]
  },
  {
    tier: "pro",
    name: "RAI² Chuyên Nghiệp",
    priceVnd: 699000,
    period: "month",
    features: [
      "Đầy đủ quyền năng Bộ Tứ Nhân Sự Số + Tùy Biến Agent",
      "100% BYOK – Không giới hạn lượt gọi qua key cá nhân",
      "Trình duyệt Chromium Tự Hành (Browser Automation)",
      "Kết Nối 500+ Ứng Dụng (Composio, Webhooks)",
      "Bảo Mật Quyết Định (Decision Log) & Phê Duyệt Di Động"
    ]
  },
  {
    tier: "team",
    name: "RAI² Doanh Nghiệp (5–20 Người)",
    priceVnd: 1890000,
    period: "month",
    features: [
      "Workspace Dùng Chung Cho Đội Ngũ 5–20 Nhân Sự",
      "Phòng Họp Multi-Agent Phối Hợp Đa Nhiệm (AI Rooms)",
      "Private Chat Cho Từng Nhân Viên & Shared Bot Công Ty",
      "Audit & Chuẩn Hóa Điểm Nghẽn Quy Trình Cùng CAIO",
      "Hỗ Trợ Ưu Tiên & Sao Lưu Dữ Liệu Tự Động"
    ]
  }
];

export interface SubscriptionRecord {
  id: string;
  code: string; // e.g. RAI2_9K2X1
  tier: "starter" | "pro" | "team";
  amount: number;
  status: "pending" | "paid" | "expired";
  createdAt: number;
  paidAt?: number;
  expiresAt?: number;
  customerEmail?: string;
  transactionRef?: string;
  gateway?: string;
}

export class SubscriptionStore {
  private filePath: string;
  private items: Map<string, SubscriptionRecord> = new Map();

  constructor(dataDir: string) {
    const dir = join(dataDir, "subscriptions");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    this.filePath = join(dir, "subscriptions.json");
    this.load();
  }

  private load(): void {
    if (!existsSync(this.filePath)) return;
    try {
      const raw = JSON.parse(readFileSync(this.filePath, "utf-8")) as SubscriptionRecord[];
      for (const rec of raw) this.items.set(rec.code, rec);
    } catch {
      // keep empty map on read error
    }
  }

  private save(): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(Array.from(this.items.values()), null, 2), "utf-8");
    } catch {
      // ignore
    }
  }

  createOrder(tier: "starter" | "pro" | "team", email?: string): SubscriptionRecord {
    const plan = RAI2_PLANS.find((p) => p.tier === tier) || RAI2_PLANS[0]!;
    const code = `RAI2_${randomBytes(4).toString("hex").toUpperCase()}`;
    const record: SubscriptionRecord = {
      id: randomBytes(8).toString("hex"),
      code,
      tier: plan.tier,
      amount: plan.priceVnd,
      status: "pending",
      createdAt: Date.now(),
      customerEmail: email?.trim() || undefined,
    };
    this.items.set(code, record);
    this.save();
    return record;
  }

  getByCode(code: string): SubscriptionRecord | undefined {
    return this.items.get(code.toUpperCase());
  }

  markPaid(code: string, ref: string, gateway: string, _amountReceived: number): SubscriptionRecord | null {
    const rec = this.items.get(code.toUpperCase());
    if (!rec) return null;
    rec.status = "paid";
    rec.paidAt = Date.now();
    rec.expiresAt = Date.now() + 31 * 86400000; // 31 days access
    rec.transactionRef = ref;
    rec.gateway = gateway;
    this.save();
    return rec;
  }
}

export interface SePayWebhookBody {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  amountIn?: number;
  amountOut?: number;
  accumulated?: number;
  code?: string | null;
  transactionContent?: string;
  referenceNumber?: string;
  body?: string | null;
}

export function handleSepayRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  method: string,
  store: SubscriptionStore,
  sessions?: SessionRegistry,
  sessionCookieName?: string
): boolean {
  // 1. GET /api/subscription/plans
  if (path === "/api/subscription/plans" && method === "GET") {
    json(res, 200, { plans: RAI2_PLANS });
    return true;
  }

  // 2. POST /api/subscription/create
  if (path === "/api/subscription/create" && method === "POST") {
    void readBody(req).then((data) => {
      const body = data as { tier?: "starter" | "pro" | "team"; email?: string };
      const tier = body.tier || "pro";
      const order = store.createOrder(tier, body.email);
      const bankAcc = process.env.SEPAY_BANK_ACCOUNT || "999999999";
      const bankName = process.env.SEPAY_BANK_NAME || "MBBank";
      const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(bankAcc)}&bank=${encodeURIComponent(bankName)}&amount=${order.amount}&des=${order.code}`;
      json(res, 201, {
        order,
        payment: {
          qrUrl,
          bankAccount: bankAcc,
          bankName,
          amount: order.amount,
          transferContent: order.code,
        }
      });
    }).catch((err) => {
      console.error("instant-access error:", err);
      json(res, 400, { error: err instanceof Error ? err.message : "Invalid request payload" });
    });
    return true;
  }

  // 3. GET /api/subscription/check/:code
  const checkMatch = path.match(/^\/api\/subscription\/check\/([\w-]+)$/);
  if (checkMatch && method === "GET") {
    const code = checkMatch[1]!;
    const order = store.getByCode(code);
    if (!order) {
      json(res, 404, { error: "Order not found" });
      return true;
    }
    json(res, 200, {
      code: order.code,
      tier: order.tier,
      status: order.status,
      paidAt: order.paidAt,
      expiresAt: order.expiresAt,
    });
    return true;
  }

  // 4. POST /api/sepay/webhook
  if (path === "/api/sepay/webhook" && method === "POST") {
    const apiKey = process.env.SEPAY_API_KEY;
    const authHeader = req.headers.authorization || req.headers["x-api-key"] || req.headers.apikey;
    if (apiKey) {
      const token = String(authHeader || "").replace(/^Apikey\s+/i, "").trim();
      if (token !== apiKey) {
        json(res, 401, { error: "Unauthorized SePay webhook" });
        return true;
      }
    }

    void readBody(req).then((raw) => {
      const payload = raw as SePayWebhookBody;
      const content = String(payload.transactionContent || payload.body || "");
      const match = content.match(/RAI2_[A-Z0-9]+/i);
      const amountIn = Number(payload.amountIn || 0);

      if (!match) {
        // Not our code, return 200 to acknowledge
        json(res, 200, { success: true, message: "Ignored, no matching RAI2 code in content" });
        return;
      }

      const code = match[0].toUpperCase();
      const updated = store.markPaid(
        code,
        String(payload.referenceNumber || payload.id || "REF_SEPAY"),
        String(payload.gateway || "BANK"),
        amountIn
      );

      if (updated) {
        json(res, 200, { success: true, code, status: "paid", expiresAt: updated.expiresAt });
      } else {
        json(res, 200, { success: true, message: `Code ${code} not found in pending orders` });
      }
    }).catch(() => json(res, 400, { error: "Malformed webhook payload" }));
    return true;
  }

  // 5. POST /api/auth/instant-access or /api/subscription/instant-access
  if ((path === "/api/auth/instant-access" || path === "/api/subscription/instant-access") && method === "POST") {
    void readBody(req).then((data) => {
      const body = data as { email?: string; tier?: string; code?: string; type?: string };
      const rawEmail = typeof body?.email === "string" ? body.email.trim() : "";
      if (!rawEmail || !rawEmail.includes("@")) {
        json(res, 400, { error: "Vui lòng nhập địa chỉ email hợp lệ" });
        return;
      }
      const email = rawEmail.toLowerCase();
      if (!sessions || !sessionCookieName) {
        json(res, 500, { error: "Auth registry is not initialized" });
        return;
      }

      // Record in store if trial or new order
      if (body.tier === "trial" || !body.tier) {
        store.createOrder("starter", email);
      }

      // Issue an authenticated session with full admin + client scopes for the user
      const issued = sessions.issue({
        label: `RAI² (${email})`,
        scopes: ["admin", "client"],
        userId: `rai2:${email}`,
      });

      const secure = requestOrigin(req)?.startsWith("https://") === true || req.headers["x-forwarded-proto"] === "https";
      const cookieStr = serializeSessionCookie(sessionCookieName, issued.token, {
        secure,
        maxAgeSeconds: cookieMaxAgeSeconds(issued.session),
      });

      res.setHeader("set-cookie", cookieStr);
      json(res, 200, {
        ok: true,
        redirectUrl: "/app",
        session: issued.session,
        token: issued.token,
        email,
      });
    }).catch((err) => {
      console.error("instant-access error:", err);
      json(res, 400, { error: err instanceof Error ? err.message : "Invalid request payload" });
    });
    return true;
  }

  return false;
}
