import { describe, expect, it } from "vitest";
import {
  validateOutgoingDraft,
  type OutgoingDraft,
} from "./silent-error-interceptor.ts";

describe("silent-error-interceptor", () => {
  it("approves clean, safe draft with margin >= 35%", () => {
    const draft: OutgoingDraft = {
      id: "draft-01",
      recipient: "khachhang@example.com",
      channel: "proposal",
      content: "Kính gửi quý đối tác bảng đề xuất giải pháp rút ngắn thời gian từ 14 ngày xuống 4 ngày.",
      quotedPrice: 100_000_000,
      costEstimate: 60_000_000, // 40% margin
      discountPercent: 0,
      deliveryDaysCommitment: 10,
      maxDeliveryCapacityDays: 7,
    };

    const result = validateOutgoingDraft(draft);

    expect(result.passed).toBe(true);
    expect(result.status).toBe("APPROVED");
    expect(result.confidenceScore).toBe(100);
    expect(result.violations).toHaveLength(0);
    expect(result.calculatedMargin).toBe(0.4);
  });

  it("blocks draft when margin falls below 35%", () => {
    const draft: OutgoingDraft = {
      id: "draft-02",
      recipient: "khachhang@example.com",
      channel: "proposal",
      content: "Báo giá hữu nghị cho đối tác.",
      quotedPrice: 100_000_000,
      costEstimate: 80_000_000, // 20% margin (< 35%)
    };

    const result = validateOutgoingDraft(draft);

    expect(result.passed).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.violations.some((v) => v.code === "MARGIN_BELOW_MINIMUM")).toBe(true);
  });

  it("escalates to HITL when anti-phrases or forbidden words are detected", () => {
    const draft: OutgoingDraft = {
      id: "draft-03",
      recipient: "khachhang@example.com",
      channel: "email",
      content: "Chúng tôi cam kết mang lại giải pháp toàn diện và tận dụng chuyên môn đỉnh cao.",
    };

    const result = validateOutgoingDraft(draft);

    expect(result.passed).toBe(false);
    expect(result.status).toBe("ESCALATE_TO_HITL");
    expect(result.violations.some((v) => v.code === "FORBIDDEN_ANTI_PHRASE")).toBe(true);
    expect(result.confidenceScore).toBeLessThan(85);
  });

  it("blocks draft when unparsed placeholder or localhost link is detected", () => {
    const draft: OutgoingDraft = {
      id: "draft-04",
      recipient: "khachhang@example.com",
      channel: "email",
      content: "Vui lòng xem chi tiết hợp đồng tại [Chèn link tại đây] hoặc gọi {phone}.",
    };

    const result = validateOutgoingDraft(draft);

    expect(result.passed).toBe(false);
    expect(result.status).toBe("BLOCKED");
    expect(result.violations.some((v) => v.code === "UNRESOLVED_PLACEHOLDER")).toBe(true);
  });

  it("flags delivery SLA breach if commitment is faster than operational capacity", () => {
    const draft: OutgoingDraft = {
      id: "draft-05",
      recipient: "khachhang@example.com",
      channel: "proposal",
      content: "Chúng tôi sẽ hoàn thành toàn bộ gói trong 3 ngày.",
      deliveryDaysCommitment: 3,
      maxDeliveryCapacityDays: 7, // Capacity requires 7 days
    };

    const result = validateOutgoingDraft(draft);

    expect(result.violations.some((v) => v.code === "DELIVERY_SLA_BREACH")).toBe(true);
    expect(result.status).toBe("ESCALATE_TO_HITL");
  });
});
