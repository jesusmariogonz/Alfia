import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore } from "@/lib/analytics/score";
import { Sparkline } from "@/components/analytics/sparkline";
import { RemoveFromWatchlistButton } from "@/components/analytics/remove-from-watchlist-button";
import { Button } from "@/components/ui/button";
import type { WatchlistItem } from "@/types/database";

function fmtVolume(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es");
}

function scoreTone(score: number): string {
  if (score >= 65) return "text-data-up";
  if (score >= 40) return "text-gold";
  return "text-data-down";
}

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<WatchlistItem[]>();

  const rows = (
    await Promise.all(
      (items ?? []).map(async (item) => {
        const asset = findAsset(item.symbol);
        if (!asset) return null;
        const closes = (await getCloses(asset.symbol))!;
        const last = closes[closes.length - 1];
        const prev = closes[closes.length - 2].close;
        const metrics = computeRiskMetrics(closes);
        return {
          asset,
          price: last.close,
          changePct: last.close / prev - 1,
          volume: last.volume,
          alfiaScore: computeAlfiaScore(metrics),
          closes,
        };
      }),
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Watchlist</h1>
      <p className="mt-1 text-sm text-text-muted">
        Los activos que sigues de cerca, todos en un solo lugar.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-display text-lg font-medium text-text">
            Todavía no sigues ningún activo
          </p>
          <p className="max-w-sm text-sm text-text-muted">
            Explora el screener y agrega los activos que quieras monitorear — verás
            su precio y tendencia aquí cada vez que entres.
          </p>
          <Link href="/screener">
            <Button>Ir al screener</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-5 py-3 font-medium">Activo</th>
                <th className="px-5 py-3 font-medium text-right">Precio</th>
                <th className="px-5 py-3 font-medium text-right">Cambio</th>
                <th className="px-5 py-3 font-medium text-right">Volumen</th>
                <th className="px-5 py-3 font-medium">Tendencia</th>
                <th className="px-5 py-3 font-medium text-right">Alfia Score</th>
                <th className="px-5 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.asset.symbol} className="hover:bg-surface-2">
                  <td className="px-5 py-3">
                    <Link href={`/activos/${row.asset.symbol}`} className="block">
                      <p className="font-data font-medium text-text">{row.asset.symbol}</p>
                      <p className="text-xs text-text-muted">{row.asset.name}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-data text-text">
                    ${row.price.toLocaleString("es")}
                  </td>
                  <td
                    className={`px-5 py-3 text-right font-data ${row.changePct >= 0 ? "text-data-up" : "text-data-down"}`}
                  >
                    {row.changePct >= 0 ? "+" : ""}
                    {(row.changePct * 100).toFixed(2)}%
                  </td>
                  <td className="px-5 py-3 text-right font-data text-text-muted">
                    {fmtVolume(row.volume)}
                  </td>
                  <td className="w-32 px-5 py-3">
                    <Sparkline
                      values={row.closes.slice(-60).map((c) => c.close)}
                      up={row.changePct >= 0}
                    />
                  </td>
                  <td className={`px-5 py-3 text-right font-data font-semibold ${scoreTone(row.alfiaScore)}`}>
                    {row.alfiaScore}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/activos/${row.asset.symbol}#abrir-posicion`}
                        className="text-xs font-medium text-green-bright hover:underline"
                      >
                        Abrir posición →
                      </Link>
                      <RemoveFromWatchlistButton symbol={row.asset.symbol} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
