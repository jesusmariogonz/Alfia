import type { MarketSentiment } from "@/lib/analytics/sentiment";

function toneFor(score: number): { text: string; bar: string; border: string; bg: string } {
  if (score < 25) return { text: "text-data-down", bar: "bg-data-down", border: "border-data-down/30", bg: "bg-data-down/10" };
  if (score < 45) return { text: "text-data-down", bar: "bg-data-down", border: "border-border", bg: "bg-surface" };
  if (score <= 55) return { text: "text-gold", bar: "bg-gold", border: "border-gold/30", bg: "bg-gold/10" };
  if (score <= 75) return { text: "text-data-up", bar: "bg-data-up", border: "border-border", bg: "bg-surface" };
  return { text: "text-data-up", bar: "bg-data-up", border: "border-data-up/30", bg: "bg-data-up/10" };
}

export function MarketSentimentBanner({ sentiment }: { sentiment: MarketSentiment }) {
  const tone = toneFor(sentiment.score);

  return (
    <div className={`rounded-xl border p-6 ${tone.border} ${tone.bg}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-text-muted">Sentimiento de mercado</p>
          <p className={`mt-1 font-display text-2xl font-semibold ${tone.text}`}>
            {sentiment.label}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`font-data text-3xl font-semibold ${tone.text}`}>
            {sentiment.score}
          </span>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-surface-2">
            <div className={`h-full ${tone.bar}`} style={{ width: `${sentiment.score}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-text-muted">{sentiment.summary}</p>
    </div>
  );
}
