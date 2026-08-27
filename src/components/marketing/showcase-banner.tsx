/**
 * Banner de impacto, full-bleed, pensado para llevar una foto real de
 * Pexels de fondo (tonos verdes: mercados, pantallas de trading, ciudad de
 * noche, naturaleza/crecimiento). Mientras no haya foto, usa un gradiente
 * oscuro con textura de grid — se ve intencional por sí solo.
 *
 * Para poner la foto real: agrega la imagen a /public/marketing/showcase.jpg
 * y reemplaza el <div className="absolute inset-0 ..."> de abajo por
 * <Image src="/marketing/showcase.jpg" alt="" fill className="object-cover" />
 * antes del overlay.
 */
export function ShowcaseBanner() {
  return (
    <section className="relative isolate overflow-hidden border-y border-border">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(115deg, #0f2318 0%, #14171a 45%, #14171a 55%, #1a2a20 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 10% 20%, var(--green-bright) 0, transparent 60%), radial-gradient(1px 1px at 80% 60%, var(--green-bright) 0, transparent 60%), radial-gradient(1px 1px at 40% 80%, var(--gold) 0, transparent 60%)",
          backgroundSize: "200px 200px",
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
