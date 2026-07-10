import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";
import { scoreLocal } from "@/lib/scoring";

const CLEAN_FEEDBACK = ["nice, got it word for word.", "spot on.", "clean, you heard all of it."];

export async function POST(req: Request) {
  const { clipId, typed } = await req.json();
  if (!clipId || typeof typed !== "string") {
    return NextResponse.json({ error: "clipId and typed are required" }, { status: 400 });
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
  const local = scoreLocal(reference, typed);

  if (local.clean) {
    const feedback = CLEAN_FEEDBACK[typed.length % CLEAN_FEEDBACK.length];
    return NextResponse.json({
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
    transcript: reference,
    score: pct,
    verdict: pct >= 90 ? "correct" : pct >= 60 ? "close" : "incorrect",
    feedback: "here is how it lines up. the highlighted words are the ones to listen for again.",
    diff: local.diff,
    matchedByFastPath: false,
  });
}
