import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SubscriptionStore, RAI2_PLANS } from "./sepay.ts";

describe("SePay Subscription System for RAI²", () => {
  let tempDir: string;
  let store: SubscriptionStore;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rai2-sepay-test-"));
    store = new SubscriptionStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("loads default RAI² plans correctly", () => {
    expect(RAI2_PLANS).toHaveLength(3);
    expect(RAI2_PLANS.map((p) => p.tier)).toEqual(["starter", "pro", "team"]);
    expect(RAI2_PLANS[0]!.priceVnd).toBe(299000);
    expect(RAI2_PLANS[1]!.priceVnd).toBe(699000);
    expect(RAI2_PLANS[2]!.priceVnd).toBe(1890000);
  });

  it("creates a pending subscription order with unique RAI2_ code", () => {
    const order = store.createOrder("pro", "sme@business.vn");
    expect(order.tier).toBe("pro");
    expect(order.amount).toBe(699000);
    expect(order.status).toBe("pending");
    expect(order.customerEmail).toBe("sme@business.vn");
    expect(order.code).toMatch(/^RAI2_[A-F0-9]{8}$/);

    const retrieved = store.getByCode(order.code);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(order.id);
  });

  it("handles SePay webhook payment confirmation and extends expiration", () => {
    const order = store.createOrder("starter", "ceo@startup.vn");
    expect(order.status).toBe("pending");

    const updated = store.markPaid(order.code, "FT261110001", "MBBank", 299000);
    expect(updated).not.toBeNull();
    expect(updated?.status).toBe("paid");
    expect(updated?.transactionRef).toBe("FT261110001");
    expect(updated?.gateway).toBe("MBBank");
    expect(updated?.paidAt).toBeGreaterThan(0);
    expect(updated?.expiresAt).toBeGreaterThan(Date.now() + 30 * 86400000);

    const reloadedStore = new SubscriptionStore(tempDir);
    const persisted = reloadedStore.getByCode(order.code);
    expect(persisted?.status).toBe("paid");
  });
});
