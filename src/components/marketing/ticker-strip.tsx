type Quote = {
  symbol: string;
  price: string;
  change: string;
  up: boolean;
};

const quotes: Quote[] = [
  { symbol: "AAPL", price: "227.14", change: "+1.24%", up: true },
  { symbol: "MSFT", price: "418.32", change: "+0.63%", up: true },
  { symbol: "NVDA", price: "121.07", change: "-0.85%", up: false },
  { symbol: "SPY", price: "553.21", change: "+0.31%", up: true },
  { symbol: "BTC", price: "61,204", change: "-2.14%", up: false },
  { symbol: "TSLA", price: "246.90", change: "+3.02%", up: true },
];

export function TickerStrip() {
  const items = [...quotes, ...quotes];
  return (
    <div className="border-y border-border bg-surface/60 py-2.5 overflow-hidden">
      <div className="flex w-max animate-[ticker_28s_linear_infinite] gap-8 px-6">
        {items.map((q, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap font-data text-sm">
            <span className="text-text-muted">{q.symbol}</span>
            <span className="text-text">{q.price}</span>
            <span className={q.up ? "text-data-up" : "text-data-down"}>{q.change}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
