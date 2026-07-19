"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/practice", label: "Practice" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Account" },
] as const;

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main navigation" className={mobile ? "grid grid-cols-3" : "flex items-center gap-4"}>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${mobile ? "flex min-h-12 justify-center border-t-2 text-sm" : "flex min-h-9 border-b-2 px-1 text-sm"} items-center font-semibold transition-colors ${
              active
                ? "border-[var(--accent-dark)] text-[var(--ink)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
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
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--background)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/practice" className="serif text-xl font-bold tracking-tight text-[var(--ink)] sm:text-2xl">
            Listen
          </Link>
          <div className="hidden md:block"><Navigation /></div>
        </div>
      </header>

      <main>{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--line)] bg-[var(--background)] px-2 pb-[env(safe-area-inset-bottom)] md:hidden">
        <Navigation mobile />
      </div>
    </div>
  );
}
