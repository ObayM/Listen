import { normalize } from "./scoring";

export type BlankToken = { text: string } | { blank: true; index: number; length: number };

export type BlankResult = { index: number; correct: boolean; answer: string; guess: string };

const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "from", "have", "are", "was", "were",
  "been", "will", "would", "could", "should", "about", "there", "their",
  "which", "when", "what", "into", "than", "then", "some", "more", "very",
  "just", "like", "your", "they", "them", "these", "those", "only", "also",
  "over", "such", "each", "other", "being", "does", "doing", "said", "says",
  "much", "many", "most", "even", "still", "where", "while", "because",
  "before", "after", "again", "once", "here", "both",
]);

function isWordToken(tok: string): boolean {
  return /^[A-Za-z']+$/.test(tok);
}

export function buildBlanks(transcript: string): { tokens: BlankToken[]; answers: string[] } {
  const raw = transcript.match(/[A-Za-z']+|[^A-Za-z']+/g) ?? [];
  const wordPositions = raw
    .map((tok, i) => ({ tok, i }))
    .filter(({ tok }) => isWordToken(tok));

  const candidates = wordPositions.filter(
    ({ tok }) => tok.length >= 4 && !STOPWORDS.has(tok.toLowerCase()),
  );
  const pool = candidates.length > 0 ? candidates : wordPositions;

  const blankCount = Math.max(1, Math.min(4, Math.round(wordPositions.length * 0.22)));
  const picked = new Set<number>();
  if (pool.length <= blankCount) {
    pool.forEach(({ i }) => picked.add(i));
  } else {
    for (let k = 0; k < blankCount; k++) {
      const idx = Math.min(Math.floor(((k + 0.5) / blankCount) * pool.length), pool.length - 1);
      picked.add(pool[idx].i);
    }
  }

  const tokens: BlankToken[] = [];
  const answers: string[] = [];
  let blankIndex = 0;
  raw.forEach((tok, i) => {
    if (picked.has(i)) {
      tokens.push({ blank: true, index: blankIndex++, length: tok.length });
      answers.push(tok);
    } else {
      tokens.push({ text: tok });
    }
  });

  return { tokens, answers };
}

export function wordsMatch(answer: string, guess: string): boolean {
  const a = normalize(answer).join(" ");
  const g = normalize(guess).join(" ");
  return a.length > 0 && a === g;
}
