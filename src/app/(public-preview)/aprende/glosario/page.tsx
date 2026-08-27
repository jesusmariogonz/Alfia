import { GLOSSARY } from "@/lib/content/glosario";

export const metadata = {
  title: "Glosario — Alfia",
  description: "Términos de inversión y trading explicados en lenguaje simple.",
};

export default function GlosarioPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Glosario</h1>
      <p className="mt-2 text-sm text-text-muted">
        Términos que verás dentro de Alfia, explicados sin jerga innecesaria.
      </p>
      <dl className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]">
        {GLOSSARY.map((item) => (
          <div key={item.term} className="p-5">
            <dt className="font-display font-medium text-text">{item.term}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-text-muted">
              {item.definition}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
