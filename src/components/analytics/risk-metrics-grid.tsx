import type { RiskMetrics } from "@/lib/analytics/metrics";

function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function RiskMetricsGrid({ metrics }: { metrics: RiskMetrics }) {
  const items = [
    {
      label: "Retorno anualizado",
      value: pct(metrics.annualizedReturn),
      tone: metrics.annualizedReturn >= 0 ? "text-data-up" : "text-data-down",
    },
    {
      label: "Volatilidad anualizada",
      value: pct(metrics.annualizedVolatility),
      tone: "text-text",
    },
    {
      label: "Sharpe ratio",
      value: metrics.sharpeRatio.toFixed(2),
      tone: "text-text",
    },
    {
      label: "Máximo drawdown",
      value: pct(metrics.maxDrawdown),
      tone: "text-data-down",
    },
    {
      label: "VaR diario (95%)",
      value: pct(metrics.valueAtRisk95),
      tone: "text-data-down",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-surface-2 p-4">
          <p className="text-xs text-text-muted">{item.label}</p>
          <p className={`mt-1 font-data text-lg font-semibold ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
