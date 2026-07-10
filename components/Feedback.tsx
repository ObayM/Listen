"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import type { BlankToken, BlankResult } from "@/lib/blanks";

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
  diff: DiffToken[];
  matchedByFastPath: boolean;
  mode?: "dictation" | "blanks";
  blankResults?: BlankResult[];
};

const VERDICT_COLOR: Record<string, string> = {
  correct: "text-emerald-400",
  close: "text-amber-400",
  incorrect: "text-rose-400",
};

const tokenVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0 },
};

function Diff({ diff }: { diff: DiffToken[] }) {
  return (
    <motion.p
      className="flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.02 }}
    >
      {diff.map((t, i) => {
        if (t.type === "ok")
          return (
            <motion.span key={i} variants={tokenVariants} className="text-neutral-300">
              {t.hyp}
            </motion.span>
          );
        if (t.type === "sub")
          return (
            <motion.span key={i} variants={tokenVariants} className="inline-flex items-baseline gap-1">
              <span className="text-emerald-400">{t.ref}</span>
              <span className="text-rose-400 line-through decoration-rose-500/60">{t.hyp}</span>
            </motion.span>
          );
        if (t.type === "missing")
          return (
            <motion.span
              key={i}
              variants={tokenVariants}
              className="text-amber-400 underline decoration-dotted"
            >
              {t.ref}
            </motion.span>
          );
        return (
          <motion.span
            key={i}
            variants={tokenVariants}
            className="text-rose-400 line-through decoration-rose-500/60"
          >
            {t.hyp}
          </motion.span>
        );
      })}
    </motion.p>
  );
}

function BlanksReveal({ tokens, results }: { tokens: BlankToken[]; results: BlankResult[] }) {
  return (
    <motion.p
      className="text-lg leading-relaxed whitespace-pre-wrap"
      initial="hidden"
      animate="show"
      transition={{ staggerChildren: 0.03 }}
    >
      {tokens.map((t, i) => {
        if (!("blank" in t)) return <span key={i}>{t.text}</span>;
        const r = results[t.index];
        if (!r) return null;
        if (r.correct) {
          return (
            <motion.span key={i} variants={tokenVariants} className="text-emerald-400">
              {r.answer}
            </motion.span>
          );
        }
        return (
          <motion.span key={i} variants={tokenVariants} className="inline-flex items-baseline gap-1">
            <span className="text-emerald-400">{r.answer}</span>
            {r.guess && (
              <span className="text-rose-400 line-through decoration-rose-500/60">{r.guess}</span>
            )}
          </motion.span>
        );
      })}
    </motion.p>
  );
}

function AnimatedScore({ value }: { value: number }) {
  const count = useMotionValue(0);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = count.on("change", (v) => setDisplay(Math.round(v)));
    const controls = animate(count, value, { duration: 0.6, ease: "easeOut" });
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display}</>;
}

export default function Feedback({
  result,
  onNext,
  blankTokens,
}: {
  result: ScoreResult;
  onNext: () => void;
  blankTokens?: BlankToken[];
}) {
  const isBlanks = result.mode === "blanks" && blankTokens && result.blankResults;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mt-6 border border-[var(--line)] bg-[var(--panel)] p-5"
    >
      <div className="flex items-center justify-between">
        <div className={`font-mono text-2xl font-semibold tabular-nums ${VERDICT_COLOR[result.verdict]}`}>
          <AnimatedScore value={result.score} />
          <span className="ml-1 text-sm font-normal text-[var(--muted)]">/100</span>
        </div>
        <div className="border border-[var(--line)] px-2 py-0.5 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
          {result.mode === "blanks" ? "blanks" : result.matchedByFastPath ? "instant" : "diff"}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">how it lines up</div>
        {isBlanks ? (
          <BlanksReveal tokens={blankTokens!} results={result.blankResults!} />
        ) : (
          <Diff diff={result.diff} />
        )}
      </div>

      {!isBlanks && (
        <div className="mt-4">
          <div className="mb-1 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">actual</div>
          <p className="text-lg text-neutral-100">{result.transcript}</p>
        </div>
      )}

      <p className="mt-4 text-neutral-300">{result.feedback}</p>

      <motion.button
        onClick={onNext}
        whileTap={{ scale: 0.98 }}
        className="mt-5 w-full bg-[var(--accent)] px-4 py-3 font-mono text-sm font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90"
      >
        next clip
      </motion.button>
    </motion.div>
  );
}
