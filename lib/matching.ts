/**
 * Scholarship matching engine.
 *
 * Two stages:
 *   1. ELIGIBILITY — hard filters. If the student fails a required criterion
 *      (min GPA, wrong major, wrong year, citizenship), the scholarship is
 *      either excluded or flagged ineligible.
 *   2. FIT SCORE — among eligible scholarships, a weighted score (0..100)
 *      rewards tight fit: major overlap, demonstrated need matching the
 *      award's intent, activity/interest overlap, and award size.
 *
 * Pure + deterministic + tested. An optional semantic essay-match (OpenAI
 * embeddings) can be layered on via lib/semantic.ts.
 */

export interface StudentProfile {
  gpa: number; // 0..4
  major: string;
  year: "freshman" | "sophomore" | "junior" | "senior" | "graduate";
  state: string;
  citizenship: "us" | "permanent_resident" | "international";
  financialNeed: number; // 0..1 (1 = high need)
  genderIdentity?: string;
  ethnicity?: string;
  firstGen: boolean;
  activities: string[]; // e.g. ["robotics", "debate", "volunteering"]
}

export interface Scholarship {
  id: string;
  name: string;
  amount: number;
  minGpa: number;
  majors: string[]; // empty = any major
  years: StudentProfile["year"][]; // empty = any year
  states: string[]; // empty = any state
  citizenship: StudentProfile["citizenship"][]; // empty = any
  needBased: boolean;
  firstGenOnly: boolean;
  targetActivities: string[]; // empty = any
  tags: string[];
}

export interface MatchResult {
  scholarship: Scholarship;
  eligible: boolean;
  score: number; // 0..100 fit score (0 if ineligible)
  reasons: string[];
  blockers: string[];
}

function ci(s: string) {
  return s.trim().toLowerCase();
}

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b.map(ci));
  return a.filter((x) => setB.has(ci(x)));
}

export function evaluate(student: StudentProfile, s: Scholarship): MatchResult {
  const blockers: string[] = [];
  const reasons: string[] = [];

  if (student.gpa < s.minGpa) blockers.push(`GPA ${student.gpa} < required ${s.minGpa}`);
  if (s.majors.length && !s.majors.map(ci).includes(ci(student.major)))
    blockers.push(`major "${student.major}" not in eligible list`);
  if (s.years.length && !s.years.includes(student.year))
    blockers.push(`year "${student.year}" not eligible`);
  if (s.states.length && !s.states.map(ci).includes(ci(student.state)))
    blockers.push(`state "${student.state}" not eligible`);
  if (s.citizenship.length && !s.citizenship.includes(student.citizenship))
    blockers.push(`citizenship not eligible`);
  if (s.firstGenOnly && !student.firstGen)
    blockers.push(`restricted to first-generation students`);

  const eligible = blockers.length === 0;

  // ---- weighted fit score (only meaningful when eligible) ----
  let score = 0;
  const W = { gpa: 22, major: 24, need: 22, activities: 18, amount: 8, firstGen: 6 };

  // GPA headroom: reward exceeding the bar, saturating.
  const gpaHeadroom = Math.min(1, (student.gpa - s.minGpa) / 1.0);
  score += W.gpa * Math.max(0, gpaHeadroom);
  if (gpaHeadroom > 0.3) reasons.push(`GPA comfortably above the ${s.minGpa} minimum`);

  // Major fit
  if (s.majors.length === 0) {
    score += W.major * 0.5; // open to any major: partial credit
  } else if (s.majors.map(ci).includes(ci(student.major))) {
    score += W.major;
    reasons.push(`major "${student.major}" directly targeted`);
  }

  // Financial need alignment
  if (s.needBased) {
    score += W.need * student.financialNeed;
    if (student.financialNeed > 0.5) reasons.push("strong demonstrated financial need");
  } else {
    score += W.need * 0.5; // merit award: need-neutral partial credit
  }

  // Activity / interest overlap
  if (s.targetActivities.length === 0) {
    score += W.activities * 0.4;
  } else {
    const shared = overlap(student.activities, s.targetActivities);
    const frac = shared.length / s.targetActivities.length;
    score += W.activities * Math.min(1, frac);
    if (shared.length) reasons.push(`activity overlap: ${shared.join(", ")}`);
  }

  // Award size (log-scaled so a $50k award doesn't swamp everything)
  score += W.amount * Math.min(1, Math.log10(Math.max(1, s.amount)) / 5);

  // First-gen bonus when applicable
  if (s.firstGenOnly && student.firstGen) {
    score += W.firstGen;
    reasons.push("first-generation eligibility met");
  }

  return {
    scholarship: s,
    eligible,
    score: eligible ? Math.round(score * 10) / 10 : 0,
    reasons,
    blockers,
  };
}

export interface MatchOptions {
  includeIneligible?: boolean;
  limit?: number;
}

export function matchAll(
  student: StudentProfile,
  scholarships: Scholarship[],
  opts: MatchOptions = {}
): MatchResult[] {
  const results = scholarships
    .map((s) => evaluate(student, s))
    .filter((r) => opts.includeIneligible || r.eligible)
    .sort((a, b) => b.score - a.score || b.scholarship.amount - a.scholarship.amount);
  return opts.limit ? results.slice(0, opts.limit) : results;
}
