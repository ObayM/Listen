import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts } from "@/lib/db/schema";
import { calculateProgress } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const deviceId = new URL(req.url).searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "deviceId is required" }, { status: 400 });
  }

  const rows = await db
    .select({
      score: attempts.score,
      verdict: attempts.verdict,
      missedWords: attempts.missedWords,
    })
    .from(attempts)
    .where(eq(attempts.deviceId, deviceId))
    .orderBy(desc(attempts.createdAt));

  return NextResponse.json(calculateProgress(rows));
}
