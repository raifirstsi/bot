import { describe, expect, it } from "vitest";
import { computeAbsenceReadiness } from "./AbsenceReadinessGauge";
import { RAI2_DEPARTMENTS } from "@/lib/rai2-departments";

describe("AbsenceReadinessGauge - Algorithm & Logic", () => {
  describe("computeAbsenceReadiness algorithm", () => {
    it("returns level 1 founder bottleneck when no agents are active", () => {
      const result = computeAbsenceReadiness([]);
      expect(result.overallScore).toBe(0);
      expect(result.level.title).toContain("Cấp độ 1");
      expect(result.gapAlerts.length).toBeGreaterThan(0);
    });

    it("increases score as key departments are staffed", () => {
      // Staff Sales (rai-quote, rai-close) and Operations (rai-task, rai-qc)
      const result = computeAbsenceReadiness(["rai-quote", "rai-close", "rai-task", "rai-qc"]);
      expect(result.overallScore).toBeGreaterThan(30);
      const salesZone = result.zones.find((z) => z.code === "ZONE_3_SALES");
      expect(salesZone?.activeAgentsCount).toBe(2);
      expect(salesZone?.autonomy).toBe(1);
    });

    it("achieves Level 3 (Absence Ready) when all 13 digital workers are active", () => {
      const allAgentKeys = RAI2_DEPARTMENTS.flatMap((d) => d.agents.map((a) => a.key));
      expect(allAgentKeys.length).toBe(13);
      const result = computeAbsenceReadiness(allAgentKeys);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.level.title).toContain("Cấp độ 3");
      expect(result.gapAlerts).toEqual([]);
    });

    it("correctly identifies critical gap alerts for unstaffed heavy-weight zones", () => {
      // Only staff HR (weight 0.05)
      const result = computeAbsenceReadiness(["rai-talent", "rai-coach"]);
      const salesGap = result.gapAlerts.find((g) => g.deptCode === "ZONE_3_SALES");
      expect(salesGap).toBeDefined();
      expect(salesGap?.reason).toContain("20%");
    });
  });
});
