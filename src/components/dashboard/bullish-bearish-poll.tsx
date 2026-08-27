"use client";

import { useState } from "react";

export function BullishBearishPoll({
  initialVote,
  initialBullish,
  initialBearish,
}: {
  initialVote: "bullish" | "bearish" | null;
  initialBullish: number;
  initialBearish: number;
}) {
  const [vote, setVote] = useState(initialVote);
  const [bullish, setBullish] = useState(initialBullish);
  const [bearish, setBearish] = useState(initialBearish);
  const [loading, setLoading] = useState(false);

  const total = bullish + bearish;
  const bullishPct = total > 0 ? Math.round((bullish / total) * 100) : 50;

  async function castVote(choice: "bullish" | "bearish") {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/polls/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: choice }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setVote(data.vote);
      setBullish(data.bullish);
      setBearish(data.bearish);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <p className="text-sm font-medium text-text">¿Bullish o bearish para mañana?</p>
      <p className="mt-1 text-xs text-text-muted">
        La opinión de la comunidad de Alfia — no es una señal ni una recomendación.
      </p>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => castVote("bullish")}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            vote === "bullish"
              ? "border-data-up bg-data-up/10 text-data-up"
              : "border-border text-text-muted hover:text-text"
          }`}
        >
          Bullish
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => castVote("bearish")}
          className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
            vote === "bearish"
              ? "border-data-down bg-data-down/10 text-data-down"
              : "border-border text-text-muted hover:text-text"
          }`}
        >
          Bearish
        </button>
      </div>

      {vote && (
        <div className="mt-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="bg-data-up" style={{ width: `${bullishPct}%` }} />
            <div className="bg-data-down" style={{ width: `${100 - bullishPct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-xs text-text-muted">
            <span>{bullishPct}% bullish ({bullish})</span>
            <span>{100 - bullishPct}% bearish ({bearish})</span>
          </div>
        </div>
      )}
    </div>
  );
}
