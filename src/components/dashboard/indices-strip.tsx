import { getQuote, findAsset } from "@/lib/market-data";
import { TickerMarquee } from "@/components/dashboard/ticker-marquee";
import { createClient } from "@/lib/supabase/server";

const INDEX_TICKERS: { symbol: string; label: string }[] = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "DIA", label: "Dow 30" },
  { symbol: "QQQ", label: "Nasdaq" },
  { symbol: "IWM", label: "Russell 2000" },
];

export async function IndicesStrip() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: watchlistItems } = user
    ? await supabase.from("watchlist_items").select("symbol").eq("user_id", user.id)
    : { data: null };

  const watchlistTickers = (watchlistItems ?? [])
    .map((w) => findAsset(w.symbol))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .filter((a) => !INDEX_TICKERS.some((t) => t.symbol === a.symbol))
    .map((a) => ({ symbol: a.symbol, label: a.name }));

  const tickers = [...INDEX_TICKERS, ...watchlistTickers];
  const quotes = await Promise.all(tickers.map((t) => getQuote(t.symbol)));

  const items = tickers.map((t, i) => {
    const q = quotes[i];
    if (!q) return null;
    return { symbol: t.symbol, label: t.label, price: q.price, changePct: q.changePct };
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return <TickerMarquee items={items} />;
}
