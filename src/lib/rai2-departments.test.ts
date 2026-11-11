import { describe, expect, it } from "vitest";
import { RAI2_DEPARTMENTS, getAgentByKey } from "./rai2-departments";

describe("RAI2 Departments & Workforce Registry", () => {
  it("defines exactly 7 departments spanning Zones 1 to 7", () => {
    expect(RAI2_DEPARTMENTS.length).toBe(7);
    const zones = RAI2_DEPARTMENTS.map((d) => d.zone).sort((a, b) => a - b);
    expect(zones).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("contains exactly 13 digital workers across the 7 departments", () => {
    const allAgents = RAI2_DEPARTMENTS.flatMap((d) => d.agents);
    expect(allAgents.length).toBe(13);

    // Verify uniqueness of keys
    const keys = allAgents.map((a) => a.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(13);
  });

  it("ensures every agent has prebaked 80% DNA and a measurable KPI commitment", () => {
    const allAgents = RAI2_DEPARTMENTS.flatMap((d) => d.agents);
    for (const agent of allAgents) {
      expect(agent.name).toBeTruthy();
      expect(agent.title).toBeTruthy();
      expect(agent.tagline).toBeTruthy();
      expect(agent.painPoint).toBeTruthy();
      expect(agent.prebakedDna.length).toBeGreaterThanOrEqual(2);
      expect(agent.kpiCommitment).toBeTruthy();
      expect(agent.color).toBeTruthy();
    }
  });

  it("retrieves agents correctly by key via getAgentByKey", () => {
    const closer = getAgentByKey("rai-close");
    expect(closer).toBeDefined();
    expect(closer?.name).toBe("RAI Close");
    expect(closer?.departmentCode).toBe("ZONE_3_SALES");

    const nonExistent = getAgentByKey("unknown-agent");
    expect(nonExistent).toBeUndefined();
  });
});
