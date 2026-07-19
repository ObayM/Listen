"use client";

import Link from "next/link";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import { useAccount } from "@/components/AccountProvider";
import { useProgress } from "@/hooks/useProgress";

export default function ProgressOverview({ compact = false }: { compact?: boolean }) {
  const { account } = useAccount();
  const { data, loading, error, refresh } = useProgress(account?.id);

  if (loading) {
    return (
      <div aria-label="Loading progress" className={`grid animate-pulse gap-4 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {[0, 1, 2].map((item) => <div key={item} className="h-44 border border-[var(--line)] bg-[var(--surface)]" />)}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div role="alert" className="card p-6 text-center">
        <p className="font-semibold text-[var(--incorrect)]">{error ?? "Progress is unavailable."}</p>
        <Button variant="secondary" onClick={refresh} className="mt-4">Try again</Button>
      </div>
    );
  }

  if (data.totalAttempts === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <div className="flex h-10 items-end justify-center gap-1" aria-hidden="true">
          {[10, 20, 14, 26, 16, 22, 12].map((height, index) => (
            <span key={index} className="w-1.5 bg-[var(--accent)] opacity-30" style={{ height }} />
          ))}
        </div>
        <h2 className="mt-5 text-xl font-semibold text-[var(--ink)]">Your first result starts here</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">Complete a listening clip and your score, streak, and tricky words will appear here.</p>
        <Link href="/practice" className="mt-5 inline-flex min-h-11 items-center rounded-[var(--radius)] border-2 border-[var(--line-strong)] bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] transition-all hover:bg-[var(--accent-hover)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none">Start practicing</Link>
      </div>
    );
  }

  return (
    <div>
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3"}`}>
        <StatCard label="Clips completed" value={data.totalAttempts} detail="All listening attempts" />
        <StatCard label="Average score" value={`${data.averageScore}%`} detail="Across every attempt" />
        <StatCard label="Current streak" value={data.currentStreak} detail="Correct answers in a row" />
      </div>

      {data.weakWords.length > 0 && (
        <section className="card mt-5 p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--ink)]">Words to listen for</h2>
              <p className="text-sm text-[var(--muted)]">These words have been easy to miss lately.</p>
            </div>
            {!compact && <Link href="/practice" className="text-sm font-semibold text-[var(--accent-dark)] hover:underline">Practice now →</Link>}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {data.weakWords.map((item) => (
              <span key={item.word} className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-1.5 text-sm font-medium text-[var(--ink)]">
                {item.word}<span className="font-mono text-xs text-[var(--muted)]">×{item.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
