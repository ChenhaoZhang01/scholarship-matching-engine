# Scholarship Matching Engine

Match students to scholarships by **eligibility** and **fit**. Hard filters
remove awards the student can't win; a weighted score then ranks the rest by
how well they fit — with a transparent reason for every match and every block.

![stack](https://img.shields.io/badge/stack-Next.js%20·%20Supabase%20·%20OpenAI-1f6feb)

## How matching works

**Stage 1 — Eligibility (hard filters):** GPA minimum, major, class year,
state, citizenship, first-gen requirement. Failing any one blocks the award and
records *why*.

**Stage 2 — Fit score (0–100, eligible only):** weighted across
- GPA headroom above the minimum
- major targeting
- financial-need alignment (need-based vs merit)
- activity / interest overlap
- award size (log-scaled)
- first-gen bonus where applicable

Every contributing factor is surfaced as a human-readable reason. The engine is
pure, deterministic TypeScript in [`lib/matching.ts`](lib/matching.ts).

## Optional semantic re-ranking

Add an "about me" blurb and set `OPENAI_API_KEY` → the app embeds it against
each scholarship and blends cosine similarity into the score
([`lib/semantic.ts`](lib/semantic.ts)). No key → deterministic score stands.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Adjust the profile on the left; matches re-rank live. Toggle "show ineligible"
to see exactly which criteria block each award.

### Optional Supabase persistence

```bash
# apply supabase/schema.sql, then set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY
```

## Tests

```bash
npm test
```

Covers GPA / first-gen / state / citizenship eligibility blocks, that the
tightest-fit CS award ranks first, that higher financial need raises the score
on need-based awards, and that ineligible awards score 0 and are excluded.
