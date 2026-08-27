import type { Candle } from "@/lib/market-data";

function fmt(n: number) {
  return `$${n.toLocaleString("es", { maximumFractionDigits: 2 })}`;
}

function fmtVolume(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("es");
}

/** Estadísticas estilo Yahoo Finance: cierre anterior, apertura, rangos, volumen. */
export function QuoteStats({ closes }: { closes: Candle[] }) {
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const yearWindow = closes.slice(-252);
  const yearLow = Math.min(...yearWindow.map((c) => c.low));
  const yearHigh = Math.max(...yearWindow.map((c) => c.high));
  const avgVolumeWindow = closes.slice(-30);
  const avgVolume =
    avgVolumeWindow.reduce((sum, c) => sum + c.volume, 0) / avgVolumeWindow.length;

  const items = [
    { label: "Cierre anterior", value: fmt(prev.close) },
    { label: "Apertura", value: fmt(last.open) },
    { label: "Rango del día", value: `${fmt(last.low)} - ${fmt(last.high)}` },
    { label: "Rango de 52 semanas", value: `${fmt(yearLow)} - ${fmt(yearHigh)}` },
    { label: "Volumen", value: fmtVolume(last.volume) },
    { label: "Volumen promedio", value: fmtVolume(avgVolume) },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border bg-surface p-5 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 border-b border-border pb-2 sm:border-none sm:pb-0">
          <p className="text-xs text-text-muted">{item.label}</p>
          <p className="font-data text-sm font-medium text-text">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
