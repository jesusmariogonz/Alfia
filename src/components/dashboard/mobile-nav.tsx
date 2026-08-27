"use client";

import { useState } from "react";
import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { NAV_SECTIONS } from "@/components/dashboard/nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    [NAV_SECTIONS[0].label]: true,
  });

  function toggleSection(label: string) {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }

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
        <nav className="border-t border-border px-4 py-2">
          {NAV_SECTIONS.map((section) => {
            const isOpen = Boolean(openSections[section.label]);
            return (
              <div key={section.label} className="border-b border-border py-1 last:border-none">
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between py-2.5 text-left text-base font-medium text-text"
                >
                  {section.label}
                  <span aria-hidden className="text-sm text-text-muted">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-1 pb-2 pl-3">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <form action="/api/auth/signout" method="post" className="py-2">
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
