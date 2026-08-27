"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { UniverseAsset } from "@/lib/market-data";

type Mode = "monto" | "acciones";

export function DemoPositionForm({
  assets,
  quotes,
}: {
  assets: UniverseAsset[];
  quotes: Record<string, number>;
}) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(assets[0]?.symbol ?? "");
  const [mode, setMode] = useState<Mode>("monto");
  const [amount, setAmount] = useState("1000");
  const [shares, setShares] = useState("");
  const [stopLossPct, setStopLossPct] = useState("5");
  const [takeProfitPct, setTakeProfitPct] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const price = quotes[symbol] ?? 0;

  const computedShares = useMemo(() => {
    if (mode === "acciones") return Number(shares) || 0;
    return price > 0 ? Number(amount) / price : 0;
  }, [mode, shares, amount, price]);

  const computedAmount = useMemo(() => {
    if (mode === "monto") return Number(amount) || 0;
    return price * (Number(shares) || 0);
  }, [mode, amount, shares, price]);

  const stopLossPrice = stopLossPct.trim() ? price * (1 - Number(stopLossPct) / 100) : null;
  const takeProfitPrice = takeProfitPct.trim() ? price * (1 + Number(takeProfitPct) / 100) : null;

  async function submit() {
    setError(null);
    setSuccess(false);
    if (!price || computedShares <= 0 || computedAmount <= 0) {
      setError("Revisa el activo y el monto/cantidad ingresados.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/demo-positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          shares: computedShares,
          demoAmountUsd: computedAmount,
          stopLossPrice,
          takeProfitPrice,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo abrir la posición demo.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5">
      <p className="text-sm font-medium text-text">Abrir posición demo</p>
      <p className="mt-1 text-xs text-text-muted">
        Practica sin dinero real: elige un activo, cuánto &ldquo;invertirías&rdquo;
        y a partir de qué caída o subida quieres avisarte (como un stop-loss
        y take-profit). El seguimiento es con precios reales.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Activo</span>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          >
            {assets.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} · {a.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Precio actual</span>
          <p className="rounded-lg border border-border bg-surface px-3 py-2 font-data text-sm text-text">
            ${price.toLocaleString("es", { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 rounded-lg border border-border p-1" style={{ width: "fit-content" }}>
        {(["monto", "acciones"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === m ? "bg-surface-2 text-text" : "text-text-muted"
            }`}
          >
            {m === "monto" ? "Por monto ($)" : "Por # de acciones"}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mode === "monto" ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted">Monto demo ($)</span>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
            />
          </label>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-text-muted"># de acciones</span>
            <input
              type="number"
              min={0}
              step="0.0001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
            />
          </label>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">
            {mode === "monto" ? "= # de acciones" : "= monto equivalente"}
          </span>
          <p className="rounded-lg border border-border bg-surface px-3 py-2 font-data text-sm text-text">
            {mode === "monto"
              ? computedShares.toLocaleString("es", { maximumFractionDigits: 4 })
              : `$${computedAmount.toLocaleString("es", { maximumFractionDigits: 2 })}`}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Stop-loss (% debajo de entrada)</span>
          <input
            type="number"
            min={0}
            step="0.5"
            value={stopLossPct}
            onChange={(e) => setStopLossPct(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
          {stopLossPrice !== null && (
            <span className="text-xs text-text-muted">≈ ${stopLossPrice.toLocaleString("es", { maximumFractionDigits: 2 })}</span>
          )}
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Take-profit (% arriba de entrada)</span>
          <input
            type="number"
            min={0}
            step="0.5"
            value={takeProfitPct}
            onChange={(e) => setTakeProfitPct(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
          {takeProfitPrice !== null && (
            <span className="text-xs text-text-muted">≈ ${takeProfitPrice.toLocaleString("es", { maximumFractionDigits: 2 })}</span>
          )}
        </label>
      </div>

      {error && <p className="mt-3 text-xs text-data-down">{error}</p>}
      {success && <p className="mt-3 text-xs text-data-up">Posición demo abierta.</p>}

      <Button onClick={submit} disabled={loading} className="mt-4">
        {loading ? "Abriendo…" : "Abrir posición demo"}
      </Button>
    </div>
  );
}
