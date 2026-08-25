type QA = { q: string; a: string };

const items: QA[] = [
  {
    q: "¿Alfia da asesoría financiera?",
    a: "No. Alfia ofrece información educativa e interpretaciones generadas por IA. No es asesoría financiera regulada ni una recomendación personalizada de inversión.",
  },
  {
    q: "¿Sobre qué temas puedo preguntar?",
    a: "Solo inversión, trading y finanzas: acciones, criptomonedas, macroeconomía, estrategias y simulaciones. Preguntas fuera de este dominio son redirigidas amablemente.",
  },
  {
    q: "¿Cómo funcionan los créditos?",
    a: "Cada consulta a la IA tiene un costo en créditos que ves antes de enviarla. Tu plan incluye créditos mensuales y puedes comprar paquetes adicionales cuando los necesites.",
  },
  {
    q: "¿Los datos de mercado son en tiempo real?",
    a: "Empezamos con datos con 15 minutos de retraso para mantener el servicio accesible. Es información suficiente para análisis, no para ejecución de operaciones.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-text md:text-4xl">
        Preguntas frecuentes
      </h2>
      <div className="mt-10 divide-y divide-border rounded-xl border border-border bg-surface">
        {items.map((item) => (
          <div key={item.q} className="p-6">
            <h3 className="font-display text-base font-medium text-text">
              {item.q}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
