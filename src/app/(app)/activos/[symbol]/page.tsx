import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore, scoreLabel } from "@/lib/analytics/score";
import { Sparkline } from "@/components/analytics/sparkline";
import { RiskMetricsGrid } from "@/components/analytics/risk-metrics-grid";
import { WatchlistToggleButton } from "@/components/analytics/watchlist-toggle-button";
import { PositionForm } from "@/components/portfolio/position-form";
import { PositionLocked } from "@/components/portfolio/position-locked";
import { canOpenPositions } from "@/lib/plan";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import type { Profile } from "@/types/database";

export default async function ActivoPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  const asset = findAsset(symbol);
  if (!asset) notFound();

  const closes = (await getCloses(asset.symbol))!;
  const metrics = computeRiskMetrics(closes);
  const score = computeAlfiaScore(metrics);
  const last = closes[closes.length - 1].close;
  const prev = closes[closes.length - 2].close;
  const changePct = last / prev - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: watchlistItem }, { data: profile }] = await Promise.all([
    supabase
      .from("watchlist_items")
      .select("id, invested_usd")
      .eq("user_id", user!.id)
      .eq("symbol", asset.symbol)
      .maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>(),
  ]);
  const canOpenPosition = canOpenPositions(profile?.plan ?? "free");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-data text-sm text-text-muted">{asset.sector}</p>
          <h1 className="font-display text-2xl font-semibold text-text">
            {asset.symbol} · {asset.name}
          </h1>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-data text-2xl font-semibold text-text">
              ${last.toLocaleString("es")}
            </span>
            <span className={`font-data text-sm ${changePct >= 0 ? "text-data-up" : "text-data-down"}`}>
              {changePct >= 0 ? "+" : ""}
              {(changePct * 100).toFixed(2)}%
            </span>
            <Badge tone={score >= 65 ? "green" : score >= 40 ? "gold" : "neutral"}>
              Alfia Score {score} · {scoreLabel(score)}
            </Badge>
          </div>
        </div>
        <WatchlistToggleButton
          symbol={asset.symbol}
          initialInWatchlist={Boolean(watchlistItem)}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <Sparkline values={closes.map((c) => c.close)} up={changePct >= 0} width={600} height={140} />
      </div>

      <div>
        <h2 className="font-display text-lg font-medium text-text">
          Métricas de riesgo (2 años)
        </h2>
        <div className="mt-4">
          <RiskMetricsGrid metrics={metrics} />
        </div>
        <Disclaimer className="mt-3" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {canOpenPosition ? (
          <PositionForm
            symbol={asset.symbol}
            initialInvestedUsd={watchlistItem?.invested_usd ?? null}
          />
        ) : (
          <PositionLocked />
        )}
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-text">
            Simulaciones, comparaciones y recomendaciones
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Pregúntale al chat de Alfia (Pro) — por ejemplo &ldquo;simula invertir
            $10,000 en {asset.symbol} a 1 año&rdquo; o &ldquo;debería comprar{" "}
            {asset.symbol}?&rdquo;.
          </p>
          <Link href="/chat" className="mt-3 inline-block">
            <Button variant="secondary">Ir al chat</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
