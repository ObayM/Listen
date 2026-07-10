"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type Props = {
  value: string;
  onChange: (v: string) => void;
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
    <div className="mt-5">
      <div className="relative">
        <textarea
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          rows={2}
          placeholder="type what you hear, then press enter"
          className="w-full resize-none border border-[var(--line)] bg-[var(--panel)] p-4 text-lg text-neutral-100 outline-none transition-colors disabled:opacity-50"
        />
        <motion.span
          className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--accent)]"
          style={{ transformOrigin: "left" }}
          initial={false}
          animate={{ scaleX: focused ? 1 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        />
      </div>
      <motion.button
        onClick={onSubmit}
        disabled={disabled || value.trim().length === 0}
        whileTap={{ scale: 0.98 }}
        className="mt-3 w-full bg-[var(--accent)] px-4 py-3 font-mono text-sm font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-30"
      >
        check
      </motion.button>
    </div>
  );
}
