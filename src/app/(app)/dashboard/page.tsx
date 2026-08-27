import Link from "next/link";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { Disclaimer } from "@/components/ui/disclaimer";

const quickLinks = [
  { href: "/portafolio", label: "Mi Portafolio", description: "Tus posiciones, riesgo y correlación reunidos" },
  { href: "/screener", label: "Screener", description: "Filtra activos por retorno y riesgo" },
  { href: "/comparar", label: "Comparador", description: "Compara dos activos lado a lado" },
  { href: "/simulador", label: "Simulador Montecarlo", description: "Proyecta escenarios de inversión" },
  { href: "/watchlist", label: "Watchlist", description: "Sigue tus activos favoritos" },
];

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="font-display text-2xl font-semibold capitalize text-text">
          {today}
        </h1>
        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-text">
            Resumen del mercado
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Los principales índices cerraron con movimientos mixtos tras los
            comentarios de la Fed sobre el ritmo de futuros recortes de tasas. El
            sector tecnológico lideró las ganancias mientras que consumo discrecional
            retrocedió por datos de ventas al menudeo más débiles de lo esperado.
            La volatilidad implícita se mantuvo estable durante la sesión.
          </p>
          <Disclaimer className="mt-4" />
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">Analíticos</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-green-bright/40"
            >
              <p className="font-display font-medium text-text">{link.label}</p>
              <p className="mt-1.5 text-xs text-text-muted">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">
          Noticias con sentimiento
        </h2>
        <div className="mt-4">
          <NewsFeed />
        </div>
      </section>
    </div>
  );
}
