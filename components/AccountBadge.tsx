"use client";

import Link from "next/link";
import { useAccount } from "@/components/AccountProvider";

export default function AccountBadge() {
  const { account, ready } = useAccount();

  return (
    <Link
      href="/profile"
      className="flex min-h-10 items-center gap-2 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)]"
    >
      <span className="serif flex h-6 w-6 items-center justify-center bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent-dark)]">
        {account?.username.slice(0, 1).toUpperCase() ?? "?"}
      </span>
      <span className="hidden max-w-28 truncate sm:block">
        {!ready ? "Account" : account?.username ?? "Sign in"}
      </span>
    </Link>
  );
}
