import Link from "next/link";
import { ReactNode } from "react";
import { LogoLockup } from "@/components/brand/logo-lockup";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8">
        <LogoLockup />
      </Link>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8">
        <h1 className="font-display text-xl font-semibold text-text">{title}</h1>
        <p className="mt-1.5 text-sm text-text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
