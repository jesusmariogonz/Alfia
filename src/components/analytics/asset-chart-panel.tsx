"use client";

import { useState } from "react";
import { NormalizedLineChart, CandlestickChart } from "@/components/analytics/price-chart";
import { InfoModal } from "@/components/ui/info-modal";
import type { Candle } from "@/lib/market-data";
import type { Plan } from "@/types/database";

type TimeframeKey = "1D" | "5D" | "1M" | "6M" | "YTD" | "1A" | "2A";

const TIMEFRAMES: { label: string; key: TimeframeKey }[] = [
  { label: "1D", key: "1D" },
  { label: "5D", key: "5D" },
  { label: "1M", key: "1M" },
  { label: "6M", key: "6M" },
  { label: "YTD", key: "YTD" },
  { label: "1A", key: "1A" },
  { label: "2A", key: "2A" },
];

function windowFor(key: TimeframeKey, candles: Candle[]): Candle[] {
  switch (key) {
    case "5D":
      return candles.slice(-5);
    case "1M":
      return candles.slice(-21);
    case "6M":
      return candles.slice(-126);
    case "YTD": {
      const jan1 = `${new Date().getFullYear()}-01-01`;
      const fromYtd = candles.filter((c) => c.date >= jan1);
      return fromYtd.length > 1 ? fromYtd : candles.slice(-21);
    }
    case "1A":
      return candles.slice(-252);
    case "2A":
      return candles;
    default:
      return candles;
  }
}

export function AssetChartPanel({
  symbol,
  candles,
  intraday,
  plan,
}: {
  symbol: string;
  candles: Candle[];
  intraday: Candle[] | null;
  plan: Plan;
}) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("1A");
  const [mode, setMode] = useState<"linea" | "velas">("linea");
  const [overlays, setOverlays] = useState<{ sma20: boolean; sma50: boolean }>({
    sma20: true,
    sma50: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [valueMode, setValueMode] = useState<"percent" | "price">("price");
  const [scale, setScale] = useState<"linear" | "log">("linear");

  const canPickOverlays = plan !== "free";
  const canUseCandles = plan !== "free";
  const activeOverlays: ("sma20" | "sma50")[] = canPickOverlays
    ? (["sma20", "sma50"] as const).filter((k) => overlays[k])
    : ["sma20"];

  const availableTimeframes = intraday ? TIMEFRAMES : TIMEFRAMES.filter((t) => t.key !== "1D");
  const windowed = timeframe === "1D" && intraday ? intraday : windowFor(timeframe, candles);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {availableTimeframes.map((tf) => (
            <button
              key={tf.key}
              type="button"
              onClick={() => setTimeframe(tf.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                timeframe === tf.key
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

          {mode === "linea" && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Configuración del gráfico"
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-text-muted transition-colors hover:text-text"
              >
                ⚙
              </button>
              {settingsOpen && (
                <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-border bg-surface p-4 shadow-lg">
                  <p className="text-xs font-medium text-text">Escala del eje Y</p>
                  <div className="mt-2 flex flex-col gap-1.5 text-xs text-text-muted">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="valueMode"
                        checked={valueMode === "price"}
                        onChange={() => setValueMode("price")}
                      />
                      Precio ($)
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="valueMode"
                        checked={valueMode === "percent"}
                        onChange={() => setValueMode("percent")}
                      />
                      Porcentaje (%)
                    </label>
                  </div>
                  {valueMode === "price" && (
                    <>
                      <p className="mt-3 text-xs font-medium text-text">Tipo de escala</p>
                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-text-muted">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="scale"
                            checked={scale === "linear"}
                            onChange={() => setScale("linear")}
                          />
                          Lineal
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="scale"
                            checked={scale === "log"}
                            onChange={() => setScale("log")}
                          />
                          Logarítmica
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <InfoModal title="¿Qué estás viendo?">
            {mode === "velas"
              ? "Cada vela muestra apertura, cierre, máximo y mínimo del día. Verde = cerró arriba de donde abrió; rojo = cerró abajo."
              : valueMode === "price"
                ? "La línea muestra el precio real del activo en el periodo seleccionado."
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
          <NormalizedLineChart
            series={[{ symbol, candles: windowed }]}
            overlays={activeOverlays}
            valueMode={valueMode}
            scale={scale}
          />
        )}
      </div>
    </div>
  );
}
