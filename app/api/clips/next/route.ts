import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { clips } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
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
    .orderBy(sql`random()`)
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: "no clips indexed yet" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}
