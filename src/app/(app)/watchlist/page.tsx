import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { Sparkline } from "@/components/analytics/sparkline";
import { RemoveFromWatchlistButton } from "@/components/analytics/remove-from-watchlist-button";
import { Button } from "@/components/ui/button";
import type { WatchlistItem } from "@/types/database";

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

  const rows = (items ?? [])
    .map((item) => {
      const asset = findAsset(item.symbol);
      if (!asset) return null;
      const closes = getCloses(asset.symbol)!;
      const last = closes[closes.length - 1].close;
      const prev = closes[closes.length - 2].close;
      return { asset, price: last, changePct: last / prev - 1, closes };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Watchlist</h1>
      <p className="mt-1 text-sm text-text-muted">
        Los activos que sigues de cerca, todos en un solo lugar.
      </p>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-12 text-center">
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
        <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
          {rows.map((row) => (
            <div key={row.asset.symbol} className="flex items-center justify-between gap-4 p-5">
              <Link href={`/activos/${row.asset.symbol}`} className="min-w-0 flex-1">
                <p className="font-data font-medium text-text">{row.asset.symbol}</p>
                <p className="text-xs text-text-muted">{row.asset.name}</p>
              </Link>
              <div className="text-right">
                <p className="font-data text-text">${row.price.toLocaleString("es")}</p>
                <p
                  className={`font-data text-xs ${row.changePct >= 0 ? "text-data-up" : "text-data-down"}`}
                >
                  {row.changePct >= 0 ? "+" : ""}
                  {(row.changePct * 100).toFixed(2)}%
                </p>
              </div>
              <Sparkline
                values={row.closes.slice(-60).map((c) => c.close)}
                up={row.changePct >= 0}
              />
              <RemoveFromWatchlistButton symbol={row.asset.symbol} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
