import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const deviceId = new URL(req.url).searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ words: [] });

  const rows = await db
    .select({
      word: sql<string>`unnest(${attempts.missedWords})`.as("word"),
    })
    .from(attempts)
    .where(sql`${attempts.deviceId} = ${deviceId}`);

  const counts = new Map<string, number>();
  for (const { word } of rows) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const words = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return NextResponse.json({ words });
}
