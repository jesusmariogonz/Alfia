import type { RiskMetrics } from "@/lib/analytics/metrics";
import { InfoModal } from "@/components/ui/info-modal";

function pct(n: number, digits = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}

export function RiskMetricsGrid({ metrics }: { metrics: RiskMetrics }) {
  const items = [
    {
      label: "Retorno anualizado",
      value: pct(metrics.annualizedReturn),
      tone: metrics.annualizedReturn >= 0 ? "text-data-up" : "text-data-down",
      explanation:
        "Cuánto habría ganado o perdido este activo por año, en promedio, durante el periodo mostrado. Se calcula con los retornos diarios y se anualiza para poder comparar activos con distinto historial.",
    },
    {
      label: "Volatilidad anualizada",
      value: pct(metrics.annualizedVolatility),
      tone: "text-text",
      explanation:
        "Qué tanto se mueve el precio del activo, hacia arriba o hacia abajo, en un año típico. Más alta = precio más impredecible en el corto plazo, no necesariamente peor rendimiento.",
    },
    {
      label: "Sharpe ratio",
      value: metrics.sharpeRatio.toFixed(2),
      tone: "text-text",
      explanation:
        "Retorno obtenido por cada unidad de riesgo asumido (retorno ÷ volatilidad, ajustado por una tasa libre de riesgo). Arriba de 1 se considera bueno; negativo significa que el riesgo no se vio compensado con retorno.",
    },
    {
      label: "Máximo drawdown",
      value: pct(metrics.maxDrawdown),
      tone: "text-data-down",
      explanation:
        "La caída más grande que tuvo el activo desde un máximo hasta el mínimo posterior, en el periodo mostrado. Es la peor pérdida que habrías visto si compraste en el peor momento.",
    },
    {
      label: "VaR diario (95%)",
      value: pct(metrics.valueAtRisk95),
      tone: "text-data-down",
      explanation:
        "Value at Risk: la pérdida diaria que, según el historial, no debería superarse en 95 de cada 100 días. El 5% de días restante puede ser peor — no es un límite absoluto.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-text-muted">{item.label}</p>
            <InfoModal title={item.label}>{item.explanation}</InfoModal>
          </div>
          <p className={`mt-1 font-data text-lg font-semibold ${item.tone}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
