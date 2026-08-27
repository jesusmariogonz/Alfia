import { getQuote } from "@/lib/market-data";

const INDEX_TICKERS: { symbol: string; label: string }[] = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "DIA", label: "Dow 30" },
  { symbol: "QQQ", label: "Nasdaq" },
  { symbol: "IWM", label: "Russell 2000" },
];

export async function IndicesStrip() {
  const quotes = await Promise.all(INDEX_TICKERS.map((t) => getQuote(t.symbol)));

  return (
    <div className="overflow-x-auto border-b border-border">
      <div className="flex w-max gap-6 px-6 py-2.5 sm:px-4">
        {INDEX_TICKERS.map((t, i) => {
          const q = quotes[i];
          if (!q) return null;
          return (
            <div key={t.symbol} className="flex flex-col whitespace-nowrap">
              <span className="text-xs text-text-muted">{t.label}</span>
              <span className="flex items-baseline gap-1.5 font-data text-sm">
                <span className="text-text">{q.price.toLocaleString("es", { maximumFractionDigits: 2 })}</span>
                <span className={q.changePct >= 0 ? "text-data-up" : "text-data-down"}>
                  {q.changePct >= 0 ? "+" : ""}
                  {(q.changePct * 100).toFixed(2)}%
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
