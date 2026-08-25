export function Disclaimer({ className }: { className?: string }) {
  return (
    <p className={`text-xs text-text-muted leading-relaxed ${className ?? ""}`}>
      Esto es información educativa, no asesoría financiera regulada.
    </p>
  );
}
