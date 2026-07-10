"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Player from "@/components/Player";
import DictationInput from "@/components/DictationInput";
import Feedback, { ScoreResult } from "@/components/Feedback";
import { getDeviceId } from "@/lib/device";

type Clip = {
  id: string;
  videoId: string;
  startSec: number;
  endSec: number;
  tags: string[];
  estDifficulty: number | null;
};

export default function Home() {
  const [clip, setClip] = useState<Clip | null>(null);
  const [typed, setTyped] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(0);
  const replayCount = useRef(0);
  const shownAt = useRef(0);

  const loadNext = useCallback(async () => {
    setResult(null);
    setTyped("");
    setError(null);
    replayCount.current = 0;
    const res = await fetch("/api/clips/next");
    if (!res.ok) {
      setClip(null);
      setError(
        res.status === 404
          ? "no clips indexed yet. run npm run index first."
          : "could not load a clip.",
      );
      return;
    }
    setClip(await res.json());
    setSeen((n) => n + 1);
    shownAt.current = Date.now();
  }, []);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  const check = async () => {
    if (!clip || typed.trim().length === 0 || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clipId: clip.id, typed }),
      });
      const data: ScoreResult = await res.json();
      setResult(data);
      fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          deviceId: getDeviceId(),
          typedText: typed,
          score: data.score,
          verdict: data.verdict,
          matchedByFastPath: data.matchedByFastPath,
          replayCount: replayCount.current,
          msToAnswer: Date.now() - shownAt.current,
        }),
      }).catch(() => {});
    } catch {
      setError("scoring failed, try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10">
      <header className="mb-8 flex items-center justify-between border-b border-[var(--line)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rec-dot h-2 w-2 bg-[var(--accent)]" />
            <h1 className="font-mono text-lg font-semibold tracking-widest text-neutral-100 uppercase">
              infinite listening
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">type what you hear. keep going.</p>
        </div>
        {seen > 0 && (
          <div className="font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
            no. <span className="text-neutral-200">{String(seen).padStart(3, "0")}</span>
          </div>
        )}
      </header>

      {error && (
        <div className="border border-[var(--line)] bg-[var(--panel)] p-6 text-neutral-300">{error}</div>
      )}

      <AnimatePresence mode="wait">
        {clip && (
          <motion.div
            key={clip.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Player
              videoId={clip.videoId}
              startSec={clip.startSec}
              endSec={clip.endSec}
              onReplay={() => {
                replayCount.current += 1;
              }}
            />

            {clip.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {clip.tags.map((t) => (
                  <span
                    key={t}
                    className="border border-[var(--line)] px-2 py-0.5 font-mono text-xs tracking-wide text-[var(--muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {!result && (
              <DictationInput value={typed} onChange={setTyped} onSubmit={check} disabled={checking} />
            )}

            {checking && !result && (
              <p className="mt-4 font-mono text-sm text-[var(--muted)]">checking...</p>
            )}

            {result && <Feedback result={result} onNext={loadNext} />}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
