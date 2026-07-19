import { indexClips, type IndexSummary } from "@/lib/indexClips";

type BootstrapState = {
  status: "idle" | "running" | "failed";
  promise: Promise<IndexSummary> | null;
  error: string | null;
  failedAt: number | null;
};

const globalState = globalThis as typeof globalThis & {
  __listenClipBootstrap?: BootstrapState;
};

function getState(): BootstrapState {
  globalState.__listenClipBootstrap ??= {
    status: "idle",
    promise: null,
    error: null,
    failedAt: null,
  };
  return globalState.__listenClipBootstrap;
}

export function clipBootstrapStatus() {
  const state = getState();
  return { status: state.status, error: state.error, failedAt: state.failedAt };
}

export function startClipBootstrap(): Promise<IndexSummary> {
  const state = getState();
  if (state.promise) return state.promise;

  state.status = "running";
  state.error = null;
  state.failedAt = null;
  state.promise = indexClips({ videosPerChannel: 30, stopAfterClips: 20 })
    .then((summary) => {
      if (summary.clips === 0) {
        throw new Error("No usable officially-captioned clips were found.");
      }
      state.status = "idle";
      state.failedAt = null;
      return summary;
    })
    .catch((error: unknown) => {
      state.status = "failed";
      state.error = error instanceof Error ? error.message : "Clip setup failed.";
      state.failedAt = Date.now();
      console.error("Automatic clip setup failed", error);
      return { clips: 0, videos: 0 };
    })
    .finally(() => {
      state.promise = null;
    });

  return state.promise;
}
