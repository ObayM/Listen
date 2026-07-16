const KEY = "en-listening-device-id";
const ACCOUNT_KEY = "en-listening-account";
const ACCOUNT_EVENT = "en-listening-account-change";

export type Account = { id: string; username: string };

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function getAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(ACCOUNT_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setAccount(account: Account | null) {
  if (typeof window === "undefined") return;
  if (account) window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  else window.localStorage.removeItem(ACCOUNT_KEY);
  window.dispatchEvent(new Event(ACCOUNT_EVENT));
}

export function getAccountSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCOUNT_KEY);
}

export function subscribeToAccount(onChange: () => void) {
  window.addEventListener(ACCOUNT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ACCOUNT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function getIdentityId(): string {
  return getAccount()?.id ?? getDeviceId();
}
