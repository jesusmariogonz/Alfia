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
      <dl className="mt-8 divide-y divide-border">
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
