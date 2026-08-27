"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ErrorBanner } from "@/components/ui/error-banner";
import { FormattedText } from "@/components/ui/formatted-text";

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
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInsufficientCredits(false);
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextHistory }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Ocurrió un error al procesar tu consulta.");
        setInsufficientCredits(res.status === 402);
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
    <div className="flex h-[calc(100vh-10rem)] flex-col rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="font-display text-lg font-medium text-text">
              Pregunta sobre inversión, trading o mercados
            </p>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              Por ejemplo: &ldquo;¿qué pasaría si invierto $10,000 en AAPL a 1
              año?&rdquo;, &ldquo;compara AAPL vs MSFT&rdquo; o &ldquo;debería
              comprar TSLA?&rdquo; — Alfia corre el análisis por ti.
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
                  : "border border-border bg-surface-2"
              }`}
            >
              {m.role === "assistant" ? (
                <FormattedText text={m.content} />
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]-2 px-4 py-3 text-sm text-text-muted">
              Analizando…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-6 mb-2">
          <ErrorBanner message={error} showCreditsCta={insufficientCredits} />
        </div>
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
            Enviar · {CHAT_COST}+ créditos
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between">
          <Disclaimer />
          <span className="font-data text-xs text-text-muted">
            Saldo: {balance.toLocaleString("es")} créditos
          </span>
        </div>
        <p className="mt-1.5 text-xs text-text-muted">
          {CHAT_COST} crédito por mensaje. Si Alfia corre un análisis más profundo
          (simulación, comparación, backtest, recomendación) se cobra un costo
          adicional por eso, no antes.
        </p>
      </div>
    </div>
  );
}
