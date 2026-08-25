"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { EquityCurveChart } from "@/components/analytics/equity-curve-chart";
import { UNIVERSE } from "@/lib/market-data";

const COST = 4;

const EXAMPLES = [
  "Comprar y mantener durante todo el periodo",
  "Comprar cuando la media móvil de 20 días cruza arriba de la de 50, vender cuando cruza abajo",
  "Comprar cuando el RSI de 14 días baja de 30 y vender cuando sube de 70",
];

type Result = {
  asset: { symbol: string; name: string };
  strategyLabel: string;
  result: {
    strategyReturn: number;
    benchmarkReturn: number;
    strategyMaxDrawdown: number;
    trades: number;
    equityCurve: { day: number; strategy: number; benchmark: number }[];
  };
  interpretation: string;
  newBalance: number;
};

export function BacktestPanel({ initialBalance }: { initialBalance: number }) {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get("symbol") ?? UNIVERSE[0].symbol);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [data, setData] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Describe la estrategia que quieres probar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, description }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo correr el backtest.");
        return;
      }
      setData(json);
      setBalance(json.newBalance);
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Activo</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="max-w-xs rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          >
            {UNIVERSE.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Describe tu estrategia</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ej. comprar cuando la media móvil de 20 días cruza arriba de la de 50…"
            className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setDescription(ex)}
                className="rounded-full border border-border px-3 py-1 text-xs text-text-muted hover:border-green-bright/40 hover:text-text"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={loading} className="self-start">
          {loading ? "Probando…" : `Correr backtest · ${COST} créditos`}
        </Button>
      </form>

      {error && (
        <p className="rounded-lg border border-data-down/30 bg-data-down/10 px-4 py-3 text-sm text-data-down">
          {error}
        </p>
      )}

      <p className="font-data text-xs text-text-muted">
        Saldo: {balance.toLocaleString("es")} créditos
      </p>

      {data && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-display text-lg font-medium text-text">
            {data.asset.symbol} — {data.strategyLabel}
          </h2>
          <div className="mt-4">
            <EquityCurveChart equityCurve={data.result.equityCurve} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric label="Retorno estrategia" value={`${(data.result.strategyReturn * 100).toFixed(1)}%`} tone={data.result.strategyReturn >= 0 ? "text-data-up" : "text-data-down"} />
            <Metric label="Retorno comprar y mantener" value={`${(data.result.benchmarkReturn * 100).toFixed(1)}%`} tone={data.result.benchmarkReturn >= 0 ? "text-data-up" : "text-data-down"} />
            <Metric label="Máx. drawdown" value={`${(data.result.strategyMaxDrawdown * 100).toFixed(1)}%`} tone="text-data-down" />
            <Metric label="Operaciones" value={String(data.result.trades)} tone="text-text" />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-text">{data.interpretation}</p>
          <Disclaimer className="mt-4" />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 font-data text-base font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
