import { createAdminClient } from "@/lib/supabase/admin";
import type { NewsItem } from "@/types/database";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diffMs / (60 * 60 * 1000));
  if (hours < 1) return "hace unos minutos";
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export async function AssetNews({ symbol, name }: { symbol: string; name: string }) {
  const admin = createAdminClient();
  const firstWord = name.split(" ")[0];
  const { data } = await admin
    .from("news_items")
    .select("*")
    .or(`title.ilike.%${symbol}%,title.ilike.%${firstWord}%,summary.ilike.%${symbol}%`)
    .order("published_at", { ascending: false })
    .limit(5)
    .returns<NewsItem[]>();

  if (!data || data.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-lg font-medium text-text">Noticias sobre {symbol}</h2>
      <p className="mt-1 text-xs text-text-muted">
        Notas recientes que mencionan {symbol} o {name}, de nuestro feed general de mercado.
      </p>
      <div className="mt-4 divide-y divide-border">
        {data.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-3 transition-colors hover:bg-surface-2"
          >
            <p className="text-sm font-medium text-text">{item.title}</p>
            {item.summary && (
              <p className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
                {item.summary}
              </p>
            )}
            <p className="mt-1 text-xs text-text-muted">
              {item.source} · {relativeTime(item.published_at)}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
