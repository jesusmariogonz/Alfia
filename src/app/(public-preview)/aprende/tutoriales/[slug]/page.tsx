import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tutorial } from "@/types/database";

async function findTutorial(slug: string): Promise<Tutorial | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutorials")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Tutorial>();
  return data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = await findTutorial(slug);
  return {
    title: tutorial ? `${tutorial.title} — Alfia` : "Tutorial — Alfia",
    description: tutorial?.summary,
  };
}

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tutorial = await findTutorial(slug);
  if (!tutorial) notFound();

  return (
    <article>
      <Link href="/aprende/tutoriales" className="text-sm text-text-muted hover:text-text">
        ← Todos los tutoriales
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold text-text">
        {tutorial.title}
      </h1>
      <p className="mt-1 font-data text-xs text-text-muted">
        {tutorial.minutes} min de lectura
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {tutorial.content.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-text">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
