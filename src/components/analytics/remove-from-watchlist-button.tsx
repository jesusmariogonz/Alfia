"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RemoveFromWatchlistButton({ symbol }: { symbol: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="secondary" disabled={loading} onClick={handleClick}>
      Quitar
    </Button>
  );
}
