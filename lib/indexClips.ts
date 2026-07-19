import { eq } from "drizzle-orm";
import { fetchOfficialCaptions, listChannelVideos } from "@/lib/captionFetch";
import { db } from "@/lib/db";
import { clips, videos } from "@/lib/db/schema";
import { segmentCues } from "@/lib/segment";
import { CHANNELS } from "@/scripts/channels.seed";

export type IndexOptions = {
  videosPerChannel?: number;
  stopAfterClips?: number;
};

export type IndexSummary = {
  clips: number;
  videos: number;
};

async function alreadyIndexed(videoId: string): Promise<boolean> {
  const rows = await db
    .select({ id: clips.id })
    .from(clips)
    .where(eq(clips.videoId, videoId))
    .limit(1);
  return rows.length > 0;
}

export async function indexClips(options: IndexOptions = {}): Promise<IndexSummary> {
  let totalClips = 0;
  let totalVideos = 0;

  for (const channel of CHANNELS) {
    console.log(`\n=== ${channel.name} ===`);
    const limit = options.videosPerChannel ?? channel.videosPerRun;
    const channelVideos = await listChannelVideos(channel.url, limit);
    console.log(`  found ${channelVideos.length} videos`);

    for (const video of channelVideos) {
      if (await alreadyIndexed(video.id)) {
        console.log(`  skip ${video.id} (already indexed)`);
        continue;
      }

      try {
        const captions = await fetchOfficialCaptions(video.id);
        if (!captions) {
          console.log(`  skip ${video.id} (no official captions)`);
          await db
            .insert(videos)
            .values({
              id: video.id,
              channelName: channel.name,
              title: video.title,
              hasStandardCaption: false,
            })
            .onConflictDoUpdate({
              target: videos.id,
              set: {
                channelName: channel.name,
                title: video.title,
                hasStandardCaption: false,
                indexedAt: new Date(),
              },
            });
          continue;
        }

        const segments = segmentCues(captions.cues).filter((segment) => segment.estDifficulty >= 3);
        if (segments.length === 0) {
          console.log(`  skip ${video.id} (0 usable segments)`);
          continue;
        }

        await db
          .insert(videos)
          .values({
            id: video.id,
            channelName: channel.name,
            title: video.title,
            lang: captions.lang,
            hasStandardCaption: true,
          })
          .onConflictDoUpdate({
            target: videos.id,
            set: {
              channelName: channel.name,
              title: video.title,
              lang: captions.lang,
              hasStandardCaption: true,
              indexedAt: new Date(),
            },
          });

        await db.insert(clips).values(
          segments.map((segment) => ({
            videoId: video.id,
            startSec: segment.startSec,
            endSec: segment.endSec,
            transcript: segment.text,
            wordsPerSec: segment.wordsPerSec,
            tags: segment.tags,
            estDifficulty: segment.estDifficulty,
          })),
        );

        totalClips += segments.length;
        totalVideos += 1;
        console.log(`  + ${video.id} "${video.title.slice(0, 40)}" -> ${segments.length} clips`);

        if (options.stopAfterClips && totalClips >= options.stopAfterClips) {
          return { clips: totalClips, videos: totalVideos };
        }
      } catch (error) {
        console.error(`  skip ${video.id} (indexing failed)`, error);
      }
    }
  }

  return { clips: totalClips, videos: totalVideos };
}
