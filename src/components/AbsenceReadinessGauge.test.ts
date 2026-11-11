import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AbsenceReadinessGauge, computeAbsenceReadiness } from "./AbsenceReadinessGauge";
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
      const result = computeAbsenceReadiness(["rai-quote", "rai-close", "rai-task", "rai-qc"]);
      expect(result.overallScore).toBeGreaterThan(30);
      const salesZone = result.zones.find((zone) => zone.code === "ZONE_3_SALES");
      expect(salesZone?.activeAgentsCount).toBe(2);
      expect(salesZone?.autonomy).toBe(1);
    });

    it("achieves Level 3 (Absence Ready) when all 13 digital workers are active", () => {
      const allAgentKeys = RAI2_DEPARTMENTS.flatMap((department) => department.agents.map((agent) => agent.key));
      expect(allAgentKeys.length).toBe(13);
      const result = computeAbsenceReadiness(allAgentKeys);
      expect(result.overallScore).toBeGreaterThanOrEqual(80);
      expect(result.level.title).toContain("Cấp độ 3");
      expect(result.gapAlerts).toEqual([]);
    });

    it("correctly identifies critical gap alerts for unstaffed heavy-weight zones", () => {
      const result = computeAbsenceReadiness(["rai-talent", "rai-coach"]);
      const salesGap = result.gapAlerts.find((gap) => gap.deptCode === "ZONE_3_SALES");
      expect(salesGap).toBeDefined();
      expect(salesGap?.reason).toContain("20%");
    });
  });
});

describe("AbsenceReadinessGauge", () => {
  it("keeps the dashboard summary neutral and icon-free", () => {
    const markup = renderToStaticMarkup(createElement(AbsenceReadinessGauge, {
      activeBotIds: [],
      onHireDepartment: () => undefined,
      onOpenFingerprint: () => undefined,
      onOpenTocDiagnostic: () => undefined,
      onOpenContextVault: () => undefined,
    }));

    expect(markup).toContain('data-absence-readiness=""');
    expect(markup).toContain("ui-button");
    expect(markup).not.toContain("<svg");
    expect(markup).not.toMatch(/(?:rose|emerald|amber)-/);
    expect(markup.match(/data-readiness-zone=/g)).toHaveLength(7);
    expect(markup.match(/phòng ban trọng yếu chưa có nhân sự số phụ trách/g)).toHaveLength(1);
  });

  it("uses plain status labels at the readiness extremes", () => {
    expect(computeAbsenceReadiness([]).level.status).toBe("Điểm nghẽn");
    const allAgentKeys = RAI2_DEPARTMENTS.flatMap((department) => department.agents.map((agent) => agent.key));
    expect(computeAbsenceReadiness(allAgentKeys).level.status).toBe("Sẵn sàng");
  });
});
