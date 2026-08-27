type Feature = {
  title: string;
  description: string;
  big?: boolean;
};

const features: Feature[] = [
  {
    title: "Reporte diario de mercado",
    description:
      "Cada día, un análisis a fondo de lo que movió los mercados: índices, sectores, la historia más relevante del día y qué vigilar mañana — no un resumen genérico.",
    big: true,
  },
  {
    title: "Chat de inversión con IA (Pro)",
    description:
      "Pregúntale lo que sea sobre tus activos y Alfia corre Montecarlo, comparaciones y backtests por su cuenta, dentro de la conversación.",
  },
  {
    title: "Mi Portafolio",
    description:
      "Reúne tus posiciones con su riesgo, retorno esperado y correlación entre ellas, en una sola vista.",
  },
  {
    title: "Noticias con sentimiento",
    description:
      "Actualizadas varias veces al día, clasificadas como positivas, negativas o neutrales para leer el mercado más rápido.",
  },
  {
    title: "Screener en tiempo real",
    description:
      "Filtra por tipo, retorno y volatilidad, compara varios activos a la vez y descubre qué investigar más a fondo.",
  },
  {
    title: "Créditos transparentes",
    description:
      "Ves el costo exacto antes de cada consulta al chat. Sin sorpresas, sin cargos ocultos.",
  },
];

export function FeatureGrid() {
  return (
    <section id="producto" className="relative mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
          Todo lo que necesitas para leer el mercado
        </h2>
        <p className="mt-4 text-text-muted">
          Herramientas de análisis potenciadas por IA, enfocadas exclusivamente en
          inversión, trading y finanzas.
        </p>
      </div>
      <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-green-bright/40 hover:shadow-[0_8px_40px_-12px_rgba(52,199,123,0.25)] ${
              f.big ? "sm:col-span-2 lg:col-span-2" : ""
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-green-bright/0 blur-2xl transition-colors duration-300 group-hover:bg-green-bright/10"
            />
            <span className="font-data text-xs text-green-bright/70">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-3 font-display text-lg font-medium text-text">
              {f.title}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
              {f.description}
            </p>
            <div className="mt-5 h-px w-10 bg-green-bright/30 transition-all duration-300 group-hover:w-16" />
          </div>
        ))}
      </div>
    </section>
  );
}
