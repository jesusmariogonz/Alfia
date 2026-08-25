export function EquityCurveChart({
  equityCurve,
}: {
  equityCurve: { day: number; strategy: number; benchmark: number }[];
}) {
  const width = 640;
  const height = 220;
  const allValues = equityCurve.flatMap((p) => [p.strategy, p.benchmark]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const lastDay = equityCurve[equityCurve.length - 1].day || 1;

  const x = (day: number) => (day / lastDay) * width;
  const y = (value: number) => height - ((value - min) / range) * height;

  const line = (key: "strategy" | "benchmark") =>
    equityCurve.map((p) => `${x(p.day)},${y(p[key])}`).join(" ");

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <polyline points={line("benchmark")} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 3" />
        <polyline points={line("strategy")} fill="none" stroke="var(--green-bright)" strokeWidth="2" />
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 bg-green-bright" /> Estrategia
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 border-t border-dashed border-text-muted" /> Comprar y mantener
        </span>
      </div>
    </div>
  );
}
