import { describe, it, expect } from "vitest";
import { RAI2_DEPARTMENTS } from "@/lib/rai2-departments";
import { diagnoseBusinessConstraint } from "@/lib/toc-detector";

describe("TocConstraintModal - Integration & Agent Linking", () => {
  it("resolves recommended agent keys to existing agents in 7 departments", () => {
    const testCases = [
      { deliveryCapacityUtilization: 95, quoteTurnaroundDays: 2, ownerHoursPerWeekSpentOnOperations: 5 },
      { deliveryCapacityUtilization: 50, quoteTurnaroundDays: 5, ownerHoursPerWeekSpentOnOperations: 5 },
      { deliveryCapacityUtilization: 50, quoteTurnaroundDays: 1, ownerHoursPerWeekSpentOnOperations: 15 },
      { deliveryCapacityUtilization: 50, quoteTurnaroundDays: 1, ownerHoursPerWeekSpentOnOperations: 3 },
    ];

    const allAgentKeys = new Set(
      RAI2_DEPARTMENTS.flatMap((d) => d.agents.map((a) => a.key))
    );

    for (const tc of testCases) {
      const diag = diagnoseBusinessConstraint({
        hasBacklogOver48h: true,
        deliveryCapacityUtilization: tc.deliveryCapacityUtilization,
        quoteTurnaroundDays: tc.quoteTurnaroundDays,
        ownerHoursPerWeekSpentOnOperations: tc.ownerHoursPerWeekSpentOnOperations,
        currentMonthlyRevenue: 300_000_000,
        currentNetMargin: 20,
      });

      expect(allAgentKeys.has(diag.recommendedAgentKey)).toBe(true);
      expect(diag.urgencyLevel).toBeTruthy();
      expect(diag.levers.projectedNetMargin).toBeGreaterThanOrEqual(35);
    }
  });
});
