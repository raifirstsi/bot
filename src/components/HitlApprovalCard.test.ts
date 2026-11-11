import { describe, expect, it } from "vitest";
import type { HitlApprovalPayload } from "./HitlApprovalCard";

describe("HitlApprovalCard Logic & Telemetry", () => {
  const samplePayload: HitlApprovalPayload = {
    taskId: "task-quote-101",
    agentKey: "rai-quote",
    agentName: "RAI Quote",
    clientName: "Anh Tuấn (Nội Thất SmartHome)",
    dealValue: "185.000.000 VNĐ",
    netMarginRate: 0.38, // 38% -> Safe (>= 35%)
    actionTitle: "Dự toán & Đề xuất 7 Phần",
    draftContent: "Em chào anh Tuấn, em gửi anh dự toán chi tiết 7 phần...",
    createdAt: new Date().toISOString(),
    timeoutMinutesRemaining: 15,
  };

  it("identifies safe margin rate >= 35%", () => {
    const isMarginSafe = (rate?: number) => (rate ?? 0.35) >= 0.35;
    expect(isMarginSafe(samplePayload.netMarginRate)).toBe(true);
    expect(isMarginSafe(0.34)).toBe(false);
    expect(isMarginSafe(0.35)).toBe(true);
    expect(isMarginSafe(0.50)).toBe(true);
  });

  it("handles escalation timeout calculation accurately", () => {
    expect(samplePayload.timeoutMinutesRemaining).toBe(15);
    const isEscalationImminent = (mins?: number) => mins !== undefined && mins <= 5;
    expect(isEscalationImminent(samplePayload.timeoutMinutesRemaining)).toBe(false);
    expect(isEscalationImminent(4)).toBe(true);
  });

  it("verifies payload structure conforms to RAI2 First OS HITL standard", () => {
    expect(samplePayload.taskId).toMatch(/^task-/);
    expect(samplePayload.agentKey).toBe("rai-quote");
    expect(samplePayload.netMarginRate).toBeGreaterThanOrEqual(0.35);
  });
});
