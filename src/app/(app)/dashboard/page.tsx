import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { MarketSentimentBanner } from "@/components/dashboard/market-sentiment-banner";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Badge } from "@/components/ui/badge";
import { isFreePlan, canUseChat } from "@/lib/plan";
import { computeMarketSentiment } from "@/lib/analytics/sentiment";
import type { Profile } from "@/types/database";

type QuickLink = {
  href: string;
  label: string;
  description: string;
  plusOnly?: boolean;
  proOnly?: boolean;
};

const QUICK_LINKS: QuickLink[] = [
  { href: "/portafolio", label: "Mi Portafolio", description: "Tus posiciones, riesgo y correlación reunidos", plusOnly: true },
  { href: "/screener", label: "Screener", description: "Filtra activos por retorno y riesgo" },
  { href: "/watchlist", label: "Watchlist", description: "Sigue tus activos favoritos" },
  { href: "/chat", label: "Chat de inversión", description: "Pregunta y corre análisis a demanda", proOnly: true },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const plan = profile?.plan ?? "free";
  const isFree = isFreePlan(plan);
  const hasChat = canUseChat(plan);
  const quickLinks = QUICK_LINKS.filter((l) => {
    if (l.plusOnly && isFree) return false;
    if (l.proOnly && !hasChat) return false;
    return true;
  });

  const today = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const sentiment = await computeMarketSentiment();

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="font-display text-2xl font-semibold capitalize text-text">
          {today}
        </h1>
        {sentiment && (
          <div className="mt-4">
            <MarketSentimentBanner sentiment={sentiment} />
          </div>
        )}
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

      {isFree && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 px-5 py-3">
          <p className="text-sm text-text">
            <Badge tone="gold">Free</Badge>{" "}
            <span className="ml-2">
              Estás viendo la versión básica del dashboard — Básico y Pro incluyen Mi
              Portafolio y más noticias diarias.
            </span>
          </p>
          <Link href="/creditos" className="text-sm font-medium text-gold hover:underline">
            Ver planes →
          </Link>
        </div>
      )}

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
          <NewsFeed limit={isFree ? 1 : undefined} />
        </div>
      </section>
    </div>
  );
}
