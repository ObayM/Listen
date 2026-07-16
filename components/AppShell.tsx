"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountBadge from "@/components/AccountBadge";

const NAV_ITEMS = [
  { href: "/practice", label: "Practice", icon: "play" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/profile", label: "Profile", icon: "person" },
] as const;

function NavIcon({ name }: { name: (typeof NAV_ITEMS)[number]["icon"] }) {
  if (name === "play") {
    return <path d="M9 7.5v9l7-4.5-7-4.5Z" />;
  }
  if (name === "chart") {
    return <path d="M5 18V10m7 8V6m7 12v-5" />;
  }
  return <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />;
}

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className={mobile ? "grid grid-cols-3" : "flex items-center gap-1"}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${mobile ? "flex min-h-16 flex-col justify-center gap-1 text-xs" : "flex min-h-10 gap-2 px-4 text-sm"} items-center rounded-[var(--radius)] font-semibold transition-colors ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
                : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"
            }`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <NavIcon name={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/practice" className="flex items-center gap-2.5 text-[var(--ink)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent)]">
              <span className="flex items-center gap-0.5" aria-hidden="true">
                {[8, 15, 10, 17, 12].map((height, index) => (
                  <i key={index} className="w-0.5 bg-white" style={{ height }} />
                ))}
              </span>
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">Infinite Listening</span>
          </Link>
          <div className="hidden md:block"><Navigation /></div>
          <AccountBadge />
        </div>
      </header>

      <main>{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--surface)] px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        <Navigation mobile />
      </div>
    </div>
  );
}
