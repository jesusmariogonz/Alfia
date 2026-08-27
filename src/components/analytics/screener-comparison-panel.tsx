"use client";

import { useMemo, useState } from "react";
import { NormalizedLineChart, CandlestickChart } from "@/components/analytics/price-chart";
import { InfoModal } from "@/components/ui/info-modal";
import type { ScreenerRow } from "@/components/analytics/screener-table";
import type { Plan } from "@/types/database";

const TIMEFRAMES = [
  { label: "1M", days: 21 },
  { label: "3M", days: 63 },
  { label: "6M", days: 126 },
  { label: "1A", days: 252 },
  { label: "2A", days: 504 },
] as const;

function toCsv(rows: ScreenerRow[]): string {
  const header = ["symbol", "name", "price", "annualized_return", "annualized_volatility", "sharpe", "alfia_score"];
  const lines = rows.map((r) =>
    [r.symbol, r.name, r.price, r.annualizedReturn, r.annualizedVolatility, r.sharpeRatio, r.alfiaScore].join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

function downloadCsv(rows: ScreenerRow[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alfia-screener.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ScreenerComparisonPanel({
  rows,
  selected,
  plan,
}: {
  rows: ScreenerRow[];
  selected: Set<string>;
  plan: Plan;
}) {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]["days"]>(252);
  const [mode, setMode] = useState<"linea" | "velas">("linea");
  const [overlays, setOverlays] = useState<{ sma20: boolean; sma50: boolean }>({
    sma20: false,
    sma50: false,
  });

  const selectedRows = useMemo(
    () => rows.filter((r) => selected.has(r.symbol)),
    [rows, selected],
  );

  if (selectedRows.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-muted">
          Selecciona uno o más activos de la lista (columna &ldquo;Comparar&rdquo;) para
          ver su gráfica aquí.
        </p>
      </div>
    );
  }

  const isFree = plan === "free";
  const canPickOverlays = !isFree;
  const canUseCandles = !isFree && selectedRows.length === 1;
  const canExportCsv = plan === "pro";
  const activeOverlays: ("sma20" | "sma50")[] = isFree
    ? ["sma20"]
    : (["sma20", "sma50"] as const).filter((k) => overlays[k]);

  const series = selectedRows.map((r) => ({
    symbol: r.symbol,
    candles: r.history.slice(-timeframe),
  }));

  return (
    <div className="mt-6 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              type="button"
              onClick={() => setTimeframe(tf.days)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                timeframe === tf.days
                  ? "border-green-bright bg-green-bright/10 text-green-bright"
                  : "border-border text-text-muted hover:text-text"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canUseCandles && (
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              {(["linea", "velas"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    mode === m ? "bg-surface-2 text-text" : "text-text-muted"
                  }`}
                >
                  {m === "linea" ? "Línea" : "Velas"}
                </button>
              ))}
            </div>
          )}

          {canPickOverlays ? (
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={overlays.sma20}
                  onChange={(e) => setOverlays((o) => ({ ...o, sma20: e.target.checked }))}
                  className="accent-green-bright"
                />
                Media 20d
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={overlays.sma50}
                  onChange={(e) => setOverlays((o) => ({ ...o, sma50: e.target.checked }))}
                  className="accent-green-bright"
                />
                Media 50d
              </label>
            </div>
          ) : (
            <span className="text-xs text-text-muted">Media móvil de 20 días incluida</span>
          )}

          <InfoModal title="¿Qué estás viendo?">
            {mode === "velas"
              ? "Cada vela muestra apertura, cierre, máximo y mínimo del día. Verde = cerró arriba de donde abrió; rojo = cerró abajo."
              : "Cada línea muestra el % de cambio acumulado desde el inicio del periodo seleccionado, para poder comparar activos con precios muy distintos entre sí."}
            {" "}Las medias móviles suavizan el precio promediando los últimos N días — ayudan a ver la tendencia sin el ruido diario.
          </InfoModal>

          {canExportCsv && (
            <button
              type="button"
              onClick={() => downloadCsv(selectedRows)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-green-bright hover:text-green-bright"
            >
              Descargar CSV
            </button>
          )}
        </div>
      </div>

      {isFree && selectedRows.length > 1 && (
        <p className="mt-3 text-xs text-gold">
          Plan Free: comparación básica (línea normalizada + media de 20 días). Con
          Básico o Pro desbloqueas velas, más medias móviles y exportar a CSV.
        </p>
      )}

      <div className="mt-5">
        {mode === "velas" && canUseCandles ? (
          <CandlestickChart candles={series[0].candles} overlays={activeOverlays} />
        ) : (
          <NormalizedLineChart series={series} overlays={activeOverlays} />
        )}
      </div>
    </div>
  );
}
