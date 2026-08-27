type TickerQuote = {
  symbol: string;
  label: string;
  price: number;
  changePct: number;
};

function TickerRow({ items }: { items: TickerQuote[] }) {
  return (
    <div className="flex shrink-0 gap-8 pr-8">
      {items.map((q, i) => (
        <div key={`${q.symbol}-${i}`} className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-xs text-text-muted">{q.label}</span>
          <span className="flex items-baseline gap-1.5 font-data text-sm">
            <span className="text-text">{q.price.toLocaleString("es", { maximumFractionDigits: 2 })}</span>
            <span className={q.changePct >= 0 ? "text-data-up" : "text-data-down"}>
              {q.changePct >= 0 ? "+" : ""}
              {(q.changePct * 100).toFixed(2)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function TickerMarquee({ items }: { items: TickerQuote[] }) {
  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden border-b border-border py-2.5">
      <div className="flex w-max animate-ticker">
        <TickerRow items={items} />
        <TickerRow items={items} />
      </div>
    </div>
  );
}
