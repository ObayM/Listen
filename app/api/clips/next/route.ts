import { NextResponse } from "next/server";
import { and, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

const DIFFICULTY_RANGES: Record<string, [number, number]> = {
  easy: [0, 4.2],
  medium: [4.2, 5.5],
  hard: [5.5, 100],
};

export async function GET(req: Request) {
  const tier = new URL(req.url).searchParams.get("difficulty");
  const range = tier ? DIFFICULTY_RANGES[tier] : undefined;

  const rows = await db
    .select({
      id: clips.id,
      videoId: clips.videoId,
      startSec: clips.startSec,
      endSec: clips.endSec,
      tags: clips.tags,
      estDifficulty: clips.estDifficulty,
    })
    .from(clips)
    .where(range ? and(gte(clips.estDifficulty, range[0]), lte(clips.estDifficulty, range[1])) : undefined)
    .orderBy(sql`random()`)
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "no clips indexed yet" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
