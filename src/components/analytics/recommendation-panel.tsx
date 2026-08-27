"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { FormattedText } from "@/components/ui/formatted-text";
import type { RecommendationAction } from "@/app/api/analytics/recommendation/route";

const COST = 2;

const ACTION_LABEL: Record<RecommendationAction, string> = {
  comprar: "Comprar",
  mantener: "Mantener",
  vender: "Vender",
};

const ACTION_TONE: Record<RecommendationAction, "green" | "gold" | "neutral"> = {
  comprar: "green",
  mantener: "gold",
  vender: "neutral",
};

export function RecommendationPanel({ symbol }: { symbol: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [result, setResult] = useState<{
    action: RecommendationAction;
    reasoning: string;
  } | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    setInsufficientCredits(false);
    try {
      const res = await fetch("/api/analytics/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "No se pudo generar la recomendación.");
        setInsufficientCredits(res.status === 402);
        return;
      }
      setResult({ action: json.action, reasoning: json.reasoning });
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">Recomendación de Alfia</p>
        {result && (
          <Badge tone={ACTION_TONE[result.action]}>{ACTION_LABEL[result.action]}</Badge>
        )}
      </div>

      {!result && (
        <>
          <p className="mt-1 text-xs text-text-muted">
            La IA interpreta las métricas de este activo y sugiere comprar, mantener
            o vender — no es una señal infalible, es una lectura razonada.
          </p>
          <Button onClick={generate} disabled={loading} className="mt-3">
            {loading ? "Analizando…" : `Generar recomendación · ${COST} créditos`}
          </Button>
        </>
      )}

      {error && (
        <div className="mt-3">
          <ErrorBanner message={error} showCreditsCta={insufficientCredits} />
        </div>
      )}

      {result && (
        <>
          <FormattedText text={result.reasoning} className="mt-3" />
          <Button onClick={generate} disabled={loading} variant="secondary" className="mt-3">
            {loading ? "Analizando…" : "Regenerar"}
          </Button>
          <Disclaimer className="mt-3" />
        </>
      )}
    </div>
  );
}
