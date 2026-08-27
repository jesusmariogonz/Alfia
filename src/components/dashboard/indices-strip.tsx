import { getQuote } from "@/lib/market-data";
import { TickerMarquee } from "@/components/dashboard/ticker-marquee";

const INDEX_TICKERS: { symbol: string; label: string }[] = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "DIA", label: "Dow 30" },
  { symbol: "QQQ", label: "Nasdaq" },
  { symbol: "IWM", label: "Russell 2000" },
];

export async function IndicesStrip() {
  const quotes = await Promise.all(INDEX_TICKERS.map((t) => getQuote(t.symbol)));

  const items = INDEX_TICKERS.map((t, i) => {
    const q = quotes[i];
    if (!q) return null;
    return { symbol: t.symbol, label: t.label, price: q.price, changePct: q.changePct };
  }).filter((v): v is NonNullable<typeof v> => v !== null);

  return <TickerMarquee items={items} />;
}
