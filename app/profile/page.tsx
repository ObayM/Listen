"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "@/components/AccountProvider";
import ProgressOverview from "@/components/ProgressOverview";
import Button from "@/components/ui/Button";
import { getDeviceId } from "@/lib/device";

const MODE_KEY = "en-listening-mode";
const DIFFICULTY_KEY = "en-listening-difficulty";

function SignInCard() {
  const { updateAccount } = useAccount();
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy || username.trim().length < 3 || passphrase.length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, passphrase, deviceId: getDeviceId() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Sign in failed.");
        return;
      }
      updateAccount({ id: data.id, username: data.username });
    } catch {
      setError("We couldn't sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card mx-auto max-w-lg p-6 sm:p-8">
      <span className="serif flex h-12 w-12 items-center justify-center bg-[var(--accent-soft)] text-xl font-semibold text-[var(--accent-dark)]">∞</span>
      <h2 className="mt-5 text-2xl font-semibold text-[var(--ink)]">Keep your progress with you</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">Enter a name and passphrase to create an account or return to one. Practice from this browser will be merged automatically.</p>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--ink)]">Username</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="At least 3 characters" className="min-h-12 w-full rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[var(--ink)]">Passphrase</span>
          <input value={passphrase} onChange={(event) => setPassphrase(event.target.value)} onKeyDown={(event) => event.key === "Enter" && submit()} type="password" autoComplete="current-password" placeholder="At least 4 characters" className="min-h-12 w-full rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]" />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 border border-[var(--incorrect)] bg-[var(--incorrect-soft)] px-4 py-3 text-sm font-medium text-[var(--incorrect)]">{error}</p>}
      <Button onClick={submit} disabled={busy || username.trim().length < 3 || passphrase.length < 4} fullWidth className="mt-5">{busy ? "Signing in…" : "Save and continue"}</Button>
      <p className="mt-4 text-center text-xs text-[var(--muted)]">No email required. Your passphrase is never displayed.</p>
    </motion.section>
  );
}

export default function ProfilePage() {
  const { account, ready, updateAccount } = useAccount();
  const [mode] = useState(() => typeof window === "undefined" ? "Dictation" : window.localStorage.getItem(MODE_KEY) === "blanks" ? "Fill blanks" : "Dictation");
  const [difficulty] = useState(() => typeof window === "undefined" ? "Any" : window.localStorage.getItem(DIFFICULTY_KEY) ?? "Any");

  if (!ready) {
    return <div className="mx-auto max-w-5xl px-4 py-12"><div className="mx-auto h-96 max-w-lg animate-pulse border border-[var(--line)] bg-[var(--surface)]" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-7">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">Profile</h1>
      </header>

      {!account ? <SignInCard /> : (
        <div className="space-y-6">
          <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="serif flex h-14 w-14 items-center justify-center bg-[var(--accent-soft)] text-xl font-semibold text-[var(--accent-dark)]">{account.username.slice(0, 1).toUpperCase()}</span>
              <div>
                <h2 className="text-xl font-semibold text-[var(--ink)]">{account.username}</h2>
                <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]"><span className="h-2 w-2 rounded-full bg-[var(--correct)]" />Progress sync is active</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => updateAccount(null)}>Sign out</Button>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Progress snapshot</h2>
            <ProgressOverview compact />
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Practice preferences</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="border border-[var(--line)] bg-[var(--surface-muted)] p-4"><p className="eyebrow">Exercise</p><p className="mt-1 font-semibold text-[var(--ink)]">{mode}</p></div>
              <div className="border border-[var(--line)] bg-[var(--surface-muted)] p-4"><p className="eyebrow">Difficulty</p><p className="mt-1 font-semibold capitalize text-[var(--ink)]">{difficulty}</p></div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
