import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";

const links = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/portafolio", label: "Mi Portafolio" },
  { href: "/chat", label: "Chat de inversión" },
  { href: "/screener", label: "Screener" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/aprende", label: "Aprende" },
  { href: "/creditos", label: "Créditos" },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-6 md:flex">
      <Link href="/dashboard" className="mb-8 px-2">
        <LogoLockup size={24} />
      </Link>
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            {link.label}
          </Link>
        ))}
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
