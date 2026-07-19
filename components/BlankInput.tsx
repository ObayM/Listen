"use client";

import { useEffect, useRef, type ReactNode } from "react";
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

  const blankSlot = (token: Extract<BlankToken, { blank: true }>) => {
    const value = guesses[token.index] ?? "";
    const complete = Boolean(value.trim());

    return (
      <input
        ref={token.index === 0 ? firstRef : undefined}
        value={value}
        disabled={disabled}
        onChange={(event) => setAt(token.index, event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        style={{ width: `${Math.max(5, Math.min(12, token.length + 1))}ch` }}
        aria-label={`Missing word ${token.index + 1}`}
        autoComplete="off"
        spellCheck={false}
        className={`mx-1 inline-block h-8 rounded-none border-0 border-b-2 px-0.5 text-center font-semibold align-baseline text-[var(--ink)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent-dark)] focus:bg-transparent focus:shadow-[inset_0_-0.45rem_0_var(--accent-soft)] focus-visible:outline-none disabled:opacity-50 ${
          complete
            ? "border-[var(--accent-dark)] bg-transparent shadow-[inset_0_-0.45rem_0_var(--accent-soft)]"
            : "border-[var(--line-strong)] bg-transparent"
        }`}
      />
    );
  };

  const sentence: ReactNode[] = [];
  const isPunctuation = (token: BlankToken | undefined) =>
    token && !("blank" in token) && /[^\s]/.test(token.text) && !/[A-Za-z']/.test(token.text);

  for (let index = 0; index < tokens.length;) {
    const token = tokens[index];
    const separator = tokens[index + 1];
    const next = tokens[index + 2];

    // Keep the word immediately before a blank attached to its answer slot.
    if (
      !("blank" in token) &&
      /^[A-Za-z']+$/.test(token.text) &&
      separator && !("blank" in separator) && /\s/.test(separator.text) &&
      next && "blank" in next
    ) {
      const punctuation = tokens[index + 3];
      sentence.push(
        <span key={`blank-group-${index}`} className="whitespace-nowrap">
          {token.text}{separator.text}{blankSlot(next)}
          {isPunctuation(punctuation) && !("blank" in punctuation!) ? punctuation.text : null}
        </span>,
      );
      index += isPunctuation(punctuation) ? 4 : 3;
      continue;
    }

    if ("blank" in token) {
      const punctuation = tokens[index + 1];
      sentence.push(
        <span key={`blank-${token.index}`} className="whitespace-nowrap">
          {blankSlot(token)}
          {isPunctuation(punctuation) && !("blank" in punctuation!) ? punctuation.text : null}
        </span>,
      );
      index += isPunctuation(punctuation) ? 2 : 1;
      continue;
    }

    sentence.push(<span key={`text-${index}`}>{token.text}</span>);
    index += 1;
  }

  return (
    <div className="mt-6 border-t border-[var(--line)] pt-6">
      <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Complete the sentence</p>
      <div className="border border-[var(--line)] bg-[var(--surface)] p-4 text-[1.0625rem] leading-[2.35] whitespace-pre-wrap text-[var(--ink)] sm:p-5 sm:text-lg">
        {sentence}
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={onSubmit} disabled={disabled || !filled} className="w-full sm:w-auto sm:min-w-40">Check answer</Button>
      </div>
    </div>
  );
}
