"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { getAccountSnapshot, setAccount, subscribeToAccount, type Account } from "@/lib/device";

type AccountContextValue = {
  account: Account | null;
  ready: boolean;
  updateAccount: (account: Account | null) => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);

export default function AccountProvider({ children }: { children: React.ReactNode }) {
  const rawAccount = useSyncExternalStore(subscribeToAccount, getAccountSnapshot, () => null);
  const ready = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const account = useMemo<Account | null>(() => rawAccount ? JSON.parse(rawAccount) : null, [rawAccount]);

  const updateAccount = useCallback((next: Account | null) => {
    setAccount(next);
  }, []);

  const value = useMemo(() => ({ account, ready, updateAccount }), [account, ready, updateAccount]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

function subscribeToHydration() {
  return () => {};
}

export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("useAccount must be used inside AccountProvider");
  return value;
}
