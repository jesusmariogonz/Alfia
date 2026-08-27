import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import type { NewsItem } from "@/types/database";

const SENTIMENT_TONE: Record<NewsItem["sentiment"], "green" | "neutral"> = {
  positivo: "green",
  negativo: "neutral",
  neutral: "neutral",
};

const SENTIMENT_TEXT_COLOR: Record<NewsItem["sentiment"], string> = {
  positivo: "text-data-up",
  negativo: "text-data-down",
  neutral: "text-text-muted",
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "hace unos minutos";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export async function NewsFeed({ limit }: { limit?: number } = {}) {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news_items")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(limit ?? 20)
    .returns<NewsItem[]>();

  if (!news || news.length === 0) {
    return (
      <div className="p-6 text-sm text-text-muted">
        Todavía no hay noticias cargadas — se actualizan automáticamente varias
        veces al día.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col gap-1.5 p-5 transition-colors hover:bg-surface-2"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-text">{item.title}</p>
            <Badge tone={SENTIMENT_TONE[item.sentiment]}>
              <span className={SENTIMENT_TEXT_COLOR[item.sentiment]}>{item.sentiment}</span>
            </Badge>
          </div>
          {item.summary && (
            <p className="text-xs leading-relaxed text-text-muted line-clamp-2">
              {item.summary}
            </p>
          )}
          <p className="text-xs text-text-muted">
            {item.source} · {relativeTime(item.published_at)}
          </p>
        </a>
      ))}
    </div>
  );
}
