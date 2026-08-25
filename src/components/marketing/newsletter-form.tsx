"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <p className="text-sm text-green-bright">
        Listo, te llegará el resumen semanal a {email || "tu correo"}.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@correo.com"
        className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
      />
      <Button type="submit" variant="secondary" disabled={status === "loading"}>
        {status === "loading" ? "Enviando…" : "Suscribirme"}
      </Button>
      {status === "error" && (
        <p className="text-xs text-data-down sm:hidden">No se pudo suscribir, intenta de nuevo.</p>
      )}
    </form>
  );
}
