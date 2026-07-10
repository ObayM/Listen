import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attempts } from "@/lib/db/schema";

export async function POST(req: Request) {
  const body = await req.json();
  const { clipId, deviceId, typedText, score, verdict } = body;
  if (!clipId || !deviceId || typeof typedText !== "string") {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  await db.insert(attempts).values({
    clipId,
    deviceId,
    typedText,
    score: Math.round(score ?? 0),
    verdict: verdict ?? "incorrect",
    matchedByFastPath: Boolean(body.matchedByFastPath),
    replayCount: Math.round(body.replayCount ?? 0),
    msToAnswer: body.msToAnswer != null ? Math.round(body.msToAnswer) : null,
    missedWords: Array.isArray(body.missedWords) ? body.missedWords.slice(0, 20) : [],
  });

  return NextResponse.json({ ok: true });
}
