"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Currency } from "@/types/database";

export function CurrencySetting({ initial }: { initial: Currency }) {
  const router = useRouter();
  const [value, setValue] = useState<Currency>(initial);
  const [loading, setLoading] = useState(false);

  async function update(next: Currency) {
    if (next === value) return;
    setValue(next);
    setLoading(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currencyPref: next }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-5">
      <p className="text-sm font-medium text-text">Moneda para mostrar montos</p>
      <p className="mt-1 text-xs text-text-muted">
        Aplica a Mi Portafolio y la cartera demo. Los precios de mercado
        siempre se cotizan en USD (fuente original de los datos).
      </p>
      <div className="mt-3 flex items-center gap-1 rounded-lg border border-border p-1" style={{ width: "fit-content" }}>
        {(["usd", "mxn"] as const).map((c) => (
          <button
            key={c}
            type="button"
            disabled={loading}
            onClick={() => update(c)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              value === c ? "bg-surface-2 text-text" : "text-text-muted"
            }`}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
