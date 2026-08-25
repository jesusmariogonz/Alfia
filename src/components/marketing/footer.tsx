import { LogoLockup } from "@/components/brand/logo-lockup";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-4">
            <LogoLockup size={22} />
            <p className="max-w-xl text-xs leading-relaxed text-text-muted">
              Alfia ofrece contenido e interpretaciones generadas por inteligencia
              artificial con fines educativos. Nada en este sitio constituye
              asesoría financiera, legal o fiscal, ni una recomendación de compra o
              venta de ningún instrumento. Invertir conlleva riesgo de pérdida.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-text">Resumen semanal por correo</p>
            <NewsletterForm />
          </div>
        </div>
        <p className="mt-8 text-xs text-text-muted">
          © {new Date().getFullYear()} Alfia. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
