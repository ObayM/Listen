export type WeakWord = {
  word: string;
  count: number;
};

export type ProgressSnapshot = {
  totalAttempts: number;
  averageScore: number;
  currentStreak: number;
  weakWords: WeakWord[];
};

export type ProgressAttempt = {
  score: number;
  verdict: string;
  missedWords: string[];
};

export const EMPTY_PROGRESS: ProgressSnapshot = {
  totalAttempts: 0,
  averageScore: 0,
  currentStreak: 0,
  weakWords: [],
};

// Function words that show up as Levenshtein sub/missing tokens constantly but
// are never what a learner actually needs to "listen for" — they carry no content.
const STOPWORDS = new Set([
  "a", "am", "an", "and", "are", "as", "at", "be", "but", "by", "do", "for",
  "go", "had", "has", "have", "he", "her", "here", "him", "his", "i", "if",
  "in", "is", "it", "its", "me", "my", "no", "not", "of", "oh", "ok", "okay",
  "on", "or", "our", "she", "so", "that", "the", "their", "them", "then",
  "there", "they", "this", "to", "up", "us", "was", "we", "were", "will",
  "with", "you", "your",
]);

export function calculateProgress(attemptsNewestFirst: ProgressAttempt[]): ProgressSnapshot {
  if (attemptsNewestFirst.length === 0) return { ...EMPTY_PROGRESS };

  const total = attemptsNewestFirst.reduce((sum, attempt) => sum + attempt.score, 0);
  let currentStreak = 0;
  for (const attempt of attemptsNewestFirst) {
    if (attempt.verdict !== "correct") break;
    currentStreak += 1;
  }

  const counts = new Map<string, number>();
  for (const attempt of attemptsNewestFirst) {
    for (const rawWord of attempt.missedWords) {
      const word = rawWord.trim().toLowerCase();
      if (word && !STOPWORDS.has(word)) counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const weakWords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return {
    totalAttempts: attemptsNewestFirst.length,
    averageScore: Math.round(total / attemptsNewestFirst.length),
    currentStreak,
    weakWords,
  };
}
