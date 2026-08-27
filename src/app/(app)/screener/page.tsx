import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UNIVERSE, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore } from "@/lib/analytics/score";
import { isFreePlan, FREE_SCREENER_LIMIT } from "@/lib/plan";
import { ScreenerTable, type ScreenerRow } from "@/components/analytics/screener-table";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/database";

export default async function ScreenerPage() {
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
  const universe = isFree ? UNIVERSE.slice(0, FREE_SCREENER_LIMIT) : UNIVERSE;

  const rows: ScreenerRow[] = await Promise.all(
    universe.map(async (asset) => {
      const closes = (await getCloses(asset.symbol))!;
      const metrics = computeRiskMetrics(closes);
      const last = closes[closes.length - 1].close;
      const prev = closes[closes.length - 2].close;

      return {
        symbol: asset.symbol,
        name: asset.name,
        sector: asset.sector,
        assetClass: asset.assetClass,
        price: last,
        changePct: last / prev - 1,
        annualizedReturn: metrics.annualizedReturn,
        annualizedVolatility: metrics.annualizedVolatility,
        sharpeRatio: metrics.sharpeRatio,
        alfiaScore: computeAlfiaScore(metrics),
        sparkline: closes.slice(-60).map((c) => c.close),
      };
    }),
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Screener</h1>
      <p className="mt-1 text-sm text-text-muted">
        Filtra el universo de activos por tipo, retorno y volatilidad. No consume
        créditos.
      </p>

      {isFree && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/30 bg-gold/10 px-5 py-3">
          <p className="text-sm text-text">
            <Badge tone="gold">Free</Badge>{" "}
            <span className="ml-2">
              Ves {universe.length} de {UNIVERSE.length} activos, sin indicadores
              avanzados (medias móviles, velas).
            </span>
          </p>
          <Link href="/creditos" className="text-sm font-medium text-gold hover:underline">
            Desbloquear con Básico o Pro →
          </Link>
        </div>
      )}

      <div className="mt-6">
        <ScreenerTable rows={rows} />
      </div>
    </div>
  );
}
