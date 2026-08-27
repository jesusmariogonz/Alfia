import { UNIVERSE, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore } from "@/lib/analytics/score";
import { ScreenerTable, type ScreenerRow } from "@/components/analytics/screener-table";

export default async function ScreenerPage() {
  const rows: ScreenerRow[] = await Promise.all(
    UNIVERSE.map(async (asset) => {
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
      <div className="mt-6">
        <ScreenerTable rows={rows} />
      </div>
    </div>
  );
}
