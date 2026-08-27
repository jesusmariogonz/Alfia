import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo-mark";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src="/marketing/hero-bg.jpg"
        alt=""
        fill
        priority
        className="-z-20 object-cover object-right opacity-30"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, var(--bg) 20%, rgba(20,23,26,0.75) 55%, rgba(20,23,26,0.4) 100%), radial-gradient(45% 40% at 85% 15%, rgba(217,169,78,0.10), transparent 60%)",
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

        <div className="relative hidden aspect-[4/5] overflow-hidden rounded-2xl border border-border md:block">
          <Image
            src="/marketing/hero-panel.jpg"
            alt="Pantallas de trading con gráficas de velas"
            fill
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,23,26,0.15), rgba(20,23,26,0.85) 85%)",
            }}
          />
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
