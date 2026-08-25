"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CheckoutBody =
  | { kind: "plan"; id: "basico" | "pro" }
  | { kind: "package"; id: "pack_100" | "pack_500" | "pack_1500" };

export function CheckoutButton({
  body,
  label,
  variant = "primary",
}: {
  body: CheckoutBody;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "No se pudo iniciar el pago. Intenta de nuevo.");
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
      <Button
        variant={variant}
        disabled={loading}
        onClick={handleClick}
        className="w-full"
      >
        {loading ? "Redirigiendo…" : label}
      </Button>
      {error && <p className="mt-2 text-xs text-data-down">{error}</p>}
    </div>
  );
}
