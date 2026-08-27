"use client";

import { useState } from "react";

export function WatchlistStarButton({
  symbol,
  initialInWatchlist,
}: {
  symbol: string;
  initialInWatchlist: boolean;
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (inWatchlist) {
        await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
        setInWatchlist(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol }),
        });
        setInWatchlist(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-pressed={inWatchlist}
      aria-label={inWatchlist ? `Quitar ${symbol} de watchlist` : `Agregar ${symbol} a watchlist`}
      title={inWatchlist ? "Quitar de watchlist" : "Agregar a watchlist"}
      className={`rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${
        inWatchlist
          ? "border-gold/40 bg-gold/10 text-gold"
          : "border-border text-text-muted hover:border-gold/40 hover:text-gold"
      }`}
    >
      {inWatchlist ? "En watchlist" : "+ Watchlist"}
    </button>
  );
}
