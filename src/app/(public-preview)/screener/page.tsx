import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UNIVERSE, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore } from "@/lib/analytics/score";
import { isFreePlan, FREE_SCREENER_LIMIT } from "@/lib/plan";
import { ScreenerClient } from "@/components/analytics/screener-client";
import type { ScreenerRow } from "@/components/analytics/screener-table";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/database";

export default async function ScreenerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>()
    : { data: null };

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
        history: closes,
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
            <Badge tone="gold">{user ? "Free" : "Sin cuenta"}</Badge>{" "}
            <span className="ml-2">
              Ves {universe.length} de {UNIVERSE.length} activos, puedes comparar
              hasta 3 a la vez, sin velas ni exportar a CSV.
            </span>
          </p>
          <Link
            href={user ? "/creditos" : "/registro"}
            className="text-sm font-medium text-gold hover:underline"
          >
            {user ? "Desbloquear con Básico o Pro →" : "Regístrate gratis →"}
          </Link>
        </div>
      )}

      <div className="mt-6">
        <ScreenerClient rows={rows} plan={plan} />
      </div>
    </div>
  );
}
