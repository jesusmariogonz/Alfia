"use client";

import { useId, useRef, useState } from "react";
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

function gridValues(min: number, max: number, steps = 4): number[] {
  const range = max - min || 1;
  return Array.from({ length: steps + 1 }, (_, i) => min + (range * i) / steps);
}

function formatDate(dateStr: string): string {
  if (dateStr.includes("T")) {
    return new Date(dateStr).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  }
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es", { day: "numeric", month: "short" });
}

/** Índice del punto más cercano a una posición X del mouse/touch dentro del SVG. */
function useHoverIndex(width: number, padding: number, count: number) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  function updateFromClientX(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    const fraction = (relX - padding) / (width - padding * 2);
    const i = Math.round(fraction * (count - 1));
    setIndex(Math.max(0, Math.min(count - 1, i)));
  }

  // % horizontal (0-100, acotado para que el tooltip flotante no se salga del borde)
  const leftPct = index !== null && count > 1 ? Math.min(88, Math.max(12, (index / (count - 1)) * 100)) : null;

  return {
    svgRef,
    index,
    setIndex,
    leftPct,
    onMouseMove: (e: React.MouseEvent) => updateFromClientX(e.clientX),
    onMouseLeave: () => setIndex(null),
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) updateFromClientX(touch.clientX);
    },
    onTouchMove: (e: React.TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) updateFromClientX(touch.clientX);
    },
    onTouchEnd: () => setIndex(null),
  };
}

