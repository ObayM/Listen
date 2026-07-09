"use client";

type DiffToken = {
  type: "ok" | "sub" | "missing" | "extra";
  ref?: string;
  hyp?: string;
};

export type ScoreResult = {
  transcript: string;
  score: number;
  verdict: "correct" | "close" | "incorrect";
  feedback: string;
  mishearings: { heard: string; actual: string; tip: string }[];
  diff: DiffToken[];
  matchedByFastPath: boolean;
};

const VERDICT_COLOR: Record<string, string> = {
  correct: "text-emerald-400",
  close: "text-amber-400",
  incorrect: "text-rose-400",
};

function Diff({ diff }: { diff: DiffToken[] }) {
  return (
    <p className="flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed">
      {diff.map((t, i) => {
        if (t.type === "ok")
          return (
            <span key={i} className="text-neutral-300">
              {t.hyp}
            </span>
          );
        if (t.type === "sub")
          return (
            <span key={i} className="inline-flex items-baseline gap-1">
              <span className="text-emerald-400">{t.ref}</span>
              <span className="text-rose-400 line-through decoration-rose-500/60">{t.hyp}</span>
            </span>
          );
        if (t.type === "missing")
          return (
            <span key={i} className="text-amber-400 underline decoration-dotted">
              {t.ref}
            </span>
          );
        return (
          <span key={i} className="text-rose-400 line-through decoration-rose-500/60">
            {t.hyp}
          </span>
        );
      })}
    </p>
  );
}

export default function Feedback({
  result,
  onNext,
}: {
  result: ScoreResult;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
      <div className="flex items-center justify-between">
        <div className={`text-2xl font-semibold ${VERDICT_COLOR[result.verdict]}`}>
          {result.score}
          <span className="ml-1 text-sm font-normal text-neutral-500">/100</span>
        </div>
        <div className="text-xs uppercase tracking-widest text-neutral-500">
          {result.matchedByFastPath ? "instant" : "coached"}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-neutral-500">how it lines up</div>
        <Diff diff={result.diff} />
      </div>

      <div className="mt-4">
        <div className="mb-1 text-xs uppercase tracking-widest text-neutral-500">actual</div>
        <p className="text-lg text-neutral-100">{result.transcript}</p>
      </div>

      <p className="mt-4 text-neutral-300">{result.feedback}</p>

      {result.mishearings.length > 0 && (
        <ul className="mt-4 space-y-2">
          {result.mishearings.map((m, i) => (
            <li key={i} className="rounded-lg bg-neutral-800/60 p-3 text-sm text-neutral-300">
              <span className="text-rose-400">{m.heard}</span>
              <span className="mx-2 text-neutral-500">should be</span>
              <span className="text-emerald-400">{m.actual}</span>
              <div className="mt-1 text-neutral-400">{m.tip}</div>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onNext}
        className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-medium text-black hover:bg-neutral-200"
      >
        next clip
      </button>
    </div>
  );
}
