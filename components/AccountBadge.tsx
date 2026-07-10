"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { setAccount, type Account } from "@/lib/device";

type Props = {
  account: Account | null;
  onChange: (account: Account | null) => void;
};

export default function AccountBadge({ account, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (account) {
    return (
      <div className="flex items-center gap-3 font-mono text-xs tracking-widest text-[var(--muted)] uppercase">
        <span>
          hi, <span className="text-neutral-200">{account.username}</span>
        </span>
        <button
          onClick={() => {
            setAccount(null);
            onChange(null);
          }}
          className="text-[var(--muted)] transition-colors hover:text-[var(--accent)]"
        >
          sign out
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-mono text-xs tracking-widest text-[var(--muted)] uppercase transition-colors hover:text-[var(--accent)]"
      >
        sign in
      </button>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, passphrase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "sign in failed");
        return;
      }
      const acct = { id: data.id, username: data.username };
      setAccount(acct);
      onChange(acct);
      setOpen(false);
    } catch {
      setError("sign in failed, try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="name"
        className="w-20 border border-[var(--line)] bg-[var(--panel)] px-2 py-1 font-mono text-xs text-neutral-100 outline-none focus:border-[var(--accent)]"
      />
      <input
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        type="password"
        placeholder="passphrase"
        onKeyDown={(e) => e.key === "Enter" && submit()}
        className="w-24 border border-[var(--line)] bg-[var(--panel)] px-2 py-1 font-mono text-xs text-neutral-100 outline-none focus:border-[var(--accent)]"
      />
      <button
        onClick={submit}
        disabled={busy || username.trim().length < 3 || passphrase.length < 4}
        className="bg-[var(--accent)] px-2 py-1 font-mono text-xs text-black uppercase disabled:opacity-30"
      >
        go
      </button>
      {error && <span className="font-mono text-xs text-rose-400">{error}</span>}
    </motion.div>
  );
}
