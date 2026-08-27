import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCloses } from "@/lib/market-data";
import { computeRiskMetrics, dailyReturns } from "@/lib/analytics/metrics";
import { computeAlfiaScore, scoreLabel } from "@/lib/analytics/score";
import { computeCovarianceMatrix } from "@/lib/analytics/covariance";
import { usdToMxn } from "@/lib/fx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { CorrelationMatrix } from "@/components/portfolio/correlation-matrix";
import type { WatchlistItem } from "@/types/database";

export default async function PortafolioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user!.id)
    .not("invested_usd", "is", null)
    .order("invested_usd", { ascending: false })
    .returns<WatchlistItem[]>();

  const positions = items ?? [];

  if (positions.length === 0) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">Mi Portafolio</h1>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)] p-12 text-center">
          <p className="font-display text-lg font-medium text-text">
            Todavía no tienes posiciones abiertas
          </p>
          <p className="max-w-sm text-sm text-text-muted">
            Ve a un activo desde el screener y pon cuánto tienes invertido — a partir
            de ahí, todo su análisis aparece reunido aquí.
          </p>
          <Link href="/screener">
            <Button>Ir al screener</Button>
          </Link>
        </div>
      </div>
    );
  }

  const rows = await Promise.all(
    positions.map(async (item) => {
      const closes = (await getCloses(item.symbol))!;
      const metrics = computeRiskMetrics(closes);
      const score = computeAlfiaScore(metrics);
      const last = closes[closes.length - 1].close;
      const prev = closes[closes.length - 2].close;
      const returns = dailyReturns(closes);
      return {
        symbol: item.symbol,
        investedUsd: item.invested_usd!,
        price: last,
        changePct: last / prev - 1,
        metrics,
        score,
        returns,
      };
    }),
  );

  const totalUsd = rows.reduce((sum, r) => sum + r.investedUsd, 0);

  const { correlation } = computeCovarianceMatrix(
    rows.map((r) => r.symbol),
    rows.map((r) => r.returns),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text">Mi Portafolio</h1>
          <p className="mt-1 text-sm text-text-muted">
            Precios actualizados cada minuto · última carga:{" "}
            {new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-3">
          <p className="text-xs text-text-muted">Valor total</p>
          <p className="font-data text-xl font-semibold text-gold">
            ${totalUsd.toLocaleString("es", { maximumFractionDigits: 0 })} USD
          </p>
          <p className="font-data text-xs text-text-muted">
            ${usdToMxn(totalUsd).toLocaleString("es", { maximumFractionDigits: 0 })} MXN
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="px-5 py-3 font-medium">Activo</th>
              <th className="px-5 py-3 font-medium text-right">Precio</th>
              <th className="px-5 py-3 font-medium text-right">Invertido</th>
              <th className="px-5 py-3 font-medium text-right">% del portafolio</th>
              <th className="px-5 py-3 font-medium text-right">Retorno esperado</th>
              <th className="px-5 py-3 font-medium text-right">Volatilidad</th>
              <th className="px-5 py-3 font-medium text-right">Alfia Score</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.symbol} className="hover:bg-surface-2">
                <td className="px-5 py-3">
                  <Link href={`/activos/${row.symbol}`} className="font-data font-medium text-text hover:text-green-bright">
                    {row.symbol}
                  </Link>
                </td>
                <td className="px-5 py-3 text-right font-data">
                  <span className="text-text">${row.price.toLocaleString("es")}</span>
                  <span className={`ml-2 text-xs ${row.changePct >= 0 ? "text-data-up" : "text-data-down"}`}>
                    {row.changePct >= 0 ? "+" : ""}
                    {(row.changePct * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-data text-text">
                  ${row.investedUsd.toLocaleString("es", { maximumFractionDigits: 0 })}
                  <span className="ml-1 text-xs text-text-muted">
                    (${usdToMxn(row.investedUsd).toLocaleString("es", { maximumFractionDigits: 0 })} MXN)
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-data text-text">
                  {((row.investedUsd / totalUsd) * 100).toFixed(1)}%
                </td>
                <td className={`px-5 py-3 text-right font-data ${row.metrics.annualizedReturn >= 0 ? "text-data-up" : "text-data-down"}`}>
                  {(row.metrics.annualizedReturn * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3 text-right font-data text-text">
                  {(row.metrics.annualizedVolatility * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3 text-right">
                  <Badge tone={row.score >= 65 ? "green" : row.score >= 40 ? "gold" : "neutral"}>
                    {row.score} · {scoreLabel(row.score)}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/activos/${row.symbol}`} className="text-xs text-green-bright hover:underline">
                    Ver análisis →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 1 && (
        <div>
          <h2 className="font-display text-lg font-medium text-text">
            Correlación entre tus posiciones
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Cercano a 1 = se mueven juntos (menos diversificación real). Cercano a 0 o
            negativo = se mueven distinto (mejor diversificación).
          </p>
          <div className="mt-4">
            <CorrelationMatrix symbols={rows.map((r) => r.symbol)} matrix={correlation} />
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
