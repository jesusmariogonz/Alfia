import Image from "next/image";

export function ShowcaseBanner() {
  return (
    <section className="relative isolate overflow-hidden border-y border-border">
      <Image
        src="/marketing/showcase.jpg"
        alt="Bosque visto desde arriba"
        fill
        className="-z-20 object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, rgba(15,23,24,0.94) 0%, rgba(15,23,24,0.85) 45%, rgba(15,35,24,0.55) 100%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-20 md:grid-cols-2 md:items-center">
        <div>
          <p className="font-data text-xs uppercase tracking-[0.2em] text-green-bright">
            Datos reales, no relleno
          </p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-text md:text-4xl">
            El mercado no espera a nadie. Tampoco tu análisis debería.
          </h2>
          <p className="mt-4 max-w-md text-text-muted">
            Precios y volumen reales, sentimiento calculado con la misma
            metodología del Fear &amp; Greed Index, y un reporte que se
            actualiza antes de que abra el mercado, a media sesión si pasa
            algo relevante, y antes del cierre.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Activos con precio real", value: "17" },
            { label: "Reportes generados al día", value: "3" },
            { label: "Métricas por activo", value: "5+" },
            { label: "Nota educativa nueva", value: "48h" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/60 bg-bg/50 p-5 backdrop-blur"
            >
              <p className="font-data text-2xl font-semibold text-text">{stat.value}</p>
              <p className="mt-1 text-xs text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
