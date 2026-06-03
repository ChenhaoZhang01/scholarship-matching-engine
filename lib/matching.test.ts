import { describe, it, expect } from "vitest";
import { evaluate, matchAll, StudentProfile } from "./matching";
import { SCHOLARSHIPS } from "./scholarships";

const csStudent: StudentProfile = {
  gpa: 3.8,
  major: "computer science",
  year: "junior",
  state: "california",
  citizenship: "us",
  financialNeed: 0.3,
  firstGen: false,
  activities: ["coding", "open source", "hackathons", "robotics"],
};

describe("eligibility", () => {
  it("blocks below-minimum GPA", () => {
    const low = { ...csStudent, gpa: 2.5 };
    const r = evaluate(low, SCHOLARSHIPS.find((s) => s.id === "stem-women")!);
    expect(r.eligible).toBe(false);
    expect(r.blockers.some((b) => b.includes("GPA"))).toBe(true);
  });

  it("blocks first-gen-only awards for non-first-gen students", () => {
    const r = evaluate(csStudent, SCHOLARSHIPS.find((s) => s.id === "first-gen-grant")!);
    expect(r.eligible).toBe(false);
    expect(r.blockers.some((b) => b.includes("first-generation"))).toBe(true);
  });

  it("blocks wrong-state regional awards", () => {
    const tx = { ...csStudent, state: "texas" };
    const r = evaluate(tx, SCHOLARSHIPS.find((s) => s.id === "ca-future-leaders")!);
    expect(r.eligible).toBe(false);
  });

  it("blocks international-only awards for US students", () => {
    const r = evaluate(csStudent, SCHOLARSHIPS.find((s) => s.id === "global-scholars")!);
    expect(r.eligible).toBe(false);
  });
});

describe("fit scoring", () => {
  it("ranks the tightest-fit CS award at the top", () => {
    const ranked = matchAll(csStudent, SCHOLARSHIPS);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked[0].scholarship.id).toBe("cs-innovators");
    expect(ranked[0].score).toBeGreaterThan(50);
  });

  it("rewards higher financial need on need-based awards", () => {
    const lowNeed = evaluate(
      { ...csStudent, financialNeed: 0.1 },
      SCHOLARSHIPS.find((s) => s.id === "community-service")!
    );
    const highNeed = evaluate(
      { ...csStudent, financialNeed: 0.9 },
      SCHOLARSHIPS.find((s) => s.id === "community-service")!
    );
    expect(highNeed.score).toBeGreaterThan(lowNeed.score);
  });

  it("ineligible awards score 0 and are excluded by default", () => {
    const all = matchAll(csStudent, SCHOLARSHIPS, { includeIneligible: true });
    const ineligible = all.filter((r) => !r.eligible);
    expect(ineligible.every((r) => r.score === 0)).toBe(true);
    const defaultList = matchAll(csStudent, SCHOLARSHIPS);
    expect(defaultList.every((r) => r.eligible)).toBe(true);
  });
});
