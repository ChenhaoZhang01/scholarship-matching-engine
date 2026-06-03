/**
 * Optional semantic re-ranking with OpenAI embeddings. If a student writes a
 * short "about me" blurb and OPENAI_API_KEY is set, we embed it against each
 * scholarship's description and blend cosine similarity into the fit score.
 * Without a key this is a no-op and the deterministic score stands.
 */

import type { MatchResult } from "./matching";

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export async function semanticRerank(
  blurb: string,
  results: MatchResult[],
  weight = 0.25
): Promise<MatchResult[]> {
  if (!process.env.OPENAI_API_KEY || !blurb.trim()) return results;
  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI();
    const texts = [
      blurb,
      ...results.map((r) => `${r.scholarship.name}. Tags: ${r.scholarship.tags.join(", ")}.`),
    ];
    const emb = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    const [studentVec, ...schVecs] = emb.data.map((d) => d.embedding);
    return results
      .map((r, i) => {
        const sim = cosine(studentVec, schVecs[i]); // -1..1
        const blended = r.score * (1 - weight) + ((sim + 1) / 2) * 100 * weight;
        return { ...r, score: Math.round(blended * 10) / 10 };
      })
      .sort((a, b) => b.score - a.score);
  } catch {
    return results; // network/key issues: fall back gracefully
  }
}