/** Grafica una o varias series normalizadas (% de cambio desde el primer punto del rango). */
export function NormalizedLineChart({
  series,
  overlays = [],
  height = 260,
  valueMode = "percent",
  scale = "linear",
}: {
  series: { symbol: string; candles: Candle[] }[];
  overlays?: ("sma20" | "sma50")[];
  height?: number;
  /** "price" solo tiene efecto con un único activo — con varios siempre se normaliza a %. */
  valueMode?: "percent" | "price";
  scale?: "linear" | "log";
}) {
  const width = 800;
  const padding = 8;
  const gradientId = useId();
  const usable = series.filter((s) => s.candles.length > 1);
  const pointCount = usable[0]?.candles.length ?? 0;
  const { svgRef, index: hoverIndex, setIndex, leftPct, ...hoverHandlers } = useHoverIndex(width, padding, pointCount);

  if (usable.length === 0) {
    return <p className="text-sm text-text-muted">No hay suficientes datos para graficar.</p>;
  }

  const usePriceMode = valueMode === "price" && usable.length === 1;
  const transform = (v: number) => (scale === "log" && usePriceMode ? Math.log(Math.max(v, 0.0001)) : v);

  const normalizedSeries = usable.map((s) => {
    if (usePriceMode) return s.candles.map((c) => transform(c.close));
    const base = s.candles[0].close;
    return s.candles.map((c) => (c.close / base - 1) * 100);
  });

  const allValues = normalizedSeries.flat();
  const min = Math.min(...allValues, 0);
  const max = Math.max(...allValues, 0);
  const range = max - min || 1;

  const xAt = (i: number, count: number) => padding + (i / (count - 1)) * (width - padding * 2);
  const yAt = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const toXY = (values: (number | null)[]) =>
    values
      .map((v, i, arr) => (v === null ? null : { x: xAt(i, arr.length), y: yAt(v) }))
      .filter((p): p is { x: number; y: number } => p !== null);

  const referenceY = usePriceMode ? yAt(normalizedSeries[0][0]) : yAt(0);
  const isSingle = usable.length === 1;
  const gridLines = gridValues(min, max);
  const dateTicks = usable[0]?.candles ?? [];

  return (
    <div>
      <div className="flex gap-2">
      <div className="relative flex-1">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block cursor-crosshair touch-none"
        onMouseMove={hoverHandlers.onMouseMove}
        onMouseLeave={hoverHandlers.onMouseLeave}
        onTouchStart={hoverHandlers.onTouchStart}
        onTouchMove={hoverHandlers.onTouchMove}
        onTouchEnd={hoverHandlers.onTouchEnd}
      >
        {gridLines.map((v, i) => (
          <line
            key={i}
            x1={0}
            x2={width}
            y1={yAt(v)}
            y2={yAt(v)}
            stroke="var(--border)"
            strokeWidth={1}
          />
        ))}
        {isSingle && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES_COLORS[0]} stopOpacity={0.28} />
              <stop offset="100%" stopColor={SERIES_COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <line x1={0} x2={width} y1={referenceY} y2={referenceY} stroke="var(--border)" strokeDasharray="4 4" />

        {isSingle &&
          (() => {
            const points = toXY(normalizedSeries[0]);
            if (points.length === 0) return null;
            const areaPath = `${pathFromPoints(points)} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`;
            return <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />;
          })()}

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

        {hoverIndex !== null && (
          <g>
            <line
              x1={xAt(hoverIndex, pointCount)}
              x2={xAt(hoverIndex, pointCount)}
              y1={padding}
              y2={height - padding}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
            {normalizedSeries.map((values, i) => (
              <circle
                key={usable[i].symbol}
                cx={xAt(hoverIndex, pointCount)}
                cy={yAt(values[hoverIndex])}
                r={3.5}
                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              />
            ))}
          </g>
        )}
      </svg>

      {hoverIndex !== null && leftPct !== null && usable[0]?.candles[hoverIndex] && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-max max-w-[min(88vw,320px)] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `${leftPct}%` }}
        >
          <p className="font-data text-text-muted">{formatDate(usable[0].candles[hoverIndex].date)}</p>
          <div className="mt-1 flex flex-col gap-1">
            {usable.map((s, i) => (
              <span key={s.symbol} className="flex items-center gap-1.5 font-data">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }} />
                {s.symbol}: ${s.candles[hoverIndex].close.toLocaleString("es")}
                {!usePriceMode && (
                  <>
                    {" "}({normalizedSeries[i][hoverIndex] >= 0 ? "+" : ""}
                    {normalizedSeries[i][hoverIndex].toFixed(2)}%)
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
      <div className="flex w-12 shrink-0 flex-col justify-between py-0.5 text-right font-data text-[10px] leading-none text-text-muted">
        {[...gridLines].reverse().map((v, i) => (
          <span key={i}>
            {usePriceMode ? `$${v.toLocaleString("es", { maximumFractionDigits: 0 })}` : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
          </span>
        ))}
      </div>
      </div>

      {dateTicks.length > 1 && (
        <div className="mt-1.5 flex justify-between text-[10px] text-text-muted">
          <span>{formatDate(dateTicks[0].date)}</span>
          <span>{formatDate(dateTicks[Math.floor(dateTicks.length / 2)].date)}</span>
          <span>{formatDate(dateTicks[dateTicks.length - 1].date)}</span>
        </div>
      )}

      {pointCount > 1 && (
        <input
          type="range"
          min={0}
          max={pointCount - 1}
          value={hoverIndex ?? pointCount - 1}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Mover el tiempo manualmente"
          className="mt-2 w-full accent-green-bright"
        />
      )}

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
  const { svgRef, index: hoverIndex, setIndex, leftPct, ...hoverHandlers } = useHoverIndex(width, padding, candles.length);

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
  const xCenter = (i: number) => padding + i * slot + slot / 2;

  const overlayPath = (values: (number | null)[]) =>
    pathFromPoints(
      values
        .map((v, i) => (v === null ? null : { x: xCenter(i), y: y(v) }))
        .filter((p): p is { x: number; y: number } => p !== null),
    );

  const hovered = hoverIndex !== null ? candles[hoverIndex] : null;
  const gridLines = gridValues(min, max);

  return (
    <div>
      <div className="flex gap-2">
      <div className="relative flex-1">
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block cursor-crosshair touch-none"
        onMouseMove={hoverHandlers.onMouseMove}
        onMouseLeave={hoverHandlers.onMouseLeave}
        onTouchStart={hoverHandlers.onTouchStart}
        onTouchMove={hoverHandlers.onTouchMove}
        onTouchEnd={hoverHandlers.onTouchEnd}
      >
        {gridLines.map((v, i) => (
          <line key={i} x1={0} x2={width} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeWidth={1} />
        ))}
        {candles.map((c, i) => {
          const cx = xCenter(i);
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
        {hoverIndex !== null && (
          <line
            x1={xCenter(hoverIndex)}
            x2={xCenter(hoverIndex)}
            y1={padding}
            y2={height - padding}
            stroke="var(--text-muted)"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {hovered && leftPct !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 w-max max-w-[min(88vw,320px)] -translate-x-1/2 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
          style={{ left: `${leftPct}%` }}
        >
          <p className="font-data text-text-muted">{formatDate(hovered.date)}</p>
          <div className="mt-1 flex flex-col gap-1 font-data">
            <span>Apertura: ${hovered.open.toLocaleString("es")}</span>
            <span>Cierre: ${hovered.close.toLocaleString("es")}</span>
            <span>Máximo: ${hovered.high.toLocaleString("es")}</span>
            <span>Mínimo: ${hovered.low.toLocaleString("es")}</span>
          </div>
        </div>
      )}
      </div>
      <div className="flex w-14 shrink-0 flex-col justify-between py-0.5 text-right font-data text-[10px] leading-none text-text-muted">
        {[...gridLines].reverse().map((v, i) => (
          <span key={i}>${v.toLocaleString("es", { maximumFractionDigits: 0 })}</span>
        ))}
      </div>
      </div>

      {candles.length > 1 && (
        <div className="mt-1.5 flex justify-between text-[10px] text-text-muted">
          <span>{formatDate(candles[0].date)}</span>
          <span>{formatDate(candles[Math.floor(candles.length / 2)].date)}</span>
          <span>{formatDate(candles[candles.length - 1].date)}</span>
        </div>
      )}

      {candles.length > 1 && (
        <input
          type="range"
          min={0}
          max={candles.length - 1}
          value={hoverIndex ?? candles.length - 1}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Mover el tiempo manualmente"
          className="mt-2 w-full accent-green-bright"
        />
      )}
    </div>
  );
}
