import { describe, it, expect } from "vitest";
import { RAI2_DEPARTMENTS } from "@/lib/rai2-departments";

describe("HireAgentDialog - Data & Department Mapping", () => {
  it("has all 7 business zones populated with agents", () => {
    expect(RAI2_DEPARTMENTS.length).toBe(7);
    for (let zone = 1; zone <= 7; zone++) {
      const dept = RAI2_DEPARTMENTS.find((d) => d.zone === zone);
      expect(dept).toBeDefined();
      expect(dept!.agents.length).toBeGreaterThan(0);
    }
  });

  it("ensures every agent has complete profile details for mobile cards", () => {
    for (const dept of RAI2_DEPARTMENTS) {
      for (const agent of dept.agents) {
        expect(agent.name).toBeTruthy();
        expect(agent.title).toBeTruthy();
        expect(agent.tagline).toBeTruthy();
        expect(agent.painPoint).toBeTruthy();
        expect(agent.kpiCommitment).toBeTruthy();
        expect(agent.prebakedDna.length).toBeGreaterThan(0);
        expect(agent.zone).toBe(dept.zone);
      }
    }
  });
});
