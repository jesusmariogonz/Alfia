"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InfoModal } from "@/components/ui/info-modal";

export function WatchlistAlertSetting({
  symbol,
  initialThresholdPct,
  triggered,
}: {
  symbol: string;
  initialThresholdPct: number | null;
  triggered: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialThresholdPct ? String(initialThresholdPct) : "");
  const [loading, setLoading] = useState(false);

  async function save() {
    const pct = value.trim() === "" ? null : Number(value);
    if (pct !== null && (!Number.isFinite(pct) || pct <= 0)) return;
    setLoading(true);
    try {
      await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, alertThresholdPct: pct }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {triggered && (
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10px] font-medium text-gold">
          Movimiento
        </span>
      )}
      <input
        type="number"
        min={0.5}
        step="0.5"
        placeholder="Umbral %"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        disabled={loading}
        className="w-20 rounded-lg border border-border bg-surface-2 px-2 py-1 text-xs text-text focus:border-green-bright focus:outline-none"
      />
      <InfoModal title="Alertas de watchlist" label="?">
        Escribe un % y sal del campo para guardarlo. Cuando el precio se
        mueva ese % o más (arriba o abajo) desde que guardaste el umbral, la
        fila se marca &ldquo;Movimiento&rdquo;. Por ahora es un aviso visual
        dentro de la app — todavía no envía correo ni notificación push.
      </InfoModal>
    </div>
  );
}
