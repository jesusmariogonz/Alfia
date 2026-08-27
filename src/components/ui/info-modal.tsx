"use client";

import { useState } from "react";

export function InfoModal({
  title,
  children,
  label = "¿Qué es esto?",
}: {
  title: string;
  children: React.ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] leading-none text-text-muted transition-colors hover:border-gold hover:text-gold"
      >
        i
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-base font-medium text-text">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="shrink-0 text-text-muted hover:text-text"
              >
                ✕
              </button>
            </div>
            <div className="mt-3 text-sm leading-relaxed text-text-muted">{children}</div>
          </div>
        </div>
      )}
    </>
  );
}
