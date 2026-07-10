"use client";

import { useEffect, useRef } from "react";
import type { BlankToken } from "@/lib/blanks";
import { motion } from "framer-motion";

type Props = {
  tokens: BlankToken[];
  guesses: string[];
  onChange: (guesses: string[]) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function BlankInput({ tokens, guesses, onChange, onSubmit, disabled }: Props) {
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) firstRef.current?.focus();
  }, [disabled, tokens]);

  const setAt = (i: number, value: string) => {
    const next = [...guesses];
    next[i] = value;
    onChange(next);
  };

  const filled = guesses.some((g) => g && g.trim().length > 0);

  return (
    <div className="mt-5">
      <div className="border border-[var(--line)] bg-[var(--panel)] p-4 text-lg leading-loose whitespace-pre-wrap text-neutral-100">
        {tokens.map((t, i) =>
          "blank" in t ? (
            <input
              key={i}
              ref={t.index === 0 ? firstRef : undefined}
              value={guesses[t.index] ?? ""}
              disabled={disabled}
              onChange={(e) => setAt(t.index, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              style={{ width: `${Math.max(3, t.length + 1.5)}ch` }}
              autoComplete="off"
              spellCheck={false}
              className="mx-1 border-b-2 border-[var(--accent)] bg-transparent text-center text-neutral-100 outline-none disabled:opacity-50"
            />
          ) : (
            <span key={i}>{t.text}</span>
          ),
        )}
      </div>
      <motion.button
        onClick={onSubmit}
        disabled={disabled || !filled}
        whileTap={{ scale: 0.98 }}
        className="mt-3 w-full bg-[var(--accent)] px-4 py-3 font-mono text-sm font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        check
      </motion.button>
    </div>
  );
}
