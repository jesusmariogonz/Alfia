"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/analytics/sparkline";
import type { AssetClass } from "@/lib/market-data";

export type ScreenerRow = {
  symbol: string;
  name: string;
  sector: string;
  assetClass: AssetClass;
  price: number;
  changePct: number;
  annualizedReturn: number;
  annualizedVolatility: number;
  sharpeRatio: number;
  alfiaScore: number;
  sparkline: number[];
};

function scoreTone(score: number): string {
  if (score >= 65) return "text-data-up";
  if (score >= 40) return "text-gold";
  return "text-data-down";
}

const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  accion: "Acción",
  etf: "ETF",
  cripto: "Cripto",
};

export function ScreenerTable({ rows }: { rows: ScreenerRow[] }) {
  const [assetClass, setAssetClass] = useState<AssetClass | "todas">("todas");
  const [minReturn, setMinReturn] = useState<number>(-100);
  const [maxVolatility, setMaxVolatility] = useState<number>(100);

  const filtered = useMemo(() => {
    return rows
      .filter((r) => assetClass === "todas" || r.assetClass === assetClass)
      .filter((r) => r.annualizedReturn * 100 >= minReturn)
      .filter((r) => r.annualizedVolatility * 100 <= maxVolatility)
      .sort((a, b) => b.sharpeRatio - a.sharpeRatio);
  }, [rows, assetClass, minReturn, maxVolatility]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Tipo de activo</label>
          <select
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as AssetClass | "todas")}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          >
            <option value="todas">Todas</option>
            <option value="accion">Acciones</option>
            <option value="etf">ETFs</option>
            <option value="cripto">Cripto</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">
            Retorno anualizado mínimo: {minReturn}%
          </label>
          <input
            type="range"
            min={-50}
            max={50}
            value={minReturn}
            onChange={(e) => setMinReturn(Number(e.target.value))}
            className="w-40 accent-green-bright"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">
            Volatilidad máxima: {maxVolatility}%
          </label>
          <input
            type="range"
            min={5}
            max={100}
            value={maxVolatility}
            onChange={(e) => setMaxVolatility(Number(e.target.value))}
            className="w-40 accent-green-bright"
          />
        </div>
        <p className="ml-auto text-xs text-text-muted">
          {filtered.length} de {rows.length} activos
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="px-5 py-3 font-medium">Activo</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Tendencia</th>
              <th className="px-5 py-3 font-medium text-right">Retorno anual.</th>
              <th className="px-5 py-3 font-medium text-right">Volatilidad</th>
              <th className="px-5 py-3 font-medium text-right">Sharpe</th>
              <th className="px-5 py-3 font-medium text-right">Alfia Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => (
              <tr key={row.symbol} className="hover:bg-surface-2">
                <td className="px-5 py-3">
                  <Link href={`/activos/${row.symbol}`} className="block">
                    <p className="font-data font-medium text-text">{row.symbol}</p>
                    <p className="text-xs text-text-muted">
                      {row.name} · {ASSET_CLASS_LABEL[row.assetClass]}
                    </p>
                  </Link>
                </td>
                <td className="px-5 py-3 font-data text-text">
                  ${row.price.toLocaleString("es")}
                  <span
                    className={`ml-2 text-xs ${row.changePct >= 0 ? "text-data-up" : "text-data-down"}`}
                  >
                    {row.changePct >= 0 ? "+" : ""}
                    {(row.changePct * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Sparkline values={row.sparkline} up={row.changePct >= 0} />
                </td>
                <td
                  className={`px-5 py-3 text-right font-data ${row.annualizedReturn >= 0 ? "text-data-up" : "text-data-down"}`}
                >
                  {(row.annualizedReturn * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3 text-right font-data text-text">
                  {(row.annualizedVolatility * 100).toFixed(1)}%
                </td>
                <td className="px-5 py-3 text-right font-data text-text">
                  {row.sharpeRatio.toFixed(2)}
                </td>
                <td className={`px-5 py-3 text-right font-data font-semibold ${scoreTone(row.alfiaScore)}`}>
                  {row.alfiaScore}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-text-muted">
                  Ningún activo cumple estos filtros. Prueba ampliarlos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
