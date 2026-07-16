import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type Cue = {
  start: number;
  dur: number;
  text: string;
};

export type OfficialCaptions = {
  videoId: string;
  lang: string;
  cues: Cue[];
};

function runYtDlp(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const p = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    p.stdout.on("data", (d) => (stdout += d.toString()));
    p.stderr.on("data", (d) => (stderr += d.toString()));
    p.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    p.on("error", (e) => resolve({ code: 1, stdout, stderr: String(e) }));
  });
}

function parseJson3(raw: string): Cue[] {
  const data = JSON.parse(raw);
  const events = Array.isArray(data?.events) ? data.events : [];
  const cues: Cue[] = [];
  for (const ev of events) {
    if (!ev.segs) continue;
    const text = ev.segs
      // yt-dlp's json3 segment shape is intentionally loose at this boundary.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => s.utf8 ?? "")
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (!text) continue;
    cues.push({
      start: (ev.tStartMs ?? 0) / 1000,
      dur: (ev.dDurationMs ?? 0) / 1000,
      text,
    });
  }
  return cues;
}

export async function fetchOfficialCaptions(
  videoId: string,
): Promise<OfficialCaptions | null> {
  const dir = await mkdtemp(join(tmpdir(), "cap-"));
  try {
    await runYtDlp([
      "--skip-download",
      "--write-subs",
      "--sub-langs",
      "en.*",
      "--sub-format",
      "json3",
      "--no-warnings",
      "--no-progress",
      "-o",
      join(dir, "%(id)s.%(ext)s"),
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);
    const files = (await readdir(dir)).filter((f) => f.endsWith(".json3"));
    if (files.length === 0) {
      return null;
    }
    const file = files.find((f) => /\.en\./.test(f)) ?? files[0];
    const langMatch = file.match(/\.([a-zA-Z-]+)\.json3$/);
    const lang = langMatch ? langMatch[1] : "en";
    const raw = await readFile(join(dir, file), "utf8");
    const cues = parseJson3(raw);
    if (cues.length === 0) return null;
    return { videoId, lang, cues };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

export type ChannelVideo = {
  id: string;
  title: string;
};

export async function listChannelVideos(
  channelUrl: string,
  limit: number,
): Promise<ChannelVideo[]> {
  const res = await runYtDlp([
    "--flat-playlist",
    "--print",
    "%(id)s\t%(title)s",
    "--playlist-end",
    String(limit),
    "--no-warnings",
    channelUrl,
  ]);
  if (res.code !== 0 && !res.stdout.trim()) return [];
  return res.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [id, ...rest] = line.split("\t");
      return { id, title: rest.join("\t") };
    })
    .filter((v) => v.id && v.id.length === 11);
}
