"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function DictationInput({ value, onChange, onSubmit, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  return (
    <div className="mt-6 border-t border-[var(--line)] pt-6">
      <label htmlFor="dictation-answer" className="mb-2 block text-sm font-semibold text-[var(--ink)]">What did you hear?</label>
      <div className={`rounded-[var(--radius)] border bg-[var(--surface)] transition-colors ${focused ? "border-[var(--accent-dark)]" : "border-[var(--line)]"}`}>
        <textarea
          id="dictation-answer"
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          rows={3}
          placeholder="Type the sentence here…"
          className="w-full resize-none rounded-[var(--radius)] bg-transparent p-4 text-lg leading-relaxed text-[var(--ink)] outline-none placeholder:text-[var(--muted)] disabled:opacity-50 sm:p-5"
        />
      </div>
      <div className="mt-3 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[var(--muted)]">Press Enter to check · Shift + Enter for a new line</p>
        <Button onClick={onSubmit} disabled={disabled || !value.trim()} className="sm:min-w-40">Check answer</Button>
      </div>
    </div>
  );
}
