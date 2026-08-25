type LogoMarkProps = {
  size?: number;
  className?: string;
};

/**
 * Ícono standalone de Alfia: una "A" formada por dos velas japonesas.
 * Cada pata es el cuerpo de una vela con su mecha; la barra transversal
 * es una línea de tendencia horizontal.
 */
export function LogoMark({ size = 32, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Alfia"
    >
      <rect width="40" height="40" rx="9" fill="var(--bg, #14171A)" />

      {/* Pata izquierda: vela alcista */}
      <g transform="rotate(-18 12.5 22)">
        <line x1="12.5" y1="8" x2="12.5" y2="34" stroke="var(--green-bright, #34C77B)" strokeWidth="1.6" />
        <rect x="9" y="15" width="7" height="14" rx="1.2" fill="var(--green-bright, #34C77B)" />
      </g>

      {/* Pata derecha: vela alcista, espejo */}
      <g transform="rotate(18 27.5 22)">
        <line x1="27.5" y1="8" x2="27.5" y2="34" stroke="var(--green, #2FA86B)" strokeWidth="1.6" />
        <rect x="24" y="15" width="7" height="14" rx="1.2" fill="var(--green, #2FA86B)" />
      </g>

      {/* Barra transversal: línea de tendencia */}
      <line
        x1="10.5"
        y1="24"
        x2="29.5"
        y2="24"
        stroke="var(--text, #E8EAED)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
