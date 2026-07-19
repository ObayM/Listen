"use client";

import { useEffect, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import Button from "@/components/ui/Button";
import type { BlankResult, BlankToken } from "@/lib/blanks";

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

const VERDICT = {
  correct: {
    label: "Great listening",
    panel: "border-[var(--correct)] bg-[var(--correct-soft)]",
    tone: "text-[var(--correct)]",
  },
  close: {
    label: "Almost there",
    panel: "border-[var(--close)] bg-[var(--close-soft)]",
    tone: "text-[var(--close)]",
  },
  incorrect: {
    label: "Keep training",
    panel: "border-[var(--incorrect)] bg-[var(--incorrect-soft)]",
    tone: "text-[var(--incorrect)]",
  },
};

const tokenVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0 },
};

function Diff({ diff }: { diff: DiffToken[] }) {
  return (
    <motion.p className="flex flex-wrap gap-x-2 gap-y-1 text-lg leading-relaxed" initial="hidden" animate="show" transition={{ staggerChildren: 0.02 }}>
      {diff.map((token, index) => {
        if (token.type === "ok") return <motion.span key={index} variants={tokenVariants}>{token.hyp}</motion.span>;
        if (token.type === "sub") {
          return (
            <motion.span key={index} variants={tokenVariants} className="inline-flex items-baseline gap-1.5">
              <span className="font-semibold text-[var(--accent-dark)] underline decoration-2">{token.ref}</span>
              <span className="text-[var(--incorrect)] line-through opacity-70">{token.hyp}</span>
            </motion.span>
          );
        }
        if (token.type === "missing") {
          return <motion.span key={index} variants={tokenVariants} className="font-semibold text-[var(--accent-dark)] underline decoration-dotted">{token.ref}</motion.span>;
        }
        return <motion.span key={index} variants={tokenVariants} className="text-[var(--incorrect)] line-through opacity-70">{token.hyp}</motion.span>;
      })}
    </motion.p>
  );
}

function BlanksReveal({ tokens, results }: { tokens: BlankToken[]; results: BlankResult[] }) {
  return (
    <motion.p className="text-lg leading-relaxed whitespace-pre-wrap" initial="hidden" animate="show" transition={{ staggerChildren: 0.03 }}>
      {tokens.map((token, index) => {
        if (!("blank" in token)) return <span key={index}>{token.text}</span>;
        const result = results[token.index];
        if (!result) return null;
        return (
          <motion.span key={index} variants={tokenVariants} className="inline-flex items-baseline gap-1.5">
            <span className="font-semibold text-[var(--accent-dark)] underline decoration-2">{result.answer}</span>
            {!result.correct && result.guess && <span className="text-[var(--incorrect)] line-through opacity-70">{result.guess}</span>}
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
    const unsubscribe = count.on("change", (next) => setDisplay(Math.round(next)));
    const controls = animate(count, value, { duration: 0.55, ease: "easeOut" });
    return () => { controls.stop(); unsubscribe(); };
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
  const style = VERDICT[result.verdict];
  const isBlanks = result.mode === "blanks" && blankTokens && result.blankResults;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: "easeOut" }} className="mt-6 border-t border-[var(--line)] pt-6">
      <div className={`flex flex-col gap-4 border p-5 sm:flex-row sm:items-center sm:justify-between ${style.panel}`}>
        <div>
          <p className={`font-semibold ${style.tone}`}>{style.label}</p>
          <p className="mt-0.5 text-sm text-[var(--muted)]">{result.feedback}</p>
        </div>
        <div className={`font-mono text-3xl font-semibold tabular-nums ${style.tone}`}>
          <AnimatedScore value={result.score} />
          <span className="text-sm font-medium opacity-70">/100</span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="card p-4">
          <p className="eyebrow mb-2">Your answer</p>
          {isBlanks ? <BlanksReveal tokens={blankTokens!} results={result.blankResults!} /> : <Diff diff={result.diff} />}
        </div>
        <div className="card bg-[var(--surface-muted)] p-4">
          <p className="eyebrow mb-2">What was said</p>
          <p className="heard text-xl leading-relaxed text-[var(--ink)]">{result.transcript}</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button onClick={onNext} className="w-full sm:w-auto sm:min-w-44">Next clip <span aria-hidden="true" className="ml-2">→</span></Button>
      </div>
    </motion.div>
  );
}
