"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { NAV_LINKS } from "@/components/dashboard/nav-links";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        <LogoLockup size={24} />
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-green-bright/10 text-green-bright"
                  : "text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {active && (
                <span className="absolute -left-4 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-green-bright" />
              )}
              {link.label}
            </Link>
          );
        })}
      </nav>
      <form action="/api/auth/signout" method="post" className="mt-auto">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
