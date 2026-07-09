"use client";

import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
};

export default function DictationInput({ value, onChange, onSubmit, disabled }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) ref.current?.focus();
  }, [disabled]);

  return (
    <div className="mt-5">
      <textarea
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
        rows={2}
        placeholder="type what you hear, then press enter"
        className="w-full resize-none rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-lg text-neutral-100 outline-none focus:border-neutral-400 disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || value.trim().length === 0}
        className="mt-3 w-full rounded-xl bg-white px-4 py-3 font-medium text-black hover:bg-neutral-200 disabled:opacity-40"
      >
        check
      </button>
    </div>
  );
}
