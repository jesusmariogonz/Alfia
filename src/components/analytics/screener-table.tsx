"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkline } from "@/components/analytics/sparkline";
import { InfoModal } from "@/components/ui/info-modal";
import { WatchlistStarButton } from "@/components/analytics/watchlist-star-button";
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
  loggedIn,
  watchlistSymbols,
}: {
  rows: ScreenerRow[];
  selected: Set<string>;
  onToggle: (symbol: string) => void;
  maxSelectable: number | null;
  loggedIn: boolean;
  watchlistSymbols: string[];
}) {
  const watchlistSet = new Set(watchlistSymbols);
  const [query, setQuery] = useState("");
  const [assetClass, setAssetClass] = useState<AssetClass | "todas">("todas");
  const [minReturn, setMinReturn] = useState<number>(-100);
  const [maxVolatility, setMaxVolatility] = useState<number>(100);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 border-b border-border pb-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted">Buscar activo</label>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
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
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted">
              <th className="px-3 py-3 font-medium sm:px-5">
                <span className="inline-flex items-center gap-1.5">
                  Comparar
                  <InfoModal title="¿Qué hace esta casilla?">
                    Selecciona hasta {maxSelectable ?? "varios"} activos para
                    graficarlos juntos abajo. Esto no los agrega a tu
                    watchlist — para eso usa el botón &ldquo;Watchlist&rdquo;
                    de cada fila, o entra al activo para abrir una posición.
                  </InfoModal>
                </span>
                {maxSelectable !== null && (
                  <span className="ml-1 font-normal text-text-muted/70">(máx. {maxSelectable})</span>
                )}
              </th>
              <th className="px-3 py-3 font-medium sm:px-5">Activo</th>
              <th className="px-3 py-3 font-medium sm:px-5">Precio</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Tendencia</th>
              <th className="hidden px-5 py-3 font-medium text-right sm:table-cell">Retorno anual.</th>
              <th className="hidden px-5 py-3 font-medium text-right md:table-cell">Volatilidad</th>
              <th className="hidden px-5 py-3 font-medium text-right md:table-cell">Sharpe</th>
              <th className="px-3 py-3 font-medium text-right sm:px-5">
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
              <th className="px-3 py-3 font-medium text-right sm:px-5">
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
              <th className="px-3 py-3 font-medium sm:px-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.map((row) => (
              <tr key={row.symbol} className="hover:bg-surface-2">
                <td className="px-3 py-3 sm:px-5">
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
                <td className="px-3 py-3 sm:px-5">
                  <Link href={`/activos/${row.symbol}`} className="block">
                    <p className="font-data font-medium text-text">{row.symbol}</p>
                    <p className="text-xs text-text-muted">
                      {row.name} · {ASSET_CLASS_LABEL[row.assetClass]}
                    </p>
                  </Link>
                </td>
                <td className="px-3 py-3 font-data text-text sm:px-5">
                  ${row.price.toLocaleString("es")}
                  <span
                    className={`ml-2 text-xs ${row.changePct >= 0 ? "text-data-up" : "text-data-down"}`}
                  >
                    {row.changePct >= 0 ? "+" : ""}
                    {(row.changePct * 100).toFixed(2)}%
                  </span>
                </td>
                <td className="hidden px-5 py-3 sm:table-cell">
                  <Sparkline values={row.sparkline} up={row.changePct >= 0} />
                </td>
                <td
                  className={`hidden px-5 py-3 text-right font-data sm:table-cell ${row.annualizedReturn >= 0 ? "text-data-up" : "text-data-down"}`}
                >
                  {(row.annualizedReturn * 100).toFixed(1)}%
                </td>
                <td className="hidden px-5 py-3 text-right font-data text-text md:table-cell">
                  {(row.annualizedVolatility * 100).toFixed(1)}%
                </td>
                <td className="hidden px-5 py-3 text-right font-data text-text md:table-cell">
                  {row.sharpeRatio.toFixed(2)}
                </td>
                <td className={`px-3 py-3 text-right font-data font-semibold sm:px-5 ${scoreTone(row.alfiaScore)}`}>
                  {row.alfiaScore}
                </td>
                <td className={`px-3 py-3 text-right text-xs font-medium sm:px-5 ${signalTone(screenerSignal(row))}`}>
                  {screenerSignal(row)}
                </td>
                <td className="px-3 py-3 sm:px-5">
                  <div className="flex flex-col items-start gap-1.5">
                    {loggedIn && (
                      <WatchlistStarButton
                        symbol={row.symbol}
                        initialInWatchlist={watchlistSet.has(row.symbol)}
                      />
                    )}
                    <Link
                      href={`/activos/${row.symbol}#abrir-posicion`}
                      className="text-xs font-medium text-green-bright hover:underline"
                    >
                      Abrir posición →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-8 text-center text-text-muted">
                  Ningún activo cumple estos filtros. Prueba ampliarlos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Paginación del screener" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === currentPage ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                n === currentPage
                  ? "border-green-bright bg-green-bright text-bg"
                  : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
