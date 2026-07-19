"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type Props = HTMLMotionProps<"button"> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  fullWidth?: boolean;
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: Props) {
  const variants = {
    primary: "min-h-11 border-2 border-[var(--line-strong)] bg-[var(--accent)] px-5 py-2.5 text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:bg-[var(--accent-hover)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:border-[var(--line)] disabled:bg-[var(--surface-muted)] disabled:shadow-none",
    secondary: "min-h-9 border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[var(--ink)] hover:bg-[var(--surface-muted)]",
    quiet: "min-h-9 px-3 py-1.5 text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
    danger: "min-h-9 border border-[var(--incorrect)] bg-transparent px-3 py-1.5 text-[var(--incorrect)] hover:bg-[var(--incorrect-soft)]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      className={`inline-flex items-center justify-center rounded-[var(--radius)] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
