"use client";

import { useState } from "react";
import { InfoModal } from "@/components/ui/info-modal";

export function PositionSizeCalculator({ currentPrice }: { currentPrice: number }) {
  const [capital, setCapital] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(currentPrice);
  const [stop, setStop] = useState(Number((currentPrice * 0.95).toFixed(2)));

  const riskAmount = capital * (riskPct / 100);
  const perShareRisk = Math.abs(entry - stop);
  const shares = perShareRisk > 0 ? Math.floor(riskAmount / perShareRisk) : 0;
  const positionValue = shares * entry;
  const pctOfCapital = capital > 0 ? (positionValue / capital) * 100 : 0;
  const invalid = entry === stop;

  return (
    <div className="p-5">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-text">Calculadora de posición</p>
        <InfoModal title="¿Cómo se calcula?">
          Define cuántas acciones comprar para arriesgar solo un % fijo de tu
          capital si el precio llega a tu stop-loss. Fórmula: acciones = (capital ×
          % de riesgo) ÷ |precio de entrada − precio de stop|. No considera
          comisiones ni slippage.
        </InfoModal>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Capital total ($)</span>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">% de riesgo por operación</span>
          <input
            type="number"
            step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Precio de entrada ($)</span>
          <input
            type="number"
            step="0.01"
            value={entry}
            onChange={(e) => setEntry(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-text-muted">Precio de stop-loss ($)</span>
          <input
            type="number"
            step="0.01"
            value={stop}
            onChange={(e) => setStop(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text focus:border-green-bright focus:outline-none"
          />
        </label>
      </div>

      {invalid ? (
        <p className="mt-4 text-xs text-data-down">
          El precio de entrada y el de stop-loss no pueden ser iguales.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-muted">Acciones a comprar</p>
            <p className="mt-1 font-data text-lg font-semibold text-text">{shares.toLocaleString("es")}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Monto en riesgo</p>
            <p className="mt-1 font-data text-lg font-semibold text-data-down">
              ${riskAmount.toLocaleString("es", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Valor de la posición</p>
            <p className="mt-1 font-data text-lg font-semibold text-text">
              ${positionValue.toLocaleString("es", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">% del capital</p>
            <p className="mt-1 font-data text-lg font-semibold text-text">{pctOfCapital.toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
