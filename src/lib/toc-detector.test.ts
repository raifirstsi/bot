import { describe, it, expect } from "vitest";
import { diagnoseBusinessConstraint, type TocDiagnosticInput } from "./toc-detector";

describe("TOC Constraint Detector & 5-Lever P&L Engine", () => {
  it("enforces Upstream Validation Gate when delivery capacity > 85%", () => {
    const input: TocDiagnosticInput = {
      hasBacklogOver48h: true,
      ownerHoursPerWeekSpentOnOperations: 5,
      deliveryCapacityUtilization: 92, // > 85%
      quoteTurnaroundDays: 2,
      currentMonthlyRevenue: 500_000_000,
      currentNetMargin: 25,
    };

    const result = diagnoseBusinessConstraint(input);
    expect(result.constraintType).toBe("DELIVERY_BOTTLENECK");
    expect(result.zoneNumber).toBe(4);
    expect(result.upstreamBlockWarning).toBeDefined();
    // Marketing lead growth must be locked to 0% because delivery is clogged
    expect(result.levers.lever1MarketingLeadGrowth).toBe(0);
    expect(result.recommendedAgentKey).toBe("rai-task");
  });

  it("identifies Sales Quoting as the single binding constraint when turnaround >= 3 days", () => {
    const input: TocDiagnosticInput = {
      hasBacklogOver48h: true,
      backlogDepartment: "ZONE_3_SALES",
      ownerHoursPerWeekSpentOnOperations: 6,
      deliveryCapacityUtilization: 60,
      quoteTurnaroundDays: 5, // slow quote (Case Joel)
      currentMonthlyRevenue: 400_000_000,
      currentNetMargin: 20,
    };

    const result = diagnoseBusinessConstraint(input);
    expect(result.constraintType).toBe("SALES_QUOTING_BOTTLENECK");
    expect(result.zoneNumber).toBe(3);
    expect(result.recommendedAgentKey).toBe("rai-quote");
    expect(result.urgencyLevel).toBe("CRITICAL");
  });

  it("detects Founder MeOS trap when owner spends >= 10h/week on operations", () => {
    const input: TocDiagnosticInput = {
      hasBacklogOver48h: false,
      ownerHoursPerWeekSpentOnOperations: 18, // >= 10h
      deliveryCapacityUtilization: 70,
      quoteTurnaroundDays: 1,
      currentMonthlyRevenue: 300_000_000,
      currentNetMargin: 22,
    };

    const result = diagnoseBusinessConstraint(input);
    expect(result.constraintType).toBe("OWNER_TIME_SINK_BOTTLENECK");
    expect(result.zoneNumber).toBe(1);
    expect(result.recommendedAgentKey).toBe("rai-strategy");
  });

  it("calculates 5-Lever P&L compounding flywheel and protects net margin >= 35%", () => {
    const input: TocDiagnosticInput = {
      hasBacklogOver48h: false,
      ownerHoursPerWeekSpentOnOperations: 4,
      deliveryCapacityUtilization: 50,
      quoteTurnaroundDays: 1,
      currentMonthlyRevenue: 200_000_000,
      currentNetMargin: 15,
    };

    const result = diagnoseBusinessConstraint(input);
    expect(result.constraintType).toBe("MARKETING_LEAD_BOTTLENECK");
    expect(result.levers.projectedNetMargin).toBeGreaterThanOrEqual(35);
    expect(result.levers.projectedMonthlyRevenue).toBeGreaterThan(input.currentMonthlyRevenue);
    expect(result.levers.projectedMonthlyProfit).toBeGreaterThan(0);
    expect(result.levers.lever5ReinvestmentPool).toBeGreaterThan(0);
  });
});
