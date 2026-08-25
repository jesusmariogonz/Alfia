import { UNIVERSE, getCloses } from "@/lib/market-data";
import { annualizedReturn, annualizedVolatility, dailyReturns, sharpeRatio } from "@/lib/analytics/metrics";
import { ScreenerTable, type ScreenerRow } from "@/components/analytics/screener-table";

export default function ScreenerPage() {
  const rows: ScreenerRow[] = UNIVERSE.map((asset) => {
    const closes = getCloses(asset.symbol)!;
    const returns = dailyReturns(closes);
    const last = closes[closes.length - 1].close;
    const prev = closes[closes.length - 2].close;

    return {
      symbol: asset.symbol,
      name: asset.name,
      sector: asset.sector,
      assetClass: asset.assetClass,
      price: last,
      changePct: last / prev - 1,
      annualizedReturn: annualizedReturn(closes),
      annualizedVolatility: annualizedVolatility(returns),
      sharpeRatio: sharpeRatio(returns),
      sparkline: closes.slice(-60).map((c) => c.close),
    };
  });

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
