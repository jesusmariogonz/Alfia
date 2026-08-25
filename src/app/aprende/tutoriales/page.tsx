import Link from "next/link";
import { TUTORIALS } from "@/lib/content/tutoriales";

export const metadata = {
  title: "Tutoriales — Alfia",
  description: "Tutoriales cortos sobre inversión, riesgo y simulación de mercado.",
};

export default function TutorialesPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-text">Tutoriales</h1>
      <p className="mt-2 text-sm text-text-muted">
        Lecturas cortas para entender mejor lo que ves en Alfia.
      </p>
      <div className="mt-8 flex flex-col gap-4">
        {TUTORIALS.map((tutorial) => (
          <Link
            key={tutorial.slug}
            href={`/aprende/tutoriales/${tutorial.slug}`}
            className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-green-bright/40"
          >
            <p className="font-display font-medium text-text">{tutorial.title}</p>
            <p className="mt-1.5 text-sm text-text-muted">{tutorial.summary}</p>
            <p className="mt-2 font-data text-xs text-text-muted">
              {tutorial.minutes} min de lectura
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
