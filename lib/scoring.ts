const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "here's": "here is",
  "what's": "what is",
  "who's": "who is",
  "let's": "let us",
  "i'll": "i will",
  "you'll": "you will",
  "we'll": "we will",
  "they'll": "they will",
  "he'll": "he will",
  "she'll": "she will",
  "it'll": "it will",
  "i've": "i have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "i'd": "i would",
  "you'd": "you would",
  "we'd": "we would",
  "they'd": "they would",
  "he'd": "he would",
  "she'd": "she would",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "won't": "will not",
  "wouldn't": "would not",
  "can't": "cannot",
  "couldn't": "could not",
  "shouldn't": "should not",
  "mustn't": "must not",
  "gonna": "going to",
  "wanna": "want to",
  "gotta": "got to",
  "gimme": "give me",
  "lemme": "let me",
  "kinda": "kind of",
  "sorta": "sort of",
  "'cause": "because",
  "cuz": "because",
  "could've": "could have",
  "would've": "would have",
  "should've": "should have",
  "must've": "must have",
  "might've": "might have",
  "coulda": "could have",
  "woulda": "would have",
  "shoulda": "should have",
  "ain't": "is not",
};

const NUMBER_WORDS: Record<string, string> = {
  zero: "0",
  one: "1",
  two: "2",
  three: "3",
  four: "4",
  five: "5",
  six: "6",
  seven: "7",
  eight: "8",
  nine: "9",
  ten: "10",
  eleven: "11",
  twelve: "12",
  thirteen: "13",
  fourteen: "14",
  fifteen: "15",
  sixteen: "16",
  seventeen: "17",
  eighteen: "18",
  nineteen: "19",
  twenty: "20",
};

function toAmerican(word: string): string {
  let w = word;
  w = w.replace(/our\b/, "or");
  w = w.replace(/ise\b/, "ize");
  w = w.replace(/isation\b/, "ization");
  w = w.replace(/yse\b/, "yze");
  w = w.replace(/tre\b/, "ter");
  w = w.replace(/ogue\b/, "og");
  w = w.replace(/lling\b/, "ling");
  w = w.replace(/lled\b/, "led");
  w = w.replace(/llor\b/, "lor");
  return w;
}

export function normalize(text: string): string[] {
  const lowered = text.toLowerCase().replace(/[‘’]/g, "'");
  const expandedContractions = lowered.replace(/[a-z']+/g, (m) =>
    CONTRACTIONS[m] ? CONTRACTIONS[m] : m,
  );
  const stripped = expandedContractions
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return [];
  return stripped.split(" ").map((w) => {
    if (NUMBER_WORDS[w]) return NUMBER_WORDS[w];
    return toAmerican(w);
  });
}

export type DiffToken = {
  type: "ok" | "sub" | "missing" | "extra";
  ref?: string;
  hyp?: string;
};

export function align(ref: string[], hyp: string[]): DiffToken[] {
  const n = ref.length;
  const m = hyp.length;
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = ref[i - 1] === hyp[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  const out: DiffToken[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && ref[i - 1] === hyp[j - 1]) {
      out.push({ type: "ok", ref: ref[i - 1], hyp: hyp[j - 1] });
      i--;
      j--;
    } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
      out.push({ type: "sub", ref: ref[i - 1], hyp: hyp[j - 1] });
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      out.push({ type: "missing", ref: ref[i - 1] });
      i--;
    } else {
      out.push({ type: "extra", hyp: hyp[j - 1] });
      j--;
    }
  }
  return out.reverse();
}

export type LocalScore = {
  clean: boolean;
  accuracy: number;
  errors: number;
  diff: DiffToken[];
};

export function scoreLocal(reference: string, typed: string): LocalScore {
  const ref = normalize(reference);
  const hyp = normalize(typed);
  const diff = align(ref, hyp);
  const errors = diff.filter((t) => t.type !== "ok").length;
  const accuracy = ref.length === 0 ? 0 : Math.max(0, (ref.length - errors) / ref.length);
  return {
    clean: errors === 0,
    accuracy: Math.round(accuracy * 100) / 100,
    errors,
    diff,
  };
}
