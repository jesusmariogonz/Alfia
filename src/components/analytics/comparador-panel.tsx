"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { FormattedText } from "@/components/ui/formatted-text";
import { RiskMetricsGrid } from "@/components/analytics/risk-metrics-grid";
import { UNIVERSE } from "@/lib/market-data";
import type { RiskMetrics } from "@/lib/analytics/metrics";
import type { UniverseAsset } from "@/lib/market-data";

const COST = 3;

type Result = {
  a: { asset: UniverseAsset; metrics: RiskMetrics };
  b: { asset: UniverseAsset; metrics: RiskMetrics };
  interpretation: string;
  newBalance: number;
};

export function ComparadorPanel({ initialBalance }: { initialBalance: number }) {
  const searchParams = useSearchParams();
  const [symbolA, setSymbolA] = useState(searchParams.get("symbolA") ?? UNIVERSE[0].symbol);
  const [symbolB, setSymbolB] = useState(searchParams.get("symbolB") ?? UNIVERSE[1].symbol);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [balance, setBalance] = useState(initialBalance);
  const [data, setData] = useState<Result | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInsufficientCredits(false);
    try {
      const res = await fetch("/api/analytics/comparar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbolA, symbolB }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo comparar los activos.");
        setInsufficientCredits(res.status === 402);
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
        className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-3"
      >
        <AssetSelect label="Activo A" value={symbolA} onChange={setSymbolA} />
        <AssetSelect label="Activo B" value={symbolB} onChange={setSymbolB} />
        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Comparando…" : `Comparar · ${COST} créditos`}
          </Button>
        </div>
      </form>

      {error && <ErrorBanner message={error} showCreditsCta={insufficientCredits} />}

      <p className="font-data text-xs text-text-muted">
        Saldo: {balance.toLocaleString("es")} créditos
      </p>

      {data && (
        <div className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-display font-medium text-text">
                {data.a.asset.symbol} — {data.a.asset.name}
              </h3>
              <div className="mt-3">
                <RiskMetricsGrid metrics={data.a.metrics} />
              </div>
            </div>
            <div>
              <h3 className="font-display font-medium text-text">
                {data.b.asset.symbol} — {data.b.asset.name}
              </h3>
              <div className="mt-3">
                <RiskMetricsGrid metrics={data.b.metrics} />
              </div>
            </div>
          </div>
          <FormattedText text={data.interpretation} />
          <Disclaimer />
        </div>
      )}
    </div>
  );
}

function AssetSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
      >
        {UNIVERSE.map((a) => (
          <option key={a.symbol} value={a.symbol}>
            {a.symbol} — {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
