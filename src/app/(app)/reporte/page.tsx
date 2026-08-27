import { computeDailyReport } from "@/lib/analytics/daily-report";
import { MarketSentimentBanner } from "@/components/dashboard/market-sentiment-banner";
import { Disclaimer } from "@/components/ui/disclaimer";
import { createClient } from "@/lib/supabase/server";
import type { MarketBriefing } from "@/types/database";

const BRIEFING_LABEL: Record<MarketBriefing["type"], string> = {
  apertura: "Apertura",
  intradia: "A media sesión",
  cierre: "Cierre",
};

function pct(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(digits)}%`;
}

function tone(n: number) {
  return n >= 0 ? "text-data-up" : "text-data-down";
}

export default async function ReportePage() {
  const report = await computeDailyReport();

  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const { data: briefings } = await supabase
    .from("market_briefings")
    .select("*")
    .gte("created_at", startOfDay.toISOString())
    .order("created_at", { ascending: true })
    .returns<MarketBriefing[]>();

  const today = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold capitalize text-text">
          Reporte diario · {today}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Cierre del mercado, amplitud, sectores y sentimiento — generado con
          datos reales de precios, no es asesoría financiera regulada.
        </p>
      </div>

      {report.sentiment && (
        <MarketSentimentBanner sentiment={report.sentiment} />
      )}

      {briefings && briefings.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-medium text-text">
            Briefings de hoy
          </h2>
          <div className="mt-4 flex flex-col gap-4">
            {briefings.map((b) => (
              <div key={b.id} className="rounded-xl border border-border bg-surface p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-display font-medium text-text">{b.title}</p>
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-text-muted">
                    {BRIEFING_LABEL[b.type]}
                  </span>
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  {b.content.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-medium text-text">Índices principales</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {report.indices.map((idx) => (
            <div key={idx.symbol} className="rounded-xl border border-border bg-surface p-5">
              <p className="font-data text-sm text-text-muted">{idx.symbol} · {idx.name}</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-data text-2xl font-semibold text-text">
                  ${idx.price.toLocaleString("es")}
                </span>
                <span className={`font-data text-sm font-medium ${tone(idx.dayChangePct)}`}>
                  {pct(idx.dayChangePct, 2)} hoy
                </span>
              </div>
              <p className={`mt-1 text-xs ${tone(idx.weekChangePct)}`}>
                {pct(idx.weekChangePct, 2)} en la última semana
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">Qué pasó y qué esperar</h2>
        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <ol className="flex flex-col gap-2 text-sm leading-relaxed text-text-muted">
            {report.narrative.map((line, i) => (
              <li key={i}>{i + 1}. {line}</li>
            ))}
          </ol>
          <Disclaimer className="mt-4" />
        </div>
      </section>

      {report.featured && (
        <section>
          <h2 className="font-display text-lg font-medium text-text">
            En detalle: {report.featured.symbol} · {report.featured.name}
          </h2>
          <div className="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-6">
            <div className="flex flex-col gap-2">
              {report.featured.detail.map((line, i) => (
                <p key={i} className="text-sm leading-relaxed text-text">
                  {line}
                </p>
              ))}
            </div>
            {report.featured.relatedNews && (
              <a
                href={report.featured.relatedNews.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-gold hover:underline"
              >
                Leer la nota completa →
              </a>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg font-medium text-text">Sectores</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-5 py-3 font-medium">Sector</th>
                <th className="px-5 py-3 font-medium text-right">Retorno promedio (día)</th>
                <th className="px-5 py-3 font-medium text-right">Activos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.sectors.map((s) => (
                <tr key={s.sector}>
                  <td className="px-5 py-3 text-text">{s.sector}</td>
                  <td className={`px-5 py-3 text-right font-data ${tone(s.avgDayChangePct)}`}>
                    {pct(s.avgDayChangePct, 2)}
                  </td>
                  <td className="px-5 py-3 text-right text-text-muted">{s.assetCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-display text-lg font-medium text-text">Mayores avances</h2>
          <div className="mt-4 flex flex-col gap-2">
            {report.topMovers.map((m) => (
              <div key={m.symbol} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
                <span className="text-sm text-text">{m.symbol} · {m.name}</span>
                <span className={`font-data text-sm font-medium ${tone(m.dayChangePct)}`}>{pct(m.dayChangePct, 2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-lg font-medium text-text">Mayores caídas</h2>
          <div className="mt-4 flex flex-col gap-2">
            {report.bottomMovers.map((m) => (
              <div key={m.symbol} className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5">
                <span className="text-sm text-text">{m.symbol} · {m.name}</span>
                <span className={`font-data text-sm font-medium ${tone(m.dayChangePct)}`}>{pct(m.dayChangePct, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-medium text-text">Refugio y materias primas</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Bonos largo plazo (TLT)</p>
            <p className={`mt-1 font-data text-lg font-semibold ${report.bondChangePct !== null ? tone(report.bondChangePct) : "text-text"}`}>
              {report.bondChangePct !== null ? pct(report.bondChangePct, 2) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Oro (GLD)</p>
            <p className={`mt-1 font-data text-lg font-semibold ${report.goldChangePct !== null ? tone(report.goldChangePct) : "text-text"}`}>
              {report.goldChangePct !== null ? pct(report.goldChangePct, 2) : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs text-text-muted">Petróleo (USO)</p>
            <p className={`mt-1 font-data text-lg font-semibold ${report.oilChangePct !== null ? tone(report.oilChangePct) : "text-text"}`}>
              {report.oilChangePct !== null ? pct(report.oilChangePct, 2) : "—"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
