import type { Cue } from "./captionFetch";

export type Segment = {
  startSec: number;
  endSec: number;
  text: string;
  wordCount: number;
  wordsPerSec: number;
  tags: string[];
  estDifficulty: number;
};

const MIN_DUR = 3;
const MAX_DUR = 8;
const MIN_WORDS = 6;
const MAX_WORDS = 30;
const MIN_WPS = 1.8;
const MAX_WPS = 4.8;

const CONTRACTION_RE =
  /\b\w+'(s|re|ve|ll|d|t|m)\b|\b(gonna|wanna|gotta|kinda|sorta|coulda|woulda|shoulda)\b/i;

function endsSentence(text: string): boolean {
  return /[.?!]["')\]]?\s*$/.test(text.trim());
}

function countWords(text: string): number {
  const m = text.trim().match(/\b[\w']+\b/g);
  return m ? m.length : 0;
}

const ANNOTATION_RE =
  /\[[^\]]*\]|\((?:laughter|applause|music|cheering|cheers|sighs?|laughs?|chuckles?|gasps?|coughs?|silence|singing|inaudible)\)|♪[^♪]*♪|♪/gi;

function buildSegment(start: number, end: number, text: string): Segment | null {
  const clean = text.replace(ANNOTATION_RE, " ").replace(/\s+/g, " ").trim();
  const dur = end - start;
  const wordCount = countWords(clean);
  if (dur < MIN_DUR || dur > MAX_DUR) return null;
  if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) return null;
  const wordsPerSec = wordCount / dur;
  if (wordsPerSec < MIN_WPS || wordsPerSec > MAX_WPS) return null;

  const tags: string[] = [];
  if (wordsPerSec > 3.3) tags.push("fast-speech");
  if (CONTRACTION_RE.test(clean)) tags.push("contraction");
  if (wordCount > 18) tags.push("long-sentence");
  if (/[,;:]/.test(clean)) tags.push("complex-clause");

  const speedScore = Math.min(1, Math.max(0, (wordsPerSec - MIN_WPS) / (MAX_WPS - MIN_WPS)));
  const lengthScore = Math.min(1, wordCount / MAX_WORDS);
  const estDifficulty = Math.round((speedScore * 0.65 + lengthScore * 0.35) * 100) / 10;

  return { startSec: start, endSec: end, text: clean, wordCount, wordsPerSec, tags, estDifficulty };
}

export function segmentCues(cues: Cue[]): Segment[] {
  const segments: Segment[] = [];
  let bufStart = -1;
  let bufEnd = -1;
  let bufText = "";

  const flush = () => {
    if (bufStart < 0) return;
    const seg = buildSegment(bufStart, bufEnd, bufText);
    if (seg) segments.push(seg);
    bufStart = -1;
    bufEnd = -1;
    bufText = "";
  };

  for (const cue of cues) {
    if (bufStart < 0) bufStart = cue.start;
    bufEnd = cue.start + cue.dur;
    bufText = bufText ? `${bufText} ${cue.text}` : cue.text;
    const dur = bufEnd - bufStart;

    if (dur >= MAX_DUR) {
      flush();
    } else if (dur >= MIN_DUR && endsSentence(cue.text)) {
      flush();
    }
  }
  flush();
  return segments;
}
