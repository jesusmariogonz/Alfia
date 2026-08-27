import Link from "next/link";
import type { SectorSnapshot } from "@/lib/analytics/daily-report";

function pct(n: number, digits = 2) {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
}

function tone(n: number) {
  return n >= 0 ? "text-data-up" : "text-data-down";
}

export function SectorAssetsList({ sectors }: { sectors: SectorSnapshot[] }) {
  return (
    <div className="mt-4 flex flex-col divide-y divide-border border-t border-border">
      {sectors.map((s) => (
        <details key={s.sector} className="group py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-2 py-2 marker:content-none">
            <span className="flex items-center gap-2 text-sm text-text">
              <span className="text-text-muted transition-transform group-open:rotate-90">›</span>
              {s.sector}
            </span>
            <span className="flex items-center gap-6">
              <span className={`font-data text-sm ${tone(s.avgDayChangePct)}`}>
                {pct(s.avgDayChangePct)}
              </span>
              <span className="w-14 text-right text-xs text-text-muted">{s.assetCount} activo{s.assetCount !== 1 ? "s" : ""}</span>
            </span>
          </summary>
          <div className="flex flex-col gap-1.5 px-2 pb-2 pl-8 pt-1">
            {s.assets.map((a) => (
              <Link
                key={a.symbol}
                href={`/activos/${a.symbol}`}
                className="flex items-center justify-between gap-4 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-2"
              >
                <span className="text-text">{a.symbol} · {a.name}</span>
                <span className={`font-data ${tone(a.dayChangePct)}`}>{pct(a.dayChangePct)}</span>
              </Link>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
