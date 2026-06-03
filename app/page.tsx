"use client";

import { useMemo, useState } from "react";
import { matchAll, StudentProfile } from "@/lib/matching";
import { SCHOLARSHIPS } from "@/lib/scholarships";

const DEFAULT: StudentProfile = {
  gpa: 3.8,
  major: "computer science",
  year: "junior",
  state: "california",
  citizenship: "us",
  financialNeed: 0.4,
  firstGen: false,
  activities: ["coding", "robotics", "volunteering"],
};

const inputStyle = {
  width: "100%", background: "#0d1117", color: "#e6edf3",
  border: "1px solid #30363d", borderRadius: 6, padding: 8, boxSizing: "border-box" as const,
};

export default function Home() {
  const [p, setP] = useState<StudentProfile>(DEFAULT);
  const [showIneligible, setShowIneligible] = useState(false);
  const results = useMemo(
    () => matchAll(p, SCHOLARSHIPS, { includeIneligible: showIneligible }),
    [p, showIneligible]
  );

  const set = <K extends keyof StudentProfile>(k: K, v: StudentProfile[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      <h1>🎓 Scholarship Matching Engine</h1>
      <p style={{ color: "#8b949e" }}>
        Eligibility filtering + weighted fit scoring across {SCHOLARSHIPS.length} scholarships.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        <div style={{ display: "grid", gap: 10 }}>
          <label>GPA<input style={inputStyle} type="number" step={0.1} value={p.gpa} onChange={(e) => set("gpa", +e.target.value)} /></label>
          <label>Major<input style={inputStyle} value={p.major} onChange={(e) => set("major", e.target.value)} /></label>
          <label>Year
            <select style={inputStyle} value={p.year} onChange={(e) => set("year", e.target.value as StudentProfile["year"])}>
              {["freshman", "sophomore", "junior", "senior", "graduate"].map((y) => <option key={y}>{y}</option>)}
            </select>
          </label>
          <label>State<input style={inputStyle} value={p.state} onChange={(e) => set("state", e.target.value)} /></label>
          <label>Citizenship
            <select style={inputStyle} value={p.citizenship} onChange={(e) => set("citizenship", e.target.value as StudentProfile["citizenship"])}>
              <option value="us">US citizen</option>
              <option value="permanent_resident">Permanent resident</option>
              <option value="international">International</option>
            </select>
          </label>
          <label>Financial need: {p.financialNeed.toFixed(1)}
            <input type="range" min={0} max={1} step={0.1} value={p.financialNeed} onChange={(e) => set("financialNeed", +e.target.value)} style={{ width: "100%" }} />
          </label>
          <label><input type="checkbox" checked={p.firstGen} onChange={(e) => set("firstGen", e.target.checked)} /> First-generation student</label>
          <label>Activities (comma-separated)
            <input style={inputStyle} value={p.activities.join(", ")} onChange={(e) => set("activities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
          </label>
          <label><input type="checkbox" checked={showIneligible} onChange={(e) => setShowIneligible(e.target.checked)} /> Show ineligible (with reasons)</label>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {results.map((r) => (
            <div key={r.scholarship.id} style={{
              background: "#161b22", border: `1px solid ${r.eligible ? "#30363d" : "#6e2222"}`,
              borderRadius: 10, padding: 16, opacity: r.eligible ? 1 : 0.6,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0 }}>{r.scholarship.name}</h3>
                <span style={{ fontWeight: 700, color: "#3fb950" }}>
                  ${r.scholarship.amount.toLocaleString()}
                </span>
              </div>
              {r.eligible ? (
                <>
                  <div style={{ margin: "8px 0" }}>
                    <div style={{ height: 8, background: "#0d1117", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${r.score}%`, height: "100%", background: "#1f6feb" }} />
                    </div>
                    <small style={{ color: "#8b949e" }}>Fit score {r.score}/100</small>
                  </div>
                  <ul style={{ color: "#8b949e", fontSize: 13, margin: "4px 0" }}>
                    {r.reasons.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </>
              ) : (
                <ul style={{ color: "#f85149", fontSize: 13 }}>
                  {r.blockers.map((x) => <li key={x}>{x}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
