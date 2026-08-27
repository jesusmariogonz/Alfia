import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findAsset, getCloses, getIntradayCloses } from "@/lib/market-data";
import { computeRiskMetrics } from "@/lib/analytics/metrics";
import { computeAlfiaScore, scoreLabel } from "@/lib/analytics/score";
import { AssetChartPanel } from "@/components/analytics/asset-chart-panel";
import { QuoteStats } from "@/components/analytics/quote-stats";
import { PositionSizeCalculator } from "@/components/analytics/position-size-calculator";
import { RiskMetricsGrid } from "@/components/analytics/risk-metrics-grid";
import { WatchlistToggleButton } from "@/components/analytics/watchlist-toggle-button";
import { PositionForm } from "@/components/portfolio/position-form";
import { PositionLocked } from "@/components/portfolio/position-locked";
import { canOpenPositions, canUseChat } from "@/lib/plan";
import { Badge } from "@/components/ui/badge";
import { InfoModal } from "@/components/ui/info-modal";
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

  const [closes, intraday] = await Promise.all([
    getCloses(asset.symbol),
    getIntradayCloses(asset.symbol),
  ]);
  if (!closes) notFound();
  const metrics = computeRiskMetrics(closes);
  const score = computeAlfiaScore(metrics);
  const last = closes[closes.length - 1].close;
  const prev = closes[closes.length - 2].close;
  const changePct = last / prev - 1;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: watchlistItem }, { data: profile }] = user
    ? await Promise.all([
        supabase
          .from("watchlist_items")
          .select("id, invested_usd")
          .eq("user_id", user.id)
          .eq("symbol", asset.symbol)
          .maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
      ])
    : [{ data: null }, { data: null }];
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
            <InfoModal title="¿Cómo se calcula el Alfia Score?">
              Combina cuatro métricas de los últimos 2 años en un solo número de 0
              a 100, para comparar activos rápido: Sharpe ratio (40%), retorno
              anualizado (25%), volatilidad anualizada —a menor volatilidad, más
              puntos— (20%) y máximo drawdown —a menor caída, más puntos— (15%).
              No es una recomendación de compra ni venta, es un resumen de riesgo
              y desempeño histórico.
            </InfoModal>
          </div>
        </div>
        {user ? (
          <WatchlistToggleButton
            symbol={asset.symbol}
            initialInWatchlist={Boolean(watchlistItem)}
          />
        ) : (
          <Link href="/registro">
            <Button variant="secondary">Regístrate para seguir este activo</Button>
          </Link>
        )}
      </div>

      <AssetChartPanel
        symbol={asset.symbol}
        candles={closes}
        intraday={intraday}
        plan={profile?.plan ?? "free"}
      />

      <QuoteStats closes={closes} />

      <PositionSizeCalculator currentPrice={last} />

      <div>
        <h2 className="font-display text-lg font-medium text-text">
          Métricas de riesgo (2 años)
        </h2>
        <div className="mt-4">
          <RiskMetricsGrid metrics={metrics} />
        </div>
        <Disclaimer className="mt-3" />
      </div>

      <div className="grid grid-cols-1 divide-y divide-border border-t border-border md:grid-cols-2 md:divide-x md:divide-y-0">
        {!user ? (
          <div className="py-5 md:pr-6">
            <p className="text-sm font-medium text-text">Abrir posición</p>
            <p className="mt-1 text-xs text-text-muted">
              Crea una cuenta gratis para registrar cuánto tienes invertido y
              reunirlo en Mi Portafolio.
            </p>
            <Link href="/registro" className="mt-3 inline-block">
              <Button variant="secondary">Crear cuenta gratis</Button>
            </Link>
          </div>
        ) : canOpenPosition ? (
          <PositionForm
            symbol={asset.symbol}
            initialInvestedUsd={watchlistItem?.invested_usd ?? null}
          />
        ) : (
          <PositionLocked />
        )}
        <div className="py-5 md:pl-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text">
              Simulaciones, comparaciones y recomendaciones
            </p>
            <Badge tone="gold">Pro</Badge>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            Pregúntale al chat de Alfia (solo plan Pro) — por ejemplo &ldquo;simula
            invertir $10,000 en {asset.symbol} a 1 año&rdquo; o &ldquo;debería
            comprar {asset.symbol}?&rdquo;.
          </p>
          <Link
            href={canUseChat(profile?.plan ?? "free") ? "/chat" : "/creditos"}
            className="mt-3 inline-block"
          >
            <Button variant="secondary">
              {canUseChat(profile?.plan ?? "free") ? "Ir al chat" : "Ver planes"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
