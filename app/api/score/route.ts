import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";
import { scoreLocal } from "@/lib/scoring";
import { buildBlanks, wordsMatch } from "@/lib/blanks";

const CLEAN_FEEDBACK = ["nice, got it word for word.", "spot on.", "clean, you heard all of it."];

export async function POST(req: Request) {
  const body = await req.json();
  const { clipId } = body;
  if (!clipId) {
    return NextResponse.json({ error: "clipId is required" }, { status: 400 });
  }

  const rows = await db
    .select({ transcript: clips.transcript })
    .from(clips)
    .where(eq(clips.id, clipId))
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "clip not found" }, { status: 404 });
  }
  const reference = rows[0].transcript;

  if (body.mode === "blanks") {
    const guesses: string[] = Array.isArray(body.guesses) ? body.guesses : [];
    const { answers } = buildBlanks(reference);
    const blankResults = answers.map((answer, i) => ({
      index: i,
      answer,
      guess: guesses[i] ?? "",
      correct: wordsMatch(answer, guesses[i] ?? ""),
    }));
    const correctCount = blankResults.filter((b) => b.correct).length;
    const score = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;

    return NextResponse.json({
      mode: "blanks",
      transcript: reference,
      score,
      verdict: score === 100 ? "correct" : score >= 50 ? "close" : "incorrect",
      feedback:
        correctCount === answers.length
          ? "nailed every blank."
          : "here's what you missed, filled in.",
      diff: [],
      blankResults,
      matchedByFastPath: false,
    });
  }

  const typed = body.typed;
  if (typeof typed !== "string") {
    return NextResponse.json({ error: "typed is required" }, { status: 400 });
  }
  const local = scoreLocal(reference, typed);

  if (local.clean) {
    const feedback = CLEAN_FEEDBACK[typed.length % CLEAN_FEEDBACK.length];
    return NextResponse.json({
      mode: "dictation",
      transcript: reference,
      score: 100,
      verdict: "correct",
      feedback,
      diff: local.diff,
      matchedByFastPath: true,
    });
  }

  const pct = Math.round(local.accuracy * 100);
  return NextResponse.json({
    mode: "dictation",
    transcript: reference,
    score: pct,
    verdict: pct >= 90 ? "correct" : pct >= 60 ? "close" : "incorrect",
    feedback: "here is how it lines up. the highlighted words are the ones to listen for again.",
    diff: local.diff,
    matchedByFastPath: false,
  });
}
