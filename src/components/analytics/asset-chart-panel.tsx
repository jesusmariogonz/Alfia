"use client";

import { useState } from "react";
import { NormalizedLineChart, CandlestickChart } from "@/components/analytics/price-chart";
import { InfoModal } from "@/components/ui/info-modal";
import type { Candle } from "@/lib/market-data";
import type { Plan } from "@/types/database";

const TIMEFRAMES = [
  { label: "1M", days: 21 },
  { label: "3M", days: 63 },
  { label: "6M", days: 126 },
  { label: "1A", days: 252 },
  { label: "2A", days: 504 },
] as const;

export function AssetChartPanel({
  symbol,
  candles,
  plan,
}: {
  symbol: string;
  candles: Candle[];
  plan: Plan;
}) {
  const [timeframe, setTimeframe] = useState<(typeof TIMEFRAMES)[number]["days"]>(252);
  const [mode, setMode] = useState<"linea" | "velas">("linea");
  const [overlays, setOverlays] = useState<{ sma20: boolean; sma50: boolean }>({
    sma20: true,
    sma50: false,
  });

  const canPickOverlays = plan !== "free";
  const canUseCandles = plan !== "free";
  const activeOverlays: ("sma20" | "sma50")[] = canPickOverlays
    ? (["sma20", "sma50"] as const).filter((k) => overlays[k])
    : ["sma20"];

  const windowed = candles.slice(-timeframe);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
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
              : "La línea muestra el % de cambio acumulado desde el inicio del periodo seleccionado."}
            {" "}Las medias móviles suavizan el precio promediando los últimos N días para ver la tendencia sin el ruido diario.
          </InfoModal>
        </div>
      </div>

      {plan === "free" && (
        <p className="mt-3 text-xs text-gold">
          Plan Free: línea + media de 20 días. Con Básico o Pro desbloqueas velas y
          la media de 50 días.
        </p>
      )}

      <div className="mt-5">
        {mode === "velas" && canUseCandles ? (
          <CandlestickChart candles={windowed} overlays={activeOverlays} />
        ) : (
          <NormalizedLineChart series={[{ symbol, candles: windowed }]} overlays={activeOverlays} />
        )}
      </div>
    </div>
  );
}
