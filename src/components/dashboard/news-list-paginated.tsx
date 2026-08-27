"use client";

import { useState } from "react";
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

const PAGE_SIZE = 10;

export function NewsListPaginated({ items }: { items: NewsItem[] }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <div className="divide-y divide-border">
        {pageItems.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-4 py-4 transition-colors hover:bg-surface-2"
          >
            {item.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image_url}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-text">{item.title}</p>
                <Badge tone={SENTIMENT_TONE[item.sentiment]}>
                  <span className={SENTIMENT_TEXT_COLOR[item.sentiment]}>{item.sentiment}</span>
                </Badge>
              </div>
              {item.summary && (
                <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
                  {item.summary}
                </p>
              )}
              <p className="mt-1 text-xs text-text-muted">
                {item.source} · {relativeTime(item.published_at)}
              </p>
            </div>
          </a>
        ))}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Paginación de noticias" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPage(n)}
              aria-current={n === page ? "page" : undefined}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                n === page
                  ? "border-green-bright bg-green-bright text-bg"
                  : "border-border text-text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
