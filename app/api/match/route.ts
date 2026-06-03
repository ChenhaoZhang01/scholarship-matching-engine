import { NextRequest, NextResponse } from "next/server";
import { matchAll, StudentProfile } from "@/lib/matching";
import { SCHOLARSHIPS } from "@/lib/scholarships";
import { semanticRerank } from "@/lib/semantic";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { profile: StudentProfile; blurb?: string };
  let results = matchAll(body.profile, SCHOLARSHIPS, { includeIneligible: false });
  if (body.blurb) results = await semanticRerank(body.blurb, results);
  return NextResponse.json({ results });
}
