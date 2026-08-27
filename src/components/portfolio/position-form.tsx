"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PositionForm({
  symbol,
  initialInvestedUsd,
}: {
  symbol: string;
  initialInvestedUsd: number | null;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(initialInvestedUsd ? String(initialInvestedUsd) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = amount.trim() === "" ? null : Number(amount);
    if (value !== null && (!Number.isFinite(value) || value <= 0)) {
      setError("Ingresa un monto válido.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, investedUsd: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No se pudo guardar la posición.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-5 md:pr-6">
      <p className="text-sm font-medium text-text">
        {initialInvestedUsd ? "Tu posición en este activo" : "Abrir posición"}
      </p>
      <p className="mt-1 text-xs text-text-muted">
        Cuánto tienes invertido en {symbol} (USD). Se usa para reunir tus posiciones
        en Mi Portafolio.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="number"
          min={0}
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Monto invertido en USD"
          className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
        />
        <Button onClick={save} disabled={loading} variant="secondary">
          {loading ? "Guardando…" : "Guardar"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-data-down">{error}</p>}
    </div>
  );
}
