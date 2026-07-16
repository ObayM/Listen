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
    primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
    secondary: "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-muted)]",
    quiet: "bg-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
    danger: "bg-[var(--incorrect)] text-white hover:opacity-90",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.985 }}
      className={`inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] px-5 py-2.5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
