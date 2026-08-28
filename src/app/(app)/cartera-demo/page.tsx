import { createClient } from "@/lib/supabase/server";
import { UNIVERSE, getQuote } from "@/lib/market-data";
import { DemoPositionForm } from "@/components/portfolio/demo-position-form";
import { CloseDemoPositionButton } from "@/components/portfolio/close-demo-position-button";
import { Disclaimer } from "@/components/ui/disclaimer";
import type { DemoPosition } from "@/types/database";

export default async function CarteraDemoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: positions } = await supabase
    .from("demo_positions")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<DemoPosition[]>();

  const open = (positions ?? []).filter((p) => p.status === "abierta");
  const closed = (positions ?? []).filter((p) => p.status === "cerrada");

  const quotesEntries = await Promise.all(UNIVERSE.map(async (a) => [a.symbol, (await getQuote(a.symbol))?.price ?? 0] as const));
  const quotes = Object.fromEntries(quotesEntries);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text">Cartera demo</h1>
        <p className="mt-1 text-sm text-text-muted">
          Practica con dinero simulado, sin arriesgar nada real. El precio de
          entrada y el seguimiento usan datos de mercado reales.
        </p>
      </div>

      <div className="border-y border-border">
        <DemoPositionForm assets={UNIVERSE} quotes={quotes} />
      </div>

      <section>
        <h2 className="font-display text-lg font-medium text-text">Posiciones abiertas</h2>
        {open.length === 0 ? (
          <p className="mt-3 text-sm text-text-muted">Todavía no tienes posiciones demo abiertas.</p>
        ) : (
          <>
          <div className="mt-4 flex flex-col divide-y divide-border border-y border-border sm:hidden">
            {open.map((p) => {
              const currentPrice = quotes[p.symbol] ?? p.entry_price;
              const pnl = (currentPrice - p.entry_price) * p.shares;
              const pnlPct = p.entry_price > 0 ? (currentPrice / p.entry_price - 1) * 100 : 0;
              const up = pnl >= 0;
              return (
                <div key={p.id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-data font-medium text-text">{p.symbol}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${up ? "bg-data-up/10 text-data-up" : "bg-data-down/10 text-data-down"}`}>
                      {up ? "▲" : "▼"} {up ? "+" : ""}{pnlPct.toFixed(1)}%
                    </span>
                  </div>
                  <p className={`mt-1 font-data text-lg font-semibold ${up ? "text-data-up" : "text-data-down"}`}>
                    {up ? "+" : ""}${pnl.toLocaleString("es", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    Entrada ${p.entry_price.toLocaleString("es", { maximumFractionDigits: 2 })} → actual $
                    {currentPrice.toLocaleString("es", { maximumFractionDigits: 2 })} · {p.shares.toLocaleString("es", { maximumFractionDigits: 4 })} acciones
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <CloseDemoPositionButton id={p.id} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="px-5 py-3 font-medium">Activo</th>
                  <th className="px-5 py-3 font-medium text-right">Entrada</th>
                  <th className="px-5 py-3 font-medium text-right">Actual</th>
                  <th className="px-5 py-3 font-medium text-right">Acciones</th>
                  <th className="px-5 py-3 font-medium text-right">Monto demo</th>
                  <th className="px-5 py-3 font-medium text-right">P&amp;L</th>
                  <th className="px-5 py-3 font-medium text-right">Stop / Take</th>
                  <th className="px-5 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {open.map((p) => {
                  const currentPrice = quotes[p.symbol] ?? p.entry_price;
                  const pnl = (currentPrice - p.entry_price) * p.shares;
                  const pnlPct = p.entry_price > 0 ? (currentPrice / p.entry_price - 1) * 100 : 0;
                  const hitStop = p.stop_loss_price !== null && currentPrice <= p.stop_loss_price;
                  const hitTake = p.take_profit_price !== null && currentPrice >= p.take_profit_price;
                  return (
                    <tr key={p.id} className="hover:bg-surface-2">
                      <td className="px-5 py-3 font-data font-medium text-text">{p.symbol}</td>
                      <td className="px-5 py-3 text-right font-data text-text-muted">
                        ${p.entry_price.toLocaleString("es", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right font-data text-text">
                        ${currentPrice.toLocaleString("es", { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-3 text-right font-data text-text-muted">
                        {p.shares.toLocaleString("es", { maximumFractionDigits: 4 })}
                      </td>
                      <td className="px-5 py-3 text-right font-data text-text-muted">
                        ${p.demo_amount_usd.toLocaleString("es", { maximumFractionDigits: 0 })}
                      </td>
                      <td className={`px-5 py-3 text-right font-data ${pnl >= 0 ? "text-data-up" : "text-data-down"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toLocaleString("es", { maximumFractionDigits: 0 })} ({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(1)}%)
                      </td>
                      <td className="px-5 py-3 text-right text-xs">
                        {p.stop_loss_price && (
                          <p className={hitStop ? "font-medium text-data-down" : "text-text-muted"}>
                            SL ${p.stop_loss_price.toLocaleString("es", { maximumFractionDigits: 2 })}{hitStop ? " · alcanzado" : ""}
                          </p>
                        )}
                        {p.take_profit_price && (
                          <p className={hitTake ? "font-medium text-data-up" : "text-text-muted"}>
                            TP ${p.take_profit_price.toLocaleString("es", { maximumFractionDigits: 2 })}{hitTake ? " · alcanzado" : ""}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <CloseDemoPositionButton id={p.id} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {closed.length > 0 && (
        <section>
          <h2 className="font-display text-lg font-medium text-text">Historial cerrado</h2>
          <div className="mt-4 flex flex-col divide-y divide-border">
            {closed.map((p) => {
              const closePrice = p.closed_price ?? p.entry_price;
              const pnl = (closePrice - p.entry_price) * p.shares;
              return (
                <div key={p.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span className="font-data text-text">
                    {p.symbol} · ${p.entry_price.toLocaleString("es")} → ${closePrice.toLocaleString("es")}
                  </span>
                  <span className={`font-data ${pnl >= 0 ? "text-data-up" : "text-data-down"}`}>
                    {pnl >= 0 ? "+" : ""}${pnl.toLocaleString("es", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
