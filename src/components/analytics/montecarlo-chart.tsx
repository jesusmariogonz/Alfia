export function MonteCarloChart({
  pathBands,
}: {
  pathBands: { day: number; p10: number; p50: number; p90: number }[];
}) {
  const width = 640;
  const height = 220;
  const allValues = pathBands.flatMap((b) => [b.p10, b.p90]);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const lastDay = pathBands[pathBands.length - 1].day || 1;

  const x = (day: number) => (day / lastDay) * width;
  const y = (value: number) => height - ((value - min) / range) * height;

  const topLine = pathBands.map((b) => `${x(b.day)},${y(b.p90)}`).join(" ");
  const bottomLine = [...pathBands]
    .reverse()
    .map((b) => `${x(b.day)},${y(b.p10)}`)
    .join(" ");
  const medianPoints = pathBands.map((b) => `${x(b.day)},${y(b.p50)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polygon
        points={`${topLine} ${bottomLine}`}
        fill="var(--green-bright)"
        fillOpacity="0.12"
      />
      <polyline
        points={medianPoints}
        fill="none"
        stroke="var(--green-bright)"
        strokeWidth="2"
      />
    </svg>
  );
}
