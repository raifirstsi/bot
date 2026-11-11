import { describe, expect, it } from "vitest";
import {
  CONTEXT_PILLARS,
  distillUnscriptedKnowledge,
  routeContextForTask,
  scoreContextSharpness,
} from "./context-vault.ts";

describe("context-vault", () => {
  it("defines all 8 core context pillars with required metadata", () => {
    const keys = Object.keys(CONTEXT_PILLARS);
    expect(keys).toHaveLength(8);
    expect(keys).toContain("brand_voice");
    expect(keys).toContain("customer_avatar");
    expect(keys).toContain("offer_breakdown");
    expect(keys).toContain("competitive_positioning");
    expect(keys).toContain("sales_process");
    expect(keys).toContain("case_studies");
    expect(keys).toContain("sops");
    expect(keys).toContain("industry_context");
  });

  describe("scoreContextSharpness", () => {
    it("returns zero score for empty content", () => {
      const result = scoreContextSharpness("");
      expect(result.score).toBe(0);
      expect(result.isSharp).toBe(false);
      expect(result.feedback[0]).toContain("trống");
    });

    it("penalizes vague corporate jargon and warns", () => {
      const vagueDoc = `
        Chúng tôi là đơn vị chuyên nghiệp, tận tâm và uy tín hàng đầu trong lĩnh vực mang lại giải pháp toàn diện.
        Chúng tôi tự hào mang đến chất lượng cao đỉnh cao thế giới.
      `;
      const result = scoreContextSharpness(vagueDoc);
      expect(result.flaggedJargon.length).toBeGreaterThanOrEqual(3);
      expect(result.score).toBeLessThan(70);
      expect(result.isSharp).toBe(false);
    });

    it("scores high (>=85) for concrete, metric-rich documents with anti-phrases", () => {
      const sharpDoc = `
        # BRAND VOICE DNA
        Chúng tôi cam kết mang lại hiệu quả đo lường được cho doanh nghiệp SME quy mô 5-20 người.
        Thời gian báo giá rút ngắn từ 14 ngày xuống còn 4 giờ làm việc.
        Biên lợi nhuận ròng luôn được bảo toàn ở mức >= 35% trên mỗi hợp đồng.
        Tỷ lệ chốt đơn tăng từ 22% lên 48% sau 30 ngày triển khai.
        Danh sách từ cấm (Anti-phrases): Tuyệt đối không dùng các từ sáo rỗng.
        Đội ngũ tập trung vào kết quả dòng tiền thay vì làm việc cơ bắp 60 giờ mỗi tuần.
      `;
      const result = scoreContextSharpness(sharpDoc);
      expect(result.metricsFound.length).toBeGreaterThanOrEqual(3);
      expect(result.antiPhrasesFound.length).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.isSharp).toBe(true);
    });
  });

  describe("distillUnscriptedKnowledge", () => {
    it("distills raw monologue into structured SOUL, MEMORY, and RULES", () => {
      const rawMonologue = `
        Tôi muốn báo giá cho khách phải đạt biên lợi nhuận ròng ít nhất 35%.
        Nếu khách hàng đòi giảm giá thì mình phải giảm phạm vi công việc chứ không được giảm tiền.
        Các bạn kinh doanh không được hứa trước khi kỹ thuật xác nhận công suất.
      `;
      const distilled = distillUnscriptedKnowledge(rawMonologue);

      expect(distilled.detectedPillar).toBe("offer_breakdown");
      expect(distilled.soul).toContain("SOUL.MD");
      expect(distilled.memory).toContain("MEMORY.MD");
      expect(distilled.rules).toContain("RULE-01");
      expect(distilled.summary).toContain("Đã chắt lọc thành công");
    });
  });

  describe("routeContextForTask", () => {
    it("extracts only task-relevant pillars and reduces token overhead", () => {
      const routed = routeContextForTask("proposal", {
        offer_breakdown: "Offer details and pricing",
        brand_voice: "Active voice only",
      });

      expect(routed.activePillars).toEqual([
        "offer_breakdown",
        "brand_voice",
        "sales_process",
        "case_studies",
      ]);
      expect(routed.combinedContext).toContain("Offer & Transformation");
      expect(routed.tokensSavedEstimate).toBeGreaterThanOrEqual(0);
    });
  });
});
