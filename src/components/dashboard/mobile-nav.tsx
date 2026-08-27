"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { NAV_LINKS } from "@/components/dashboard/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border bg-surface md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <LogoLockup size={22} />
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className={`flex h-9 items-center justify-center rounded-lg border border-border px-3 text-text ${open ? "" : "w-9"}`}
        >
          {open ? (
            <span aria-hidden className="text-xs font-medium leading-none">Cerrar</span>
          ) : (
            <span aria-hidden className="flex flex-col gap-1">
              <span className="block h-0.5 w-5 bg-text" />
              <span className="block h-0.5 w-5 bg-text" />
              <span className="block h-0.5 w-5 bg-text" />
            </span>
          )}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-border px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              {link.label}
            </Link>
          ))}
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              Cerrar sesión
            </button>
          </form>
        </nav>
      )}
    </div>
  );
}
