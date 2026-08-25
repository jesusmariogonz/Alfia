"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WatchlistToggleButton({
  symbol,
  initialInWatchlist,
}: {
  symbol: string;
  initialInWatchlist: boolean;
}) {
  const [inWatchlist, setInWatchlist] = useState(initialInWatchlist);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
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
    <Button variant={inWatchlist ? "secondary" : "primary"} disabled={loading} onClick={handleClick}>
      {inWatchlist ? "Quitar de watchlist" : "Agregar a watchlist"}
    </Button>
  );
}
