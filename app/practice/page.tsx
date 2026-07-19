"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BlankInput from "@/components/BlankInput";
import DictationInput from "@/components/DictationInput";
import Feedback, { type ScoreResult } from "@/components/Feedback";
import Player from "@/components/Player";
import SegmentedControl from "@/components/ui/SegmentedControl";
import type { BlankToken } from "@/lib/blanks";
import { getIdentityId } from "@/lib/device";

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
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];
const DIFFICULTY_KEY = "en-listening-difficulty";

type Mode = "dictation" | "blanks";
const MODES: { value: Mode; label: string }[] = [
  { value: "dictation", label: "Dictation" },
  { value: "blanks", label: "Fill blanks" },
];
const MODE_KEY = "en-listening-mode";

export default function PracticePage() {
  const [clip, setClip] = useState<Clip | null>(null);
  const [typed, setTyped] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seedPoll, setSeedPoll] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("any");
  const [mode, setMode] = useState<Mode>("dictation");
  const replayCount = useRef(0);
  const shownAt = useRef(0);
  const difficultyRef = useRef<Difficulty>("any");
  const modeRef = useRef<Mode>("dictation");

  const loadNext = useCallback(async () => {
    setResult(null);
    setTyped("");
    setGuesses([]);
    setError(null);
    setLoading(true);
    replayCount.current = 0;

    const params = new URLSearchParams();
    if (difficultyRef.current !== "any") params.set("difficulty", difficultyRef.current);
    if (modeRef.current === "blanks") params.set("mode", "blanks");

    try {
      const query = params.toString();
      const response = await fetch(`/api/clips/next${query ? `?${query}` : ""}`);
      if (response.status === 202) {
        setClip(null);
        setSeedPoll((value) => value + 1);
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setClip(null);
        setSeedPoll(0);
        setError(data?.error ?? "We couldn't load a clip. Please try again.");
        return;
      }
      setClip(await response.json());
      setSeedPoll(0);
      shownAt.current = Date.now();
    } catch {
      setClip(null);
      setSeedPoll(0);
      setError("We couldn't connect to the clip library. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (seedPoll === 0) return;
    const timer = window.setTimeout(loadNext, 8000);
    return () => window.clearTimeout(timer);
  }, [loadNext, seedPoll]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedDifficulty = window.localStorage.getItem(DIFFICULTY_KEY) as Difficulty | null;
      if (savedDifficulty && DIFFICULTIES.some((option) => option.value === savedDifficulty)) {
        difficultyRef.current = savedDifficulty;
        setDifficulty(savedDifficulty);
      }
      const savedMode = window.localStorage.getItem(MODE_KEY) as Mode | null;
      if (savedMode && MODES.some((option) => option.value === savedMode)) {
        modeRef.current = savedMode;
        setMode(savedMode);
      }
      loadNext();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadNext]);

  const pickDifficulty = (value: Difficulty) => {
    difficultyRef.current = value;
    setDifficulty(value);
    window.localStorage.setItem(DIFFICULTY_KEY, value);
    loadNext();
  };

  const pickMode = (value: Mode) => {
    modeRef.current = value;
    setMode(value);
    window.localStorage.setItem(MODE_KEY, value);
    loadNext();
  };

  const check = async () => {
    if (!clip || checking) return;
    const isBlanks = mode === "blanks";
    if (isBlanks && !guesses.some((guess) => guess?.trim())) return;
    if (!isBlanks && !typed.trim()) return;

    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/score", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isBlanks ? { clipId: clip.id, mode: "blanks", guesses } : { clipId: clip.id, typed },
        ),
      });
      if (!response.ok) throw new Error("score request failed");

      const data: ScoreResult = await response.json();
      setResult(data);

      const missedWords = data.blankResults
        ? data.blankResults
            .filter((blank) => !blank.correct)
            .map((blank) => blank.answer.toLowerCase().replace(/[^a-z']/g, ""))
            .filter(Boolean)
        : data.diff
            .filter((token) => token.type === "sub" || token.type === "missing")
            .map((token) => (token.ref ?? "").toLowerCase().replace(/[^a-z']/g, ""))
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
      }).catch(() => {});
    } catch {
      setError("We couldn't check that answer. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <SegmentedControl label="Exercise" value={mode} options={MODES} onChange={pickMode} variant="tabs" />
        <SegmentedControl label="Difficulty" value={difficulty} options={DIFFICULTIES} onChange={pickDifficulty} variant="chips" />
      </section>

      {error && (
        <div role="alert" className="mb-6 border border-[var(--incorrect)] bg-[var(--incorrect-soft)] p-4 text-sm font-medium text-[var(--incorrect)]">
          {error}
        </div>
      )}

      {seedPoll > 0 && !clip && (
        <div role="status" className="card px-6 py-12 text-center sm:px-8">
          <div className="mx-auto flex h-10 items-end justify-center gap-1" aria-hidden="true">
            {[12, 22, 16, 30, 18, 25, 14].map((height, index) => (
              <span key={index} className="wave-bar w-1 bg-[var(--accent)]" style={{ height, animationDelay: `${index * 70}ms` }} />
            ))}
          </div>
          <h2 className="mt-5 text-xl font-semibold text-[var(--ink)]">Preparing your first clips</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Listen is finding a few officially captioned videos. This only happens once and can take a couple of minutes.
          </p>
        </div>
      )}

      {loading && !clip && seedPoll === 0 && (
        <div className="card animate-pulse p-6 sm:p-8">
          <div className="mx-auto h-5 w-36 rounded bg-[var(--surface-muted)]" />
          <div className="mx-auto mt-8 h-24 max-w-md bg-[var(--surface-muted)]" />
        </div>
      )}

      <AnimatePresence mode="wait">
        {clip && (
          <motion.section
            key={clip.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="card overflow-hidden p-4 sm:p-7"
          >
            <Player
              videoId={clip.videoId}
              startSec={clip.startSec}
              endSec={clip.endSec}
              onReplay={() => { replayCount.current += 1; }}
            />

            {!result && mode === "blanks" && clip.blanks && (
              <BlankInput tokens={clip.blanks} guesses={guesses} onChange={setGuesses} onSubmit={check} disabled={checking} />
            )}
            {!result && mode === "dictation" && (
              <DictationInput value={typed} onChange={setTyped} onSubmit={check} disabled={checking} />
            )}
            {checking && !result && (
              <p role="status" className="mt-4 text-center text-sm font-semibold text-[var(--muted)]">Checking your answer…</p>
            )}
            {result && <Feedback result={result} onNext={loadNext} blankTokens={clip.blanks} />}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
