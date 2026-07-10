"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Player from "@/components/Player";
import DictationInput from "@/components/DictationInput";
import BlankInput from "@/components/BlankInput";
import Feedback, { ScoreResult } from "@/components/Feedback";
import AccountBadge from "@/components/AccountBadge";
import { getAccount, getIdentityId, type Account } from "@/lib/device";
import type { BlankToken } from "@/lib/blanks";

type Clip = {
  id: string;
  videoId: string;
  startSec: number;
  endSec: number;
  tags: string[];
  estDifficulty: number | null;
  blanks?: BlankToken[];
};

type Difficulty = "any" | "easy" | "medium" | "hard";
const DIFFICULTIES: Difficulty[] = ["any", "easy", "medium", "hard"];
const DIFFICULTY_KEY = "en-listening-difficulty";

type Mode = "dictation" | "blanks";
const MODES: Mode[] = ["dictation", "blanks"];
const MODE_KEY = "en-listening-mode";

type WeakWord = { word: string; count: number };

export default function Home() {
  const [clip, setClip] = useState<Clip | null>(null);
  const [typed, setTyped] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seen, setSeen] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("any");
  const [mode, setMode] = useState<Mode>("dictation");
  const [scores, setScores] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [weakWords, setWeakWords] = useState<WeakWord[]>([]);
  const [account, setAccountState] = useState<Account | null>(null);
  const replayCount = useRef(0);
  const shownAt = useRef(0);
  const difficultyRef = useRef<Difficulty>("any");
  const modeRef = useRef<Mode>("dictation");

  const refreshWeakWords = useCallback(() => {
    fetch(`/api/stats/weak-words?deviceId=${getIdentityId()}`)
      .then((r) => r.json())
      .then((d) => setWeakWords(d.words ?? []))
      .catch(() => {});
  }, []);

  const loadNext = useCallback(async () => {
    setResult(null);
    setTyped("");
    setGuesses([]);
    setError(null);
    replayCount.current = 0;
    const params = new URLSearchParams();
    if (difficultyRef.current !== "any") params.set("difficulty", difficultyRef.current);
    if (modeRef.current === "blanks") params.set("mode", "blanks");
    const qs = params.toString();
    const res = await fetch(`/api/clips/next${qs ? `?${qs}` : ""}`);
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
    const saved = window.localStorage.getItem(DIFFICULTY_KEY) as Difficulty | null;
    if (saved && DIFFICULTIES.includes(saved)) {
      difficultyRef.current = saved;
      setDifficulty(saved);
    }
    const savedMode = window.localStorage.getItem(MODE_KEY) as Mode | null;
    if (savedMode && MODES.includes(savedMode)) {
      modeRef.current = savedMode;
      setMode(savedMode);
    }
    setAccountState(getAccount());
    loadNext();
    refreshWeakWords();
  }, [loadNext, refreshWeakWords]);

  const handleAccountChange = (a: Account | null) => {
    setAccountState(a);
    refreshWeakWords();
  };

  const pickDifficulty = (d: Difficulty) => {
    difficultyRef.current = d;
    setDifficulty(d);
    window.localStorage.setItem(DIFFICULTY_KEY, d);
    loadNext();
  };

  const pickMode = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
    window.localStorage.setItem(MODE_KEY, m);
    loadNext();
  };

  const check = async () => {
    if (!clip || checking) return;
    const isBlanks = mode === "blanks";
    if (isBlanks && !guesses.some((g) => g && g.trim().length > 0)) return;
    if (!isBlanks && typed.trim().length === 0) return;

    setChecking(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isBlanks ? { clipId: clip.id, mode: "blanks", guesses } : { clipId: clip.id, typed },
        ),
      });
      const data: ScoreResult = await res.json();
      setResult(data);
      setScores((s) => [...s, data.score]);
      setStreak((s) => (data.verdict === "correct" ? s + 1 : 0));

      const missedWords = data.blankResults
        ? data.blankResults
            .filter((b) => !b.correct)
            .map((b) => b.answer.toLowerCase().replace(/[^a-z']/g, ""))
            .filter(Boolean)
        : data.diff
            .filter((t) => t.type === "sub" || t.type === "missing")
            .map((t) => (t.ref ?? "").toLowerCase().replace(/[^a-z']/g, ""))
            .filter(Boolean);

      fetch("/api/attempts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          deviceId: getIdentityId(),
          typedText: isBlanks ? guesses.join(" | ") : typed,
          score: data.score,
          verdict: data.verdict,
          matchedByFastPath: data.matchedByFastPath,
          replayCount: replayCount.current,
          msToAnswer: Date.now() - shownAt.current,
          missedWords,
        }),
      })
        .then(() => refreshWeakWords())
        .catch(() => {});
    } catch {
      setError("scoring failed, try again.");
    } finally {
      setChecking(false);
    }
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-4">
        <div className="shrink-0">
          <div className="flex items-center gap-2">
            <span className="rec-dot h-2 w-2 shrink-0 bg-[var(--accent)]" />
            <h1 className="font-mono text-lg font-semibold whitespace-nowrap tracking-widest text-neutral-100 uppercase">
              infinite listening
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--muted)]">type what you hear. keep going.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AccountBadge account={account} onChange={handleAccountChange} />
          {seen > 0 && (
            <div className="font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
              no. <span className="text-neutral-200">{String(seen).padStart(3, "0")}</span>
            </div>
          )}
        </div>
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
          {avgScore !== null && (
            <span>
              avg <span className="text-neutral-200">{avgScore}</span>
            </span>
          )}
          {streak > 1 && (
            <span>
              streak <span className="text-[var(--accent)]">{streak}</span>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border border-[var(--line)]">
            {MODES.map((m) => (
              <button
                key={m}
                onClick={() => pickMode(m)}
                className={`px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors ${
                  mode === m
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--muted)] hover:text-neutral-200"
                }`}
              >
                {m === "dictation" ? "dictation" : "fill blanks"}
              </button>
            ))}
          </div>
          <div className="flex border border-[var(--line)]">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => pickDifficulty(d)}
                className={`px-3 py-1.5 font-mono text-xs tracking-widest uppercase transition-colors ${
                  difficulty === d
                    ? "bg-[var(--accent)] text-black"
                    : "text-[var(--muted)] hover:text-neutral-200"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {weakWords.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 border border-[var(--line)] bg-[var(--panel)] px-3 py-2">
          <span className="font-mono text-xs tracking-widest text-[var(--muted)] uppercase">listen for</span>
          {weakWords.map((w) => (
            <span key={w.word} className="font-mono text-xs text-neutral-300">
              {w.word}
            </span>
          ))}
        </div>
      )}

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

            {!result && mode === "blanks" && clip.blanks && (
              <BlankInput
                tokens={clip.blanks}
                guesses={guesses}
                onChange={setGuesses}
                onSubmit={check}
                disabled={checking}
              />
            )}

            {!result && mode === "dictation" && (
              <DictationInput value={typed} onChange={setTyped} onSubmit={check} disabled={checking} />
            )}

            {checking && !result && (
              <p className="mt-4 font-mono text-sm text-[var(--muted)]">checking...</p>
            )}

            {result && <Feedback result={result} onNext={loadNext} blankTokens={clip.blanks} />}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
