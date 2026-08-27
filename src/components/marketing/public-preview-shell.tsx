import Link from "next/link";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Button } from "@/components/ui/button";

/**
 * Shell para páginas que un visitante sin cuenta puede ver de verdad
 * (screener, ficha de activo) — el gancho de "esto es real, no una
 * promesa" antes de pedir registro. Mismo look de marca que la landing,
 * con un banner fijo invitando a crear cuenta.
 */
export function PublicPreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="border-b border-gold/30 bg-gold/10 px-6 py-3 text-center text-sm text-text">
        Estás viendo Alfia sin cuenta.{" "}
        <Link href="/registro" className="font-medium text-gold hover:underline">
          Regístrate gratis
        </Link>{" "}
        para guardar tu portafolio y desbloquear el chat de IA.
      </div>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      <div className="mx-auto w-full max-w-6xl px-6 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)] p-6">
          <p className="text-sm text-text-muted">
            Crea tu cuenta gratis y empieza con 20 créditos de bienvenida.
          </p>
          <Link href="/registro">
            <Button>Crear cuenta gratis</Button>
          </Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
