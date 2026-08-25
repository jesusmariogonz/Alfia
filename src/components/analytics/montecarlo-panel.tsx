"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { MonteCarloChart } from "@/components/analytics/montecarlo-chart";
import { UNIVERSE } from "@/lib/market-data";

const COST = 5;

type Result = {
  asset: { symbol: string; name: string };
  result: {
    percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
    pathBands: { day: number; p10: number; p50: number; p90: number }[];
    probabilityOfLoss: number;
  };
  interpretation: string;
  newBalance: number;
};

export function MonteCarloPanel({ initialBalance }: { initialBalance: number }) {
  const searchParams = useSearchParams();
  const [symbol, setSymbol] = useState(searchParams.get("symbol") ?? UNIVERSE[0].symbol);
  const [amount, setAmount] = useState(10000);
  const [years, setYears] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [data, setData] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/montecarlo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol,
          initialAmount: amount,
          horizonDays: Math.round(years * 252),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo correr la simulación.");
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
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-4"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Activo</label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          >
            {UNIVERSE.map((a) => (
              <option key={a.symbol} value={a.symbol}>
                {a.symbol} — {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Monto inicial (USD)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Horizonte (años)</label>
          <input
            type="number"
            min={0.1}
            max={5}
            step={0.1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Simulando…" : `Simular · ${COST} créditos`}
          </Button>
        </div>
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
            Escenarios para {data.asset.symbol} — {data.asset.name}
          </h2>
          <div className="mt-4">
            <MonteCarloChart pathBands={data.result.pathBands} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 sm:grid-cols-5">
            <Metric label="P5" value={data.result.percentiles.p5} />
            <Metric label="P25" value={data.result.percentiles.p25} />
            <Metric label="Mediana" value={data.result.percentiles.p50} highlight />
            <Metric label="P75" value={data.result.percentiles.p75} />
            <Metric label="P95" value={data.result.percentiles.p95} />
          </div>
          <p className="mt-4 font-data text-sm text-data-down">
            Probabilidad de terminar con pérdida:{" "}
            {(data.result.probabilityOfLoss * 100).toFixed(1)}%
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text">{data.interpretation}</p>
          <Disclaimer className="mt-4" />
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p
        className={`mt-1 font-data text-base font-semibold ${
          highlight ? "text-green-bright" : "text-text"
        }`}
      >
        ${value.toLocaleString("es", { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
}
