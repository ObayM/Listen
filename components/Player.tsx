"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi } from "@/lib/youtube";

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
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <div ref={holderRef} className="absolute inset-0 h-full w-full" />
        {needsTap && ready && (
          <button
            onClick={start}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
          >
            <div className="text-lg font-medium">tap to start listening</div>
            <div className="text-sm text-neutral-500">browsers need one tap before audio plays</div>
          </button>
        )}
        {!needsTap && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-900 text-neutral-300">
            <div className="text-sm uppercase tracking-widest text-neutral-500">
              {playing ? "listening" : "clip ready"}
            </div>
            <div className="flex items-end gap-1">
              {[10, 22, 16, 28, 14, 20, 12].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full bg-neutral-500 ${playing ? "animate-pulse" : ""}`}
                  style={{ height: `${h}px`, animationDelay: `${i * 90}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={replay}
        disabled={!ready}
        className="mt-3 rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
      >
        replay clip
      </button>
    </div>
  );
}
