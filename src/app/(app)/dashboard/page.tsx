import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { MarketSentimentBanner } from "@/components/dashboard/market-sentiment-banner";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Badge } from "@/components/ui/badge";
import { isFreePlan, canUseChat } from "@/lib/plan";
import { computeDailyReport } from "@/lib/analytics/daily-report";
import { BullishBearishPoll } from "@/components/dashboard/bullish-bearish-poll";
import type { Profile, SentimentVote } from "@/types/database";

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

  const report = await computeDailyReport();
  const sentiment = report.sentiment;

  const today8601 = new Date().toISOString().slice(0, 10);
  const { data: todaysVotes } = await supabase
    .from("sentiment_votes")
    .select("*")
    .eq("vote_date", today8601)
    .returns<SentimentVote[]>();
  const myVote = todaysVotes?.find((v) => v.user_id === user!.id)?.vote ?? null;
  const bullishCount = todaysVotes?.filter((v) => v.vote === "bullish").length ?? 0;
  const bearishCount = todaysVotes?.filter((v) => v.vote === "bearish").length ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-display text-2xl font-semibold capitalize text-text">
          {today}
        </h1>

        <div className="mt-5 divide-y divide-border rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]">
          {sentiment && <MarketSentimentBanner sentiment={sentiment} />}

          <BullishBearishPoll
            initialVote={myVote}
            initialBullish={bullishCount}
            initialBearish={bearishCount}
          />

          <div className="p-6">
            <h2 className="font-display text-lg font-medium text-text">
              Resumen del mercado
            </h2>
            <ol className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed text-text-muted">
              {report.narrative.slice(0, 2).map((line, i) => (
                <li key={i}>{i + 1}. {line}</li>
              ))}
            </ol>

            {report.featured && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gold">
                  En detalle: {report.featured.symbol}
                </p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {report.featured.detail.map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed text-text">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/reporte"
              className="mt-4 inline-block text-sm font-medium text-green-bright hover:underline"
            >
              Ver reporte completo →
            </Link>
            <Disclaimer className="mt-4" />
          </div>
        </div>
      </section>

      {isFree && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-y border-gold/30 bg-gold/5 px-1 py-4">
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
        <div className="mt-4 divide-y divide-border border-y border-border">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-baseline justify-between gap-4 py-4 transition-colors hover:bg-surface-2"
            >
              <p className="font-display font-medium text-text">{link.label}</p>
              <p className="text-right text-xs text-text-muted">{link.description}</p>
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
