"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import type { BlankToken } from "@/lib/blanks";

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

  const setAt = (index: number, value: string) => {
    const next = [...guesses];
    next[index] = value;
    onChange(next);
  };

  const filled = guesses.some((guess) => guess?.trim());

  return (
    <div className="mt-6 border-t border-[var(--line)] pt-6">
      <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Complete the sentence</p>
      <div className="rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--surface)] p-4 text-lg leading-[2.65] whitespace-pre-wrap text-[var(--ink)] sm:p-5">
        {tokens.map((token, index) =>
          "blank" in token ? (
            <input
              key={index}
              ref={token.index === 0 ? firstRef : undefined}
              value={guesses[token.index] ?? ""}
              disabled={disabled}
              onChange={(event) => setAt(token.index, event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              style={{ width: `${Math.max(4, token.length + 2)}ch` }}
              aria-label={`Missing word ${token.index + 1}`}
              autoComplete="off"
              spellCheck={false}
              className="mx-1 rounded-[var(--radius-sm)] border border-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 text-center font-semibold text-[var(--accent-dark)] outline-none focus:bg-[var(--surface)] disabled:opacity-50"
            />
          ) : <span key={index}>{token.text}</span>,
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={onSubmit} disabled={disabled || !filled} className="w-full sm:w-auto sm:min-w-40">Check answer</Button>
      </div>
    </div>
  );
}
