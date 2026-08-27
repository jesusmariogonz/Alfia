function cellTone(value: number): string {
  if (value >= 0.6) return "text-data-down"; // muy correlacionado = poca diversificación
  if (value <= 0.1) return "text-data-up"; // poco correlacionado = buena diversificación
  return "text-text";
}

export function CorrelationMatrix({
  symbols,
  matrix,
}: {
  symbols: string[];
  matrix: number[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_10px_30px_-14px_rgba(0,0,0,0.55)]">
      <table className="w-full min-w-[420px] text-center text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">
              Correlación
            </th>
            {symbols.map((s) => (
              <th key={s} className="px-4 py-3 font-data text-xs font-medium text-text-muted">
                {s}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {symbols.map((rowSymbol, i) => (
            <tr key={rowSymbol}>
              <td className="px-4 py-3 text-left font-data text-xs text-text-muted">
                {rowSymbol}
              </td>
              {symbols.map((_, j) => (
                <td key={j} className={`px-4 py-3 font-data ${cellTone(matrix[i][j])}`}>
                  {matrix[i][j].toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
