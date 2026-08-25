"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAT_COST = 1;

export function ChatPanel({ initialBalance }: { initialBalance: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error al procesar tu consulta.");
        setLoading(false);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      if (typeof data.newBalance === "number") setBalance(data.newBalance);
    } catch {
      setError(
        "No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-xl border border-border bg-surface">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-lg font-medium text-text">
              Pregunta sobre inversión, trading o mercados
            </p>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              Por ejemplo: &ldquo;¿qué diferencia hay entre una acción de valor y
              una de crecimiento?&rdquo; o &ldquo;explícame qué es la volatilidad
              implícita&rdquo;.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-green-bright text-bg"
                  : "border border-border bg-surface-2 text-text"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-text-muted">
              Analizando…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mx-6 mb-2 rounded-lg border border-data-down/30 bg-data-down/10 px-3.5 py-2.5 text-sm text-data-down">
          {error}
        </p>
      )}

      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta…"
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-green-bright focus:outline-none"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            Enviar · {CHAT_COST} crédito
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between">
          <Disclaimer />
          <span className="font-data text-xs text-text-muted">
            Saldo: {balance.toLocaleString("es")} créditos
          </span>
        </div>
      </div>
    </div>
  );
}
