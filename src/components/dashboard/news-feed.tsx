import { Badge } from "@/components/ui/badge";

type NewsItem = {
  title: string;
  source: string;
  sentiment: "positivo" | "negativo" | "neutral";
};

const items: NewsItem[] = [
  {
    title: "La Fed mantiene tasas sin cambios y sugiere recortes graduales para 2026",
    source: "Reuters",
    sentiment: "positivo",
  },
  {
    title: "Ventas al menudeo en EE.UU. caen más de lo esperado en julio",
    source: "Bloomberg",
    sentiment: "negativo",
  },
  {
    title: "Resultados mixtos en el sector tecnológico durante la temporada de reportes",
    source: "MarketWatch",
    sentiment: "neutral",
  },
];

const sentimentTone: Record<NewsItem["sentiment"], "green" | "neutral"> = {
  positivo: "green",
  negativo: "neutral",
  neutral: "neutral",
};

export function NewsFeed({ limit }: { limit?: number } = {}) {
  const visible = limit ? items.slice(0, limit) : items;
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-surface">
      {visible.map((item) => (
        <div key={item.title} className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-sm font-medium text-text">{item.title}</p>
            <p className="mt-1 text-xs text-text-muted">{item.source}</p>
          </div>
          <Badge
            tone={
              item.sentiment === "negativo"
                ? "neutral"
                : sentimentTone[item.sentiment]
            }
          >
            <span
              className={
                item.sentiment === "positivo"
                  ? "text-data-up"
                  : item.sentiment === "negativo"
                    ? "text-data-down"
                    : "text-text-muted"
              }
            >
              {item.sentiment}
            </span>
          </Badge>
        </div>
      ))}
    </div>
  );
}
