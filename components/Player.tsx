"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { loadYouTubeApi } from "@/lib/youtube";

const BAR_HEIGHTS = [18, 30, 23, 38, 28, 43, 25, 35, 20];
let audioUnlocked = false;

type YouTubePlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime?: () => number;
  destroy?: () => void;
};

type YouTubeWindow = Window & {
  YT: {
    Player: new (
      element: HTMLDivElement,
      options: { videoId: string; playerVars: Record<string, number>; events: { onReady: () => void } },
    ) => YouTubePlayer;
  };
};

type Props = {
  videoId: string;
  startSec: number;
  endSec: number;
  onReplay: () => void;
};

export default function Player({ videoId, startSec, endSec, onReplay }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const pollRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(!audioUnlocked);

  const stopPolling = () => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const playRange = () => {
    const player = playerRef.current;
    if (!player) return;
    stopPolling();
    player.seekTo(startSec, true);
    player.playVideo();
    setPlaying(true);
    pollRef.current = window.setInterval(() => {
      if ((player.getCurrentTime?.() ?? 0) >= endSec) {
        player.pauseVideo();
        setPlaying(false);
        stopPolling();
      }
    }, 100);
  };

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !holderRef.current) return;
      const browser = window as unknown as YouTubeWindow;
      playerRef.current = new browser.YT.Player(holderRef.current, {
        videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
          iv_load_policy: 3,
          fs: 0,
        },
        events: { onReady: () => setReady(true) },
      });
    });
    return () => {
      cancelled = true;
      stopPolling();
      try { playerRef.current?.destroy?.(); } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (ready && audioUnlocked) playRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, videoId, startSec, endSec]);

  const replay = () => {
    onReplay();
    if (needsTap) {
      audioUnlocked = true;
      setNeedsTap(false);
    }
    playRange();
  };

  return (
    <div className="relative overflow-hidden border border-[var(--line)] bg-[var(--surface-muted)] px-5 py-9 sm:px-8 sm:py-12">
      <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden="true">
        <div ref={holderRef} />
      </div>
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <div className="flex h-14 items-center justify-center gap-1.5" aria-hidden="true">
          {BAR_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className={`w-1.5 bg-[var(--accent)] transition-opacity duration-300 ${playing ? "wave-bar" : "opacity-30"}`}
              style={{ height, animationDelay: `${index * 70}ms` }}
            />
          ))}
        </div>

        <motion.button
          type="button"
          onClick={replay}
          disabled={!ready}
          whileTap={{ scale: 0.97 }}
          aria-label={needsTap ? "Start listening" : "Replay clip"}
          className={`mt-8 flex items-center gap-2.5 rounded-[var(--radius)] font-semibold transition-all disabled:opacity-40 ${needsTap
            ? "min-h-12 border-2 border-[var(--line-strong)] bg-[var(--accent)] px-6 py-3 text-[var(--ink)] shadow-[4px_4px_0_var(--ink)] hover:bg-[var(--accent-hover)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            : "min-h-9 border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
          }`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
            {needsTap ? <path d="m9 7 8 5-8 5V7Z" /> : <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" /><path d="M4 4v4.6h4.6" /></>}
          </svg>
          {!ready ? "Loading audio…" : needsTap ? "Start listening" : "Replay clip"}
        </motion.button>
      </div>
    </div>
  );
}
