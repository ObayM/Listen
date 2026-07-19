import { indexClips, type IndexSummary } from "@/lib/indexClips";

type BootstrapState = {
  status: "idle" | "running" | "failed";
  promise: Promise<IndexSummary> | null;
  error: string | null;
};

const globalState = globalThis as typeof globalThis & {
  __listenClipBootstrap?: BootstrapState;
};

function getState(): BootstrapState {
  globalState.__listenClipBootstrap ??= {
    status: "idle",
    promise: null,
    error: null,
  };
  return globalState.__listenClipBootstrap;
}

export function clipBootstrapStatus() {
  const state = getState();
  return { status: state.status, error: state.error };
}

export function startClipBootstrap(): Promise<IndexSummary> {
  const state = getState();
  if (state.promise) return state.promise;

  state.status = "running";
  state.error = null;
  state.promise = indexClips({ videosPerChannel: 3, stopAfterClips: 20 })
    .then((summary) => {
      if (summary.clips === 0) {
        throw new Error("No usable officially-captioned clips were found.");
      }
      state.status = "idle";
      return summary;
    })
    .catch((error: unknown) => {
      state.status = "failed";
      state.error = error instanceof Error ? error.message : "Clip setup failed.";
      console.error("Automatic clip setup failed", error);
      throw error;
    })
    .finally(() => {
      state.promise = null;
    });

  return state.promise;
}
