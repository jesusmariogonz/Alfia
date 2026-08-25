type Feature = {
  title: string;
  description: string;
};

const features: Feature[] = [
  {
    title: "Resumen diario de mercado",
    description:
      "Cada mañana, un resumen claro de lo que movió los mercados: índices, sectores y las noticias que más importan.",
  },
  {
    title: "Chat de inversión con IA",
    description:
      "Pregunta sobre activos, estrategias y conceptos financieros. Alfia responde solo dentro del tema — nada de tangentes.",
  },
  {
    title: "Simulador de Montecarlo",
    description:
      "Corre miles de escenarios sobre tu portafolio y recibe una interpretación en lenguaje natural de los resultados.",
  },
  {
    title: "Feed de noticias con sentimiento",
    description:
      "Noticias relevantes clasificadas como positivas, negativas o neutrales, para leer el mercado más rápido.",
  },
  {
    title: "Comparador de activos",
    description:
      "Pon dos acciones lado a lado — fundamentales, desempeño y riesgo — y entiende las diferencias en segundos.",
  },
  {
    title: "Sistema de créditos transparente",
    description:
      "Ves el costo en créditos antes de cada consulta. Sin sorpresas, sin cargos ocultos.",
  },
];

export function FeatureGrid() {
  return (
    <section id="producto" className="mx-auto max-w-6xl px-6 py-20">
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
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-green-bright/40"
          >
            <h3 className="font-display text-lg font-medium text-text">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
