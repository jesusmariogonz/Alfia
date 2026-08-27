import Link from "next/link";
import { LogoLockup } from "@/components/brand/logo-lockup";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/">
          <LogoLockup />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/screener" className="text-sm text-text-muted hover:text-text">
            Screener
          </Link>
          <a href="#precios" className="text-sm text-text-muted hover:text-text">
            Precios
          </a>
          <a href="#faq" className="text-sm text-text-muted hover:text-text">
            Preguntas frecuentes
          </a>
          <Link href="/aprende" className="text-sm text-text-muted hover:text-text">
            Aprende
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-text-muted hover:text-text">
            Iniciar sesión
          </Link>
          <Link href="/registro">
            <Button>Crear cuenta gratis</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
