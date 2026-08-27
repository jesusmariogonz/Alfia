import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo-mark";

/** Mini gráfica de velas puramente decorativa para el panel del hero. */
function DecorativeCandles() {
  const bars = [40, 55, 48, 70, 60, 82, 75, 90, 68, 95, 88, 100];
  return (
    <svg viewBox="0 0 240 120" className="h-full w-full" preserveAspectRatio="none">
      {bars.map((h, i) => {
        const up = i % 3 !== 0;
        const x = i * 20 + 4;
        const barHeight = (h / 100) * 90;
        return (
          <g key={i}>
            <line
              x1={x + 6}
              x2={x + 6}
              y1={110 - barHeight - 8}
              y2={110}
              stroke={up ? "var(--data-up)" : "var(--data-down)"}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
            <rect
              x={x}
              y={110 - barHeight}
              width={12}
              height={barHeight}
              rx={2}
              fill={up ? "var(--data-up)" : "var(--data-down)"}
              opacity={0.85}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Glow de fondo — reemplazar por foto real de Pexels si se quiere (ver
          instrucciones): fondo full-bleed con overlay oscuro degradado sobre
          esta misma zona. Búsqueda sugerida: "stock market green candles",
          "trading floor dark green", "forest green abstract gradient". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 0%, rgba(52,199,123,0.16), transparent 60%), radial-gradient(45% 40% at 85% 15%, rgba(217,169,78,0.10), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:items-center md:pb-28 md:pt-24">
        <div className="text-center md:text-left">
          <LogoMark size={56} className="mx-auto mb-6 md:mx-0" />
          <Badge tone="green">✦ Contenido diario generado por IA</Badge>
          <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text md:text-6xl">
            Lee el mercado{" "}
            <span className="bg-gradient-to-r from-green-bright to-[#7ee6ac] bg-clip-text text-transparent">
              antes que reaccione
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-text-muted md:mx-0 md:text-lg">
            Resúmenes de mercado con datos reales, simulaciones de Montecarlo y un
            chat de inversión con IA que corre el análisis por ti. Pagas solo por lo
            que usas, con créditos.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row md:justify-start">
            <Link href="/registro">
              <Button className="px-7 py-3 text-base shadow-[0_0_32px_-8px_var(--green-bright)]">
                Empezar gratis
              </Button>
            </Link>
            <Link href="/screener">
              <Button variant="secondary" className="px-7 py-3 text-base">
                Ver el screener en vivo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Esto es información educativa, no asesoría financiera regulada.
          </p>
        </div>

        {/* Panel visual del hero. Placeholder con velas decorativas — para
            reemplazar por una foto real de Pexels (retrato/paisaje en tonos
            verdes: pantallas de trading, luces de ciudad de noche, bull
            market abstracto), envuélvela en este mismo div con overlay. */}
        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl border border-border md:block">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(160deg, rgba(52,199,123,0.22), rgba(20,23,26,0.95) 65%)",
            }}
          />
          <div className="absolute inset-x-6 bottom-24 top-10 opacity-70">
            <DecorativeCandles />
          </div>
          <div className="absolute inset-x-6 bottom-6 rounded-xl border border-border/60 bg-bg/70 p-4 backdrop-blur">
            <p className="font-data text-xs text-text-muted">Alfia Score</p>
            <p className="mt-1 font-data text-2xl font-semibold text-green-bright">78 · Sólido</p>
            <p className="mt-1 text-xs text-text-muted">Calculado con datos reales, no una promesa.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
