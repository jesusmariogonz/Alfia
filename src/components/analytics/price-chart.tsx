import type { Candle } from "@/lib/market-data";

const SERIES_COLORS = [
  "var(--green-bright)",
  "var(--gold)",
  "#7dd3fc",
  "#f472b6",
  "#c084fc",
  "#fb923c",
];

function sma(values: number[], window: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += values[j];
    return sum / window;
  });
}

function pathFromPoints(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

/** Grafica una o varias series normalizadas (% de cambio desde el primer punto del rango). */
export function NormalizedLineChart({
  series,
  overlays = [],
  height = 260,
}: {
  series: { symbol: string; candles: Candle[] }[];
  overlays?: ("sma20" | "sma50")[];
  height?: number;
}) {
  const width = 800;
  const padding = 8;
  const usable = series.filter((s) => s.candles.length > 1);
  if (usable.length === 0) {
    return <p className="text-sm text-text-muted">No hay suficientes datos para graficar.</p>;
  }

  const normalizedSeries = usable.map((s) => {
    const base = s.candles[0].close;
    return s.candles.map((c) => (c.close / base - 1) * 100);
  });

  const allValues = normalizedSeries.flat();
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 0);
  const range = max - min || 1;

  const toXY = (values: (number | null)[]) =>
    values
      .map((v, i, arr) =>
        v === null
          ? null
          : {
              x: padding + (i / (arr.length - 1)) * (width - padding * 2),
              y: height - padding - ((v - min) / range) * (height - padding * 2),
            },
      )
      .filter((p): p is { x: number; y: number } => p !== null);

  const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2);

  return (
    <div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
        <line x1={0} x2={width} y1={zeroY} y2={zeroY} stroke="var(--border)" strokeDasharray="4 4" />
        {normalizedSeries.map((values, i) => (
          <path
            key={usable[i].symbol}
            d={pathFromPoints(toXY(values))}
            fill="none"
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={1.75}
          />
        ))}
        {overlays.includes("sma20") &&
          normalizedSeries.map((values, i) => (
            <path
              key={`${usable[i].symbol}-sma20`}
              d={pathFromPoints(toXY(sma(values, 20)))}
              fill="none"
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              strokeOpacity={0.45}
              strokeDasharray="3 3"
              strokeWidth={1.25}
            />
          ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-4">
        {usable.map((s, i) => (
          <span key={s.symbol} className="flex items-center gap-1.5 text-xs text-text-muted">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            {s.symbol}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Gráfica de velas (OHLC) de un solo activo, con medias móviles opcionales. */
export function CandlestickChart({
  candles,
  overlays = [],
  height = 260,
}: {
  candles: Candle[];
  overlays?: ("sma20" | "sma50")[];
  height?: number;
}) {
  const width = 800;
  const padding = 8;
  if (candles.length < 2) {
    return <p className="text-sm text-text-muted">No hay suficientes datos para graficar.</p>;
  }

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const range = max - min || 1;
  const usableWidth = width - padding * 2;
  const slot = usableWidth / candles.length;
  const bodyWidth = Math.max(1.5, Math.min(6, slot * 0.6));

  const y = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);
  const closes = candles.map((c) => c.close);

  const overlayPath = (values: (number | null)[]) =>
    pathFromPoints(
      values
        .map((v, i) => (v === null ? null : { x: padding + i * slot + slot / 2, y: y(v) }))
        .filter((p): p is { x: number; y: number } => p !== null),
    );

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="block">
      {candles.map((c, i) => {
        const cx = padding + i * slot + slot / 2;
        const up = c.close >= c.open;
        const color = up ? "var(--data-up)" : "var(--data-down)";
        return (
          <g key={c.date}>
            <line x1={cx} x2={cx} y1={y(c.high)} y2={y(c.low)} stroke={color} strokeWidth={1} />
            <rect
              x={cx - bodyWidth / 2}
              y={Math.min(y(c.open), y(c.close))}
              width={bodyWidth}
              height={Math.max(1, Math.abs(y(c.open) - y(c.close)))}
              fill={color}
            />
          </g>
        );
      })}
      {overlays.includes("sma20") && (
        <path d={overlayPath(sma(closes, 20))} fill="none" stroke="var(--gold)" strokeWidth={1.25} />
      )}
      {overlays.includes("sma50") && (
        <path d={overlayPath(sma(closes, 50))} fill="none" stroke="#7dd3fc" strokeWidth={1.25} />
      )}
    </svg>
  );
}
