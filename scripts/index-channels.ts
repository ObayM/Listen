import "dotenv/config";
import { fetchOfficialCaptions, listChannelVideos } from "../lib/captionFetch";
import { segmentCues } from "../lib/segment";
import { db } from "../lib/db";
import { clips, videos } from "../lib/db/schema";
import { sql } from "drizzle-orm";
import { CHANNELS } from "./channels.seed";

async function alreadyIndexed(videoId: string): Promise<boolean> {
  const rows = await db
    .select({ id: videos.id })
    .from(videos)
    .where(sql`${videos.id} = ${videoId}`);
  return rows.length > 0;
}

async function main() {
  let totalClips = 0;
  let totalVideos = 0;

  for (const channel of CHANNELS) {
    console.log(`\n=== ${channel.name} ===`);
    const vids = await listChannelVideos(channel.url, channel.videosPerRun);
    console.log(`  found ${vids.length} videos`);

    for (const v of vids) {
      if (await alreadyIndexed(v.id)) {
        console.log(`  skip ${v.id} (already indexed)`);
        continue;
      }

      const cap = await fetchOfficialCaptions(v.id);
      if (!cap) {
        console.log(`  skip ${v.id} (no official captions)`);
        await db
          .insert(videos)
          .values({
            id: v.id,
            channelName: channel.name,
            title: v.title,
            hasStandardCaption: false,
          })
          .onConflictDoNothing();
        continue;
      }

      const segments = segmentCues(cap.cues).filter((s) => s.estDifficulty >= 3);
      if (segments.length === 0) {
        console.log(`  skip ${v.id} (0 usable segments)`);
        continue;
      }

      await db
        .insert(videos)
        .values({
          id: v.id,
          channelName: channel.name,
          title: v.title,
          lang: cap.lang,
          hasStandardCaption: true,
        })
        .onConflictDoNothing();

      await db.insert(clips).values(
        segments.map((s) => ({
          videoId: v.id,
          startSec: s.startSec,
          endSec: s.endSec,
          transcript: s.text,
          wordsPerSec: s.wordsPerSec,
          tags: s.tags,
          estDifficulty: s.estDifficulty,
        })),
      );

      totalClips += segments.length;
      totalVideos += 1;
      console.log(`  + ${v.id} "${v.title.slice(0, 40)}" -> ${segments.length} clips`);
    }
  }

  console.log(`\ndone: ${totalClips} clips from ${totalVideos} videos`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
