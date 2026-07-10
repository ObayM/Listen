"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { loadYouTubeApi } from "@/lib/youtube";

const BAR_HEIGHTS = [10, 22, 16, 28, 14, 20, 12];

let audioUnlocked = false;

type Props = {
  videoId: string;
  startSec: number;
  endSec: number;
  onReplay: () => void;
};

export default function Player({ videoId, startSec, endSec, onReplay }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
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
    const p = playerRef.current;
    if (!p) return;
    stopPolling();
    p.seekTo(startSec, true);
    p.playVideo();
    setPlaying(true);
    pollRef.current = window.setInterval(() => {
      const t = p.getCurrentTime?.() ?? 0;
      if (t >= endSec) {
        p.pauseVideo();
        setPlaying(false);
        stopPolling();
      }
    }, 100);
  };

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !holderRef.current) return;
      const w = window as any;
      playerRef.current = new w.YT.Player(holderRef.current, {
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
        events: {
          onReady: () => {
            setReady(true);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      stopPolling();
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (ready && audioUnlocked) playRange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, videoId, startSec, endSec]);

  const start = () => {
    audioUnlocked = true;
    setNeedsTap(false);
    playRange();
  };

  const replay = () => {
    onReplay();
    if (needsTap) {
      start();
    } else {
      playRange();
    }
  };

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full overflow-hidden border border-[var(--line)] bg-black">
        <div ref={holderRef} className="absolute inset-0 h-full w-full" />
        {needsTap && ready && (
          <motion.button
            onClick={start}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--panel)] text-neutral-200"
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-lg font-medium">tap to start listening</div>
            <div className="text-sm text-[var(--muted)]">browsers need one tap before audio plays</div>
          </motion.button>
        )}
        {!needsTap && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--panel)] text-neutral-300">
            <div className="flex items-center gap-2 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
              <span
                className={`h-1.5 w-1.5 ${playing ? "rec-dot bg-[var(--accent)]" : "bg-[var(--muted)]"}`}
              />
              {playing ? "listening" : "clip ready"}
            </div>
            <div className="flex h-8 items-end gap-1.5">
              {BAR_HEIGHTS.map((h, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 bg-[var(--accent)]"
                  style={{ height: `${h}px`, transformOrigin: "bottom" }}
                  animate={
                    playing
                      ? { scaleY: [0.4, 1.4, 0.7, 1.2, 0.4] }
                      : { scaleY: 0.5 }
                  }
                  transition={
                    playing
                      ? {
                          duration: 0.7 + i * 0.08,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { duration: 0.2 }
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <motion.button
        onClick={replay}
        disabled={!ready}
        whileTap={{ scale: 0.97 }}
        className="mt-3 border border-[var(--line)] px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
      >
        replay clip
      </motion.button>
    </div>
  );
}
