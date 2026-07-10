"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
      <header className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-100">infinite listening</h1>
        <p className="text-sm text-neutral-500">type what you hear. keep going.</p>
      </header>

      {error && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 text-neutral-300">
          {error}
        </div>
      )}

      {clip && (
        <>
          <Player
            key={clip.id}
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
                  className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs text-neutral-400"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {!result && (
            <DictationInput value={typed} onChange={setTyped} onSubmit={check} disabled={checking} />
          )}

          {checking && !result && <p className="mt-4 text-sm text-neutral-500">checking...</p>}

          {result && <Feedback result={result} onNext={loadNext} />}
        </>
      )}
    </main>
  );
}
