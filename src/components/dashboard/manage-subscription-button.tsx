"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "No se pudo abrir el portal de facturación.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" disabled={loading} onClick={handleClick}>
        {loading ? "Abriendo…" : "Gestionar suscripción"}
      </Button>
      {error && <p className="mt-2 text-xs text-data-down">{error}</p>}
    </div>
  );
}
