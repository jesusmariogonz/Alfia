"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CloseDemoPositionButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function close() {
    setLoading(true);
    try {
      await fetch("/api/demo-positions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={close}
      disabled={loading}
      className="text-xs font-medium text-text-muted hover:text-data-down"
    >
      {loading ? "Cerrando…" : "Cerrar posición"}
    </button>
  );
}
