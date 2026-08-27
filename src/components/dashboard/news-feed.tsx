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

export async function NewsFeed({ limit, hero = false }: { limit?: number; hero?: boolean } = {}) {
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

  const [featured, ...rest] = hero ? news : [null, ...news];

  return (
    <div>
      {featured && (
        <a
          href={featured.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 block"
        >
          {featured.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.image_url}
              alt=""
              className="mb-3 aspect-video w-full rounded-xl object-cover"
            />
          )}
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-xl font-semibold leading-tight text-text">
              {featured.title}
            </h3>
            <Badge tone={SENTIMENT_TONE[featured.sentiment]}>
              <span className={SENTIMENT_TEXT_COLOR[featured.sentiment]}>{featured.sentiment}</span>
            </Badge>
          </div>
          {featured.summary && (
            <p className="mt-2 text-sm leading-relaxed text-text-muted line-clamp-3">
              {featured.summary}
            </p>
          )}
          <p className="mt-2 text-xs text-text-muted">
            {featured.source} · {relativeTime(featured.published_at)}
          </p>
        </a>
      )}

      <div className="divide-y divide-border">
        {rest.map((item) => (
          <a
            key={item!.id}
            href={item!.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 py-4 transition-colors hover:bg-surface-2"
          >
            {item!.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item!.image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-text">{item!.title}</p>
                <Badge tone={SENTIMENT_TONE[item!.sentiment]}>
                  <span className={SENTIMENT_TEXT_COLOR[item!.sentiment]}>{item!.sentiment}</span>
                </Badge>
              </div>
              {item!.summary && (
                <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
                  {item!.summary}
                </p>
              )}
              <p className="mt-1 text-xs text-text-muted">
                {item!.source} · {relativeTime(item!.published_at)}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
