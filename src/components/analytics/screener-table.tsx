"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/analytics/sparkline";
import { InfoModal } from "@/components/ui/info-modal";
import type { AssetClass, Candle } from "@/lib/market-data";

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
  history: Candle[];
};

function scoreTone(score: number): string {
  if (score >= 65) return "text-data-up";
  if (score >= 40) return "text-gold";
  return "text-data-down";
}

type Signal = "Retener" | "Vigilar" | "Vender";

/**
 * Señal orientativa, no una recomendación: combina el Alfia Score (riesgo +
 * desempeño histórico) con el retorno anualizado. Un score bajo con retorno
 * negativo se marca "Vender" (peor combinación), un score alto con retorno
 * positivo "Retener"; todo lo intermedio queda como "Vigilar".
 */
function screenerSignal(row: Pick<ScreenerRow, "alfiaScore" | "annualizedReturn">): Signal {
  if (row.alfiaScore >= 60 && row.annualizedReturn > 0) return "Retener";
  if (row.alfiaScore < 35 && row.annualizedReturn < 0) return "Vender";
  return "Vigilar";
}

function signalTone(signal: Signal): string {
  if (signal === "Retener") return "text-data-up";
  if (signal === "Vender") return "text-data-down";
  return "text-gold";
}

const ASSET_CLASS_LABEL: Record<AssetClass, string> = {
  accion: "Acción",
  etf: "ETF",
  cripto: "Cripto",
};

export function ScreenerTable({
  rows,
  selected,
  onToggle,
  maxSelectable,
}: {
  rows: ScreenerRow[];
  selected: Set<string>;
  onToggle: (symbol: string) => void;
  maxSelectable: number | null;
}) {
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass | "todas">("todas");
  const [minReturn, setMinReturn] = useState<number>(-100);
  const [maxVolatility, setMaxVolatility] = useState<number>(100);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows
      .filter(
        (r) =>
          !normalizedQuery ||
          r.symbol.toLowerCase().includes(normalizedQuery) ||
          r.name.toLowerCase().includes(normalizedQuery),
      )
      .filter((r) => assetClass === "todas" || r.assetClass === assetClass)
      .filter((r) => r.annualizedReturn * 100 >= minReturn)
      .filter((r) => r.annualizedVolatility * 100 <= maxVolatility)
      .sort((a, b) => b.sharpeRatio - a.sharpeRatio);
  }, [rows, query, assetClass, minReturn, maxVolatility]);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Buscar activo</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Símbolo o nombre…"
            className="w-40 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
          />
        </div>
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

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="px-5 py-3 font-medium">
                Comparar
                {maxSelectable !== null && (
                  <span className="ml-1 font-normal text-text-muted/70">(máx. {maxSelectable})</span>
                )}
              </th>
              <th className="px-5 py-3 font-medium">Activo</th>
              <th className="px-5 py-3 font-medium">Precio</th>
              <th className="px-5 py-3 font-medium">Tendencia</th>
              <th className="px-5 py-3 font-medium text-right">Retorno anual.</th>
              <th className="px-5 py-3 font-medium text-right">Volatilidad</th>
              <th className="px-5 py-3 font-medium text-right">Sharpe</th>
              <th className="px-5 py-3 font-medium text-right">
                <span className="inline-flex items-center gap-1.5">
                  Alfia Score
                  <InfoModal title="¿Cómo se calcula el Alfia Score?">
                    Combina cuatro métricas de los últimos 2 años en un solo número
                    de 0 a 100: Sharpe ratio (40%), retorno anualizado (25%),
                    volatilidad anualizada (20%, a menor volatilidad más puntos) y
                    máximo drawdown (15%, a menor caída más puntos). No es una
                    recomendación de compra ni venta.
                  </InfoModal>
                </span>
              </th>
              <th className="px-5 py-3 font-medium text-right">
                <span className="inline-flex items-center gap-1.5">
                  Señal
                  <InfoModal title="¿Cómo se calcula la señal?">
                    Es orientativa, no una recomendación de inversión. Combina el
                    Alfia Score con el retorno anualizado: score alto (≥60) y
                    retorno positivo se marca &ldquo;Retener&rdquo;; score bajo
                    (&lt;35) y retorno negativo se marca &ldquo;Vender&rdquo;; el
                    resto queda como &ldquo;Vigilar&rdquo;.
                  </InfoModal>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((row) => (
              <tr key={row.symbol} className="hover:bg-surface-2">
                <td className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.symbol)}
                    onChange={() => onToggle(row.symbol)}
                    disabled={
                      !selected.has(row.symbol) &&
                      maxSelectable !== null &&
                      selected.size >= maxSelectable
                    }
                    className="h-4 w-4 accent-green-bright"
                  />
                </td>
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
                <td className={`px-5 py-3 text-right text-xs font-medium ${signalTone(screenerSignal(row))}`}>
                  {screenerSignal(row)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-text-muted">
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
